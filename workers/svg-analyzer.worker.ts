/// <reference lib="webworker" />

import { XMLBuilder, XMLParser, XMLValidator } from "fast-xml-parser";
import type {
  ParsedSvgSummary,
  SvgAnalyzerRequest,
  SvgAnalyzerResponse,
  SvgViewBox,
  SvgWarning,
} from "@/types/svg";

const ATTRIBUTE_PREFIX = "@_";
const SOFT_BYTE_LIMIT = 10 * 1024 * 1024;
const SOFT_NODE_LIMIT = 10_000;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: ATTRIBUTE_PREFIX,
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
  ignoreDeclaration: false,
  processEntities: false,
});

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: ATTRIBUTE_PREFIX,
  format: true,
  suppressBooleanAttributes: false,
});

const FONT_STYLE_REGEX = /font-family\s*:\s*([^;]+)/gi;
const COLOR_STYLE_REGEX =
  /(fill|stroke|stop-color|flood-color|lighting-color|color)\s*:\s*([^;]+)/gi;
const URL_STYLE_REGEX = /url\(\s*(['"]?)(.*?)\1\s*\)/gi;

const analyzer = self as DedicatedWorkerGlobalScope;

analyzer.onmessage = (event: MessageEvent<SvgAnalyzerRequest>) => {
  const { requestId, originalText, byteSize } = event.data;
  const summary = analyzeSvg(originalText, byteSize);
  const payload: SvgAnalyzerResponse = { requestId, summary };
  analyzer.postMessage(payload);
};

function analyzeSvg(originalText: string, byteSize: number): ParsedSvgSummary {
  const validation = XMLValidator.validate(originalText, {
    allowBooleanAttributes: true,
  });

  if (validation !== true) {
    return {
      width: null,
      height: null,
      widthText: null,
      heightText: null,
      viewBox: null,
      aspectRatio: null,
      rootTag: null,
      elementCounts: {},
      totalElements: 0,
      approxNodeCount: 0,
      colorPalette: [],
      fonts: [],
      ids: [],
      classes: [],
      hasGradients: false,
      hasFilters: false,
      hasMasks: false,
      hasText: false,
      hasScripts: false,
      hasForeignObject: false,
      hasExternalRefs: false,
      eventAttributeCount: 0,
      warnings: [
        {
          code: "broken-xml",
          level: "danger",
          message: "The SVG markup is not valid XML.",
          details: validation.err.msg,
        },
      ],
      prettySource: originalText.trim(),
      parseStatus: "error",
      parseError: validation.err.msg,
    };
  }

  try {
    const parsedDocument = parser.parse(originalText) as Record<string, unknown>;
    const rootTag = Object.keys(parsedDocument).find((key) => !key.startsWith("?"));

    if (!rootTag) {
      return createParseFailure("The SVG document has no root element.", originalText);
    }

    const rootNode = parsedDocument[rootTag];
    if (!rootTag.toLowerCase().endsWith("svg") || !isPlainObject(rootNode)) {
      return createParseFailure(
        "The loaded document does not expose a readable <svg> root.",
        originalText,
      );
    }

    const elementCounts: Record<string, number> = {};
    const colors = new Set<string>();
    const fonts = new Set<string>();
    const ids = new Set<string>();
    const classNames = new Set<string>();
    const warnings: SvgWarning[] = [];

    let totalElements = 0;
    let hasScripts = false;
    let hasForeignObject = false;
    let hasExternalRefs = false;
    let eventAttributeCount = 0;

    const walk = (tagName: string, value: unknown) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => walk(tagName, entry));
        return;
      }

      if (!isPlainObject(value)) {
        return;
      }

      const localTag = tagName.split(":").pop() ?? tagName;
      totalElements += 1;
      elementCounts[localTag] = (elementCounts[localTag] ?? 0) + 1;

      const attributes = extractAttributes(value);
      inspectAttributes(attributes, colors, fonts, ids, classNames);

      if (localTag === "script") {
        hasScripts = true;
      }

      if (localTag === "foreignObject") {
        hasForeignObject = true;
      }

      if (attributes.href && isExternalReference(attributes.href)) {
        hasExternalRefs = true;
      }

      if (attributes["xlink:href"] && isExternalReference(attributes["xlink:href"])) {
        hasExternalRefs = true;
      }

      for (const attributeName of Object.keys(attributes)) {
        if (attributeName.toLowerCase().startsWith("on")) {
          eventAttributeCount += 1;
        }
      }

      const styleValue = attributes.style;
      if (styleValue) {
        URL_STYLE_REGEX.lastIndex = 0;
        let styleMatch = URL_STYLE_REGEX.exec(styleValue);
        while (styleMatch) {
          if (isExternalReference(styleMatch[2])) {
            hasExternalRefs = true;
          }
          styleMatch = URL_STYLE_REGEX.exec(styleValue);
        }
      }

      Object.entries(value).forEach(([key, childValue]) => {
        if (key.startsWith(ATTRIBUTE_PREFIX) || key === "#text" || key === "?xml") {
          return;
        }

        walk(key, childValue);
      });
    };

    walk(rootTag, rootNode);

    const rootAttributes = extractAttributes(rootNode);
    const viewBox = parseViewBox(rootAttributes.viewBox);
    const width = parseNumericDimension(rootAttributes.width);
    const height = parseNumericDimension(rootAttributes.height);
    const aspectRatio =
      viewBox?.width && viewBox.height
        ? viewBox.width / viewBox.height
        : width && height
          ? width / height
          : null;

    if (hasScripts) {
      warnings.push({
        code: "script-tag",
        level: "danger",
        message: "Script tags were detected. The viewer will never inline-mount this SVG.",
      });
    }

    if (hasForeignObject) {
      warnings.push({
        code: "foreign-object",
        level: "warning",
        message:
          "foreignObject is present. Rendering can diverge across browsers and image export targets.",
      });
    }

    if (eventAttributeCount > 0) {
      warnings.push({
        code: "event-attributes",
        level: "danger",
        message: `Inline event attributes were detected (${eventAttributeCount}).`,
      });
    }

    if (hasExternalRefs) {
      warnings.push({
        code: "external-reference",
        level: "warning",
        message:
          "External href or xlink:href references are present. Preview may work, but PNG export can fail.",
      });
    }

    if (byteSize > SOFT_BYTE_LIMIT) {
      warnings.push({
        code: "heavy-file",
        level: "warning",
        message: "This SVG is larger than 10 MB. Heavy analysis and PNG export are softened in v1.",
      });
    }

    if (totalElements > SOFT_NODE_LIMIT) {
      warnings.push({
        code: "dense-structure",
        level: "warning",
        message: `Approximate element count is ${totalElements}, above the 10k soft limit.`,
      });
    }

    if ((elementCounts.text ?? 0) > 0 || (elementCounts.tspan ?? 0) > 0) {
      warnings.push({
        code: "font-rendering",
        level: "info",
        message:
          "Text nodes were found. Visual output can shift if the original fonts are not available.",
      });
    }

    if (!viewBox) {
      warnings.push({
        code: "missing-viewbox",
        level: "info",
        message: "No viewBox attribute was found. Fit behavior may rely on explicit width and height.",
      });
    }

    return {
      width,
      height,
      widthText: rootAttributes.width ?? null,
      heightText: rootAttributes.height ?? null,
      viewBox,
      aspectRatio,
      rootTag,
      elementCounts,
      totalElements,
      approxNodeCount: totalElements,
      colorPalette: Array.from(colors).slice(0, 12),
      fonts: Array.from(fonts).slice(0, 12),
      ids: Array.from(ids).slice(0, 16),
      classes: Array.from(classNames).slice(0, 16),
      hasGradients: Boolean((elementCounts.linearGradient ?? 0) + (elementCounts.radialGradient ?? 0)),
      hasFilters: Boolean(elementCounts.filter ?? 0),
      hasMasks: Boolean(elementCounts.mask ?? 0),
      hasText: Boolean((elementCounts.text ?? 0) + (elementCounts.tspan ?? 0) + (elementCounts.textPath ?? 0)),
      hasScripts,
      hasForeignObject,
      hasExternalRefs,
      eventAttributeCount,
      warnings,
      prettySource: builder.build(parsedDocument).trim(),
      parseStatus: "ok",
    };
  } catch (error) {
    return createParseFailure(
      error instanceof Error ? error.message : "Unknown worker parsing error.",
      originalText,
    );
  }
}

