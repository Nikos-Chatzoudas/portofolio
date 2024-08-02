import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import vertexShader from './screenshaders/vertex.glsl';
import fragmentShader from './screenshaders/fragment.glsl';
import vertexShaderBlackHole from './blackholeshaders/vertexShaderBlackHole.glsl';
import fragmentShaderBlackHole from './blackholeshaders/fragmentShaderBlackHole.glsl';

// Define terminal text color
const textcolor = '#1e40af'; // Bright cyan color

// Create the scene
const scene = new THREE.Scene();
scene.background = null; // Set background color to black

// Create the camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 0.15; // Position the camera

// Create the renderer and attach it to the canvas
const canvas = document.querySelector('.three') as HTMLCanvasElement;
if (!canvas) {
    throw new Error('Canvas element not found');
}
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
renderer.toneMappingExposure = 2.3;

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true; // Enable zoom
controls.minDistance = 0.15;
controls.maxDistance = 1;
controls.zoomSpeed = 2; // Adjust zoom speed
controls.mouseButtons.RIGHT = null; // Disable right-click panning

const angleLimit = Math.PI / 180 * 50; // Limit to 10 degrees

controls.minAzimuthAngle = -angleLimit; // Limit horizontal rotation to 10 degrees left
controls.maxAzimuthAngle = angleLimit;  // Limit horizontal rotation to 10 degrees right
controls.minPolarAngle = Math.PI / 2 - angleLimit; // Limit vertical rotation down to 10 degrees
controls.maxPolarAngle = Math.PI / 2 + angleLimit; // Limit vertical rotation up to 10 degrees

controls.update();


// Add spotlight
const spotLight = new THREE.SpotLight(0xa7bef6, 20);
spotLight.position.set(10, 10, 10);
spotLight.angle = Math.PI / 4;
spotLight.penumbra = 0.5;
spotLight.decay = 0.5;
spotLight.castShadow = true;
spotLight.shadow.mapSize.width = 1024;
spotLight.shadow.mapSize.height = 1024;
scene.add(spotLight);

// Add ambient light
const ambientLight = new THREE.AmbientLight(0xa7bef6, 0.25);
scene.add(ambientLight);

// Create an input field for terminal commands
const inputElement = document.getElementById('terminal-input') as HTMLInputElement;

// Define uniforms for the shader
const uniforms = {
    uDiffuse: { value: null },
    uTime: { value: 0 },
    LINE_SIZE: { value: 130.0 },
    LINE_STRENGTH: { value: 0.05 },
    NOISE_STRENGTH: { value: 0.2 },
    BRIGHTNESS: { value: 1.2 }, // Brightness adjustment
    CONTRAST: { value: 1.6 }    // Contrast adjustment
};


// Function to create a texture with terminal-like appearance
function createTextTexture(textLines: string[], showCursor: boolean, imageUrl: string | null = null): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const padding = 40;
        const maxLines = 20;
        const lineHeight = 20;
        const textHeight = maxLines * lineHeight;
        canvas.width = 512;
        canvas.height = textHeight + padding * 2;

        if (!context) {
            return reject(new Error('Failed to get 2D context from canvas'));
        }

        context.fillStyle = 'black';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = '16px monospace';
        context.fillStyle = textcolor;
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.shadowColor = textcolor;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
        context.shadowBlur = 3;

        const startY = padding;
        let visibleLines = textLines.slice(-maxLines);

        const drawContent = () => {
            visibleLines.forEach((line, index) => {
                if (!line.startsWith('[IMAGE]')) {
                    context.fillText(line, padding, startY + index * lineHeight);
                }
            });

            if (showCursor) {
                const cursorLineIndex = visibleLines.length - 1;
                const lastLine = visibleLines[cursorLineIndex] || '';
                const cursorX = padding + context.measureText(lastLine).width;
                const cursorY = startY + cursorLineIndex * lineHeight;
                const cursorWidth = 6;
                const cursorHeight = lineHeight / 1.5;
                context.fillStyle = textcolor;
                context.fillRect(cursorX, cursorY, cursorWidth, cursorHeight);
            }
        };

        drawContent();

        const loadAndDrawImage = (url: string) => {
            return new Promise<void>((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    const imgIndex = textLines.findIndex(line => line.startsWith('[IMAGE]'));
                    if (imgIndex !== -1) {
                        const imgY = startY + (imgIndex - (textLines.length - visibleLines.length)) * lineHeight;
                        const imgHeight = lineHeight * 13;

                        // Calculate width to maintain aspect ratio
                        const imgWidth = (img.width / img.height) * imgHeight;

                        if (imgY + imgHeight > 0) {
                            context.drawImage(img, padding, imgY, imgWidth, imgHeight);
                        }
                    }

                    resolve();
                };
                img.onerror = () => reject(new Error('Error loading image: ' + url));
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

// Function to update terminal text on the canvas
function updateTerminalText(textLines: string[], showCursor: boolean) {
    const imageLines = textLines.filter(line => line.startsWith('[IMAGE]'));
    const imageUrls = imageLines.map(line => line.split(' ')[1]);

    return createTextTexture(textLines, showCursor, imageUrls[0]).then((texture) => {
        const mesh = scene.getObjectByName('Object006') as THREE.Mesh | undefined;
        if (mesh) {
            const material = mesh.material as THREE.ShaderMaterial;
            if (material.uniforms.uDiffuse) {
                material.uniforms.uDiffuse.value = texture;
                material.needsUpdate = true;
            } else {
                console.error('Uniform uDiffuse not found in material');
            }
        } else {
            console.error('Mesh with name "Object006" not found');
        }
    }).catch((error) => {
        console.error('Error updating terminal text:', error);
    });
}
// Function to create a Milky Way background


// Load the model with surface geometry
const loader = new GLTFLoader();
loader.load('/model/pc.glb', (gltf) => {
    gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            (child.material as THREE.Material).metalness = 0.5;
            (child.material as THREE.Material).roughness = 0.1;
            (child.material as THREE.Material).needsUpdate = true;
            child.castShadow = true;
            child.receiveShadow = true;
        }
        if (child.name === 'Object006') {
            // Initialize with neofetch command
            const initialTextLines = [
                'user:~$ neofetch',
                '[IMAGE] hero.png',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: 20',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLang: C,Html,Css,Js,',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tPython,Java',
                '',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com',
                '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tWebsite:chatzoudas.dev',
                '',
                '',
                '',
                'type help for more or scroll',
                'user:~$'
            ];
            updateTerminalText(initialTextLines, false);

            if (child instanceof THREE.Mesh) {
                child.material = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShader,
                    uniforms: uniforms,
                    transparent: true
                });
                child.position.z -= 0;
                child.castShadow = false;
                child.receiveShadow = false;
            }
        }
    });

    gltf.scene.position.y -= 0.32;
    scene.add(gltf.scene);
}, undefined, (error) => {
    console.error('Error loading model:', error);
});

