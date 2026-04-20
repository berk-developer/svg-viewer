"use client";

import {
  startTransition,
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  ExportState,
  ParsedSvgSummary,
  StageBackground,
  SvgAnalyzerResponse,
  SvgInput,
  SvgInputKind,
  SvgWarning,
  ViewerTransform,
} from "@/types/svg";

type PanelTab = "info" | "markup" | "export";
type ToastTone = "neutral" | "success" | "warning" | "danger";
type PreviewStatus = "idle" | "loading" | "ready" | "error";

interface StageSize {
  width: number;
  height: number;
}

interface ToastState {
  tone: ToastTone;
  message: string;
}

const SOFT_BYTE_LIMIT = 10 * 1024 * 1024;
const SOFT_NODE_LIMIT = 10_000;
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 24;
const FIT_PADDING = 88;
const ENCODER = new TextEncoder();

const defaultSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" fill="#ff6b35" opacity="0.2"/>
  <circle cx="50" cy="50" r="30" fill="#ff6b35"/>
  <path d="M35 50 L45 60 L65 40" stroke="#060608" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

export function SvgWorkbench() {
  const fileInputId = useId();
  const stageViewportRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const workerRequestRef = useRef(0);
  const panPointerRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const [currentInput, setCurrentInput] = useState<SvgInput>(() =>
    buildSvgInput("paste", "graphic.svg", defaultSvg),
  );
  const [analysis, setAnalysis] = useState<ParsedSvgSummary | null>(null);
  const [analysisState, setAnalysisState] = useState<"parsing" | "ready" | "error">("parsing");
  const [panelTab, setPanelTab] = useState<PanelTab>("info");
  const [background, setBackground] = useState<StageBackground>("checkerboard");
  const [transform, setTransform] = useState<ViewerTransform>({
    zoom: 1,
    panX: 0,
    panY: 0,
    fitMode: "fit",
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>("loading");
  const [imageSize, setImageSize] = useState<StageSize>({ width: 0, height: 0 });
  const [viewportSize, setViewportSize] = useState<StageSize>({ width: 0, height: 0 });
  const [dropActive, setDropActive] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [pasteValue, setPasteValue] = useState("");
  const [isExportingPng, setIsExportingPng] = useState<number | null>(null);

  const handleViewportKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!stageViewportRef.current) return;
    const viewportRect = stageViewportRef.current.getBoundingClientRect();
    const panAmount = Math.min(viewportRect.width, viewportRect.height) * 0.1;

    switch (event.key) {
      case "ArrowUp": {
        event.preventDefault();
        setTransform((current) => ({ ...current, panY: current.panY + panAmount, fitMode: "custom" }));
        break;
      }
      case "ArrowDown": {
        event.preventDefault();
        setTransform((current) => ({ ...current, panY: current.panY - panAmount, fitMode: "custom" }));
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        setTransform((current) => ({ ...current, panX: current.panX + panAmount, fitMode: "custom" }));
        break;
      }
      case "ArrowRight": {
        event.preventDefault();
        setTransform((current) => ({ ...current, panX: current.panX - panAmount, fitMode: "custom" }));
        break;
      }
      case "+":
      case "=": {
        event.preventDefault();
        setTransform((current) => ({ ...current, zoom: clamp(current.zoom * 1.12, MIN_ZOOM, MAX_ZOOM), fitMode: "custom" }));
        break;
      }
      case "-": {
        event.preventDefault();
        setTransform((current) => ({ ...current, zoom: clamp(current.zoom * 0.9, MIN_ZOOM, MAX_ZOOM), fitMode: "custom" }));
        break;
      }
      case "0": {
        event.preventDefault();
        const fitTransform = buildFitTransform(viewportSize, contentSize);
        if (fitTransform) setTransform(fitTransform);
        break;
      }
    }
  };

  const markupSource = analysis?.prettySource || currentInput.originalText;
  const deferredMarkupSource = useDeferredValue(markupSource);
  const exportState = getExportState(currentInput, analysis);
  const contentSize = getRenderableSize(analysis, imageSize);
  const stageHasContent = Boolean(previewUrl);
  const featureWarnings = analysis?.warnings ?? [];
  const sortedElementCounts = Object.entries(analysis?.elementCounts ?? {}).sort(
    (left, right) => right[1] - left[1],
  );
  const viewportWidth = viewportSize.width;
  const viewportHeight = viewportSize.height;
  const contentWidth = contentSize.width;
  const contentHeight = contentSize.height;

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  useEffect(() => {
    const worker = new Worker(new URL("../workers/svg-analyzer.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event: MessageEvent<SvgAnalyzerResponse>) => {
      if (event.data.requestId !== workerRequestRef.current) return;
      setAnalysis(event.data.summary);
      setAnalysisState(event.data.summary.parseStatus === "error" ? "error" : "ready");
    };
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const nextRequestId = workerRequestRef.current + 1;
    workerRequestRef.current = nextRequestId;
    setAnalysisState("parsing");
    worker.postMessage({
      requestId: nextRequestId,
      originalText: currentInput.originalText,
      byteSize: currentInput.byteSize,
    });
  }, [currentInput]);

  useEffect(() => {
    const nextPreviewUrl = URL.createObjectURL(
      new Blob([currentInput.originalText], { type: "image/svg+xml;charset=utf-8" }),
    );
    setPreviewUrl(nextPreviewUrl);
    setPreviewStatus("loading");
    setImageSize({ width: 0, height: 0 });
    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [currentInput]);

  useEffect(() => {
    const stageViewport = stageViewportRef.current;
    if (!stageViewport) return;
    const updateSize = () => {
      setViewportSize({
        width: stageViewport.clientWidth,
        height: stageViewport.clientHeight,
      });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(stageViewport);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (transform.fitMode !== "fit") return;
    const fitTransform = buildFitTransform(
      { width: viewportWidth, height: viewportHeight },
      { width: contentWidth, height: contentHeight },
    );
    if (!fitTransform) return;
    setTransform((current) => (areTransformsEqual(current, fitTransform) ? current : fitTransform));
  }, [contentHeight, contentWidth, transform.fitMode, viewportHeight, viewportWidth]);

  async function handleFileSelection(fileList: FileList | null, kind: SvgInputKind) {
    const file = fileList?.[0];
    if (!file) return;
    const text = await file.text();
    if (!loadSvgText(kind, file.name, text)) return;
    setToast({ tone: "success", message: `Loaded ${file.name}` });
  }

  function loadSvgText(kind: SvgInputKind, name: string | undefined, rawText: string): boolean {
    const normalizedText = normalizeSvgText(rawText);
    if (!looksLikeSvg(normalizedText)) {
      setToast({ tone: "danger", message: "Invalid SVG markup" });
      return false;
    }
    const nextInput = buildSvgInput(kind, name, normalizedText);
    startTransition(() => {
      setCurrentInput(nextInput);
      setPanelTab("info");
      setTransform({ zoom: 1, panX: 0, panY: 0, fitMode: "fit" });
    });
    return true;
  }

  function handlePasteImport() {
    const success = loadSvgText("paste", "pasted.svg", pasteValue);
    if (success) {
      setToast({ tone: "success", message: "SVG loaded" });
      setPasteValue("");
    }
  }

  async function handleCopy(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ tone: "success", message: successMessage });
    } catch {
      setToast({ tone: "warning", message: "Copy failed" });
    }
  }

  async function handlePngExport(scale: number) {
    if (!exportState.canExportPng) {
      setToast({ tone: "warning", message: exportState.blockedReason ?? "Export unavailable" });
      return;
    }
    setIsExportingPng(scale);
    try {
      await exportSvgAsPng(currentInput.originalText, scale, currentInput.name, contentSize);
      setToast({ tone: "success", message: `Exported ${scale}x` });
    } catch (error) {
      setToast({ tone: "danger", message: error instanceof Error ? error.message : "Export failed" });
    } finally {
      setIsExportingPng(null);
    }
  }

  function handleDownloadSvg() {
    downloadBlob(
      new Blob([currentInput.originalText], { type: "image/svg+xml;charset=utf-8" }),
      ensureSvgFileName(currentInput.name),
    );
  }

  function handleWheelZoom(event: React.WheelEvent<HTMLDivElement>) {
    if (!stageHasContent) return;
    event.preventDefault();
    const bounds = stageViewportRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const pointX = event.clientX - bounds.left - bounds.width / 2;
    const pointY = event.clientY - bounds.top - bounds.height / 2;
    const factor = event.deltaY < 0 ? 1.12 : 0.9;
    setTransform((current) => zoomAroundPoint(current, pointX, pointY, factor));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!stageHasContent) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panPointerRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setIsPanning(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const activePointer = panPointerRef.current;
    if (!activePointer || activePointer.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - activePointer.x;
    const deltaY = event.clientY - activePointer.y;
    panPointerRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
    setTransform((current) => ({ ...current, panX: current.panX + deltaX, panY: current.panY + deltaY, fitMode: "custom" }));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (panPointerRef.current?.pointerId === event.pointerId) {
      panPointerRef.current = null;
      setIsPanning(false);
    }
  }

  function handleStageDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setDropActive(true);
  }

  async function handleStageDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    setDropActive(false);
    if (event.dataTransfer.files?.length) {
      await handleFileSelection(event.dataTransfer.files, "drop");
      return;
    }
    const rawText = event.dataTransfer.getData("text/plain");
    if (rawText) {
      const success = loadSvgText("drop", "dropped.svg", rawText);
      if (success) setToast({ tone: "success", message: "SVG loaded" });
    }
  }

  return (
    <section
      className={`workbench ${dropActive ? "workbench--drop" : ""}`}
      onDragOver={handleStageDragOver}
      onDragLeave={() => setDropActive(false)}
      onDrop={handleStageDrop}
      aria-label="SVG workspace"
    >
      <div className="workspaceMain">
        <div className="importGrid">
          <div className="surfaceCard">
            <div className="surfaceHeading">
              <h3>Upload</h3>
            </div>
            <label className="dropZone" htmlFor={fileInputId}>
              <svg className="dropZoneIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17,8 12,3 7,8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className="dropZoneText">Drop SVG here</div>
              <div className="dropZoneButton">Browse files</div>
              <div className="dropZoneHint">.svg only</div>
            </label>
            <input
              id={fileInputId}
              type="file"
              accept=".svg,image/svg+xml"
              className="srOnly"
              onChange={async (event) => {
                await handleFileSelection(event.target.files, "file");
                event.target.value = "";
              }}
            />
          </div>

          <div className="surfaceCard">
            <div className="surfaceHeading">
              <h3>Paste Code</h3>
            </div>
            <textarea
              className="textArea"
              value={pasteValue}
              onChange={(event) => setPasteValue(event.target.value)}
              placeholder="<svg...>"
            />
            <div className="inputActions">
              <button
                className="actionButton actionButton--primary"
                type="button"
                onClick={handlePasteImport}
                disabled={!pasteValue.trim()}
              >
                Load
              </button>
            </div>
          </div>
        </div>

        <div className="stageCard">
          <div className="stageHeader">
            <h3>{currentInput.name ?? "Untitled"}</h3>
            <span className="chip">{formatBytes(currentInput.byteSize)}</span>
          </div>

          <div className="stageToolbar">
            <div className="toolGroup" role="toolbar" aria-label="Zoom controls">
              <button className="toolButton" type="button" onClick={() => setTransform(buildFitTransform(viewportSize, contentSize) ?? transform)}>Fit</button>
              <button className="toolButton" type="button" onClick={() => setTransform({ zoom: 1, panX: 0, panY: 0, fitMode: "actual" })}>1:1</button>
              <button className="toolButton" type="button" onClick={() => setTransform((current) => ({ ...current, zoom: clamp(current.zoom * 1.12, MIN_ZOOM, MAX_ZOOM), fitMode: "custom" }))}>+</button>
              <button className="toolButton" type="button" onClick={() => setTransform((current) => ({ ...current, zoom: clamp(current.zoom * 0.9, MIN_ZOOM, MAX_ZOOM), fitMode: "custom" }))}>−</button>
            </div>
            <div className="toolGroup" role="toolbar" aria-label="Background selection">
              {(["light", "dark", "checkerboard"] as const).map((item) => (
                <button
                  key={item}
                  className={`toolButton ${background === item ? "toolButton--active" : ""}`}
                  type="button"
                  onClick={() => setBackground(item)}
                  aria-pressed={background === item}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div
            ref={stageViewportRef}
            className={`stageViewport stageViewport--${background} ${isPanning ? "stageViewport--panning" : ""}`}
            tabIndex={0}
            role="img"
            aria-label={`SVG preview: ${currentInput.name ?? "Untitled"}, ${contentWidth}×${contentHeight} pixels`}
            onKeyDown={handleViewportKeyDown}
            onWheel={handleWheelZoom}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {previewUrl && (
              <img
                alt={currentInput.name ?? "SVG"}
                className="stageImage"
                draggable={false}
                onLoad={(event) => {
                  setPreviewStatus("ready");
                  setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight });
                }}
                onError={() => setPreviewStatus("error")}
                src={previewUrl}
                style={{ transform: `translate(calc(-50% + ${transform.panX}px), calc(-50% + ${transform.panY}px)) scale(${transform.zoom})` }}
              />
            )}
            {previewStatus !== "ready" && (
              <div className="stageOverlay">
                <div className="stageOverlayLabel">{analysisState === "parsing" ? "Processing..." : "Error"}</div>
                <div className="stageOverlayCopy">{analysisState === "error" ? "Failed to parse SVG" : "Analyzing markup"}</div>
              </div>
            )}
          </div>

          <div className="stageFooter">
            <div className="stageFooterItem">
              <span className="stageFooterLabel">Zoom</span>
              <span className="stageFooterValue">{Math.round(transform.zoom * 100)}%</span>
            </div>
            <div className="stageFooterItem">
              <span className="stageFooterLabel">Size</span>
              <span className="stageFooterValue">{contentWidth}×{contentHeight}</span>
            </div>
          </div>
        </div>
      </div>

      <aside className="panelCard">
        <div className="panelHeader">
          <h3>Details</h3>
          <div className="panelTabs">
            {(["info", "markup", "export"] as const).map((tab) => (
              <button
                key={tab}
                className={`panelTab ${panelTab === tab ? "panelTab--active" : ""}`}
                type="button"
                onClick={() => setPanelTab(tab)}
                aria-pressed={panelTab === tab}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {panelTab === "info" && (
          <div className="panelContent">
            <div className="metricGrid">
              <div className="metricCard"><div className="metricLabel">Canvas</div><div className="metricValue">{formatCanvasLabel(analysis)}</div></div>
              <div className="metricCard"><div className="metricLabel">Elements</div><div className="metricValue">{analysis ? analysis.approxNodeCount.toLocaleString() : "—"}</div></div>
            </div>

            <div className="infoSection">
              <div className="infoSectionHeading"><h4>Features</h4></div>
              <div className="tagWrap">
                <FeatureTag active={Boolean(analysis?.hasGradients)}>Gradients</FeatureTag>
                <FeatureTag active={Boolean(analysis?.hasFilters)}>Filters</FeatureTag>
                <FeatureTag active={Boolean(analysis?.hasMasks)}>Masks</FeatureTag>
                <FeatureTag active={Boolean(analysis?.hasText)}>Text</FeatureTag>
                <FeatureTag active={Boolean(analysis?.hasScripts)} tone="danger">Script</FeatureTag>
              </div>
            </div>

            {sortedElementCounts.length > 0 && (
              <div className="infoSection">
                <div className="infoSectionHeading"><h4>Elements</h4><span>Top {Math.min(sortedElementCounts.length, 8)}</span></div>
                <div className="countList">
                  {sortedElementCounts.slice(0, 8).map(([name, count]) => (
                    <div className="countRow" key={name}><span>{name}</span><strong>{count}</strong></div>
                  ))}
                </div>
              </div>
            )}

            {analysis && analysis.colorPalette.length > 0 && (
              <div className="infoSection">
                <div className="infoSectionHeading"><h4>Colors</h4><span>{analysis.colorPalette.length}</span></div>
                <div className="paletteRow">
                  {analysis.colorPalette.map((color) => (
                    <div className="paletteSwatch" key={color}><span className="paletteChip" style={{ background: color }} /><span>{color}</span></div>
                  ))}
                </div>
              </div>
            )}

            {featureWarnings.length > 0 && (
              <div className="infoSection">
                <div className="infoSectionHeading"><h4>Warnings</h4><span>{featureWarnings.length}</span></div>
                <div className="warningList">
                  {featureWarnings.map((warning) => (<WarningRow key={`${warning.code}-${warning.message}`} warning={warning} />))}
                </div>
              </div>
            )}
          </div>
        )}

        {panelTab === "markup" && (
          <div className="panelContent">
            <div className="panelActions" style={{ marginBottom: 'var(--space-md)' }}>
              <button className="actionButton" type="button" onClick={() => handleCopy(markupSource, "Copied")}>Copy</button>
            </div>
            <pre className="markupPane">{deferredMarkupSource}</pre>
          </div>
        )}

        {panelTab === "export" && (
          <div className="panelContent">
            <div className="exportBox">
              <h4>SVG</h4>
              <p className="inlineFeedback" style={{ marginBottom: 'var(--space-md)' }}>Download or copy the source</p>
              <div className="panelActions">
                <button className="actionButton actionButton--primary" type="button" onClick={handleDownloadSvg}>Download</button>
                <button className="actionButton" type="button" onClick={() => handleCopy(markupSource, "Copied")}>Copy</button>
              </div>
            </div>
            <div className="exportBox">
              <h4>PNG</h4>
              <p className="inlineFeedback" style={{ marginBottom: 'var(--space-md)' }}>Rasterize at scale</p>
              <div className="panelActions">
                {[1, 2, 4].map((scale) => (
                  <button
                    key={scale}
                    className="actionButton"
                    type="button"
                    onClick={() => handlePngExport(scale)}
                    disabled={!exportState.canExportPng || isExportingPng !== null}
                  >
                    {isExportingPng === scale ? "..." : `${scale}x`}
                  </button>
                ))}
              </div>
              {!exportState.canExportPng && <p className="inlineFeedback" style={{ marginTop: 'var(--space-sm)' }}>{exportState.blockedReason}</p>}
            </div>
          </div>
        )}
      </aside>

      {toast && <div className={`toast toast--${toast.tone}`} aria-live={toast.tone === "danger" ? "assertive" : "polite"} aria-atomic="true">{toast.message}</div>}
    </section>
  );
}

function FeatureTag({ children, active, tone = "neutral" }: { children: React.ReactNode; active: boolean; tone?: "neutral" | "warning" | "danger" }) {
  return <span className={`featureTag featureTag--${tone} ${active ? "featureTag--active" : ""}`}>{children}</span>;
}

function WarningRow({ warning }: { warning: SvgWarning }) {
  return (
    <div className={`warningRow warningRow--${warning.level}`}>
      <div className="warningRowHead"><span className="warningBadge">{warning.level}</span><strong>{warning.message}</strong></div>
      {warning.details && <p style={{ marginTop: 4, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{warning.details}</p>}
    </div>
  );
}

function buildSvgInput(kind: SvgInputKind, name: string | undefined, originalText: string): SvgInput {
  return {
    kind,
    name: name ? ensureSvgFileName(name) : `${kind}-input.svg`,
    originalText,
    byteSize: ENCODER.encode(originalText).byteLength,
    importedAt: Date.now(),
  };
}

function normalizeSvgText(rawText: string): string {
  return rawText.replace(/^\uFEFF/, "").trim();
}

function looksLikeSvg(text: string): boolean {
  return /<svg[\s>]/i.test(text);
}

function ensureSvgFileName(fileName = "graphic.svg"): string {
  return fileName.toLowerCase().endsWith(".svg") ? fileName : `${fileName}.svg`;
}

function getRenderableSize(summary: ParsedSvgSummary | null, imageSize: StageSize): StageSize {
  if (imageSize.width && imageSize.height) return imageSize;
  if (summary?.viewBox?.width && summary.viewBox.height) return { width: summary.viewBox.width, height: summary.viewBox.height };
  if (summary?.width && summary.height) return { width: summary.width, height: summary.height };
  return { width: 100, height: 100 };
}

function buildFitTransform(viewport: StageSize, content: StageSize): ViewerTransform | null {
  if (!viewport.width || !viewport.height || !content.width || !content.height) return null;
  const nextZoom = clamp(Math.min((viewport.width - FIT_PADDING) / content.width, (viewport.height - FIT_PADDING) / content.height), MIN_ZOOM, MAX_ZOOM);
  return { zoom: nextZoom, panX: 0, panY: 0, fitMode: "fit" };
}

function zoomAroundPoint(current: ViewerTransform, pointerX: number, pointerY: number, factor: number): ViewerTransform {
  const nextZoom = clamp(current.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const worldX = (pointerX - current.panX) / current.zoom;
  const worldY = (pointerY - current.panY) / current.zoom;
  return { zoom: nextZoom, panX: pointerX - worldX * nextZoom, panY: pointerY - worldY * nextZoom, fitMode: "custom" };
}

function areTransformsEqual(left: ViewerTransform, right: ViewerTransform): boolean {
  return left.fitMode === right.fitMode && Math.abs(left.zoom - right.zoom) < 0.0001 && Math.abs(left.panX - right.panX) < 0.0001 && Math.abs(left.panY - right.panY) < 0.0001;
}

function getExportState(input: SvgInput | null, summary: ParsedSvgSummary | null): ExportState {
  if (!input) return { canDownloadSvg: false, canExportPng: false, blockedReason: "Load an SVG first" };
  if (!summary || summary.parseStatus === "error") return { canDownloadSvg: true, canExportPng: false, blockedReason: "Parse error" };
  if (summary.hasExternalRefs) return { canDownloadSvg: true, canExportPng: false, blockedReason: "External refs" };
  if (summary.hasScripts) return { canDownloadSvg: true, canExportPng: false, blockedReason: "Scripts detected" };
  if (input.byteSize > SOFT_BYTE_LIMIT) return { canDownloadSvg: true, canExportPng: false, blockedReason: "File too large" };
  if (summary.approxNodeCount > SOFT_NODE_LIMIT) return { canDownloadSvg: true, canExportPng: false, blockedReason: "Too many elements" };
  return { canDownloadSvg: true, canExportPng: true };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatBytes(byteSize: number): string {
  if (byteSize < 1024) return `${byteSize} B`;
  if (byteSize < 1024 * 1024) return `${(byteSize / 1024).toFixed(1)} KB`;
  return `${(byteSize / (1024 * 1024)).toFixed(2)} MB`;
}

function formatCanvasLabel(summary: ParsedSvgSummary | null): string {
  if (!summary) return "—";
  if (summary.widthText && summary.heightText) return `${summary.widthText} × ${summary.heightText}`;
  if (summary.viewBox) return `${summary.viewBox.width} × ${summary.viewBox.height}`;
  return "—";
}

async function exportSvgAsPng(svgText: string, scale: number, fileName: string | undefined, sizeHint: StageSize) {
  const objectUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await loadImage(objectUrl);
    const width = Math.max(1, image.naturalWidth || sizeHint.width || 100);
    const height = Math.max(1, image.naturalHeight || sizeHint.height || 100);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas error");
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Export failed");
    downloadBlob(blob, `${ensureSvgFileName(fileName).replace(/\.svg$/i, "")}@${scale}x.png`);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Load failed"));
    image.src = src;
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