function createParseFailure(message: string, originalText: string): ParsedSvgSummary {
  return {
    width: null,
    height: null,
    widthText: null,
    heightText: null,
    viewBox: null,
    aspectRatio: null,
    rootTag: null,
    elementCounts: {},
    totalElements: 0,
    approxNodeCount: 0,
    colorPalette: [],
    fonts: [],
    ids: [],
    classes: [],
    hasGradients: false,
    hasFilters: false,
    hasMasks: false,
    hasText: false,
    hasScripts: false,
    hasForeignObject: false,
    hasExternalRefs: false,
    eventAttributeCount: 0,
    warnings: [
      {
        code: "worker-parse-failure",
        level: "danger",
        message: "Worker parsing failed.",
        details: message,
      },
    ],
    prettySource: originalText.trim(),
    parseStatus: "error",
    parseError: message,
  };
}

function extractAttributes(node: Record<string, unknown>): Record<string, string> {
  return Object.entries(node).reduce<Record<string, string>>((result, [key, value]) => {
    if (!key.startsWith(ATTRIBUTE_PREFIX) || typeof value !== "string") {
      return result;
    }

    result[key.slice(ATTRIBUTE_PREFIX.length)] = value;
    return result;
  }, {});
}

function inspectAttributes(
  attributes: Record<string, string>,
  colors: Set<string>,
  fonts: Set<string>,
  ids: Set<string>,
  classNames: Set<string>,
) {
  const directColorAttributes = [
    attributes.fill,
    attributes.stroke,
    attributes["stop-color"],
    attributes["flood-color"],
    attributes["lighting-color"],
    attributes.color,
  ];

  directColorAttributes.forEach((value) => {
    const normalized = normalizeColor(value);
    if (normalized) {
      colors.add(normalized);
    }
  });

  if (attributes.style) {
    COLOR_STYLE_REGEX.lastIndex = 0;
    let colorMatch = COLOR_STYLE_REGEX.exec(attributes.style);
    while (colorMatch) {
      const normalized = normalizeColor(colorMatch[2]);
      if (normalized) {
        colors.add(normalized);
      }
      colorMatch = COLOR_STYLE_REGEX.exec(attributes.style);
    }

    FONT_STYLE_REGEX.lastIndex = 0;
    let fontMatch = FONT_STYLE_REGEX.exec(attributes.style);
    while (fontMatch) {
      const normalizedFont = normalizeFont(fontMatch[1]);
      if (normalizedFont) {
        fonts.add(normalizedFont);
      }
      fontMatch = FONT_STYLE_REGEX.exec(attributes.style);
    }
  }

  if (attributes["font-family"]) {
    const normalizedFont = normalizeFont(attributes["font-family"]);
    if (normalizedFont) {
      fonts.add(normalizedFont);
    }
  }

  if (attributes.id) {
    ids.add(attributes.id.trim());
  }

  if (attributes.class) {
    attributes.class
      .split(/\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => classNames.add(entry));
  }
}