// Manage terminal text lines
const terminalTextLines: string[] = [
    'user:~$ neofetch',
    '[IMAGE] hero.png',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: 20',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLang: C,Html,Css,Js,',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tPython,Java',
    '',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com',
    '\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tWebsite:chatzoudas.dev',
    '',
    '',
    '',
    'type help for more or scroll',
    'user:~$ '
];
let cursorVisible = false;
let cursorBlinkInterval: number | null = null;

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

function checkIfInputFocused() {
    return document.activeElement === inputElement;
}

inputElement.addEventListener('focus', () => {
    startCursorBlinking();
});
inputElement.addEventListener('blur', () => {
    stopCursorBlinking();
});

inputElement.addEventListener('input', function () {
    const userInput = inputElement.value;
    const lastLineIndex = terminalTextLines.length - 1;
    let name = updatePrompt();
    terminalTextLines[lastLineIndex] = `${name} ${userInput}`;
    updateTerminalText(terminalTextLines, cursorVisible);
});

inputElement.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();

        const userInput = inputElement.value.trim();
        const [command, ...args] = userInput.split(' ');

        // Remove this line to avoid double printing
        // terminalTextLines.push(`${updatePrompt()}${userInput}`);

        switch (command.toLowerCase()) {
            case 'cd':
                changeDirectory(args[0]);
                break;
            case 'ls':
                listDirectory();
                break;
            case 'pwd':
                printWorkingDirectory();
                break;
            case 'cat':
                catFile(args[0]);
                break;
            case 'clear':
                terminalTextLines.length = 0;
                break;
            case 'help':
                showHelp();
                break;
            case 'neofetch':
                showNeofetch();
                break;
            case 'whoami':
                terminalTextLines.push('user');
                break;
            case 'meow':
                showCat();
                break;
            case 'dedli':
                terminalTextLines.push('how do you know that name?');
                break;
            case 'yorukosu':
                terminalTextLines.push('The blender GOD!');
                break;
            default:
                terminalTextLines.push('command not found');
        }

        // Update the prompt after command execution
        terminalTextLines.push(updatePrompt());
        updateTerminalText(terminalTextLines, cursorVisible);
        inputElement.value = '';
    }
});

function changeDirectory(dirName: string) {
    if (!dirName) {
        terminalTextLines.push('cd: missing operand');
        return;
    }

    let newPath: string;
    let newDir: FileSystemNode;

    if (dirName.startsWith('/')) {
        // Absolute path
        newPath = dirName;
        newDir = navigateToPath(fileSystem, newPath);
    } else if (dirName === '..') {
        // Parent directory
        if (currentPath !== '/') {
            const pathParts = currentPath.split('/').filter(Boolean);
            pathParts.pop();
            newPath = '/' + pathParts.join('/');
            newDir = navigateToPath(fileSystem, newPath);
        } else {
            return; // Already at root
        }
    } else {
        // Relative path
        newPath = currentPath === '/' ? `/${dirName}` : `${currentPath}/${dirName}`;
        newDir = navigateToPath(fileSystem, newPath);
    }

    if (newDir.type === 'directory') {
        currentPath = newPath;
        currentDirectory = newDir;
    } else {
        terminalTextLines.push(`cd: ${dirName}: Not a directory`);
    }
}

