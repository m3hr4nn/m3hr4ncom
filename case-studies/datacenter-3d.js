// ─── Multi-Site DR — 3D datacenter scene (Three.js, lazy-loaded) ─────────────
// Procedural low-poly scene: three datacenter nodes + glowing links with
// animated replication pulses. Drag to orbit, click a site to select it.
// No external model files — everything is built from primitives.
//
// SCAFFOLD: site labels/roles are PLACEHOLDERS — replace `SITES` data with the
// real architecture once the case-study copy is finalized.

import * as THREE from 'three';

// Placeholder site data — EDIT ME with the real 3-DC topology.
const SITES = [
    { id: 'A', label: 'DC-A', role: 'Primary site — {{ role TBD }}', pos: [-3.2, 0, 1.6], color: 0x5e6ad2 },
    { id: 'B', label: 'DC-B', role: 'Secondary site — {{ role TBD }}', pos: [3.2, 0, 1.6], color: 0x8b93e8 },
    { id: 'C', label: 'DC-C', role: 'Tertiary / DR site — {{ role TBD }}', pos: [0, 0, -3.2], color: 0x2dd4bf },
];
// Replication / failover links between sites (index pairs into SITES).
const LINKS = [[0, 1], [1, 2], [2, 0]];

export function initDatacenterScene(canvas, { onSelect, reducedMotion = false } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 6, 11);
    camera.lookAt(0, 0, 0);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(5, 10, 7);
    scene.add(key);
    const rim = new THREE.PointLight(0x5e6ad2, 0.8, 40);
    rim.position.set(-6, 4, -6);
    scene.add(rim);

    // Root group we rotate for "orbit"
    const root = new THREE.Group();
    scene.add(root);

    // Ground grid for spatial context
    const grid = new THREE.GridHelper(16, 16, 0x2a2a33, 0x16161c);
    grid.position.y = -1.2;
    root.add(grid);

    // Build datacenter nodes (stacked "rack" boxes)
    const pickables = [];
    const nodeByMesh = new Map();
    SITES.forEach((site) => {
        const group = new THREE.Group();
        group.position.set(...site.pos);

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x0e0e14, roughness: 0.55, metalness: 0.3,
            emissive: site.color, emissiveIntensity: 0.12,
        });
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.8, 1.4), bodyMat);
        body.position.y = -0.3;
        group.add(body);

        // Glowing top "beacon"
        const beaconMat = new THREE.MeshStandardMaterial({
            color: site.color, emissive: site.color, emissiveIntensity: 1.4, roughness: 0.3,
        });
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), beaconMat);
        beacon.position.y = 0.75;
        group.add(beacon);

        // Wireframe halo (selection affordance)
        const halo = new THREE.Mesh(
            new THREE.BoxGeometry(1.7, 2.1, 1.7),
            new THREE.MeshBasicMaterial({ color: site.color, wireframe: true, transparent: true, opacity: 0.18 })
        );
        halo.position.y = -0.3;
        group.add(halo);

        group.userData = { site, halo, beacon };
        body.userData.group = group;
        pickables.push(body);
        nodeByMesh.set(body, group);
        root.add(group);
    });

    // Build links + traveling pulse spheres
    const pulses = [];
    LINKS.forEach(([a, b]) => {
        const pa = new THREE.Vector3(...SITES[a].pos);
        const pb = new THREE.Vector3(...SITES[b].pos);
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([pa, pb]),
            new THREE.LineBasicMaterial({ color: 0x5e6ad2, transparent: true, opacity: 0.45 })
        );
        root.add(line);

        const pulse = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 12, 12),
            new THREE.MeshBasicMaterial({ color: 0x8b93e8 })
        );
        root.add(pulse);
        pulses.push({ pulse, pa, pb, t: Math.random() });
    });

    // ── Hand-rolled orbit (pointer drag) ────────────────────────────────────
    let targetRotY = 0.5, targetRotX = 0.25, curRotY = 0.5, curRotX = 0.25;
    let dragging = false, lastX = 0, lastY = 0;
    const onDown = (e) => { dragging = true; lastX = e.clientX ?? e.touches[0].clientX; lastY = e.clientY ?? e.touches[0].clientY; };
    const onUp = () => { dragging = false; };
    const onMove = (e) => {
        if (!dragging) return;
        const x = e.clientX ?? e.touches[0].clientX, y = e.clientY ?? e.touches[0].clientY;
        targetRotY += (x - lastX) * 0.01;
        targetRotX = Math.max(-0.2, Math.min(0.9, targetRotX + (y - lastY) * 0.006));
        lastX = x; lastY = y;
    };
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointermove', onMove);

    // ── Click-to-select via raycaster ───────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let selected = null;
    let downPos = null;
    canvas.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
    canvas.addEventListener('pointerup', (e) => {
        if (!downPos) return;
        const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
        downPos = null;
        if (moved > 6) return; // was a drag, not a click
        const rect = canvas.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(pickables, false)[0];
        select(hit ? nodeByMesh.get(hit.object) : null);
    });

    function select(group) {
        if (selected) selected.userData.halo.material.opacity = 0.18;
        selected = group;
        if (group) {
            group.userData.halo.material.opacity = 0.6;
            onSelect && onSelect(group.userData.site);
        } else {
            onSelect && onSelect(null);
        }
    }

    // ── Resize ──────────────────────────────────────────────────────────────
    function resize() {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (canvas.width !== w || canvas.height !== h) {
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        }
    }

    // ── Animation loop ────────────────────────────────────────────────────────
    let raf = 0, running = true;
    const clock = new THREE.Clock();
    function frame() {
        if (!running) return;
        raf = requestAnimationFrame(frame);
        resize();
        const dt = clock.getDelta();

        // Smooth orbit; gentle auto-rotate unless reduced motion
        if (!reducedMotion && !dragging) targetRotY += dt * 0.12;
        curRotY += (targetRotY - curRotY) * 0.08;
        curRotX += (targetRotX - curRotX) * 0.08;
        root.rotation.y = curRotY;
        root.rotation.x = curRotX;

        // Beacon pulse + traveling replication pulses
        if (!reducedMotion) {
            const tt = clock.elapsedTime;
            root.children.forEach((c) => {
                if (c.userData && c.userData.beacon) {
                    c.userData.beacon.material.emissiveIntensity = 1.0 + Math.sin(tt * 3) * 0.5;
                }
            });
            pulses.forEach((p) => {
                p.t = (p.t + dt * 0.25) % 1;
                p.pulse.position.lerpVectors(p.pa, p.pb, p.t);
            });
        }
        renderer.render(scene, camera);
    }
    frame();

    // ── Teardown ──────────────────────────────────────────────────────────────
    return {
        select,
        destroy() {
            running = false;
            cancelAnimationFrame(raf);
            canvas.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointermove', onMove);
            renderer.dispose();
        },
    };
}
