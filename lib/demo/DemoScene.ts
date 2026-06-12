import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  CanvasTexture,
  Clock,
  Color,
  CubeCamera,
  HemisphereLight,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  SphereGeometry,
  TorusKnotGeometry,
  WebGLCubeRenderTarget,
  WebGLRenderer,
} from "three";
import { SpatialGodRays } from "../godrays/SpatialGodRays";
import {
  FALLBACK_BACKGROUND,
  mergeGodraysOptions,
  type GodraysHeroTextOptions,
  type GodraysOptionsPatch,
  type GodraysSceneOptions,
} from "../godrays/types";
import { godraysPreset } from "../godrays/presets";

interface DemoSceneConfig {
  mount: HTMLElement;
  options?: GodraysOptionsPatch;
  pixelRatio?: number;
}

export class DemoScene {
  readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 100);
  private readonly clock = new Clock();
  private readonly raySheets: SpatialGodRays;
  private readonly ambientLight = new AmbientLight(0xd8e5f6, 1.18);
  private readonly hemisphereLight = new HemisphereLight(0xf4f8ff, 0x27354a, 0.92);
  private readonly backdropGeometry = new SphereGeometry(60, 32, 16);
  private readonly backdropMaterial = new MeshBasicMaterial({
    color: new Color(FALLBACK_BACKGROUND.color),
    side: BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly backdropMesh = new Mesh(this.backdropGeometry, this.backdropMaterial);
  private readonly reflectionTarget = new WebGLCubeRenderTarget(256, {
    generateMipmaps: true,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
  private readonly reflectionCamera = new CubeCamera(0.1, 30, this.reflectionTarget);
  private readonly demoKnot: Mesh<TorusKnotGeometry, MeshPhysicalMaterial>;
  private readonly heroTextGeometry = new PlaneGeometry(11.2, 2.72);
  private readonly heroTextMaterial = new MeshBasicMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    toneMapped: false,
  });
  private readonly heroTextMesh = new Mesh(this.heroTextGeometry, this.heroTextMaterial);
  private heroTextTexture?: CanvasTexture;
  private heroTextFontRefreshId = 0;
  private options: GodraysSceneOptions;

  constructor(config: DemoSceneConfig) {
    this.options = mergeGodraysOptions({
      ...godraysPreset,
      ...config.options,
    });

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
      color: new Color("#ffffff"),
      metalness: 1,
      roughness: 0.006,
      envMapIntensity: 1,
      envMap: this.reflectionTarget.texture,
    });
    this.demoKnot = new Mesh(new TorusKnotGeometry(0.5, 0.13, 180, 24), knotMaterial);
    this.demoKnot.geometry.center();
    this.demoKnot.scale.setScalar(0.8);
    this.demoKnot.position.set(0, 0, 0);
    this.demoKnot.visible = this.options.model?.visible ?? false;
    this.demoKnot.renderOrder = 1;
    this.heroTextMesh.position.set(0, -0.02, -1.15);
    this.heroTextMesh.renderOrder = 0;
    this.applyHeroText();

    this.scene.add(this.backdropMesh);
    for (const sheet of this.raySheets.meshes) {
      this.scene.add(sheet);
    }
    this.scene.add(this.ambientLight);
    this.scene.add(this.hemisphereLight);
    this.scene.add(this.heroTextMesh);
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

    if (options.heroText) {
      const heroTextOptions = this.options.heroText;
      if (!heroTextOptions) {
        return;
      }

      this.options.heroText = {
        ...heroTextOptions,
        ...options.heroText,
      };
      this.applyHeroText();
    }
  }

  dispose(): void {
    this.raySheets.dispose();
    this.reflectionTarget.dispose();
    this.backdropGeometry.dispose();
    this.backdropMaterial.dispose();
    this.demoKnot.geometry.dispose();
    this.demoKnot.material.dispose();
    this.heroTextTexture?.dispose();
    this.heroTextGeometry.dispose();
    this.heroTextMaterial.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private applyHeroText(): void {
    const textOptions = this.options.heroText;

    if (!textOptions) {
      this.heroTextMesh.visible = false;
      return;
    }

    this.heroTextMesh.visible = textOptions.visible;
    this.updateHeroTextTexture(textOptions);

    const fontSet = document.fonts;
    if (fontSet) {
      const refreshId = ++this.heroTextFontRefreshId;
      fontSet.load(`400 664px "${textOptions.fontFamily}"`).then(() => {
        const latestTextOptions = this.options.heroText;

        if (latestTextOptions && refreshId === this.heroTextFontRefreshId) {
          this.updateHeroTextTexture(latestTextOptions);
        }
      });
    }
  }

  private updateHeroTextTexture(options: GodraysHeroTextOptions): void {
    this.heroTextTexture?.dispose();
    this.heroTextTexture = this.createHeroTextTexture(options);
    this.heroTextMaterial.map = this.heroTextTexture;
    this.heroTextMaterial.needsUpdate = true;
  }

  private createHeroTextTexture(options: GodraysHeroTextOptions): CanvasTexture {
    const canvas = document.createElement("canvas");
    const width = 4096;
    const height = 1024;
    const context = canvas.getContext("2d");

    canvas.width = width;
    canvas.height = height;

    if (!context) {
      return new CanvasTexture(canvas);
    }

    context.clearRect(0, 0, width, height);
    context.fillStyle = options.color;
    context.font = `400 664px "${options.fontFamily}"`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(options.text, width / 2, height / 2 + 48);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;

    return texture;
  }

  private updateDynamicReflection(): void {
    if (!this.options.model?.visible) {
      return;
    }

    const modelVisible = this.demoKnot.visible;
    const heroTextVisible = this.heroTextMesh.visible;

    this.demoKnot.visible = false;
    this.heroTextMesh.visible = false;
    this.reflectionCamera.position.copy(this.demoKnot.position);
    this.reflectionCamera.update(this.renderer, this.scene);
    this.demoKnot.visible = modelVisible;
    this.heroTextMesh.visible = heroTextVisible;
  }

  private applyBackground(): void {
    if (this.options.background.transparent) {
      this.scene.background = null;
      this.backdropMesh.visible = false;
      this.renderer.setClearColor(0x000000, 0);
    } else {
      const color = new Color(this.options.background.color);
      this.scene.background = color;
      this.backdropMaterial.color.copy(color);
      this.backdropMesh.visible = true;
      this.renderer.setClearColor(color, 1);
    }
  }
}
