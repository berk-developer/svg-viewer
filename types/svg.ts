export type SvgInputKind = "file" | "drop" | "url" | "paste" | "sample";
export type StageBackground = "light" | "dark" | "checkerboard";
export type FitMode = "fit" | "actual" | "custom";
export type SvgWarningLevel = "info" | "warning" | "danger";

export interface SvgWarning {
  code: string;
  level: SvgWarningLevel;
  message: string;
  details?: string;
}

export interface SvgViewBox {
  minX: number;
  minY: number;
  width: number;
  height: number;
  raw: string;
}

export interface SvgInput {
  kind: SvgInputKind;
  name?: string;
  originalText: string;
  byteSize: number;
  importedAt: number;
}

export interface ViewerTransform {
  zoom: number;
  panX: number;
  panY: number;
  fitMode: FitMode;
}

export interface ParsedSvgSummary {
  width?: number | null;
  height?: number | null;
  widthText?: string | null;
  heightText?: string | null;
  viewBox?: SvgViewBox | null;
  aspectRatio?: number | null;
  rootTag?: string | null;
  elementCounts: Record<string, number>;
  totalElements: number;
  approxNodeCount: number;
  colorPalette: string[];
  fonts: string[];
  ids: string[];
  classes: string[];
  hasGradients: boolean;
  hasFilters: boolean;
  hasMasks: boolean;
  hasText: boolean;
  hasScripts: boolean;
  hasForeignObject: boolean;
  hasExternalRefs: boolean;
  eventAttributeCount: number;
  warnings: SvgWarning[];
  prettySource: string;
  parseStatus: "ok" | "error";
  parseError?: string;
}

export interface ExportState {
  canDownloadSvg: boolean;
  canExportPng: boolean;
  blockedReason?: string;
}

export interface SvgAnalyzerRequest {
  requestId: number;
  originalText: string;
  byteSize: number;
}

export interface SvgAnalyzerResponse {
  requestId: number;
  summary: ParsedSvgSummary;
}

