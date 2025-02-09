//starting camera position  {x: 0, y: 9.184850993605149e-18, z: 0.15}
import "./style.css";
import {
  scene,
  camera,
  renderer,
  uniforms,
  loadHDREnvironment,
  loadModel,
  animate,
  hdriLoaded,
  modelLoaded,
} from "./model";
import * as THREE from "three";

// Add emulatorjs script
let emulatorjsLoaded = false;
let emulatorInstance: any = null;
let isEmulatorRunning = false;

const emulatorjsScript = document.createElement("script");
emulatorjsScript.src =
  "https://cdn.jsdelivr.net/npm/emulatorjs@latest/dist/emulator.js";
emulatorjsScript.onload = () => {
  emulatorjsLoaded = true;
  (window as any).emulatorjs.pathPrefix =
    "https://cdn.jsdelivr.net/npm/emulatorjs@latest/dist/";
};
document.head.appendChild(emulatorjsScript);

const startTime = performance.now();

const audio = new Audio("music.mp3");
audio.loop = true;
audio.volume = 0.5;
let audioLoaded = false;
audio.addEventListener("canplaythrough", () => {
  audioLoaded = true;
  checkAllLoaded();
});

interface VirtualFile {
  name: string;
  type: "file" | "directory";
  content?: string;
  children?: { [key: string]: VirtualFile };
}

const fileSystem: VirtualFile = {
  name: "/",
  type: "directory",
  children: {
    home: {
      name: "home",
      type: "directory",
      children: {
        user: {
          name: "user",
          type: "directory",
          children: {
            documents: {
              name: "documents",
              type: "directory",
              children: {
                "readme.txt": {
                  name: "readme.txt",
                  type: "file",
                  content: "Welcome to my portfolio!",
                },
              },
            },
            projects: {
              name: "projects",
              type: "directory",
              children: {
                portfolio: {
                  name: "portfolio",
                  type: "directory",
                  children: {},
                },
              },
            },
          },
        },
      },
    },
  },
};

let currentDirectory: VirtualFile =
  fileSystem.children!["home"].children!["user"];
let currentPath: string[] = ["/home/user"];

function resolvePath(path: string): VirtualFile | null {
  if (path === "/") return fileSystem;
  if (path.startsWith("/")) {
    const parts = path.split("/").filter((p) => p);
    let current = fileSystem;
    for (const part of parts) {
      if (!current.children || !current.children[part]) return null;
      current = current.children[part];
    }
    return current;
  } else {
    const parts = path.split("/").filter((p) => p);
    let current = currentDirectory;
    for (const part of parts) {
      if (part === "..") {
        const parentPath = currentPath.slice(0, -1).join("/") || "/";
        current = resolvePath(parentPath)!;
      } else if (part === ".") {
        continue;
      } else {
        if (!current.children || !current.children[part]) return null;
        current = current.children[part];
      }
    }
    return current;
  }
}

function getFullPath(): string {
  return currentPath[currentPath.length - 1];
}