function listDirectory() {
    if (currentDirectory.children) {
        const items = Object.values(currentDirectory.children);
        const output = items.map(item => `${item.name}${item.type === 'directory' ? '/' : ''}`).join('  ');
        terminalTextLines.push(output);
    }
}

function printWorkingDirectory() {
    terminalTextLines.push(currentPath);
}

function catFile(fileName: string) {
    if (!fileName) {
        terminalTextLines.push('cat: missing operand');
        return;
    }
    if (currentDirectory.children && currentDirectory.children[fileName] && currentDirectory.children[fileName].type === 'file') {
        terminalTextLines.push(currentDirectory.children[fileName].content || '');
    } else {
        terminalTextLines.push(`cat: ${fileName}: No such file`);
    }
}

function showHelp() {
    terminalTextLines.push('Available commands:');
    terminalTextLines.push('  cd <directory> - Change directory');
    terminalTextLines.push('  ls - List contents of current directory');
    terminalTextLines.push('  pwd - Print working directory');
    terminalTextLines.push('  cat <file> - Display contents of a file');
    terminalTextLines.push('  clear - Clear the terminal');
    terminalTextLines.push('  neofetch - Display system info');
    terminalTextLines.push('  whoami - Display current user');
    terminalTextLines.push('  meow - Get catted');
    terminalTextLines.push('  help - Show this help message');
}

function showNeofetch() {
    const imageUrl = 'hero.png';
    terminalTextLines.push(`[IMAGE] ${imageUrl}`);
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tName: Nikos Chatzoudas');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tStudying: Digital Systems');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tAge: 20');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLocation: Greece');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tLang: C,Html,Css,Js,');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tPython,Java');
    terminalTextLines.push('');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tcontact information');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t-------------------');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tEmail:nikoschatzoudas@gmail.com');
    terminalTextLines.push('\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tWebsite:chatzoudas.dev');
    terminalTextLines.push('');
    terminalTextLines.push('');
}

function showCat() {
    terminalTextLines.push('  ／l、 ');
    terminalTextLines.push('（ﾟ､ ｡ ７  ')
    terminalTextLines.push(' l  ~ヽ    ')
    terminalTextLines.push(' じしf_,)ノ')
}

// Raycasting setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event: MouseEvent) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object.name === 'Object006') {
            inputElement.focus();
        }
    }
}

window.addEventListener('click', onMouseClick);

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

});
interface FileSystemNode {
    name: string;
    type: 'file' | 'directory';
    content?: string;
    children?: { [key: string]: FileSystemNode };
}

const fileSystem: FileSystemNode = {
    name: '/',
    type: 'directory',
    children: {
        home: {
            name: 'home',
            type: 'directory',
            children: {
                user: {
                    name: 'user',
                    type: 'directory',
                    children: {
                        'documents': {
                            name: 'documents',
                            type: 'directory',
                            children: {
                                'readme.txt': {
                                    name: 'readme.txt',
                                    type: 'file',
                                    content: 'Welcome to my portfolio!'
                                }
                            }
                        },
                        'projects': {
                            name: 'projects',
                            type: 'directory',
                            children: {}
                        }
                    }
                }
            }
        },
        etc: {
            name: 'etc',
            type: 'directory',
            children: {}
        },
        var: {
            name: 'var',
            type: 'directory',
            children: {}
        }
    }
};

let currentDirectory: FileSystemNode = fileSystem.children.home.children.user;
let currentPath: string = '/home/user';

function updatePrompt() {
    let displayPath = currentPath;
    if (currentPath === '/home/user') {
        displayPath = '~';
    } else if (currentPath.startsWith('/home/user/')) {
        displayPath = '~' + currentPath.slice(10); // Replace '/home/user' with '~'
    }
    return `user:${displayPath}$`;
}
function navigateToPath(root: FileSystemNode, path: string): FileSystemNode {
    const pathParts = path.split('/').filter(Boolean);
    let current = root;
    for (const part of pathParts) {
        if (current.children && current.children[part]) {
            current = current.children[part];
        } else {
            return root; // If path is invalid, return to root
        }
    }
    return current;
}
function animate() {
    requestAnimationFrame(animate);

    // Update time uniform for both shaders
    if (uniforms.uTime) {
        uniforms.uTime.value += 0.05;
    }


    renderer.render(scene, camera);
}
animate();