function parseNumericDimension(value?: string): number | null {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^([+-]?\d*\.?\d+)(px)?$/i);
  if (!match) {
    return null;
  }

  const nextValue = Number(match[1]);
  return Number.isFinite(nextValue) ? nextValue : null;
}

function parseViewBox(value?: string): SvgViewBox | null {
  if (!value) {
    return null;
  }

  const tokens = value
    .trim()
    .split(/[\s,]+/)
    .map((token) => Number(token));

  if (tokens.length !== 4 || tokens.some((token) => !Number.isFinite(token))) {
    return null;
  }

  return {
    minX: tokens[0],
    minY: tokens[1],
    width: tokens[2],
    height: tokens[3],
    raw: value,
  };
}

function normalizeColor(value?: string): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/^['"]|['"]$/g, "");
  if (!normalized) {
    return null;
  }

  const lowerCase = normalized.toLowerCase();
  if (
    lowerCase === "none" ||
    lowerCase === "inherit" ||
    lowerCase === "transparent" ||
    lowerCase === "currentcolor" ||
    lowerCase.startsWith("url(")
  ) {
    return null;
  }

  return normalized;
}

function normalizeFont(value: string): string | null {
  const normalized = value.trim().replace(/^['"]|['"]$/g, "");
  return normalized || null;
}

function isExternalReference(value: string): boolean {
  const trimmed = value.trim().replace(/^['"]|['"]$/g, "");

  if (!trimmed || trimmed.startsWith("#")) {
    return false;
  }

  return /^(https?:|\/\/|data:|file:|blob:)/i.test(trimmed);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

