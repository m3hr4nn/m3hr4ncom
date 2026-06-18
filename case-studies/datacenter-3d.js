// ─── Multi-Site DR — 3D datacenter scene (Three.js, lazy-loaded) ─────────────
// Procedural scene of the real (anonymized) topology.
//
// North-south plane:  Internet → DMZ edge (API gateway · F5 · DNS/GSLB)
//                     → DC-1 / DC-2 active, DC-3 warm standby.
// CRM circle:         the three DCs sit on a disc — the active CRM core.
// East-west plane:    an adjacent integration disc the CRM core exchanges data
//                     with through a Middleware bus — CBS, Reporting, Mediation,
//                     MLOps (DC symbols) and the IPBB carrier backbone (network
//                     device).
// Each DC shows its Nginx ingress, Kubernetes engine and Oracle DB / app /
// backup storage. Traffic and replication are animated as traveling pulses.
//
// Drag to orbit, click any node for its role. Everything is built from
// primitives + canvas-texture sprite labels — no external models, no addons.

import * as THREE from 'three';

const hex = (c) => '#' + c.toString(16).padStart(6, '0');

// ── Site topology (Active-Active-Standby). Colors kept as-is per design. ─────
const SITES = [
    { id: '1', label: 'DC-1', active: true,  pos: [-4.0, 0, -0.4], color: 0x5e6ad2,
      role: 'Active — serves live traffic via the F5. Kubernetes engine runs the CBS/CRM apps behind an Nginx ingress; Oracle DB on ~1 PB storage + ~500 TB app storage, each mirrored to a same-size backup device.' },
    { id: '2', label: 'DC-2', active: true,  pos: [ 4.0, 0, -0.4], color: 0x8b93e8,
      role: 'Active — serves live traffic alongside DC-1 and is sized to absorb 100% of national load if a peer site is lost. Same K8s + Oracle + storage stack.' },
    { id: '3', label: 'DC-3', active: false, pos: [ 0, 0, -4.6], color: 0x2dd4bf,
      role: 'Warm standby — continuously receives DB & app replication. Promoted on a full active-site loss (needs a DNS change to propagate).' },
];

// ── Edge / DMZ devices ───────────────────────────────────────────────────────
const INTERNET = { pos: [0, 4.7, 4.8], color: 0x9aa4b2,
    label: 'Internet', role: 'Internet & external channels — north-south traffic and partner integrations enter the platform from here.' };
const DMZ = { y: 2.0, z: 2.8, color: 0xf5a623,
    role: 'DMZ — public-facing edge zone hosting the F5 VIP, the API gateway and the Nginx ingress that front the private application tier.' };
const EDGE = [
    { id: 'apigw', pos: [-3.4, 2.35, 2.8], color: 0x10b981, label: 'API GW',
      role: 'API Gateway — north-south entry point; lets external channels reach the application tier through the Nginx ingress at each site.' },
    { id: 'f5',    pos: [ 0,   2.35, 2.8], color: 0xef4444, label: 'F5',
      role: 'F5 load balancer — single VIP/DNS over DC-1 & DC-2 with weighted, proximity-aware routing. HTTPS 200 health checks per site; reroutes automatically on failure.' },
    { id: 'dns',   pos: [ 3.4, 2.35, 2.8], color: 0x38bdf8, label: 'DNS · GSLB',
      role: 'DNS / GSLB — resolves the public name to the active sites. DNS replication was limited to two sites, so promoting DC-3 requires a DNS change to propagate.' },
];

// ── CRM circle + east-west integration plane ─────────────────────────────────
const CRM_DISC = { center: [0, -1.25, -1.8], radius: 5.3, color: 0x6f78e0,
    label: 'CRM circle', role: 'CRM core — the active CRM cluster running across DC-1, DC-2 and DC-3.' };
