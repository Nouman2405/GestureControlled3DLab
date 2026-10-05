import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ==================== SCENE ====================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101820);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 2, 6);

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ==================== LIGHTING ====================

scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

// ==================== CAMERA CONTROLS ====================

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ==================== GROUND ====================

scene.add(new THREE.GridHelper(20, 20));

// ==================== COMPONENT GROUP ====================

const componentGroup = new THREE.Group();
componentGroup.position.y = 0.6;
scene.add(componentGroup);

// ==================== COMPONENT INFORMATION ====================

const components = {
  resistor: {
    name: 'Resistor',
    type: 'Fixed Resistor',
    function: 'Limits electric current'
  },

  capacitor: {
    name: 'Capacitor',
    type: 'Electronic Capacitor',
    function: 'Stores electrical energy'
  },

  led: {
    name: 'LED',
    type: 'Light Emitting Diode',
    function: 'Emits light when current flows'
  },

  transistor: {
    name: 'Transistor',
    type: 'BJT Transistor',
    function: 'Used for switching and amplification'
  },

  arduino: {
    name: 'Arduino Uno',
    type: 'Microcontroller Development Board',
    function: 'Controls electronic components and sensors'
  }
};

let selectedComponent = 'resistor';
let currentGesture = 'No Hand';

// ==================== RESISTOR ====================

function createResistor() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.35, 0.35, 1.5, 32),
    new THREE.MeshStandardMaterial({
      color: 0xd2a679,
      emissive: 0x000000
    })
  );

  body.rotation.z = Math.PI / 2;
  group.add(body);

  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    emissive: 0x000000
  });

  const pinGeometry = new THREE.CylinderGeometry(0.06, 0.06, 1, 16);

  const leftPin = new THREE.Mesh(pinGeometry, pinMaterial);
  leftPin.rotation.z = Math.PI / 2;
  leftPin.position.x = -1.2;
  group.add(leftPin);

  const rightPin = new THREE.Mesh(pinGeometry, pinMaterial);
  rightPin.rotation.z = Math.PI / 2;
  rightPin.position.x = 1.2;
  group.add(rightPin);

  return group;
}

// ==================== CAPACITOR ====================

function createCapacitor() {
  const group = new THREE.Group();

  const material = new THREE.MeshStandardMaterial({
    color: 0x4da6ff,
    emissive: 0x000000
  });

  const geometry = new THREE.BoxGeometry(0.12, 1.4, 1.1);

  const leftPlate = new THREE.Mesh(geometry, material);
  leftPlate.position.x = -0.25;
  group.add(leftPlate);

  const rightPlate = new THREE.Mesh(geometry, material);
  rightPlate.position.x = 0.25;
  group.add(rightPlate);

  return group;
}

// ==================== LED ====================

function createLED() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.45, 0.45, 0.6, 32),
    new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0x000000
    })
  );

  group.add(body);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(
      0.45,
      32,
      16,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2
    ),
    new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0x000000,
      transparent: true,
      opacity: 0.9
    })
  );

  dome.position.y = 0.3;
  group.add(dome);

  return group;
}

// ==================== TRANSISTOR ====================

function createTransistor() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.8, 32),
    new THREE.MeshStandardMaterial({
      color: 0x222222,
      emissive: 0x000000
    })
  );

  group.add(body);

  return group;
}

// ==================== CREATE COMPONENTS ====================

const resistor = createResistor();
const capacitor = createCapacitor();
const led = createLED();
const transistor = createTransistor();

// ==================== LOAD ARDUINO GLB ====================

let arduino = new THREE.Group();

function loadArduinoModel() {
  const loader = new GLTFLoader();

  loader.load(
    '/models/arduino.glb',

    (gltf) => {
      arduino = gltf.scene;

      window.arduinoModel = arduino;

console.log('Arduino model:', arduino);
console.log('Children:', arduino.children.length);
console.log('Position:', arduino.position);
console.log('Scale:', arduino.scale);

      // Calculate model dimensions
      const box = new THREE.Box3().setFromObject(arduino);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center the model
      arduino.position.sub(center);

      // Scale the model
      const maxDimension = Math.max(
        size.x,
        size.y,
        size.z
      );

      if (maxDimension > 0) {
        const scale = 3.5 / maxDimension;
        arduino.scale.setScalar(scale);
      }

      // Rotate model to a visible angle
      arduino.rotation.set(
        0,
        Math.PI / 4,
        0
      );

      // Enable shadows and materials
      arduino.traverse((object) => {
  if (object.isMesh) {
    object.visible = true;
    object.castShadow = true;
    object.receiveShadow = true;

    if (object.material) {
      object.material = object.material.clone();

      // Make components fully visible
      object.material.transparent = false;
      object.material.opacity = 1;
      object.material.depthWrite = true;
      object.material.depthTest = true;
      object.material.side = THREE.DoubleSide;

      // Remove unwanted dark emission
      if (object.material.emissive) {
        object.material.emissive.set(0x000000);
        object.material.emissiveIntensity = 0;
      }
    }
  }
});

      console.log('Arduino model loaded successfully');
      console.log('Model size:', size);
      console.log('Model center:', center);

      // Display Arduino if selected
      if (selectedComponent === 'arduino') {
        componentGroup.clear();
        componentGroup.add(arduino);
        componentGroup.rotation.set(0, 0, 0);
        updateInfo();
      }
    },

    undefined,

    (error) => {
      console.error('Error loading Arduino model:', error);
    }
  );
}
loadArduinoModel();
// ==================== INFORMATION PANEL ====================

