import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import screenvert from "./screenshaders/vertex.glsl";
import screenfrag from "./screenshaders/fragment.glsl";

export const scene = new THREE.Scene();
scene.background = null;

export const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 0.15;

const canvas = document.querySelector(".three") as HTMLCanvasElement;
if (!canvas) {
  throw new Error("Canvas element not found");
}

export const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 2.3;

// Controls
export const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.minDistance = 0.15;
controls.maxDistance = 1;
controls.zoomSpeed = 2;
controls.mouseButtons.RIGHT = null;

const angleLimit = (Math.PI / 180) * 50;
controls.minAzimuthAngle = -angleLimit;
controls.maxAzimuthAngle = angleLimit;
controls.minPolarAngle = Math.PI / 2 - angleLimit;
controls.maxPolarAngle = Math.PI / 2 + angleLimit;
controls.update();

const spotLight = new THREE.SpotLight(0xa7bef6, 20);
spotLight.position.set(10, 10, 10);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
spotLight.decay = 0.5;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

const ambientLight = new THREE.AmbientLight(0xa7bef6, 0.25);
scene.add(ambientLight);

export const uniforms = {
  uDiffuse: { value: null },
  uTime: { value: 0 },
  LINE_SIZE: { value: 130.0 },
  LINE_STRENGTH: { value: 0.05 },
  NOISE_STRENGTH: { value: 0.2 },
  BRIGHTNESS: { value: 1.2 },
  CONTRAST: { value: 1.6 },
};

export let hdriLoaded = false;
export let modelLoaded = false;

const maxProgress = 20;
export const loadingProgress = {
  hdri: 0,
  model: 0,
  getProgressBar() {
    const totalProgress = Math.floor((this.hdri + this.model) / 2);
    const progressChars = Math.floor((totalProgress / 100) * maxProgress);
    return `[${"#"
      .repeat(progressChars)
      .padEnd(maxProgress, ".")}] ${totalProgress}%`;
  },
};

export function loadHDREnvironment(
  onProgress: (progressBar: string) => void,
  onComplete: () => void
) {
  const loader = new RGBELoader();
  loader.load(
    "bg.hdr",
    (texture: THREE.Texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.background = texture;
      scene.environment = texture;

      scene.traverse((child: THREE.Object3D) => {
        if (
          child instanceof THREE.Mesh &&
          child.material instanceof THREE.MeshStandardMaterial
        ) {
          child.material.envMap = texture;
          child.material.needsUpdate = true;
        }
      });

      hdriLoaded = true;
      loadingProgress.hdri = 100;
      onProgress(loadingProgress.getProgressBar());
      onComplete();
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        loadingProgress.hdri = Math.floor((xhr.loaded / xhr.total) * 100);
        onProgress(loadingProgress.getProgressBar());
      }
    }
  );
}

function createInitialTexture(): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = 512;
    canvas.height = 512;

    if (context) {
      context.fillStyle = "black";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.font = "16px monospace";
      context.fillStyle = "#1e40af";
      context.textAlign = "left";
      context.textBaseline = "top";
      context.shadowColor = "#1e40af";
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
      context.shadowBlur = 3;

      context.fillText("Loading...", 40, 40);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    resolve(texture);
  });
}

export function loadModel(
  onProgress: (progressBar: string) => void,
  onComplete: () => void
) {
  const loader = new GLTFLoader();

  loader.load(
    "pc.glb",
    async (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.metalness = 0.5;
            child.material.roughness = 0.1;
            child.material.needsUpdate = true;
          }
          child.castShadow = true;
          child.receiveShadow = true;

          if (
            child.name === "StickyNote1" ||
            child.name === "StickyNote2" ||
            child.name === "StickyNote3" ||
            child.name === "frontpage"
          ) {
            if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.roughness = 1;
            }
          }

          if (child.name === "Object006") {
            createInitialTexture().then((texture) => {
              child.material = new THREE.ShaderMaterial({
                vertexShader: screenvert,
                fragmentShader: screenfrag,
                uniforms: {
                  ...uniforms,
                  uDiffuse: { value: texture },
                },
                transparent: true,
              });
              child.position.z -= 0;
              child.castShadow = false;
              child.receiveShadow = false;
            });
          }
        }
      });

      gltf.scene.position.y -= 0.32;
      scene.add(gltf.scene);
      modelLoaded = true;
      loadingProgress.model = 100;
      onProgress(loadingProgress.getProgressBar());
      onComplete();
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        loadingProgress.model = Math.floor((xhr.loaded / xhr.total) * 100);
        onProgress(loadingProgress.getProgressBar());
      }
    },
    (error) => {
      console.error("Error loading model:", error);
    }
  );
}

function createStarfield() {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];

  for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    vertices.push(x, y, z);
  }

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.4,
    sizeAttenuation: true,
  });

  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
  return stars;
}

export const starfield = createStarfield();

export function animate() {
  requestAnimationFrame(animate);
  if (uniforms.uTime) {
    uniforms.uTime.value += 0.05;
  }
  starfield.rotation.y += 0.0001;
  renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
