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

const startTime = performance.now();

// Terminal text creation
function createTextTexture(
  textLines: string[],
  showCursor: boolean,
  imageUrl: string | null = null
): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
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

// Terminal text update
function updateTerminalText(textLines: string[], showCursor: boolean) {
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

// Terminal state
const terminalTextLines: string[] = [
  "user:~$ neofetch",
  "[IMAGE] hero.png",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: 20",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLang: C,Html,Css,Js,",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tPython,Java",
  "",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com",
  "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tWebsite:chatzoudas.dev",
  "",
  "",
  "",
  "TYPE help OR SCOLL AND CLICK THE NOTEPAD",
  "user:~$ ",
];

let cursorVisible = false;
let cursorBlinkInterval: number | null = null;

const inputElement = document.getElementById(
  "terminal-input"
) as HTMLInputElement;

// Cursor blinking
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

// Terminal commands
function showHelp() {
  terminalTextLines.push("Available commands:");
  terminalTextLines.push("  clear - Clear the terminal");
  terminalTextLines.push("  neofetch - Display system info");
  terminalTextLines.push("  whoami - Display current user");
  terminalTextLines.push("  meow - Get catted");
  terminalTextLines.push("  help - Show this help message");
}

function showNeofetch() {
  terminalTextLines.push("user:~$ neofetch");
  terminalTextLines.push("[IMAGE] hero.png");
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas"
  );
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems"
  );
  terminalTextLines.push("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: 20");
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece"
  );
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLang: C,Html,Css,Js,"
  );
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tPython,Java"
  );
  terminalTextLines.push("");
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information"
  );
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------"
  );
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com"
  );
  terminalTextLines.push(
    "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tWebsite:chatzoudas.dev"
  );
  terminalTextLines.push("");
  terminalTextLines.push("");
}

function showCat() {
  terminalTextLines.push("  ／l、");
  terminalTextLines.push("（ﾟ､ ｡ ７");
  terminalTextLines.push(" l  ~ヽ");
  terminalTextLines.push(" じしf_,)ノ");
}

function updatePrompt() {
  return "user:~$";
}

// Event listeners
inputElement.addEventListener("focus", () => {
  startCursorBlinking();
});

inputElement.addEventListener("blur", () => {
  stopCursorBlinking();
});

inputElement.addEventListener("input", function () {
  const userInput = inputElement.value;
  const lastLineIndex = terminalTextLines.length - 1;
  let name = updatePrompt();
  terminalTextLines[lastLineIndex] = `${name} ${userInput}`;
  updateTerminalText(terminalTextLines, cursorVisible);
});

inputElement.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const userInput = inputElement.value.trim();
    const [command] = userInput.split(" ");

    switch (command.toLowerCase()) {
      case "help":
        showHelp();
        break;
      case "neofetch":
        terminalTextLines.length = 0;
        showNeofetch();
        break;
      case "whoami":
        terminalTextLines.push("user");
        break;
      case "meow":
        showCat();
        break;
      case "clear":
        terminalTextLines.length = 0;
        break;
      default:
        terminalTextLines.push("command not found");
    }

    terminalTextLines.push(updatePrompt());
    updateTerminalText(terminalTextLines, cursorVisible);
    inputElement.value = "";
  }
});

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

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
    if (object.name === "frontpage") {
      let notepad = document.getElementById("notepad");
      if (notepad) {
        document.body.classList.add("no-scroll");
        notepad.style.display = "flex";
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
      intersect.object.name === "frontpage"
  );

  if (isStickerHovered) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "auto";
  }
}

window.addEventListener("mousemove", onMouseMove);
window.addEventListener("click", onMouseClick);

// Loading and initialization
function updateLoadingText(progressBar: string) {
  const loadingText = document.getElementById("loadingText");
  if (loadingText) {
    loadingText.textContent = `Loading ${progressBar}`;
  }
}

function checkAllLoaded() {
  if (hdriLoaded && modelLoaded) {
    const endTime = performance.now();
    const loadTime = (endTime - startTime) / 1000;
    console.log(`Time taken to load everything: ${loadTime.toFixed(2)} sec`);
    const loaderElement = document.getElementById("loader");
    if (!loaderElement) return;
    loaderElement.style.opacity = "0";
    setTimeout(() => {
      loaderElement.style.display = "none";
      if (inputElement) {
        inputElement.focus();
        startCursorBlinking();
      }
    }, 500);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadHDREnvironment(updateLoadingText, checkAllLoaded);
  loadModel(updateLoadingText, checkAllLoaded);
});

animate();
