import { Vector2, Vector3 } from "three";
import type { GodRaysOptions, GodraysSceneOptions } from "./types";

const formatNumber = (value: number): string => {
  const rounded = Math.round(value * 1000) / 1000;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const formatVector3 = (vector: Vector3): string =>
  `new Vector3(${formatNumber(vector.x)}, ${formatNumber(vector.y)}, ${formatNumber(vector.z)})`;

const formatVector2 = (vector: Vector2): string =>
  `new Vector2(${formatNumber(vector.x)}, ${formatNumber(vector.y)})`;

const formatPrimitive = (value: string | number | boolean): string =>
  typeof value === "string" ? JSON.stringify(value) : String(value);

const formatLayer = (layer: GodRaysOptions, indent: string): string => {
  const lines: string[] = [];

  if (layer.color) {
    lines.push(`${indent}color: ${formatVector3(layer.color)},`);
  }
  if (typeof layer.angle === "number") {
    lines.push(`${indent}angle: ${formatNumber(layer.angle)},`);
  }
  if (typeof layer.intensity === "number") {
    lines.push(`${indent}intensity: ${formatNumber(layer.intensity)},`);
  }
  if (typeof layer.opacity === "number") {
    lines.push(`${indent}opacity: ${formatNumber(layer.opacity)},`);
  }
  if (layer.origin) {
    lines.push(`${indent}origin: ${formatVector2(layer.origin)},`);
  }
  if (typeof layer.visible === "boolean") {
    lines.push(`${indent}visible: ${layer.visible},`);
  }
  if (typeof layer.z === "number") {
    lines.push(`${indent}z: ${formatNumber(layer.z)},`);
  }
  if (typeof layer.frontZ === "number") {
    lines.push(`${indent}frontZ: ${formatNumber(layer.frontZ)},`);
  }
  if (typeof layer.raySpeed === "number") {
    lines.push(`${indent}raySpeed: ${formatNumber(layer.raySpeed)},`);
  }
  if (typeof layer.rayDirection === "number") {
    lines.push(`${indent}rayDirection: ${formatNumber(layer.rayDirection)},`);
  }
  if (typeof layer.rayMotion === "number") {
    lines.push(`${indent}rayMotion: ${formatNumber(layer.rayMotion)},`);
  }
  if (typeof layer.rayDepthMode === "number") {
    lines.push(`${indent}rayDepthMode: ${formatNumber(layer.rayDepthMode)},`);
  }
  if (typeof layer.raySpread === "number") {
    lines.push(`${indent}raySpread: ${formatNumber(layer.raySpread)},`);
  }
  if (typeof layer.rayLength === "number") {
    lines.push(`${indent}rayLength: ${formatNumber(layer.rayLength)},`);
  }
  if (typeof layer.rayBrightness === "number") {
    lines.push(`${indent}rayBrightness: ${formatNumber(layer.rayBrightness)},`);
  }
  if (typeof layer.rayThickness === "number") {
    lines.push(`${indent}rayThickness: ${formatNumber(layer.rayThickness)},`);
  }
  if (typeof layer.raySoftness === "number") {
    lines.push(`${indent}raySoftness: ${formatNumber(layer.raySoftness)},`);
  }
  if (typeof layer.rayCount === "number") {
    lines.push(`${indent}rayCount: ${formatNumber(layer.rayCount)},`);
  }
  if (typeof layer.rayPulse === "boolean") {
    lines.push(`${indent}rayPulse: ${layer.rayPulse},`);
  }
  if (typeof layer.rayPulseSpeed === "number") {
    lines.push(`${indent}rayPulseSpeed: ${formatNumber(layer.rayPulseSpeed)},`);
  }
  if (typeof layer.rayPulseAmount === "number") {
    lines.push(`${indent}rayPulseAmount: ${formatNumber(layer.rayPulseAmount)},`);
  }
  if (typeof layer.rayPulseStagger === "number") {
    lines.push(`${indent}rayPulseStagger: ${formatNumber(layer.rayPulseStagger)},`);
  }
  if (typeof layer.raySeed === "number") {
    lines.push(`${indent}raySeed: ${formatNumber(layer.raySeed)},`);
  }

  return `{\n${lines.join("\n")}\n${indent.slice(2)}}`;
};

export const serializeGodraysPreset = (options: GodraysSceneOptions): string => {
  const lines = [
    'import { Vector2, Vector3 } from "three";',
    "",
    "const godraysPreset = {",
    "  background: {",
    `    transparent: ${options.background.transparent},`,
    `    color: ${formatPrimitive(options.background.color)},`,
    "  },",
    `  backgroundLayer: ${formatLayer(options.backgroundLayer, "  ")},`,
    `  foregroundLayer: ${formatLayer(options.foregroundLayer, "  ")},`,
  ];

  if (options.model) {
    lines.push("  model: {");
    lines.push(`    visible: ${options.model.visible ?? true},`);
    lines.push("  },");
  }

  if (options.heroText) {
    lines.push("  heroText: {");
    lines.push(`    color: ${formatPrimitive(options.heroText.color)},`);
    lines.push(`    fontFamily: ${formatPrimitive(options.heroText.fontFamily)},`);
    lines.push(`    text: ${formatPrimitive(options.heroText.text)},`);
    lines.push(`    visible: ${options.heroText.visible},`);
    lines.push("  },");
  }

  lines.push("};", "", "export default godraysPreset;");

  return lines.join("\n");
};
