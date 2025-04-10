import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// manually canvas for precise control 
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.width = '100%';
document.body.style.height = '100%';
document.body.style.overflow = 'hidden';

const canvas = document.querySelector('canvas.webgl');

// scene
const scene = new THREE.Scene();

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height)
camera.position.z = 3;
scene.add(camera);

// render initialization
const renderer = new THREE.WebGLRenderer({ canvas: canvas});
document.body.appendChild( renderer.domElement );
document.body.style.backgroundColor = '#888888';
renderer.setClearColor(0x888888);
renderer.setSize(sizes.width, sizes.height);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// Add basic lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// objects
const gridHelper = new THREE.GridHelper(100, 100, 0xffffff, 0xffffff);
gridHelper.material.opacity = 0.25;
gridHelper.position.y = -0.5;
scene.add(gridHelper);


// Generate 10 random cubes around the center
const selectableObjects = [];
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
// Use separate material instances to prevent shared color updates
function createBoxMaterial() {
    return new THREE.MeshBasicMaterial({ color: 0x008000 });
}

for (let i = 0; i < 10; i++) {
    const mesh = new THREE.Mesh(boxGeometry, createBoxMaterial());
    mesh.position.set(
        (Math.random() - 0.5) * 10,
        0.5,
        (Math.random() - 0.5) * 10
    );
    mesh.name = `cube_${i}`;
    scene.add(mesh);
    selectableObjects.push(mesh);
}

// events

// event selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
const arrows = [];
const arrowColliders = [];
let rotationMode = false;
const rotationCircles = [];

// control mode 
const ControlMode = {
    SELECT: 'select',
    MOVE: 'move',
    ROTATE: 'rotate'
};
let currentMode = ControlMode.SELECT;
let activeAxis = null;

function enterMode(mode) {
    console.log('entering mode');
    exitMode();
    currentMode = mode;

    if (mode === ControlMode.MOVE && selectedObject) {
        createArrows(selectedObject.position);
    } else if (mode === ControlMode.ROTATE && selectedObject) {
        createRotationCircles(selectedObject.position);
    }
}

function exitMode() {
    clearArrows();
    clearRotationCircles();
    currentMode = ControlMode.SELECT;
    activeAxis = null;
    controls.enabled = true;
    console.log('exiting mode');
}

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects, true);

    if (currentMode === ControlMode.SELECT) {
        if (selectedObject) selectedObject.material.color.set(0x008000);

        const hit = intersects.find(obj => !['x collider', 'y collider', 'z collider'].includes(obj.object.name));
        if (hit) {
            selectedObject = hit.object;
            selectedObject.material.color.set(0xFFFF00);
        } else {
            selectedObject = null;
        }
    } else {
        if (activeAxis) return;
        const valid = intersects.some(i => i.object.name.startsWith('rotation_') || i.object.name.includes('collider'));
        if (!valid) {
            console.log('not valid');
            exitMode();
        }
    }
});

// selection -> dragging -> arrows for moving object

function createArrows(position) {
    const arrowLength = 1;
    const arrowRadius = 0.05;
    const colliderThickness = 0.15;

    const createArrow = (dir, color, name) => {
        const arrow = new THREE.ArrowHelper(dir, position.clone(), arrowLength, color);
        arrow.name = name + ' arrow';
        arrow.line.material.depthTest = false;
        arrow.cone.material.depthTest = false;
        arrow.line.renderOrder = 999;
        arrow.cone.renderOrder = 999;
        scene.add(arrow);
        arrows.push(arrow);

        const collider = new THREE.Mesh(
            new THREE.CylinderGeometry(colliderThickness, colliderThickness, arrowLength, 8),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        collider.name = name + ' collider';
        collider.userData.axis = name;
        collider.position.copy(position.clone().add(dir.clone().multiplyScalar(arrowLength / 2)));

        if (name === 'x') collider.rotation.z = Math.PI / 2;
        if (name === 'z') collider.rotation.x = Math.PI / 2;

        scene.add(collider);
        arrowColliders.push(collider);
        selectableObjects.push(collider);
    };

    createArrow(new THREE.Vector3(1, 0, 0), 0xff0000, 'x');
    createArrow(new THREE.Vector3(0, 1, 0), 0x00ff00, 'y');
    createArrow(new THREE.Vector3(0, 0, 1), 0x0000ff, 'z');
}

function clearArrows() {
    for (const arrow of arrows) {
        scene.remove(arrow);
    }
    for (const collider of arrowColliders) {
        scene.remove(collider);
        const index = selectableObjects.indexOf(collider);
        if (index !== -1) {
            selectableObjects.splice(index, 1);
        }
    }
    arrows.length = 0;
    arrowColliders.length = 0;
}

function createRotationCircles(position) {
    const radius = 1.2;
    const tubeRadius = 0.04;
    const radialSegments = 16;
    const tubularSegments = 100;

    const createTorus = (axis, color, name) => {
        const torus = new THREE.Mesh(
            new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments),
            new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
        );
        torus.name = name;
        torus.position.copy(position);
        if (name === 'rotation_x') torus.rotation.y = Math.PI / 2;
        if (name === 'rotation_y') torus.rotation.x = Math.PI / 2;
        if (name === 'rotation_z') torus.rotation.z = Math.PI / 2;
        scene.add(torus);
        rotationCircles.push(torus);
        selectableObjects.push(torus);
    };

    createTorus('x', 0xff0000, 'rotation_x');
    createTorus('y', 0x00ff00, 'rotation_y');
    createTorus('z', 0x0000ff, 'rotation_z');
}

