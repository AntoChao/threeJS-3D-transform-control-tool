import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// manually canvas for precise control 
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
renderer.setSize(sizes.width, sizes.height);

const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// objects
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const mesh = new THREE.Mesh(geometry, material);
mesh.name = 'cube';
scene.add(mesh);

// events

// event selection
const selectableObjects = [];
selectableObjects.push(mesh);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let selectedObject = null;
const arrows = [];
const arrowColliders = [];
let rotationMode = false;
const rotationCircles = [];

window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(selectableObjects, true);

    // there is an object already selected, should unselect it first
    if (selectedObject) {
        selectedObject.material.color.set(0xff0000); 
        clearArrows();
    }

    // select the object
    if (intersects.length > 0) {
        selectedObject = intersects[0].object;

        const name = selectedObject.name;
        if (!['x collider', 'y collider', 'z collider'].includes(name))
        {
            selectedObject.material.color.set(0x0000ff);
            createArrows(selectedObject.position);

            console.log('Clicked:', intersects.map(obj => obj.object.name || obj.object.type));
            const axis = intersects[0].object.userData.axis;
            console.log('Drag axis:', axis);
        }
    } else {
        selectedObject = null;
    }
});

// selection -> dragging -> arrows for moving object

function createArrows(position) {
    const arrowLength = 1;
    const arrowRadius = 0.05;
    const headLength = 0.2;

    // Visual arrows
    const xArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), position.clone(), arrowLength, 0xff0000);
    xArrow.name = 'x arrow'
    xArrow.line.material.depthTest = false;
    xArrow.cone.material.depthTest = false;
    xArrow.line.renderOrder = 999;
    xArrow.cone.renderOrder = 999;

    const yArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), position.clone(), arrowLength, 0x00ff00);
    yArrow.name = 'y arrow'
    yArrow.line.material.depthTest = false;
    yArrow.cone.material.depthTest = false;
    yArrow.line.renderOrder = 999;
    yArrow.cone.renderOrder = 999;

    const zArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), position.clone(), arrowLength, 0x0000ff);
    zArrow.name = 'z arrow'
    zArrow.line.material.depthTest = false;
    zArrow.cone.material.depthTest = false;
    zArrow.line.renderOrder = 999;
    zArrow.cone.renderOrder = 999;

    scene.add(xArrow, yArrow, zArrow);
    arrows.push(xArrow, yArrow, zArrow);

    // Invisible raycast colliders for dragging
    const colliderMaterial = new THREE.MeshBasicMaterial({ visible: false });

    const xCollider = new THREE.Mesh(
        new THREE.CylinderGeometry(arrowRadius, arrowRadius, arrowLength, 8),
        colliderMaterial
    );
    xCollider.position.copy(position).add(new THREE.Vector3(arrowLength / 2, 0, 0));
    xCollider.rotation.z = Math.PI / 2;
    xCollider.userData.axis = 'x';
    xCollider.name = 'x collider';

    const yCollider = new THREE.Mesh(
        new THREE.CylinderGeometry(arrowRadius, arrowRadius, arrowLength, 8),
        colliderMaterial
    );
    yCollider.position.copy(position).add(new THREE.Vector3(0, arrowLength / 2, 0));
    yCollider.userData.axis = 'y';
    yCollider.name = 'y collider';

    const zCollider = new THREE.Mesh(
        new THREE.CylinderGeometry(arrowRadius, arrowRadius, arrowLength, 8),
        colliderMaterial
    );
    zCollider.position.copy(position).add(new THREE.Vector3(0, 0, arrowLength / 2));
    zCollider.rotation.x = Math.PI / 2;
    zCollider.userData.axis = 'z';
    zCollider.name = 'z collider';

    scene.add(xCollider, yCollider, zCollider);
    arrowColliders.push(xCollider, yCollider, zCollider);
    console.log('spawned arrow collider: ');
    arrowColliders.forEach(obj => console.log(obj.name));
    selectableObjects.push(xCollider, yCollider, zCollider);
}