function executeCommand(command: string): string[] {
  const [cmd, ...args] = command.trim().split(" ");
  const output: string[] = [];

  switch (cmd.toLowerCase()) {
    case "ls":
      if (currentDirectory.children) {
        const entries = Object.values(currentDirectory.children);
        entries.forEach((entry) => {
          output.push(
            entry.type === "directory" ? `${entry.name}/` : entry.name
          );
        });
      }
      break;

    case "pwd":
      output.push(getFullPath());
      break;

    case "cd":
      const target = args[0] || "/home/user";
      let newDir: VirtualFile | null;
      let newPath: string;

      if (target === "/") {
        newDir = fileSystem;
        newPath = "/";
      } else if (target.startsWith("/")) {
        newDir = resolvePath(target);
        newPath = target;
      } else {
        const relativePath = target.split("/").filter((p) => p);
        let tempPath = [...currentPath];

        for (const part of relativePath) {
          if (part === "..") {
            if (tempPath.length > 1) {
              tempPath.pop();
            }
          } else if (part !== ".") {
            tempPath.push(part);
          }
        }

        newPath = tempPath.join("/");
        newDir = resolvePath(newPath);
      }

      if (newDir && newDir.type === "directory") {
        currentDirectory = newDir;
        currentPath = newPath === "/" ? ["/"] : newPath.split("/");
      } else {
        output.push(`cd: no such directory: ${target}`);
      }
      break;

    case "cat":
      if (args.length === 0) {
        output.push("cat: missing file operand");
        break;
      }
      const filePath = args[0];
      const file = resolvePath(filePath);

      if (!file) {
        output.push(`cat: ${filePath}: No such file or directory`);
      } else if (file.type === "directory") {
        output.push(`cat: ${filePath}: Is a directory`);
      } else if (file.content !== undefined) {
        output.push(file.content);
      } else {
        output.push(`cat: ${filePath}: Unable to read file`);
      }
      break;

    case "help":
      output.push("Available commands:");
      output.push("  clear - Clear the terminal");
      output.push("  ls - List directory contents");
      output.push("  pwd - Print working directory");
      output.push("  cd [dir] - Change directory");
      output.push("  cat [file] - Display file contents");
      output.push("  neofetch - Display system info");
      output.push("  whoami - Display current user");
      output.push("  meow - Get catted");
      output.push("  volume - Mutes or Unmutes the music");

      break;

    case "neofetch":
      terminalTextLines.length = 0;
      output.push("user:~$ neofetch");
      output.push("[IMAGE] hero.png");
      output.push(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas"
      );
      output.push(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems"
      );
      output.push(
        `\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: ${calculateAge()}`
      );
      output.push("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece");
      output.push("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tOS: chatzOS");

      output.push("");
      output.push(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information"
      );
      output.push(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------"
      );
      output.push(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com"
      );
      output.push(
        "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tWebsite:chatzoudas.dev"
      );
      output.push("");
      output.push("");
      output.push("");
      break;

    case "whoami":
      output.push("user");
      break;
    case "exit":
      output.push("and go where?");
      break;
    case "volume":
      volume();
      break;

    case "meow":
      output.push("  ／l、");
      output.push("（ﾟ､ ｡ ７");
      output.push(" l  ~ヽ");
      output.push(" じしf_,)ノ");
      break;

    case "clear":
      terminalTextLines.length = 0;
      break;

    default:
      output.push("command not found");
  }

  return output;
}

let terminalCanvas: HTMLCanvasElement | null = null;

function createTextTexture(
  textLines: string[],
  showCursor: boolean,
  imageUrl: string | null = null
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    if (!terminalCanvas) {
      terminalCanvas = document.createElement("canvas");
    }
    const canvas = terminalCanvas;
    const context = canvas.getContext("2d");
    const padding = 40;
    const maxLines = 20;
    const lineHeight = 20;
    const textHeight = maxLines * lineHeight;
    canvas.width = 512;
    canvas.height = textHeight + padding * 2;

    if (!context) {
      return reject(new Error("Failed to get 2D context from canvas"));
    }

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

    const startY = padding;
    let visibleLines = textLines.slice(-maxLines);

    const drawContent = () => {
      visibleLines.forEach((line, index) => {
        if (!line.startsWith("[IMAGE]")) {
          context.fillText(line, padding, startY + index * lineHeight);
        }
      });

      if (showCursor) {
        const cursorLineIndex = visibleLines.length - 1;
        const lastLine = visibleLines[cursorLineIndex] || "";
        const cursorX = padding + context.measureText(lastLine).width;
        const cursorY = startY + cursorLineIndex * lineHeight;
        const cursorWidth = 6;
        const cursorHeight = lineHeight / 1.5;
        context.fillStyle = "#1e40af";
        context.fillRect(cursorX, cursorY, cursorWidth, cursorHeight);
      }
    };

    drawContent();

    const loadAndDrawImage = (url: string) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const imgIndex = textLines.findIndex((line) =>
            line.startsWith("[IMAGE]")
          );
          if (imgIndex !== -1) {
            const imgY =
              startY +
              (imgIndex - (textLines.length - visibleLines.length)) *
                lineHeight;
            const imgHeight = lineHeight * 13;
            const imgWidth = (img.width / img.height) * imgHeight;

            if (imgY + imgHeight > 0) {
              context.drawImage(img, padding, imgY, imgWidth, imgHeight);
            }
          }
          resolve();
        };
        img.onerror = () => reject(new Error("Error loading image: " + url));
        img.src = url;
      });
    };

    const finalizeTexture = () => {
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      resolve(texture);
    };

    if (imageUrl) {
      loadAndDrawImage(imageUrl).then(finalizeTexture).catch(reject);
    } else {
      finalizeTexture();
    }
  });
}

