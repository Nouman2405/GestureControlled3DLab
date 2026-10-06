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

camera.position.set(0, 2.5, 6);

// ==================== RENDERER ====================

const renderer = new THREE.WebGLRenderer({
  antialias: true
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.8;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

// ==================== LIGHTING ====================

const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

const hemisphereLight = new THREE.HemisphereLight(
  0xffffff,
  0x444444,
  2
);

scene.add(hemisphereLight);

const frontLight = new THREE.DirectionalLight(0xffffff, 3);
frontLight.position.set(5, 8, 10);
frontLight.castShadow = true;
scene.add(frontLight);

const backLight = new THREE.DirectionalLight(0xffffff, 2);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

const topLight = new THREE.PointLight(0xffffff, 2);
topLight.position.set(0, 8, 3);
scene.add(topLight);

// ==================== CAMERA CONTROLS ====================

const controls = new OrbitControls(camera, renderer.domElement);

controls.enableDamping = true;
controls.dampingFactor = 0.05;

// ==================== GROUND ====================

const grid = new THREE.GridHelper(20, 20);
scene.add(grid);

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

  const bodyMaterial = new THREE.MeshStandardMaterial({
  color: 0xa66a3f,
  roughness: 0.85,
  metalness: 0
});

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.35,
      0.35,
      1.5,
      32
    ),
    bodyMaterial
  );

  body.rotation.z = Math.PI / 2;

  group.add(body);

  const pinMaterial = new THREE.MeshStandardMaterial({
    color: 0xb0b0b0,
    metalness: 0.8,
    roughness: 0.3
  });

  const pinGeometry = new THREE.CylinderGeometry(
    0.06,
    0.06,
    1,
    16
  );

  const leftPin = new THREE.Mesh(
    pinGeometry,
    pinMaterial
  );

  leftPin.rotation.z = Math.PI / 2;
  leftPin.position.x = -1.2;

  group.add(leftPin);

  const rightPin = new THREE.Mesh(
    pinGeometry,
    pinMaterial
  );

  rightPin.rotation.z = Math.PI / 2;
  rightPin.position.x = 1.2;

  group.add(rightPin);

  return group;
}

function createCapacitor() {

  const group = new THREE.Group();

  // ==================== CAPACITOR BODY ====================

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x1f6f8b,
    roughness: 0.45,
    metalness: 0.05
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.45,   // top radius
      0.45,   // bottom radius
      1.2,    // height
      32
    ),
    bodyMaterial
  );

  group.add(body);

  // ==================== CAPACITOR TOP ====================

  const topMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.1
  });

  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.45,
      0.45,
      0.04,
      32
    ),
    topMaterial
  );

  top.position.y = 0.62;

  group.add(top);

  // ==================== POLARITY STRIPE ====================

  const stripeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.6
  });

  const stripe = new THREE.Mesh(
    new THREE.BoxGeometry(
      0.08,
      1.05,
      0.02
    ),
    stripeMaterial
  );

  stripe.position.set(
    -0.25,
    0,
    0.44
  );

  group.add(stripe);

  // ==================== CAPACITOR LEADS ====================

  const leadMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b8b8,
    metalness: 0.85,
    roughness: 0.25
  });

  const leadGeometry = new THREE.CylinderGeometry(
    0.045,
    0.045,
    0.8,
    16
  );

  // Left lead
  const leftLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  leftLead.position.set(
    -0.18,
    -1.0,
    0
  );

  group.add(leftLead);

  // Right lead
  const rightLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  rightLead.position.set(
    0.18,
    -1.0,
    0
  );

  group.add(rightLead);

  return group;
}
// ==================== LED ====================

