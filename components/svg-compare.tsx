"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SvgInput } from "@/types/svg";

interface CompareSlot {
  id: string;
  input: SvgInput | null;
  previewUrl: string | null;
  size: { width: number; height: number } | null;
}

const ENCODER = new TextEncoder();

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function buildSvgInput(name: string, originalText: string): SvgInput {
  return {
    kind: "paste" as const,
    name,
    originalText,
    byteSize: ENCODER.encode(originalText).byteLength,
    importedAt: Date.now(),
  };
}

function looksLikeSvg(text: string): boolean {
  return /\u003csvg[\s>]/i.test(text);
}

export function SvgCompare() {
  const [slots, setSlots] = useState<CompareSlot[]>([
    { id: generateId(), input: null, previewUrl: null, size: null },
    { id: generateId(), input: null, previewUrl: null, size: null },
  ]);
  const slotsRef = useRef(slots);
  const [activeTab, setActiveTab] = useState<"grid" | "overlay">("grid");
  const [zoom, setZoom] = useState(1);

  const loadedSlots = slots.filter((s) => s.input);

  useEffect(() => {
    slotsRef.current = slots;
  }, [slots]);

  useEffect(() => {
    return () => {
      slotsRef.current.forEach((s) => {
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
      });
    };
  }, []);

  function addSlot() {
    setSlots((prev) => [
      ...prev,
      { id: generateId(), input: null, previewUrl: null, size: null },
    ]);
  }

  function removeSlot(id: string) {
    setSlots((prev) => {
      const slot = prev.find((s) => s.id === id);
      if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      const newSlots = prev.filter((s) => s.id !== id);
      return newSlots.length > 0
        ? newSlots
        : [{ id: generateId(), input: null, previewUrl: null, size: null }];
    });
  }

  function duplicateSlot(id: string) {
    const slot = slots.find((s) => s.id === id);
    if (!slot?.input) return;

    const input = slot.input;
    const previewUrl = URL.createObjectURL(
      new Blob([input.originalText], { type: "image/svg+xml;charset=utf-8" })
    );

    setSlots((prev) => {
      const index = prev.findIndex((s) => s.id === id);
      const newSlot: CompareSlot = {
        id: generateId(),
        input: {
          kind: "paste" as const,
          name: input.name + " (copy)",
          originalText: input.originalText,
          byteSize: input.byteSize,
          importedAt: Date.now(),
        },
        previewUrl,
        size: slot.size,
      };
      const newSlots = [...prev];
      newSlots.splice(index + 1, 0, newSlot);
      return newSlots;
    });
  }

  function updateSlot(id: string, input: SvgInput) {
    const previewUrl = URL.createObjectURL(
      new Blob([input.originalText], { type: "image/svg+xml;charset=utf-8" })
    );
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, input, previewUrl, size: null } : s))
    );
  }

  function clearSlot(id: string) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
          return { id: s.id, input: null, previewUrl: null, size: null };
        }
        return s;
      })
    );
  }

  return (
    <section className="compareWorkbench">
      <div className="compareToolbar">
        <div className="compareTabs" role="tablist" aria-label="Comparison view">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "grid"}
            aria-controls="grid-panel"
            id="grid-tab"
            className={`compareTab ${activeTab === "grid" ? "compareTab--active" : ""}`}
            onClick={() => setActiveTab("grid")}
          >
            Grid
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overlay"}
            aria-controls="overlay-panel"
            id="overlay-tab"
            className={`compareTab ${activeTab === "overlay" ? "compareTab--active" : ""}`}
            onClick={() => setActiveTab("overlay")}
          >
            Overlay
          </button>
        </div>

        <div className="compareStats">
          <span>{loadedSlots.length}/{slots.length} loaded</span>
          <span>{Math.round(zoom * 100)}%</span>
        </div>

        <div className="compareZoomControls">
          <button type="button" onClick={() => setZoom((z) => Math.max(0.1, z * 0.8))}>−</button>
          <button type="button" onClick={() => setZoom(1)}>Reset</button>
          <button type="button" onClick={() => setZoom((z) => Math.min(5, z * 1.2))}>+</button>
        </div>
      </div>

      <div className="compareInputsContainer">
        <div className="inputsGrid">
          {slots.map((slot, index) => (
            <CompareInput
              key={slot.id}
              slot={slot}
              index={index}
              onUpdate={(input) => updateSlot(slot.id, input)}
              onClear={() => clearSlot(slot.id)}
              onRemove={() => removeSlot(slot.id)}
              onDuplicate={() => duplicateSlot(slot.id)}
              canRemove={slots.length > 1}
            />
          ))}
        </div>
        <button type="button" className="addSlotButton" onClick={addSlot}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Slot
        </button>
      </div>

      {loadedSlots.length > 0 ? (
        <div className="compareOutput">
          {activeTab === "grid" ? (
            <div className="gridView" role="tabpanel" id="grid-panel" aria-labelledby="grid-tab">
              <div
                className="gridViewContent"
                style={{
                  transform: `scale(${zoom})`,
                  gridTemplateColumns: `repeat(${Math.min(loadedSlots.length, 3)}, 1fr)`,
                }}
              >
                {loadedSlots.map((slot) => (
                  <div key={slot.id} className="gridViewItem">
                    <img
                      src={slot.previewUrl || ""}
                      alt={slot.input?.name || "SVG"}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setSlots((prev) =>
                          prev.map((s) =>
                            s.id === slot.id
                              ? { ...s, size: { width: img.naturalWidth, height: img.naturalHeight } }
                              : s
                          )
                        );
                      }}
                    />
                    <div className="gridViewItemLabel">
                      <span>{slot.input?.name}</span>
                      {slot.size && (
                        <span className="gridViewItemDimensions">
                          {slot.size.width}×{slot.size.height}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <OverlayView slots={loadedSlots} />
          )}
        </div>
      ) : (
        <div className="compareEmpty">
          <div className="compareEmptyIcon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
          <h3>No SVGs loaded</h3>
          <p>Add SVGs above to start comparing</p>
        </div>
      )}
    </section>
  );
}

function CompareInput({
  slot,
  index,
  onUpdate,
  onClear,
  onRemove,
  onDuplicate,
  canRemove,
}: {
  slot: CompareSlot;
  index: number;
  onUpdate: (input: SvgInput) => void;
  onClear: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  canRemove: boolean;
}) {
  const fileInputId = useId();
  const [pasteValue, setPasteValue] = useState("");

  async function handleFile(file: File) {
    const text = await file.text();
    if (!looksLikeSvg(text)) return;
    onUpdate(buildSvgInput(file.name, text));
  }

  function handlePaste() {
    if (!pasteValue.trim() || !looksLikeSvg(pasteValue)) return;
    onUpdate(buildSvgInput("pasted.svg", pasteValue));
    setPasteValue("");
  }

  return (
    <div
      className={`compareInputCard ${slot.input ? "compareInputCard--loaded" : ""}`}
    >
      <span className="srOnly">Slot {index + 1}: {slot.input?.name || "empty"}</span>
      <div className="compareInputHeader">
        <div className="compareInputTitle">
          <span className="compareInputNumber">{index + 1}</span>
          {slot.input && slot.size && (
            <span className="compareInputLabel">{slot.size.width}×{slot.size.height}</span>
          )}
        </div>
        <div className="compareInputActions">
          {slot.input && (
            <>
              <button type="button" className="compareInputAction" onClick={onDuplicate} title="Duplicate">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
              <button type="button" className="compareInputAction" onClick={onClear} title="Clear">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
          {canRemove && (
            <button
              type="button"
              className="compareInputAction compareInputAction--danger"
              onClick={onRemove}
              title="Remove"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <polyline points="3,6 5,6 21,6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {slot.input ? (
        <div className="compareInputPreview">
          {slot.previewUrl && <img src={slot.previewUrl} alt={slot.input.name} />}
          <div className="compareInputInfo">
            <span className="compareInputFilename">{slot.input.name}</span>
          </div>
        </div>
      ) : (
        <div className="compareInputEmpty">
          <label htmlFor={fileInputId} className="compareDropZone">
            <input
              id={fileInputId}
              type="file"
              accept=".svg,image/svg+xml"
              className="srOnly"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <span className="compareDropZoneContent">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17,8 12,3 7,8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Drop or click</span>
            </span>
          </label>
          <div className="compareInputOr">or paste</div>
          <textarea
            className="compareInputTextarea"
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder="\u003csvg...\u003e"
            rows={2}
          />
          <button
            type="button"
            className="actionButton actionButton--primary compareInputLoad"
            onClick={handlePaste}
            disabled={!pasteValue.trim()}
          >
            Load
          </button>
        </div>
      )}
    </div>
  );
}

function OverlayView({ slots }: { slots: CompareSlot[] }) {
  const [sliderPos, setSliderPos] = useState(50);

  if (slots.length < 2) {
    return <div className="overlayEmpty">Load at least 2 SVGs for overlay</div>;
  }

  const base = slots[0];
  const compare = slots[1];

  return (
    <div className="overlayView" role="tabpanel" id="overlay-panel" aria-labelledby="overlay-tab">
      <div className="overlaySliderControl">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPos}
          onChange={(e) => setSliderPos(Number(e.target.value))}
          aria-label="Comparison reveal slider"
          aria-valuetext={`Left ${sliderPos}%, Right ${100 - sliderPos}%`}
        />
        <span aria-hidden="true">{sliderPos}%</span>
      </div>
      <div className="overlayViewport">
        <div className="overlayBase">
          <img src={base.previewUrl || ""} alt={base.input?.name} />
          <span className="overlayLabel">1: {base.input?.name}</span>
        </div>
        <div className="overlayTop" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={compare.previewUrl || ""} alt={compare.input?.name} />
          <div className="overlaySliderHandle" style={{ left: `${sliderPos}%` }}>
            <div className="overlaySliderLine" />
          </div>
          <span className="overlayLabel">2: {compare.input?.name}</span>
        </div>
      </div>
    </div>
  );
}
