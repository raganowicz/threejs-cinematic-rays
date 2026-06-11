import {
  AddEquation,
  CustomBlending,
  Mesh,
  OneFactor,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  SrcAlphaFactor,
  Vector2,
  Vector3,
  ZeroFactor,
} from "three";
import { GODRAYS_FRAGMENT_SHADER, GODRAYS_VERTEX_SHADER } from "./shaders";
import type { GodRaysOptions } from "./types";

export class GodRays {
  private readonly geometry = new PlaneGeometry(2, 2);
  private material: ShaderMaterial;
  private elapsedTime = 0;
  private lastCameraZ = Number.NaN;
  private lastHeight = 0;
  private lastWidth = 0;

  readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;

  constructor(options: GodRaysOptions = {}) {
    const {
      angle = -2.3,
      color = new Vector3(0.612, 0.639, 0.651),
      intensity = 0.2,
      opacity = 1,
      origin = new Vector2(1.48, 1.86),
      visible = true,
      z = 0,
      raySpeed = 1.0,
      rayDirection = -1.0,
      beamFocus = 1.0,
      raySpread = 1.0,
      rayLength = 1.4,
      rayBrightness = 1.0,
      rayThickness = 1.0,
      rayCount = 8,
      raySeed = Math.random() * 1000,
    } = options;

    this.material = new ShaderMaterial({
      vertexShader: GODRAYS_VERTEX_SHADER,
      fragmentShader: GODRAYS_FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vector2(1, 1) },
        uIntensity: { value: intensity },
        uOpacity: { value: opacity },
        uColor: { value: color },
        uBgColor: { value: new Vector3(0.118, 0.133, 0.149) },
        uOrigin: { value: origin },
        uAngle: { value: angle },
        uRaySpeed: { value: raySpeed },
        uRayDirection: { value: rayDirection },
        uBeamFocus: { value: beamFocus },
        uRaySpread: { value: raySpread },
        uRayLength: { value: rayLength },
        uRayBrightness: { value: rayBrightness },
        uRayThickness: { value: rayThickness },
        uRayCount: { value: rayCount },
        uRaySeed: { value: raySeed },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: CustomBlending,
      blendEquation: AddEquation,
      blendSrc: SrcAlphaFactor,
      blendDst: OneFactor,
      blendEquationAlpha: AddEquation,
      blendSrcAlpha: ZeroFactor,
      blendDstAlpha: OneFactor,
    });

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.position.z = z;
    this.mesh.visible = visible;
  }

  update(delta: number): void {
    if (!this.mesh.visible) {
      return;
    }

    this.elapsedTime += delta;
    this.material.uniforms.uTime.value = this.elapsedTime;
  }

  setVisible(visible: boolean): void {
    this.mesh.visible = visible;
  }

  setIntensity(intensity: number): void {
    this.material.uniforms.uIntensity.value = intensity;
  }

  setOpacity(opacity: number): void {
    this.material.uniforms.uOpacity.value = opacity;
  }

  setAngle(angle: number): void {
    this.material.uniforms.uAngle.value = angle;
  }

  setOrigin(x: number, y: number): void {
    this.material.uniforms.uOrigin.value.set(x, y);
  }

  setColor(color: Vector3): void {
    this.material.uniforms.uColor.value.copy(color);
  }

  setRaySpeed(speed: number): void {
    this.material.uniforms.uRaySpeed.value = speed;
  }

  setRayDirection(direction: number): void {
    this.material.uniforms.uRayDirection.value = direction >= 0 ? 1 : -1;
  }

  setBeamFocus(focus: number): void {
    this.material.uniforms.uBeamFocus.value = focus;
  }

  setRaySpread(spread: number): void {
    this.material.uniforms.uRaySpread.value = spread;
  }

  setRayLength(length: number): void {
    this.material.uniforms.uRayLength.value = Math.max(0.05, Math.min(4, length));
  }

  setRayBrightness(brightness: number): void {
    this.material.uniforms.uRayBrightness.value = Math.max(0, brightness);
  }

  setRayThickness(thickness: number): void {
    this.material.uniforms.uRayThickness.value = Math.max(0.005, thickness);
  }

  setRayCount(count: number): void {
    this.material.uniforms.uRayCount.value = Math.floor(Math.max(1, Math.min(32, count)));
  }

  setRaySeed(seed: number): void {
    this.material.uniforms.uRaySeed.value = seed;
  }

  resize(camera: PerspectiveCamera, width: number, height: number): void {
    const cameraChanged = Math.abs(camera.position.z - this.lastCameraZ) > 0.001;
    if (width === this.lastWidth && height === this.lastHeight && !cameraChanged) {
      return;
    }

    this.lastWidth = width;
    this.lastHeight = height;
    this.lastCameraZ = camera.position.z;
    this.material.uniforms.uResolution.value.set(width, height);

    const distance = Math.max(camera.position.z - this.mesh.position.z, 0.01);
    const viewportHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
    const viewportWidth = viewportHeight * camera.aspect;
    this.mesh.scale.set(viewportWidth, viewportHeight, 1);
  }

  destroy(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}