const INTEG_DISC = { center: [-8.5, -1.25, -1.8], radius: 3.0, color: 0xc084fc,
    label: 'Integration · E-W', role: 'East-west integration domain — downstream and 3rd-party systems the CRM core exchanges data with through the middleware bus.' };
const MIDDLEWARE = { pos: [-5.6, -0.25, -1.8], color: 0xa855f7, label: 'Middleware',
    role: 'Middleware / integration bus — brokers east-west traffic between the CRM core and downstream systems (billing, mediation, reporting, analytics).' };
const THIRD_PARTIES = [
    { kind: 'dc',  label: 'CBS',       color: 0xf59e0b, ang: 80,
      role: 'CBS — Convergent Billing System. Primary east-west consumer of CRM events for charging and billing.' },
    { kind: 'dc',  label: 'Reporting', color: 0x06b6d4, ang: 152,
      role: 'Reporting / BI — consumes CRM and billing data for operational and business reporting.' },
    { kind: 'dc',  label: 'Mediation', color: 0xec4899, ang: 224,
      role: 'Mediation — collects and normalizes network usage records that feed billing and analytics.' },
    { kind: 'dc',  label: 'MLOps',     color: 0x84cc16, ang: 296,
      role: 'MLOps / analytics — model training and serving on platform data.' },
    { kind: 'net', label: 'IPBB',      color: 0x3b82f6, ang: 8,
      role: 'IP Backbone (IPBB) — the carrier IP/MPLS backbone the platform and its integrations ride on.' },
];