function createLED() {

  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xff2222,
    roughness: 0.35,
    metalness: 0
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.45,
      0.45,
      0.6,
      32
    ),
    bodyMaterial
  );

  body.position.y = 0;

  group.add(body);

  const domeMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4444,
    roughness: 0.2,
    metalness: 0,
    transparent: false,
    opacity: 1
  });

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
    domeMaterial
  );

  dome.position.y = 0.3;

  group.add(dome);

  // ----- LED LEADS -----

  const leadMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b8b8,
    metalness: 0.85,
    roughness: 0.25
  });

  const leadGeometry = new THREE.CylinderGeometry(
    0.045,
    0.045,
    1.0,
    16
  );

  const leftLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  leftLead.position.set(
    -0.18,
    -0.8,
    0
  );

  group.add(leftLead);

  const rightLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  rightLead.position.set(
    0.18,
    -0.8,
    0
  );

  group.add(rightLead);

  return group;
}

// ==================== TRANSISTOR ====================

function createTransistor() {

  const group = new THREE.Group();

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.4,
    metalness: 0.1
  });

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.55,
      0.55,
      0.8,
      32
    ),
    bodyMaterial
  );

  group.add(body);

  // ----- TRANSISTOR LEADS -----

  const leadMaterial = new THREE.MeshStandardMaterial({
    color: 0xb8b8b8,
    metalness: 0.85,
    roughness: 0.25
  });

  const leadGeometry = new THREE.CylinderGeometry(
    0.045,
    0.045,
    1.1,
    16
  );

  const baseLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  baseLead.position.set(
    -0.25,
    -0.95,
    0
  );

  group.add(baseLead);

  const collectorLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  collectorLead.position.set(
    0,
    -0.95,
    0
  );

  group.add(collectorLead);

  const emitterLead = new THREE.Mesh(
    leadGeometry,
    leadMaterial
  );

  emitterLead.position.set(
    0.25,
    -0.95,
    0
  );

  group.add(emitterLead);

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

      // Calculate dimensions

      const box = new THREE.Box3().setFromObject(
        arduino
      );

      const size = box.getSize(
        new THREE.Vector3()
      );

      const center = box.getCenter(
        new THREE.Vector3()
      );

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

      // Rotate the Arduino

      arduino.rotation.set(
        0,
        Math.PI / 4,
        0
      );

      // Fix materials and visibility

      arduino.traverse((object) => {

        if (!object.isMesh) {
          return;
        }

        object.visible = true;

        object.castShadow = false;
        object.receiveShadow = false;

        if (!object.material) {
          return;
        }

        object.material = object.material.clone();

        const materials = Array.isArray(
          object.material
        )
          ? object.material
          : [object.material];

        materials.forEach((material) => {
          console.log(
  "Arduino mesh:",
  object.name,
  "| material:",
  material.name,
  "| color:",
  material.color?.getHexString()
);
  
  material.transparent = false;
  material.alphaTest = 0.5;
  material.opacity = 1;
  material.depthWrite = true;
  material.depthTest = true;
  material.side = THREE.DoubleSide;

  // Force imported GLB materials to behave as solid surfaces
  if ('alphaTest' in material) {
    material.alphaTest = 0;
  }

 if ('roughness' in material) {
  material.roughness = 0.6;
}

if ('metalness' in material) {
  material.metalness = 0.1;
}

material.needsUpdate = true;

  if (material.emissive) {
    material.emissive.set(0x000000);
    material.emissiveIntensity = 0;
  }
});

      });

      console.log(
        'Arduino model loaded successfully'
      );

      console.log(
        'Model size:',
        size
      );

      console.log(
        'Model center:',
        center
      );

      // Display Arduino if already selected

      if (selectedComponent === 'arduino') {

        componentGroup.clear();

        componentGroup.add(arduino);

        componentGroup.rotation.set(
          0,
          0,
          0
        );

        updateInfo();

      }

    },

    undefined,

    (error) => {

      console.error(
        'Error loading Arduino model:',
        error
      );

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

info.style.background =
  'rgba(0, 0, 0, 0.8)';

info.style.color = 'white';

info.style.fontFamily = 'Arial';

info.style.lineHeight = '1.6';

info.style.borderRadius = '8px';

info.style.display = 'none';

document.body.appendChild(info);

function updateInfo() {

  const component =
    components[selectedComponent];

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

function createMenuButton(
  label,
  componentName
) {

  const button =
    document.createElement('button');

  button.textContent = label;

  button.style.padding =
    '12px 18px';

  button.style.cursor =
    'pointer';

  button.style.border =
    'none';

  button.style.borderRadius =
    '6px';

  button.style.fontSize =
    '15px';

  button.addEventListener(
    'click',
    () => {

      selectComponent(
        componentName
      );

    }
  );

  menu.appendChild(button);

}

createMenuButton(
  'Resistor',
  'resistor'
);

createMenuButton(
  'Capacitor',
  'capacitor'
);

createMenuButton(
  'LED',
  'led'
);

createMenuButton(
  'Transistor',
  'transistor'
);

createMenuButton(
  'Arduino',
  'arduino'
);

// ==================== COMPONENT SELECTION ====================

function selectComponent(
  componentName
) {

  console.log(
    'Selected component:',
    componentName
  );

  removeHighlight();

  selectedComponent =
    componentName;

  componentGroup.clear();

  if (
    selectedComponent ===
    'resistor'
  ) {

    componentGroup.add(
      resistor
    );

  }

  if (
    selectedComponent ===
    'capacitor'
  ) {

    componentGroup.add(
      capacitor
    );

  }

  if (
    selectedComponent ===
    'led'
  ) {

    componentGroup.add(
      led
    );

  }

  if (
    selectedComponent ===
    'transistor'
  ) {

    componentGroup.add(
      transistor
    );

  }

  if (
    selectedComponent ===
    'arduino'
  ) {

    if (
      arduino &&
      arduino.children.length > 0
    ) {

      componentGroup.add(
        arduino
      );

      arduino.position.set(
        0,
        0,
        0
      );

      arduino.rotation.set(
        0,
        0,
        0
      );

      console.log(
        'Arduino added to scene'
      );

    } else {

      console.log(
        'Arduino model is not ready yet'
      );

    }

  }

  componentGroup.rotation.set(
    0,
    0,
    0
  );

  updateInfo();

}

// ==================== HIGHLIGHTING ====================

function highlightSelectedComponent() {

  componentGroup.traverse(
    (object) => {

      if (
        object.isMesh &&
        object.material &&
        object.material.emissive
      ) {

        object.material.emissive.set(
          0xff0000
        );

        object.material.emissiveIntensity =
          1.5;

      }

    }
  );

  info.style.display = 'block';

  updateInfo();

}

function removeHighlight() {

  componentGroup.traverse(
    (object) => {

      if (
        object.isMesh &&
        object.material &&
        object.material.emissive
      ) {

        object.material.emissive.set(
          0x000000
        );

        object.material.emissiveIntensity =
          0;

      }

    }
  );

  info.style.display = 'none';

}

// ==================== WEBSOCKET ====================

const socket =
  new WebSocket(
    'ws://localhost:8765'
  );

socket.onopen = () => {

  console.log(
    'Connected to Python WebSocket server'
  );

};

socket.onmessage = (event) => {

  const data =
    JSON.parse(event.data);

  currentGesture =
    data.gesture;

  if (
    currentGesture ===
    'POINT'
  ) {

    highlightSelectedComponent();

  }

  if (
    currentGesture ===
    'OPEN PALM'
  ) {

    removeHighlight();

  }

  if (
    currentGesture ===
    'FIST'
  ) {

    componentGroup.rotation.set(
      0,
      0,
      0
    );

    removeHighlight();

  }

  updateInfo();

};

socket.onerror = (error) => {

  console.error(
    'WebSocket error:',
    error
  );

};

// ==================== ANIMATION ====================

function animate() {

  requestAnimationFrame(
    animate
  );

  if (
    currentGesture ===
    'OPEN PALM'
  ) {

    componentGroup.rotation.y +=
      0.01;

  }

  controls.update();

  renderer.render(
    scene,
    camera
  );

}

animate();

// ==================== RESPONSIVE SCREEN ====================

window.addEventListener(
  'resize',
  () => {

    camera.aspect =
      window.innerWidth /
      window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

  }
);