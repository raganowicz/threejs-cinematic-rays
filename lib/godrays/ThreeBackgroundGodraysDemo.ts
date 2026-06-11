import {
  ACESFilmicToneMapping,
  AddEquation,
  AmbientLight,
  Clock,
  Color,
  CubeCamera,
  CustomBlending,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  OneFactor,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SrcAlphaFactor,
  TorusKnotGeometry,
  Vector2,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderer,
  ZeroFactor,
} from "three";
import {
  DEFAULT_GODRAYS_OPTIONS,
  type GodRaysOptions,
  type GodraysOptionsPatch,
  type GodraysSceneOptions,
} from "./types";

interface ThreeBackgroundGodraysDemoConfig {
  mount: HTMLElement;
  options?: GodraysOptionsPatch;
  pixelRatio?: number;
}

const GODRAYS_3D_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GODRAYS_3D_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

varying vec2 vUv;

uniform float uTime;
uniform float uIntensity;
uniform float uOpacity;
uniform float uAspect;
uniform float uAngle;
uniform float uRaySpeed;
uniform float uRayDirection;
uniform int uRayMotion;
uniform float uBeamFocus;
uniform float uRaySpread;
uniform float uRayThickness;
uniform int uRayCount;
uniform float uRaySeed;
uniform vec2 uOrigin;
uniform vec3 uColor;
uniform vec3 uBgColor;

float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float clamp01(float value) {
  return clamp(value, 0.0, 1.0);
}

float angularDistance(float a, float b) {
  return abs(atan(sin(a - b), cos(a - b)));
}