export function initDatacenterScene(canvas, { onSelect, reducedMotion = false } = {}) {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 8.5, 17.5);
    camera.lookAt(0, 0.6, -0.6);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(5, 12, 8);
    scene.add(key);
    const rim = new THREE.PointLight(0x5e6ad2, 0.8, 60);
    rim.position.set(-8, 6, -7);
    scene.add(rim);

    // Root group we rotate for "orbit"; content is recentered inside it so the
    // (asymmetric) composition orbits around its own middle.
    const root = new THREE.Group();
    scene.add(root);
    const content = new THREE.Group();
    root.add(content);

    // Ground grid for spatial context
    const grid = new THREE.GridHelper(28, 28, 0x2a2a33, 0x16161c);
    grid.position.y = -1.2;
    content.add(grid);

    // ── Selection plumbing ──────────────────────────────────────────────────
    const pickables = [];
    const beacons = [];
    const groupByMesh = new Map();
    function registerPick(mesh, group) { pickables.push(mesh); groupByMesh.set(mesh, group); }
    function makeHalo(w, h, d, color) {
        return new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: 0.18 })
        );
    }

    // ── Text label sprites (canvas texture, always face camera) ──────────────
    function makeLabel(text, { color = '#eef0f5', height = 0.72 } = {}) {
        const font = 48, padX = 22, padY = 14;
        const c = document.createElement('canvas');
        const ctx = c.getContext('2d');
        ctx.font = `700 ${font}px JetBrains Mono, monospace`;
        const tw = Math.ceil(ctx.measureText(text).width);
        c.width = tw + padX * 2;
        c.height = font + padY * 2;
        const r = 14;
        ctx.font = `700 ${font}px JetBrains Mono, monospace`;
        ctx.fillStyle = 'rgba(10,10,16,0.72)';
        ctx.beginPath();
        ctx.moveTo(r, 0); ctx.arcTo(c.width, 0, c.width, c.height, r);
        ctx.arcTo(c.width, c.height, 0, c.height, r); ctx.arcTo(0, c.height, 0, 0, r);
        ctx.arcTo(0, 0, c.width, 0, r); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.globalAlpha = 0.35; ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, c.width / 2, c.height / 2 + 2);
        const tex = new THREE.CanvasTexture(c);
        tex.minFilter = THREE.LinearFilter; tex.anisotropy = 4;
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
        sp.renderOrder = 20;
        sp.scale.set(height * (c.width / c.height), height, 1);
        return sp;
    }

    // ── Primitive helpers ────────────────────────────────────────────────────
    function deviceMat(color, emissive = 0.22) {
        return new THREE.MeshStandardMaterial({ color: 0x0e0e14, roughness: 0.5, metalness: 0.35, emissive: color, emissiveIntensity: emissive });
    }
    function box(w, h, d, color, emissive) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), deviceMat(color, emissive)); }
    function cyl(r, h, color, emissive = 0.3) {
        return new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18),
            new THREE.MeshStandardMaterial({ color: 0x14141c, roughness: 0.45, metalness: 0.4, emissive: color, emissiveIntensity: emissive }));
    }

    // ── Datacenter nodes (rich: body=K8s, Nginx, DB/app/backup storage) ──────
    SITES.forEach((site) => {
        const group = new THREE.Group();
        group.position.set(...site.pos);

        const body = box(1.5, 1.8, 1.5, site.color, 0.12);
        body.position.y = -0.3;
        group.add(body);
        registerPick(body, group);

        const beaconMat = new THREE.MeshStandardMaterial({ color: site.color, emissive: site.color, emissiveIntensity: 1.4, roughness: 0.3 });
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), beaconMat);
        beacon.position.y = 0.75;
        group.add(beacon);
        beacons.push(beacon);

        const nginx = box(0.42, 0.42, 0.42, 0x22c55e, 0.5);
        nginx.position.set(0, 0.2, 0.95);
        group.add(nginx);
        registerPick(nginx, group);

        const db = cyl(0.32, 0.9, 0xf97316, 0.45);     // Oracle DB tier (~1 PB)
        db.position.set(-1.05, -0.55, 0.2);
        group.add(db); registerPick(db, group);

        const app = cyl(0.3, 0.75, 0x6366f1, 0.4);     // App tier (~500 TB)
        app.position.set(1.05, -0.6, 0.2);
        group.add(app); registerPick(app, group);

        const backup = cyl(0.26, 0.6, 0x64748b, 0.25); // Same-size backup
        backup.position.set(0, -0.7, -0.95);
        group.add(backup); registerPick(backup, group);

        const halo = makeHalo(1.85, 2.25, 1.85, site.color);
        halo.position.y = -0.3;
        group.add(halo);

        const label = makeLabel(site.label, { color: hex(site.color), height: 0.8 });
        label.position.set(0, 1.5, 0);
        group.add(label);

        const sub = makeLabel(site.active ? 'active' : 'warm standby', { color: '#9aa4b2', height: 0.42 });
        sub.position.set(0, 1.08, 0);
        group.add(sub);

        group.userData = { site: { label: site.label, role: site.role }, halo, haloBase: 0.18 };
        content.add(group);
    });

    // ── Internet cloud (cluster of spheres) ──────────────────────────────────
    const cloud = new THREE.Group();
    cloud.position.set(...INTERNET.pos);
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0x1b1f29, roughness: 0.7, metalness: 0.1, emissive: INTERNET.color, emissiveIntensity: 0.25 });
    const puffs = [[0, 0, 0, 0.8], [0.72, 0.08, 0, 0.58], [-0.72, 0.06, 0, 0.58], [0.38, -0.22, 0.34, 0.5], [-0.42, -0.18, -0.3, 0.5]];
    let cloudPick = null;
    puffs.forEach(([x, y, z, r], i) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 16), cloudMat);
        s.position.set(x, y, z);
        cloud.add(s);
        if (i === 0) cloudPick = s;
    });
    const cloudHalo = makeHalo(2.6, 1.6, 1.6, INTERNET.color);
    cloud.add(cloudHalo);
    const cloudLabel = makeLabel(INTERNET.label, { color: '#c7cedb', height: 0.58 });
    cloudLabel.position.set(0, 1.15, 0);
    cloud.add(cloudLabel);
    cloud.userData = { site: { label: 'Internet', role: INTERNET.role }, halo: cloudHalo, haloBase: 0.18 };
    registerPick(cloudPick, cloud);
    content.add(cloud);

    // ── DMZ zone (translucent slab) + edge devices ───────────────────────────
    const dmzSlab = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 0.18, 2.6),
        new THREE.MeshStandardMaterial({ color: DMZ.color, transparent: true, opacity: 0.10, roughness: 0.9, emissive: DMZ.color, emissiveIntensity: 0.12 })
    );
    dmzSlab.position.set(0, DMZ.y - 0.55, DMZ.z);
    content.add(dmzSlab);
    const dmzEdge = new THREE.Mesh(
        new THREE.BoxGeometry(10.5, 0.18, 2.6),
        new THREE.MeshBasicMaterial({ color: DMZ.color, wireframe: true, transparent: true, opacity: 0.22 })
    );
    dmzEdge.position.copy(dmzSlab.position);
    content.add(dmzEdge);
    const dmzLabel = makeLabel('DMZ', { color: '#f5c97b', height: 0.5 });
    dmzLabel.position.set(-4.6, DMZ.y - 0.15, DMZ.z);
    content.add(dmzLabel);

    EDGE.forEach((d) => {
        const group = new THREE.Group();
        group.position.set(...d.pos);
        const mesh = box(1.1, 0.5, 0.9, d.color, 0.45);
        group.add(mesh); registerPick(mesh, group);
        const halo = makeHalo(1.35, 0.75, 1.15, d.color);
        group.add(halo);
        const label = makeLabel(d.label, { color: hex(d.color), height: 0.46 });
        label.position.set(0, 0.62, 0);
        group.add(label);
        group.userData = { site: { label: d.label, role: d.role }, halo, haloBase: 0.18 };
        content.add(group);
    });

    // ── Discs (CRM circle + integration plane) ───────────────────────────────
    function makeDisc(def) {
        const group = new THREE.Group();
        group.position.set(...def.center);
        const disc = new THREE.Mesh(
            new THREE.CylinderGeometry(def.radius, def.radius, 0.12, 56),
            new THREE.MeshStandardMaterial({ color: def.color, transparent: true, opacity: 0.09, roughness: 0.9, emissive: def.color, emissiveIntensity: 0.13 })
        );
        group.add(disc); registerPick(disc, group);
        const ring = new THREE.Mesh(
            new THREE.TorusGeometry(def.radius, 0.045, 8, 72),
            new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.5 })
        );
        ring.rotation.x = Math.PI / 2; ring.position.y = 0.07;
        group.add(ring);
        const label = makeLabel(def.label, { color: hex(def.color), height: 0.6 });
        label.position.set(0, 0.55, def.radius - 0.7);
        group.add(label);
        // the ring doubles as the selection highlight
        group.userData = { site: { label: def.label, role: def.role }, halo: ring, haloBase: 0.5 };
        content.add(group);
        return group;
    }
    makeDisc(CRM_DISC);
    makeDisc(INTEG_DISC);

    // ── Middleware bus ────────────────────────────────────────────────────────
    const mwGroup = new THREE.Group();
    mwGroup.position.set(...MIDDLEWARE.pos);
    const mwMesh = box(0.9, 0.7, 1.4, MIDDLEWARE.color, 0.5);
    mwGroup.add(mwMesh); registerPick(mwMesh, mwGroup);
    const mwHalo = makeHalo(1.15, 0.95, 1.65, MIDDLEWARE.color);
    mwGroup.add(mwHalo);
    const mwLabel = makeLabel(MIDDLEWARE.label, { color: hex(MIDDLEWARE.color), height: 0.5 });
    mwLabel.position.set(0, 0.7, 0);
    mwGroup.add(mwLabel);
    mwGroup.userData = { site: { label: MIDDLEWARE.label, role: MIDDLEWARE.role }, halo: mwHalo, haloBase: 0.18 };
    content.add(mwGroup);

    // ── Third-party systems on the integration disc ──────────────────────────
    function makeMiniDC(pos, color, label, role) {
        const g = new THREE.Group(); g.position.set(...pos);
        const body = box(0.85, 1.0, 0.85, color, 0.16); body.position.y = -0.1; g.add(body); registerPick(body, g);
        const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.3, roughness: 0.3 }));
        beacon.position.y = 0.5; g.add(beacon); beacons.push(beacon);
        const halo = makeHalo(1.05, 1.3, 1.05, color); halo.position.y = -0.1; g.add(halo);
        const lab = makeLabel(label, { color: hex(color), height: 0.5 }); lab.position.set(0, 0.95, 0); g.add(lab);
        g.userData = { site: { label, role }, halo, haloBase: 0.18 };
        content.add(g); return g;
    }
    function makeNetDevice(pos, color, label, role) {
        const g = new THREE.Group(); g.position.set(...pos);
        const base = box(1.15, 0.32, 0.85, color, 0.42); base.position.y = -0.25; g.add(base); registerPick(base, g);
        [-0.32, 0.32].forEach((x) => {
            const a = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 8),
                new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.8 }));
            a.position.set(x, 0.15, 0.2); g.add(a);
        });
        const halo = makeHalo(1.35, 0.95, 1.05, color); halo.position.y = -0.1; g.add(halo);
        const lab = makeLabel(label, { color: hex(color), height: 0.5 }); lab.position.set(0, 0.6, 0); g.add(lab);
        g.userData = { site: { label, role }, halo, haloBase: 0.18 };
        content.add(g); return g;
    }

    const tpGroups = [];
    THIRD_PARTIES.forEach((tp) => {
        const a = (tp.ang * Math.PI) / 180, r = 2.2;
        const pos = [INTEG_DISC.center[0] + r * Math.cos(a), 0, INTEG_DISC.center[2] + r * Math.sin(a)];
        const g = tp.kind === 'net'
            ? makeNetDevice(pos, tp.color, tp.label, tp.role)
            : makeMiniDC(pos, tp.color, tp.label, tp.role);
        tpGroups.push({ g, pos });
    });

    // ── Links + pulses ───────────────────────────────────────────────────────
    const v = (p) => new THREE.Vector3(...p);
    const replPulses = [];   // cross-site replication
    const flowPulses = [];   // north-south traffic
    const ewPulses = [];     // east-west integration traffic

    function addLink(pa, pb, { color = 0x5e6ad2, opacity = 0.4, dashed = false } = {}) {
        const mat = dashed
            ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.3, gapSize: 0.25 })
            : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([pa, pb]), mat);
        if (dashed) line.computeLineDistances();
        content.add(line);
    }
    function addPulse(pa, pb, color, list, speed = 0.3) {
        const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), new THREE.MeshBasicMaterial({ color }));
        content.add(pulse);
        list.push({ pulse, pa, pb, t: Math.random(), speed });
    }

    // North-south traffic: Internet → API GW / DNS → F5 → DC-1 / DC-2
    const pInternet = v(INTERNET.pos);
    const pApi = v(EDGE[0].pos), pF5 = v(EDGE[1].pos), pDns = v(EDGE[2].pos);
    const nsColor = 0xfacc15;
    [[pInternet, pApi], [pInternet, pDns], [pApi, pF5]].forEach(([a, b]) => {
        addLink(a, b, { color: nsColor, opacity: 0.5 }); addPulse(a, b, nsColor, flowPulses, 0.35);
    });
    [SITES[0], SITES[1]].forEach((s) => {
        const top = v(s.pos).add(new THREE.Vector3(0, 0.75, 0));
        addLink(pF5, top, { color: nsColor, opacity: 0.5 }); addPulse(pF5, top, nsColor, flowPulses, 0.3);
    });
    addLink(pF5, v(SITES[2].pos).add(new THREE.Vector3(0, 0.75, 0)), { color: 0x64748b, opacity: 0.45, dashed: true });

    // Cross-site replication: DC-1 ↔ DC-2 ↔ DC-3 (between DB positions)
    const dbPos = SITES.map((s) => v(s.pos).add(new THREE.Vector3(0, -0.4, 0)));
    [[0, 1], [0, 2], [1, 2]].forEach(([a, b]) => {
        addLink(dbPos[a], dbPos[b], { color: 0x2dd4bf, opacity: 0.4 });
        addPulse(dbPos[a], dbPos[b], 0x5eead4, replPulses, 0.22);
        addPulse(dbPos[b], dbPos[a], 0x5eead4, replPulses, 0.22);
    });

    // East-west integration: CRM core ↔ Middleware ↔ integration hub ↔ 3rd parties
    const ewColor = 0xc084fc;
    const pCrm = v([CRM_DISC.center[0], 0, CRM_DISC.center[2]]);
    const pMw = v(MIDDLEWARE.pos).add(new THREE.Vector3(0, 0.1, 0));
    const pHub = v([INTEG_DISC.center[0], 0, INTEG_DISC.center[2]]);
    addLink(pCrm, pMw, { color: ewColor, opacity: 0.5 });
    addLink(pMw, pHub, { color: ewColor, opacity: 0.5 });
    addPulse(pCrm, pMw, ewColor, ewPulses, 0.3); addPulse(pMw, pCrm, ewColor, ewPulses, 0.3);
    addPulse(pMw, pHub, ewColor, ewPulses, 0.3); addPulse(pHub, pMw, ewColor, ewPulses, 0.3);
    tpGroups.forEach(({ pos }) => {
        const p = v([pos[0], 0, pos[2]]);
        addLink(pHub, p, { color: ewColor, opacity: 0.35 });
        addPulse(pHub, p, ewColor, ewPulses, 0.4);
    });

    // Recenter the (left-heavy) composition so it orbits around its middle.
    content.position.x = 2.8;

    // ── Hand-rolled orbit (pointer drag) ────────────────────────────────────
    let targetRotY = 0.5, targetRotX = 0.22, curRotY = 0.5, curRotX = 0.22;
    let dragging = false, userInteracted = false, lastX = 0, lastY = 0;
    const onDown = (e) => { dragging = true; lastX = e.clientX ?? e.touches[0].clientX; lastY = e.clientY ?? e.touches[0].clientY; };
    const onUp = () => { dragging = false; };
    const onMove = (e) => {
        if (!dragging) return;
        userInteracted = true;
        const x = e.clientX ?? e.touches[0].clientX, y = e.clientY ?? e.touches[0].clientY;
        targetRotY += (x - lastX) * 0.01;
        targetRotX = Math.max(-0.15, Math.min(0.85, targetRotX + (y - lastY) * 0.006));
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
        select(hit ? groupByMesh.get(hit.object) : null);
    });

    function select(group) {
        if (selected) selected.userData.halo.material.opacity = selected.userData.haloBase;
        selected = group;
        if (group) {
            group.userData.halo.material.opacity = 0.75;
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

        // Gentle rocking until the user takes control (keeps the wide layout framed)
        if (!reducedMotion && !userInteracted) targetRotY = 0.5 + Math.sin(clock.elapsedTime * 0.22) * 0.34;
        curRotY += (targetRotY - curRotY) * 0.08;
        curRotX += (targetRotX - curRotX) * 0.08;
        root.rotation.y = curRotY;
        root.rotation.x = curRotX;

        if (!reducedMotion) {
            const tt = clock.elapsedTime;
            beacons.forEach((b) => { b.material.emissiveIntensity = 1.0 + Math.sin(tt * 3) * 0.5; });
            [replPulses, flowPulses, ewPulses].forEach((list) => {
                list.forEach((p) => { p.t = (p.t + dt * p.speed) % 1; p.pulse.position.lerpVectors(p.pa, p.pb, p.t); });
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
