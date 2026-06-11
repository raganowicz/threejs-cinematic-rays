import {
  Clock,
  Color,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from "three";
import { GodRays } from "./GodraysLayer";
import {
  DEFAULT_GODRAYS_OPTIONS,
  type GodraysLayerName,
  type GodraysOptionsPatch,
  type GodraysSceneOptions,
} from "./types";

interface ThreeBackgroundGodraysConfig {
  mount: HTMLElement;
  options?: GodraysOptionsPatch;
  pixelRatio?: number;
}

export class ThreeBackgroundGodrays {
  readonly renderer: WebGLRenderer;

  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(28, 1, 0.1, 100);
  private readonly clock = new Clock();
  private readonly layers: Record<GodraysLayerName, GodRays>;
  private options: GodraysSceneOptions;

  constructor(config: ThreeBackgroundGodraysConfig) {
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
    };

    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    this.renderer.setPixelRatio(config.pixelRatio ?? Math.min(window.devicePixelRatio, 1.75));

    this.layers = {
      background: new GodRays({
        ...this.options.backgroundLayer,
      }),
      foreground: new GodRays({
        ...this.options.foregroundLayer,
      }),
    };

    this.layers.background.mesh.renderOrder = 0;
    this.layers.foreground.mesh.renderOrder = 2;

    this.camera.position.z = 5.95;

    this.scene.add(this.layers.background.mesh);
    this.scene.add(this.layers.foreground.mesh);

    this.applyBackground();

    config.mount.appendChild(this.renderer.domElement);
    this.setSize(config.mount.clientWidth, config.mount.clientHeight);
  }

  setSize(width: number, height: number): void {
    if (height <= 0) {
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.layers.background.resize(this.camera, width, height);
    this.layers.foreground.resize(this.camera, width, height);
  }

  render(): void {
    const delta = Math.min(this.clock.getDelta(), 0.05);
    this.layers.background.update(delta);
    this.layers.foreground.update(delta);
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
      this.applyLayerOptions(this.layers.background, options.backgroundLayer);
    }

    if (options.foregroundLayer) {
      this.options.foregroundLayer = {
        ...this.options.foregroundLayer,
        ...options.foregroundLayer,
      };
      this.applyLayerOptions(this.layers.foreground, options.foregroundLayer);
    }
  }

  dispose(): void {
    this.layers.background.destroy();
    this.layers.foreground.destroy();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private applyBackground(): void {
    if (this.options.background.transparent) {
      this.renderer.setClearColor(0x000000, 0);
    } else {
      const color = new Color(this.options.background.color);
      this.renderer.setClearColor(color, 1);
    }
  }

  private applyLayerOptions(layer: GodRays, patch: NonNullable<GodraysOptionsPatch["backgroundLayer"]>): void {
    if (typeof patch.visible === "boolean") {
      layer.setVisible(patch.visible);
    }

    if (typeof patch.intensity === "number") {
      layer.setIntensity(patch.intensity);
    }

    if (typeof patch.opacity === "number") {
      layer.setOpacity(patch.opacity);
    }

    if (typeof patch.angle === "number") {
      layer.setAngle(patch.angle);
    }

    if (patch.origin) {
      layer.setOrigin(patch.origin.x, patch.origin.y);
    }

    if (typeof patch.z === "number") {
      layer.mesh.position.z = patch.z;
    }
  }
}