function clearRotationCircles() {
    rotationCircles.forEach(circle => {
        scene.remove(circle);
        const index = selectableObjects.indexOf(circle);
        if (index !== -1) selectableObjects.splice(index, 1);
    });
    rotationCircles.length = 0;
}

function toScreenPosition(objPosition, camera) {
    const vector = objPosition.clone().project(camera);
    return new THREE.Vector2(
        (vector.x + 1) / 2 * sizes.width,
        (1 - vector.y) / 2 * sizes.height
    );
}

window.addEventListener('mousedown', (event) => {
    if (currentMode !== ControlMode.SELECT) {
        controls.enabled = false;

        mouse.x = (event.clientX / sizes.width) * 2 - 1;
        mouse.y = -(event.clientY / sizes.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(selectableObjects, true);

        const hit = intersects.find(i => i.object.name.includes('collider') || i.object.name.startsWith('rotation_'));
        if (hit) {
            activeAxis = hit.object.name;
            console.log('active axis', activeAxis);
        }
    } else {
        controls.enabled = true;
    }
});

window.addEventListener('mouseup', () => {
    activeAxis = null;
    controls.enabled = true;
});

window.addEventListener('mousemove', (event) => {
    if (!activeAxis || !selectedObject) return;

    const newMouse = new THREE.Vector2(event.clientX, event.clientY);

    const worldDir = new THREE.Vector3();
    if (activeAxis.includes('x')) worldDir.set(1, 0, 0);
    if (activeAxis.includes('y')) worldDir.set(0, 1, 0);
    if (activeAxis.includes('z')) worldDir.set(0, 0, 1);

    const startPos = selectedObject.position.clone();
    const endPos = startPos.clone().add(worldDir);

    const screenStart = toScreenPosition(startPos, camera);
    const screenEnd = toScreenPosition(endPos, camera);
    const screenDir = screenEnd.sub(screenStart).normalize();

    const mouseDelta = new THREE.Vector2(
        event.movementX || event.mozMovementX || event.webkitMovementX || 0,
        event.movementY || event.mozMovementY || event.webkitMovementY || 0
    );

    const amount = mouseDelta.dot(screenDir) * 0.01;

    if (currentMode === ControlMode.MOVE) {
        console.log('moving');
        
        selectedObject.position.addScaledVector(worldDir, amount);
        clearArrows();
        createArrows(selectedObject.position);
    } else if (currentMode === ControlMode.ROTATE) {
        console.log('rotating');

        const rotationAmount = amount * 2; // arbitrary rotation factor
        const axis = new THREE.Vector3();
        if (activeAxis.includes('x')) axis.set(1, 0, 0);
        if (activeAxis.includes('y')) axis.set(0, 1, 0);
        if (activeAxis.includes('z')) axis.set(0, 0, 1);
        selectedObject.rotateOnWorldAxis(axis, rotationAmount);
        clearRotationCircles();
        createRotationCircles(selectedObject.position);
    }
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'r') {
        if (selectedObject) enterMode(ControlMode.ROTATE);
    } else if (event.key === 'm') {
        if (selectedObject) enterMode(ControlMode.MOVE);
    }
});

// render start rendering
function animate() {

	requestAnimationFrame( animate );

	controls.update();

	renderer.render( scene, camera );
}
animate();

// instructions:
// Instruction UI setup
const instructionDiv = document.createElement('div');
instructionDiv.style.position = 'absolute';
instructionDiv.style.bottom = '10px';
instructionDiv.style.left = '10px';
instructionDiv.style.padding = '8px 12px';
instructionDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
instructionDiv.style.color = '#fff';
instructionDiv.style.fontFamily = 'sans-serif';
instructionDiv.style.fontSize = '14px';
instructionDiv.style.borderRadius = '4px';
instructionDiv.style.maxWidth = '300px';
instructionDiv.style.whiteSpace = 'pre-line';
document.body.appendChild(instructionDiv);

function updateInstructions() {
    if (currentMode === ControlMode.SELECT) {
        if (!selectedObject) {
            instructionDiv.textContent = 'Left click to select';
        } else {
            instructionDiv.textContent = `'r' to rotate
'm' to move`;
        }
    } else if (currentMode === ControlMode.MOVE) {
        instructionDiv.textContent = 'Left mouse: drag arrow to move';
    } else if (currentMode === ControlMode.ROTATE) {
        instructionDiv.textContent = 'Left mouse: drag torus to rotate';
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;

    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();

    renderer.setSize(sizes.width, sizes.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// Call this anytime the mode or selection changes
setInterval(updateInstructions, 100);