float dither(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

void main() {
  vec2 uv = vUv;
  float t = (uTime + uRaySeed * 0.37) * 0.62;
  float motionSign = (uRayMotion == 0 || uRayMotion == 3) ? 1.0 : -1.0;

  vec2 p = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  vec2 o = vec2((uOrigin.x - 0.5) * uAspect, uOrigin.y - 0.5);
  vec2 toPoint = p - o;
  vec2 rayDir = normalize(vec2(cos(uAngle), sin(uAngle)));
  vec2 rayNormal = vec2(-rayDir.y, rayDir.x);
  float pointAngle = atan(toPoint.y, toPoint.x);
  float sourceDistance = length(toPoint);

  float depth = dot(toPoint, rayDir);
  float cross = dot(toPoint, rayNormal);
  float falloffDepth = max(depth - 2.75, 0.0);

  float entryFade = smoothstep(-0.18, 0.38, depth);
  float depthFade = 1.0 - smoothstep(2.85, 4.3, depth);
  float distanceFalloff = exp(-falloffDepth * 0.28);
  float floorFade = smoothstep(0.02, 0.42, uv.y);
  float sourceFade = smoothstep(0.08, 0.42, sourceDistance);

  float broadWash = exp(-abs(cross - 0.1) * 0.72);
  broadWash *= entryFade * (0.34 + 0.66 * depthFade) * (0.5 + 0.5 * distanceFalloff) * (0.2 + 0.8 * floorFade);
  broadWash *= 0.98 + 0.02 * sin(t * 0.12);

  float shafts = 0.0;
  float rayCountF = max(float(uRayCount), 1.0);

  for (int i = 0; i < 32; i++) {
    if (i >= uRayCount) break;
    float fi = float(i);
    float seed = hash(fi * 7.137 + 2.41 + uRaySeed * 0.71);
    float speedSeed = hash(fi * 2.91 + 6.0 + uRaySeed * 0.43);
    float lane = (fi + 0.5) / rayCountF;
    float laneOffset = mix(-0.58, 0.46, lane);
    float drift = 0.0;

    if (uRayMotion < 2) {
      float movingLane = fract(lane + t * motionSign * mix(0.018, 0.055, speedSeed));
      laneOffset = mix(-0.72, 0.58, movingLane);
      drift = sin(t * 0.07 + seed * 6.28318530718) * 0.012;
    } else {
      float orbitT = t * motionSign;
      drift = sin(orbitT * mix(0.07, 0.2, speedSeed) + seed * 6.28318530718) * 0.08;
      drift += sin(orbitT * mix(0.025, 0.08, seed) + fi * 1.7) * 0.035;
    }

    float angleOffset = (laneOffset + drift) * uRaySpread;
    float wrapFade = smoothstep(-0.72 * uRaySpread, -0.54 * uRaySpread, angleOffset) *
      (1.0 - smoothstep(0.42 * uRaySpread, 0.58 * uRaySpread, angleOffset));
    float thickness = max(uRayThickness, 0.025);
    float baseWidth = mix(0.024, 0.07, hash(fi * 3.71 + 8.0 + uRaySeed * 0.17));
    float width = max((baseWidth * thickness) / max(uBeamFocus, 0.2), 0.0025);
    float microSpread = mix(-0.018, 0.018, hash(fi * 9.7 + 0.8 + uRaySeed * 0.31));
    float beamAngle = uAngle + angleOffset + microSpread;
    float angleDelta = angularDistance(pointAngle, beamAngle);
    float localDepth = sourceDistance * cos(angleDelta);

    float distanceToBeam = angleDelta / width;
    float beam = exp(-distanceToBeam * distanceToBeam);
    float companionSeed = hash(fi * 10.13 + 2.6 + uRaySeed * 0.59);
    float companionAngle = angleOffset + mix(-0.1, 0.1, companionSeed) * uRaySpread;
    float companionDistance = angularDistance(pointAngle, uAngle + companionAngle) / (width * mix(0.75, 1.2, companionSeed));
    float companion = exp(-companionDistance * companionDistance) * smoothstep(0.58, 0.98, companionSeed) * 0.18;
    beam += companion;

    float softness = 0.92 + 0.08 * sin(t * (0.04 + seed * 0.05) + fi * 1.4);
    float localEntryFade = smoothstep(-0.16, 0.36, localDepth);
    float rayFalloff = exp(-max(localDepth - 2.65, 0.0) * mix(0.2, 0.34, seed));
    float pulse = 0.98 + 0.02 * sin(t * (0.05 + seed * 0.05) + fi * 1.9);
    float rayStrength = mix(0.22, 0.68, hash(fi * 5.33 + 3.3 + uRaySeed * 0.23));

    shafts += beam * wrapFade * softness * localEntryFade * sourceFade * floorFade * rayFalloff * pulse * rayStrength;
  }

  shafts = shafts / (1.0 + shafts * 0.52);

  float atmosphere = broadWash * 0.055 + shafts * 0.36;
  float bloom = pow(clamp01(broadWash * 0.18 + shafts * 0.72), 1.24) * 0.2;
  float totalLight = (atmosphere + bloom) * uIntensity;
  float grain = dither(gl_FragCoord.xy);
  totalLight = max(totalLight + (grain - 0.5) / 96.0, 0.0);

  vec3 col = uBgColor + uColor * totalLight;
  col += (grain - 0.5) / 150.0;

  vec3 lightDelta = max(clamp(col, 0.0, 1.0) - uBgColor, 0.0);
  float alpha = clamp01((broadWash * 0.055 + shafts * 0.74 + bloom) * uOpacity + (grain - 0.5) / 180.0);
  gl_FragColor = vec4(lightDelta, alpha);
}
`;

export class SpatialGodRays {
  private readonly geometry = new PlaneGeometry(1, 1);
  private readonly sheets: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
  private readonly materials: ShaderMaterial[] = [];
  private elapsedTime = 0;
  private lastAspect = 1;
  private options: GodRaysOptions;

  constructor(options: GodRaysOptions) {
    this.options = options;
    this.createSheet(options.z ?? -0.9, 0, 1, true);
    this.createSheet(0.45, 0.31, 0.62, false);
    this.applyOptions(options);
  }

  get meshes(): Mesh<PlaneGeometry, ShaderMaterial>[] {
    return this.sheets;
  }

  update(delta: number): void {
    const speed = this.sanitize(this.options.raySpeed, 0.62, 0, 10);

    this.elapsedTime += delta * speed;

    for (const material of this.materials) {
      material.uniforms.uTime.value = this.elapsedTime;
    }
  }

  resize(camera: PerspectiveCamera, width: number, height: number): void {
    this.lastAspect = width / Math.max(height, 1);

    for (const sheet of this.sheets) {
      const distance = Math.max(camera.position.z - sheet.position.z, 0.01);
      const viewportHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
      const viewportWidth = viewportHeight * this.lastAspect;
      sheet.scale.set(viewportWidth * 1.65, viewportHeight * 1.65, 1);
    }

    for (const material of this.materials) {
      material.uniforms.uAspect.value = this.lastAspect;
    }
  }

  setVisible(visible: boolean): void {
    const depthMode = this.options.rayDepthMode ?? 2;

    this.sheets[0].visible = visible && depthMode !== 1;
    this.sheets[1].visible = visible && depthMode !== 0;
  }

  applyOptions(options: GodRaysOptions): void {
    this.options = {
      ...this.options,
      ...options,
    };
    const color = this.options.color ?? new Vector3(0.612, 0.639, 0.651);
    const origin = this.options.origin ?? new Vector2(1.48, 1.86);

    for (const material of this.materials) {
      material.uniforms.uIntensity.value = this.sanitize(this.options.intensity, 0.75, 0, 10);
      material.uniforms.uOpacity.value = this.sanitize(this.options.opacity, 0.58, 0, 1);
      material.uniforms.uAngle.value = this.sanitize(this.options.angle, -2.3, -Math.PI * 2, Math.PI * 2);
      material.uniforms.uRaySpeed.value = this.sanitize(this.options.raySpeed, 0.62, 0, 10);
      material.uniforms.uRayDirection.value = this.options.rayDirection ?? -1;
      material.uniforms.uRayMotion.value = this.options.rayMotion ?? 2;
      material.uniforms.uBeamFocus.value = this.sanitize(this.options.beamFocus, 1, 0.2, 10);
      material.uniforms.uRaySpread.value = this.sanitize(this.options.raySpread, 1, 0, 10);
      material.uniforms.uRayThickness.value = this.sanitize(this.options.rayThickness, 0.32, 0.025, 10);
      material.uniforms.uRayCount.value = Math.floor(this.sanitize(this.options.rayCount, 10, 1, 32));
      material.uniforms.uOrigin.value.copy(origin);
      material.uniforms.uColor.value.setRGB(color.x, color.y, color.z);
      material.uniforms.uAspect.value = this.lastAspect;
    }

    this.setVisible(this.options.visible ?? true);
  }

  private sanitize(value: number | undefined, fallback: number, min: number, max: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return fallback;
    }

    return Math.max(min, Math.min(max, value));
  }

  dispose(): void {
    this.geometry.dispose();

    for (const material of this.materials) {
      material.dispose();
    }
  }

  private createSheet(z: number, seedOffset: number, energy: number, depthTest: boolean): void {
    const color = this.options.color ?? new Vector3(0.612, 0.639, 0.651);
    const material = new ShaderMaterial({
      vertexShader: GODRAYS_3D_VERTEX_SHADER,
      fragmentShader: GODRAYS_3D_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: (this.options.intensity ?? 0.75) * energy },
        uOpacity: { value: (this.options.opacity ?? 0.58) * energy },
        uAspect: { value: 1 },
        uAngle: { value: this.options.angle ?? -2.3 },
        uRaySpeed: { value: this.options.raySpeed ?? 0.62 },
        uRayDirection: { value: this.options.rayDirection ?? -1 },
        uRayMotion: { value: this.options.rayMotion ?? 2 },
        uBeamFocus: { value: this.options.beamFocus ?? 1 },
        uRaySpread: { value: this.options.raySpread ?? 1 },
        uRayThickness: { value: this.options.rayThickness ?? 0.32 },
        uRayCount: { value: Math.floor(this.options.rayCount ?? 10) },
        uRaySeed: { value: 17.13 + seedOffset },
        uOrigin: { value: (this.options.origin ?? new Vector2(1.48, 1.86)).clone() },
        uColor: { value: new Color(color.x, color.y, color.z) },
        uBgColor: { value: new Vector3(0.118, 0.133, 0.149) },
      },
      transparent: true,
      depthTest,
      depthWrite: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneFactor,
      blendEquationAlpha: AddEquation,
      blendSrcAlpha: ZeroFactor,
      blendDstAlpha: OneFactor,
      dithering: true,
      precision: "highp",
    });
    const sheet = new Mesh(this.geometry, material);

    sheet.position.z = z;
    sheet.renderOrder = z < 0 ? 0 : 2;
    this.sheets.push(sheet);
    this.materials.push(material);
  }
}

export class ThreeBackgroundGodraysDemo {
  readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 100);
  private readonly clock = new Clock();
  private readonly raySheets: SpatialGodRays;
  private readonly ambientLight = new AmbientLight(0xd8e5f6, 1.18);
  private readonly hemisphereLight = new HemisphereLight(0xf4f8ff, 0x27354a, 0.92);
  private readonly reflectionTarget = new WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
  private readonly reflectionCamera = new CubeCamera(0.1, 30, this.reflectionTarget);
  private readonly demoKnot: Mesh<TorusKnotGeometry, MeshPhysicalMaterial>;
  private options: GodraysSceneOptions;

  constructor(config: ThreeBackgroundGodraysDemoConfig) {
    this.options = {
      background: {
        ...DEFAULT_GODRAYS_OPTIONS.background,
        ...config.options?.background,
      },
      backgroundLayer: {
        ...DEFAULT_GODRAYS_OPTIONS.backgroundLayer,
        ...config.options?.backgroundLayer,
      },
      foregroundLayer: {
        ...DEFAULT_GODRAYS_OPTIONS.foregroundLayer,
        ...config.options?.foregroundLayer,
      },
      model: {
        ...(DEFAULT_GODRAYS_OPTIONS.model ?? { visible: true }),
        ...config.options?.model,
      },
    };

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      precision: "highp",
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(config.pixelRatio ?? Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";

    this.camera.position.set(0, 0, 4.9);
    this.camera.lookAt(0, 0, 0);

    this.raySheets = new SpatialGodRays(this.options.backgroundLayer);
    const knotMaterial = new MeshPhysicalMaterial({
      color: new Color("#f8fbff"),
      emissive: new Color("#0b1220"),
      emissiveIntensity: 0.015,
      metalness: 1,
      roughness: 0.018,
      clearcoat: 1,
      clearcoatRoughness: 0.018,
      envMap: this.reflectionTarget.texture,
      envMapIntensity: 0.98,
    });
    this.demoKnot = new Mesh(new TorusKnotGeometry(0.42, 0.13, 180, 24), knotMaterial);
    this.demoKnot.geometry.center();
    this.demoKnot.scale.setScalar(1.1);
    this.demoKnot.position.set(0, 0, 0);
    this.demoKnot.visible = this.options.model?.visible ?? true;
    this.demoKnot.renderOrder = 1;

    for (const sheet of this.raySheets.meshes) {
      this.scene.add(sheet);
    }
    this.scene.add(this.ambientLight);
    this.scene.add(this.hemisphereLight);
    this.scene.add(this.demoKnot);
    this.scene.add(this.reflectionCamera);

    this.applyBackground();

    config.mount.appendChild(this.renderer.domElement);
    this.setSize(config.mount.clientWidth, config.mount.clientHeight);
  }

  setSize(width: number, height: number): void {
    const safeWidth = Math.max(width, window.innerWidth, 1);
    const safeHeight = Math.max(height, window.innerHeight, 1);

    this.camera.aspect = safeWidth / safeHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(safeWidth, safeHeight, true);
    this.raySheets.resize(this.camera, safeWidth, safeHeight);
  }

  render(): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);

    this.raySheets.update(delta);
    this.updateDynamicReflection();
    this.demoKnot.rotation.x += delta * 0.22;
    this.demoKnot.rotation.y += delta * 0.28;
    this.demoKnot.rotation.z += delta * 0.06;
    this.renderer.render(this.scene, this.camera);
  }

  updateOptions(options: GodraysOptionsPatch): void {
    if (options.background) {
      this.options.background = {
        ...this.options.background,
        ...options.background,
      };
      this.applyBackground();
    }

    if (options.backgroundLayer) {
      this.options.backgroundLayer = {
        ...this.options.backgroundLayer,
        ...options.backgroundLayer,
      };
      this.raySheets.applyOptions(this.options.backgroundLayer);
    }

    if (options.model) {
      const modelOptions = this.options.model ?? { visible: true };
      this.options.model = {
        ...modelOptions,
        ...options.model,
      };
      this.demoKnot.visible = this.options.model.visible ?? true;
    }
  }

  dispose(): void {
    this.raySheets.dispose();
    this.reflectionTarget.dispose();
    this.demoKnot.geometry.dispose();
    this.demoKnot.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private updateDynamicReflection(): void {
    const modelVisible = this.demoKnot.visible;

    this.demoKnot.visible = false;
    this.reflectionCamera.position.copy(this.demoKnot.position);
    this.reflectionCamera.update(this.renderer, this.scene);
    this.demoKnot.visible = modelVisible;
  }

  private applyBackground(): void {
    if (this.options.background.transparent) {
      this.renderer.setClearColor(0x000000, 0);
    } else {
      const color = new Color(this.options.background.color);
      this.renderer.setClearColor(color, 1);
    }
  }
}