function updateTerminalText(textLines: string[], showCursor: boolean) {
  if (isEmulatorRunning) return;
  const imageLines = textLines.filter((line) => line.startsWith("[IMAGE]"));
  const imageUrls = imageLines.map((line) => line.split(" ")[1]);

  return createTextTexture(textLines, showCursor, imageUrls[0])
    .then((texture) => {
      const mesh = scene.getObjectByName("Object006") as THREE.Mesh | undefined;
      if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
        mesh.material.uniforms.uDiffuse.value = texture;
        mesh.material.needsUpdate = true;
      }
    })
    .catch((error) => {
      console.error("Error updating terminal text:", error);
    });
}

function calculateAge(): number {
  const birthDate = new Date(2003, 9, 20); // Year, Month (0-indexed), Day
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const month = today.getMonth() - birthDate.getMonth();

  if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

const terminalTextLines: string[] = [
  "user:~$ neofetch",
  "[IMAGE] hero.png",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems",
  `\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: ${calculateAge()}`,
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece",

  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tOS: chatzOS",
  "",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t",
  "",
  "",
  "",
  "user:~$ ",
];

let cursorVisible = false;
let cursorBlinkInterval: number | null = null;

const inputElement = document.getElementById(
  "terminal-input"
) as HTMLInputElement;

function startCursorBlinking() {
  if (cursorBlinkInterval) return;
  cursorVisible = true;
  updateTerminalText(terminalTextLines, cursorVisible);
  cursorBlinkInterval = window.setInterval(() => {
    cursorVisible = !cursorVisible;
    updateTerminalText(terminalTextLines, cursorVisible);
  }, 500);
}

function stopCursorBlinking() {
  if (cursorBlinkInterval) {
    clearInterval(cursorBlinkInterval);
    cursorBlinkInterval = null;
  }
  cursorVisible = false;
  updateTerminalText(terminalTextLines, cursorVisible);
}

function updatePrompt() {
  const path = getFullPath();
  if (path === "/home/user") {
    return "user:~$";
  } else if (path.startsWith("/home/user/")) {
    return `user:~/${path.slice("/home/user/".length)}$`;
  } else {
    return `user:${path}$`;
  }
}

inputElement.addEventListener("focus", () => {
  startCursorBlinking();
});

inputElement.addEventListener("blur", () => {
  stopCursorBlinking();
});

inputElement.addEventListener("input", function () {
  const userInput = inputElement.value;
  const lastLineIndex = terminalTextLines.length - 1;
  let prompt = updatePrompt();
  terminalTextLines[lastLineIndex] = `${prompt} ${userInput}`;
  updateTerminalText(terminalTextLines, cursorVisible);

  const typingMessage = document.querySelector(".typing-message");
  typingMessage?.classList.remove("visible");
  messageShown = true;
});

inputElement.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const userInput = inputElement.value.trim();
    const output = executeCommand(userInput);

    if (userInput.toLowerCase() !== "clear") {
      output.forEach((line) => terminalTextLines.push(line));
    } else {
      terminalTextLines.length = 0;
    }

    terminalTextLines.push(`${updatePrompt()} `);
    updateTerminalText(terminalTextLines, cursorVisible);
    inputElement.value = "";
  }
});

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const BLUE_DISK_TYPES = [
  "floppy_volume_blue",
  "floppy_logo_DOS_blue",
  "floppy_plate_blue",
  "floppy_volume_blue_1",
  "floppy_paper_blue",
];
function onMouseClick(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);

  if (intersects.length > 0) {
    const object = intersects[0].object;
    if (object.name === "Object006") {
      inputElement.focus();
    }
    if (object.name === "StickyNote1") {
      window.open("mailto:nikoschatzoudas@gmail.com", "_blank");
    }
    if (object.name === "StickyNote2") {
      window.open("https://github.com/Nikos-Chatzoudas", "_blank");
    }
    if (object.name === "StickyNote3") {
      window.open("https://www.linkedin.com/in/nick-chatzoudas/", "_blank");
    }

    if (BLUE_DISK_TYPES.includes(object.name)) {
      let notepad = document.getElementById("notepad");
      if (notepad) {
        document.body.classList.add("no-scroll");
        notepad.style.display = "flex";
        const typingMessage = document.querySelector(".typing-message");
        typingMessage?.classList.remove("visible");
        messageShown = true;
        setTimeout(() => {
          notepad.classList.add("visible");
          document.body.classList.remove("no-scroll");
        }, 10);
      }
    }
  }
}
function onMouseMove(event: MouseEvent) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children, true);

  const isStickerHovered = intersects.some(
    (intersect) =>
      intersect.object.name === "StickyNote1" ||
      intersect.object.name === "StickyNote2" ||
      intersect.object.name === "StickyNote3" ||
      BLUE_DISK_TYPES.includes(intersect.object.name)
  );

  document.body.style.cursor = isStickerHovered ? "pointer" : "auto";
}

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);