function clearArrows() {
    for (const arrow of arrows) {
        scene.remove(arrow);
    }
    console.log('before clear:');
    arrowColliders.forEach(obj => console.log(obj.name));

    for (const collider of arrowColliders) {
        scene.remove(collider);
        const index = selectableObjects.indexOf(collider);
        if (index !== -1) {
            selectableObjects.splice(index, 1);
        }
    }
    arrows.length = 0;
    arrowColliders.length = 0;

    console.log('after clear:');
    arrowColliders.forEach(obj => console.log(obj.name));

}

function createRotationCircles(position) {
    const radius = 1.2;
    const segments = 64;
    const materialX = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
    const materialY = new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide });
    const materialZ = new THREE.MeshBasicMaterial({ color: 0x0000ff, side: THREE.DoubleSide });

    const geometry = new THREE.RingGeometry(radius - 0.01, radius + 0.01, segments);

    const xCircle = new THREE.Mesh(geometry, materialX);
    xCircle.rotation.y = Math.PI / 2;
    xCircle.position.copy(position);
    xCircle.name = 'rotation_x';

    const yCircle = new THREE.Mesh(geometry, materialY);
    yCircle.rotation.x = Math.PI / 2;
    yCircle.position.copy(position);
    yCircle.name = 'rotation_y';

    const zCircle = new THREE.Mesh(geometry, materialZ);
    zCircle.rotation.z = Math.PI / 2;
    zCircle.position.copy(position);
    zCircle.name = 'rotation_z';

    [xCircle, yCircle, zCircle].forEach(circle => {
        scene.add(circle);
        rotationCircles.push(circle);
        selectableObjects.push(circle);
    });
}

function clearRotationCircles() {
    rotationCircles.forEach(circle => {
        scene.remove(circle);
        const index = selectableObjects.indexOf(circle);
        if (index !== -1) selectableObjects.splice(index, 1);
    });
    rotationCircles.length = 0;
}


// event drag
let dragging = false;
let draggingAxis = null;

function toScreenPosition(objPosition, camera) {
    const vector = objPosition.clone().project(camera);
    return new THREE.Vector2(
        (vector.x + 1) / 2 * sizes.width,
        (1 - vector.y) / 2 * sizes.height
    );
}

window.addEventListener('mousedown', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const arrowHits = raycaster.intersectObjects(arrowColliders);
    if (arrowHits.length > 0) {
        dragging = true;
        controls.enabled = false;
        draggingAxis = arrowHits[0].object.userData.axis;
    }
});

window.addEventListener('mousemove', (event) => {
    if (dragging && selectedObject && draggingAxis) {
        const newMouse = new THREE.Vector2(event.clientX, event.clientY);

        // Step 1: Project object position and direction to screen space
        const worldDir = new THREE.Vector3();
        if (draggingAxis === 'x') worldDir.set(1, 0, 0);
        if (draggingAxis === 'y') worldDir.set(0, 1, 0);
        if (draggingAxis === 'z') worldDir.set(0, 0, 1);

        const startPos = selectedObject.position.clone();
        const endPos = startPos.clone().add(worldDir);

        const screenStart = toScreenPosition(startPos, camera);
        const screenEnd = toScreenPosition(endPos, camera);

        const screenDir = screenEnd.sub(screenStart).normalize();

        // Step 2: Get mouse delta since last frame
        const mouseDelta = new THREE.Vector2(
            event.movementX || event.mozMovementX || event.webkitMovementX || 0,
            event.movementY || event.mozMovementY || event.webkitMovementY || 0
        );

        // Step 3: Project mouse movement onto the axis screen direction
        const amount = mouseDelta.dot(screenDir) * 0.01;

        // Step 4: Apply movement along world direction
        selectedObject.position.addScaledVector(worldDir, amount);

        clearArrows();
        createArrows(selectedObject.position);
    }
});

window.addEventListener('mouseup', () => {
    dragging = false;
    draggingAxis = null;
    controls.enabled = true;
});

window.addEventListener('keydown', (event) => {
    if (event.key === 'r' && selectedObject) {
        rotationMode = true;
        clearArrows();
        clearRotationCircles();
        createRotationCircles(selectedObject.position);
    }
});

// render start rendering
function animate() {

	requestAnimationFrame( animate );

	controls.update();

	renderer.render( scene, camera );
}
animate();