const info = document.createElement('div');

info.style.position = 'absolute';
info.style.top = '20px';
info.style.left = '20px';
info.style.padding = '15px';
info.style.background = 'rgba(0, 0, 0, 0.8)';
info.style.color = 'white';
info.style.fontFamily = 'Arial';
info.style.lineHeight = '1.6';
info.style.borderRadius = '8px';
info.style.display = 'none';

document.body.appendChild(info);

function updateInfo() {
  const component = components[selectedComponent];

  info.innerHTML = `
    <strong>Component: ${component.name}</strong><br>
    Type: ${component.type}<br>
    Function: ${component.function}<br>
    Gesture: ${currentGesture}
  `;
}

// ==================== MENU ====================

const menu = document.createElement('div');

menu.style.position = 'absolute';
menu.style.top = '20px';
menu.style.right = '20px';
menu.style.display = 'flex';
menu.style.flexDirection = 'column';
menu.style.gap = '10px';

document.body.appendChild(menu);

function createMenuButton(label, componentName) {
  const button = document.createElement('button');

  button.textContent = label;
  button.style.padding = '12px 18px';
  button.style.cursor = 'pointer';
  button.style.border = 'none';
  button.style.borderRadius = '6px';
  button.style.fontSize = '15px';

  button.addEventListener('click', () => {
    selectComponent(componentName);
  });

  menu.appendChild(button);
}

createMenuButton('Resistor', 'resistor');
createMenuButton('Capacitor', 'capacitor');
createMenuButton('LED', 'led');
createMenuButton('Transistor', 'transistor');
createMenuButton('Arduino', 'arduino');

// ==================== COMPONENT SELECTION ====================

function selectComponent(componentName) {
  console.log('Selected component:', componentName);

  removeHighlight();

  selectedComponent = componentName;

  componentGroup.clear();

  if (selectedComponent === 'resistor') {
    componentGroup.add(resistor);
  }

  if (selectedComponent === 'capacitor') {
    componentGroup.add(capacitor);
  }

  if (selectedComponent === 'led') {
    componentGroup.add(led);
  }

  if (selectedComponent === 'transistor') {
    componentGroup.add(transistor);
  }

  if (selectedComponent === 'arduino') {
    if (arduino && arduino.children.length > 0) {
      componentGroup.add(arduino);

      arduino.position.set(0, 0, 0);
      arduino.rotation.set(0, 0, 0);

      console.log('Arduino added to scene');
    } else {
      console.log('Arduino model is not ready yet');
    }
  }

  componentGroup.rotation.set(0, 0, 0);

  updateInfo();
}
// ==================== HIGHLIGHTING ====================

function highlightSelectedComponent() {
  componentGroup.traverse((object) => {
    if (object.isMesh && object.material.emissive) {
      object.material.emissive.set(0xff0000);
      object.material.emissiveIntensity = 2;
    }
  });

  info.style.display = 'block';
  updateInfo();
}

function removeHighlight() {
  componentGroup.traverse((object) => {
    if (object.isMesh && object.material.emissive) {
      object.material.emissive.set(0x000000);
      object.material.emissiveIntensity = 0;
    }
  });

  info.style.display = 'none';
}

// ==================== WEBSOCKET ====================

const socket = new WebSocket('ws://localhost:8765');

socket.onopen = () => {
  console.log('Connected to Python WebSocket server');
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  currentGesture = data.gesture;

  if (currentGesture === 'POINT') {
    highlightSelectedComponent();
  }

  if (currentGesture === 'OPEN PALM') {
    removeHighlight();
  }

  if (currentGesture === 'FIST') {
    componentGroup.rotation.set(0, 0, 0);
    removeHighlight();
  }

  updateInfo();
};

socket.onerror = (error) => {
  console.error('WebSocket error:', error);
};

// ==================== ANIMATION ====================

function animate() {
  requestAnimationFrame(animate);

  if (currentGesture === 'OPEN PALM') {
    componentGroup.rotation.y += 0.01;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

// ==================== RESPONSIVE SCREEN ====================

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});