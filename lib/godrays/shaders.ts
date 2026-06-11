export const GODRAYS_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

export const GODRAYS_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform vec2  uResolution;
uniform float uIntensity;
uniform float uOpacity;
uniform vec3  uColor;
uniform vec3  uBgColor;
uniform vec2  uOrigin;
uniform float uAngle;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

float angularDistance(float a, float b) {
  return abs(atan(sin(a - b), cos(a - b)));
}

float dither(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  float aspect = uResolution.x / uResolution.y;
  vec2 uv = vUv;
  float t = uTime * 0.62;

  vec2 p = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
  vec2 o = vec2((uOrigin.x - 0.5) * aspect, uOrigin.y - 0.5);
  vec2 toPoint = p - o;
  vec2 rayDir = normalize(vec2(cos(uAngle), sin(uAngle)));
  vec2 rayNormal = vec2(-rayDir.y, rayDir.x);
  float pointAngle = atan(toPoint.y, toPoint.x);
  float sourceDistance = length(toPoint);

  float depth = dot(toPoint, rayDir);
  float cross = dot(toPoint, rayNormal);
  float falloffDepth = max(depth - 1.85, 0.0);

  float entryFade = smoothstep(-0.12, 0.25, depth);
  float depthFade = 1.0 - smoothstep(1.55, 2.55, depth);
  float distanceFalloff = exp(-falloffDepth * 0.72);
  float floorFade = smoothstep(0.16, 0.56, uv.y);
  float topRightFade = smoothstep(-0.15, 0.78, uv.y) * smoothstep(-0.2, 0.85, uv.x);

  float broadWash = exp(-abs(cross - 0.12) * 0.58);
  broadWash *= entryFade * (0.35 + 0.65 * depthFade) * (0.42 + 0.58 * distanceFalloff) * (0.18 + 0.82 * floorFade);
  broadWash *= 0.9 + 0.1 * sin(t * 0.18);

  float shafts = 0.0;

  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    float seed = hash(fi * 7.137 + 2.41);
    float speedSeed = hash(fi * 2.91 + 6.0);
    float layer = mix(0.72, 1.34, hash(fi * 6.11 + 4.2));
    float sweep = fract(seed + t * mix(0.006, 0.026, speedSeed) * layer);
    float angleOffset = mix(-0.48, 0.36, sweep);
    float wrapFade = smoothstep(-0.48, -0.36, angleOffset) * (1.0 - smoothstep(0.24, 0.36, angleOffset));
    float width = mix(0.009, 0.032, hash(fi * 3.71 + 8.0));
    float microSpread = mix(-0.024, 0.024, hash(fi * 9.7 + 0.8));
    float beamAngle = uAngle + angleOffset + microSpread;
    float angleDelta = angularDistance(pointAngle, beamAngle);
    float localDepth = sourceDistance * cos(angleDelta);

    float distanceToBeam = angleDelta / width;
    float beam = exp(-distanceToBeam * distanceToBeam);
    float companionSeed = hash(fi * 10.13 + 2.6);
    float companionAngle = angleOffset + mix(-0.08, 0.08, companionSeed);
    float companionDistance = angularDistance(pointAngle, uAngle + companionAngle) / (width * mix(0.55, 0.9, companionSeed));
    float companion = exp(-companionDistance * companionDistance) * smoothstep(0.58, 0.98, companionSeed) * 0.22;
    beam += companion;

    float softness = 0.82 + 0.18 * sin(t * (0.08 + seed * 0.08) + fi * 1.4);
    float localEntryFade = smoothstep(-0.12, 0.25, localDepth);
    float rayFalloff = exp(-max(localDepth - 1.85, 0.0) * mix(0.44, 0.68, seed));
    float pulse = 0.9 + 0.1 * sin(t * (0.1 + seed * 0.12) + fi * 1.9);
    float rayStrength = mix(0.12, 0.58, hash(fi * 5.33 + 3.3));

    shafts += beam * wrapFade * softness * localEntryFade * floorFade * rayFalloff * pulse * rayStrength;
  }

  shafts = shafts / (1.0 + shafts * 0.42);

  float surfaceGlow = topRightFade * exp(-falloffDepth * 0.62) * 0.08;
  float atmosphere = broadWash * 0.12 + shafts * 0.2 + surfaceGlow;
  float bloom = pow(saturate(broadWash * 0.48 + shafts * 0.4), 1.38) * 0.17;
  float totalLight = (atmosphere + bloom) * uIntensity;

  vec3 col = uBgColor + uColor * totalLight;
  col += (dither(gl_FragCoord.xy) - 0.5) / 255.0;

  vec3 lightDelta = max(clamp(col, 0.0, 1.0) - uBgColor, 0.0);
  gl_FragColor = vec4(lightDelta, uOpacity);
}
`;