function updateLoadingText(progressBar: string) {
  const loadingText = document.getElementById("loadingText");
  if (loadingText) {
    loadingText.textContent = `${progressBar}`;
  }
}

function checkAllLoaded() {
  if (hdriLoaded && modelLoaded && audioLoaded) {
    const endTime = performance.now();
    const loadTime = (endTime - startTime) / 1000;
    console.log(`Time taken to load everything: ${loadTime.toFixed(2)} sec`);
    const startBox = document.getElementById("startbox");
    const loadingimg = document.getElementById("loadingimg");
    const loadingText = document.getElementById("loadingText");
    if (startBox) {
      startBox.style.display = "flex";
    }
    if (loadingimg) {
      loadingimg.style.display = "none";
    }
    if (loadingText) {
      loadingText.style.display = "none";
    }
  }
}
export let initialCameraPosition: THREE.Vector3 | null = null;
export let initialCameraZoom: number | null = null;
let messageShown = false;

export function checkCameraMovement() {
  if (!initialCameraPosition || !initialCameraZoom) return;

  const currentPosition = camera.position.clone();
  const currentZoom = camera.zoom;

  const hasMoved =
    !currentPosition.equals(initialCameraPosition) ||
    currentZoom !== initialCameraZoom;
  const typingMessage = document.querySelector(".typing-message");

  if (hasMoved) {
    typingMessage?.classList.remove("visible");
    messageShown = true;
  } else if (!messageShown) {
    typingMessage?.classList.add("visible");
    messageShown = true;
  }
}

function start() {
  const loaderElement = document.getElementById("loader");
  if (!loaderElement) return;
  loaderElement.style.opacity = "0";

  setTimeout(() => {
    loaderElement.style.display = "none";

    audio.play();
    if (inputElement) {
      inputElement.focus();
      startCursorBlinking();
    }

    setTimeout(() => {
      initialCameraPosition = camera.position.clone();
      initialCameraZoom = camera.zoom;
    }, 3000);
  }, 500);
}
function volume(): void {
  const icon = document.getElementById("volume") as HTMLImageElement | null;

  if (icon) {
    if (icon.src.includes("volume-2.svg")) {
      icon.src = "volume-off.svg";
      audio.volume = 0;
    } else {
      icon.src = "volume-2.svg";
      audio.volume = 0.5;
    }
  }
}
document.getElementById("volume")?.addEventListener("click", () => {
  document.getElementById("volume")?.classList.add("pop");
  setTimeout(() => {
    document.getElementById("volume")?.classList.remove("pop");
  }, 200);
});
document.getElementById("startButton")?.addEventListener("click", start);
document.getElementById("volume")?.addEventListener("click", volume);
document.addEventListener("DOMContentLoaded", function () {
  loadHDREnvironment(updateLoadingText, checkAllLoaded);
  loadModel(updateLoadingText, checkAllLoaded);
});

const keyAnimations: { [key: string]: boolean } = {};

function keyPressAudio() {
  const keypressaudio = new Audio("keypress.mp3");
  keypressaudio.volume = 0.1;
  keypressaudio.play();
}

function keypressanimation(keyName: string) {
  if (keyAnimations[keyName]) return;

  let keyObject: THREE.Object3D | null = null;
  scene.traverse((object) => {
    if (object.name === keyName) {
      keyObject = object;
    }
  });
  keyPressAudio();
  if (!keyObject) {
    console.warn(`Object named '${keyName}' not found in the scene.`);
    return;
  }

  keyAnimations[keyName] = true;

  const initialYPosition = keyObject.position.y;

  const pressDistance = 7.0;
  const animationSpeed = 0.7;

  const targetY = initialYPosition - pressDistance;
  const animateDown = () => {
    keyObject!.position.y -= animationSpeed;
    if (keyObject!.position.y <= targetY) {
      const animateUp = () => {
        keyObject!.position.y += animationSpeed;
        if (keyObject!.position.y >= initialYPosition) {
          keyObject!.position.y = initialYPosition;
          keyAnimations[keyName] = false;
          return;
        }
        requestAnimationFrame(animateUp);
      };
      requestAnimationFrame(animateUp);
      return;
    }
    requestAnimationFrame(animateDown);
  };

  requestAnimationFrame(animateDown);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  let keyName = `key${key}`;
  if (keyName === "key ") {
    keyName = "keyspace";
  }

  keypressanimation(keyName);
});
animate();
