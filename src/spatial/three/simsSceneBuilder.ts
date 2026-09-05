import * as THREE from 'three';

export interface SceneDimensions {
  width: number;
  depth: number;
  centerX: number;
  centerZ: number;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE SIMS ENVIRONMENT BUILDER (WP-01)
 * Tạo dựng không gian ngoại cảnh sân vườn The Sims, hàng rào gỗ trắng cọc nhọn,
 * sàn gạch phân khu ấm cúng và hệ thống tường cắt thấp (Cutaway Low-Walls).
 * ════════════════════════════════════════════════════════════════════════════
 */

export function createSimsGroundAndYard(scene: THREE.Scene, dims: SceneDimensions) {
  const { width, depth, centerX, centerZ } = dims;
  const yardGroup = new THREE.Group();
  yardGroup.name = 'SimsYardGroup';

  // 1. Thảm cỏ xanh The Sims (Lush Green Lawn)
  const lawnMargin = 320;
  const lawnWidth = width + lawnMargin * 2;
  const lawnDepth = depth + lawnMargin * 2;
  const lawnGeo = new THREE.PlaneGeometry(lawnWidth, lawnDepth);
  const lawnMat = new THREE.MeshStandardMaterial({
    color: '#4ade80', // Sims lively grass green
    roughness: 0.85,
    metalness: 0.05,
  });
  const lawnMesh = new THREE.Mesh(lawnGeo, lawnMat);
  lawnMesh.rotation.x = -Math.PI / 2;
  lawnMesh.position.set(centerX, -1.5, centerZ);
  lawnMesh.receiveShadow = true;
  yardGroup.add(lawnMesh);

  // 2. Nền xi măng hành lang & Sàn gạch tổng thể chợ (Polished Market Floor)
  const floorGeo = new THREE.BoxGeometry(width + 32, 2, depth + 32);
  const floorMat = new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.6,
    metalness: 0.1,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.set(centerX, -1, centerZ);
  floorMesh.receiveShadow = true;
  yardGroup.add(floorMesh);

  // 3. Đường nhựa xe tải nhận hàng phía Bắc & Nam (Driveway & Asphalt)
  const roadGeo = new THREE.PlaneGeometry(lawnWidth, 140);
  const roadMat = new THREE.MeshStandardMaterial({
    color: '#334155', // Slate dark road
    roughness: 0.9,
  });
  const roadNorth = new THREE.Mesh(roadGeo, roadMat);
  roadNorth.rotation.x = -Math.PI / 2;
  roadNorth.position.set(centerX, -1.2, centerZ - depth / 2 - 120);
  roadNorth.receiveShadow = true;
  yardGroup.add(roadNorth);

  // Vạch kẻ đỗ xe tải màu vàng
  const stripeGeo = new THREE.PlaneGeometry(16, 60);
  const stripeMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
  for (let i = -3; i <= 3; i++) {
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(centerX + i * 180, -1.1, centerZ - depth / 2 - 120);
    yardGroup.add(stripe);
  }

  // 4. Hàng rào cọc gỗ trắng The Sims (White Picket Fence)
  const fenceGroup = new THREE.Group();
  const postGeo = new THREE.BoxGeometry(4, 18, 2);
  const capGeo = new THREE.ConeGeometry(2.8, 4, 4);
  capGeo.rotateY(Math.PI / 4);
  const fenceMat = new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.3,
  });

  const createPicket = (x: number, z: number, rotY = 0) => {
    const picket = new THREE.Group();
    const post = new THREE.Mesh(postGeo, fenceMat);
    post.position.y = 9;
    post.castShadow = true;
    picket.add(post);

    const cap = new THREE.Mesh(capGeo, fenceMat);
    cap.position.y = 20;
    picket.add(cap);

    picket.position.set(x, 0, z);
    picket.rotation.y = rotY;
    return picket;
  };

  // Rải hàng rào cọc gỗ bao quanh sân vườn (có chừa lối vào Cổng)
  const fenceHalfW = width / 2 + 180;
  const fenceHalfD = depth / 2 + 180;
  const step = 20;

  // Cạnh Nam & Bắc (trừ khoảng mở ở giữa cho Cổng 160px)
  for (let x = -fenceHalfW; x <= fenceHalfW; x += step) {
    if (Math.abs(x) > 90) {
      fenceGroup.add(createPicket(centerX + x, centerZ - fenceHalfD));
      fenceGroup.add(createPicket(centerX + x, centerZ + fenceHalfD));
    }
  }
  // Cạnh Đông & Tây
  for (let z = -fenceHalfD; z <= fenceHalfD; z += step) {
    if (Math.abs(z) > 90) {
      fenceGroup.add(createPicket(centerX - fenceHalfW, centerZ + z, Math.PI / 2));
      fenceGroup.add(createPicket(centerX + fenceHalfW, centerZ + z, Math.PI / 2));
    }
  }

  // Thanh giằng ngang của hàng rào (Horizontal Rails)
  const railMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
  const makeRail = (w: number, x: number, z: number, rotY = 0) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 2, 2), railMat);
    rail.position.set(x, 6, z);
    rail.rotation.y = rotY;
    const railUpper = rail.clone();
    railUpper.position.y = 13;
    const g = new THREE.Group();
    g.add(rail);
    g.add(railUpper);
    return g;
  };

  // Rails cho cạnh Bắc/Nam
  fenceGroup.add(makeRail(fenceHalfW - 100, centerX - fenceHalfW / 2 - 40, centerZ - fenceHalfD));
  fenceGroup.add(makeRail(fenceHalfW - 100, centerX + fenceHalfW / 2 + 40, centerZ - fenceHalfD));
  fenceGroup.add(makeRail(fenceHalfW - 100, centerX - fenceHalfW / 2 - 40, centerZ + fenceHalfD));
  fenceGroup.add(makeRail(fenceHalfW - 100, centerX + fenceHalfW / 2 + 40, centerZ + fenceHalfD));
  // Rails cho cạnh Đông/Tây
  fenceGroup.add(makeRail(fenceHalfD - 100, centerX - fenceHalfW, centerZ - fenceHalfD / 2 - 40, Math.PI / 2));
  fenceGroup.add(makeRail(fenceHalfD - 100, centerX - fenceHalfW, centerZ + fenceHalfD / 2 + 40, Math.PI / 2));
  fenceGroup.add(makeRail(fenceHalfD - 100, centerX + fenceHalfW, centerZ - fenceHalfD / 2 - 40, Math.PI / 2));
  fenceGroup.add(makeRail(fenceHalfD - 100, centerX + fenceHalfW, centerZ + fenceHalfD / 2 + 40, Math.PI / 2));

  yardGroup.add(fenceGroup);

  // 5. Cây cảnh hoạt họa The Sims ở 4 góc sân (Stylized Low-poly Trees)
  const treeMatTrunk = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.9 });
  const treeMatLeaves = new THREE.MeshStandardMaterial({ color: '#15803d', roughness: 0.7 });
  const createTree = (x: number, z: number, scale = 1) => {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(3 * scale, 4 * scale, 18 * scale, 6), treeMatTrunk);
    trunk.position.y = 9 * scale;
    trunk.castShadow = true;
    tree.add(trunk);

    const leaves1 = new THREE.Mesh(new THREE.ConeGeometry(16 * scale, 24 * scale, 7), treeMatLeaves);
    leaves1.position.y = 22 * scale;
    leaves1.castShadow = true;
    tree.add(leaves1);

    const leaves2 = new THREE.Mesh(new THREE.ConeGeometry(12 * scale, 18 * scale, 7), treeMatLeaves);
    leaves2.position.y = 32 * scale;
    leaves2.castShadow = true;
    tree.add(leaves2);

    tree.position.set(x, 0, z);
    return tree;
  };

  yardGroup.add(createTree(centerX - fenceHalfW + 40, centerZ - fenceHalfD + 40, 1.2));
  yardGroup.add(createTree(centerX + fenceHalfW - 40, centerZ - fenceHalfD + 40, 1.1));
  yardGroup.add(createTree(centerX - fenceHalfW + 40, centerZ + fenceHalfD - 40, 1.2));
  yardGroup.add(createTree(centerX + fenceHalfW - 40, centerZ + fenceHalfD - 40, 1.3));
  yardGroup.add(createTree(centerX - fenceHalfW + 45, centerZ, 0.9));
  yardGroup.add(createTree(centerX + fenceHalfW - 45, centerZ, 0.9));

  scene.add(yardGroup);
  return yardGroup;
}

/**
 * Tạo tường bao cắt thấp ngang ngực (Cutaway Low-Walls) chuẩn The Sims
 */
export function createCutawayWalls(scene: THREE.Scene, dims: SceneDimensions) {
  const { width, depth, centerX, centerZ } = dims;
  const wallsGroup = new THREE.Group();
  wallsGroup.name = 'SimsCutawayWalls';

  const wallHeight = 16; // Cắt thấp ngang lưng để nhìn rõ toàn bộ nội thất
  const wallThickness = 6;
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#cbd5e1', // Slate-300
    roughness: 0.8,
  });
  const capMat = new THREE.MeshStandardMaterial({
    color: '#ffffff', // Gờ phào chỉ trắng
    roughness: 0.3,
  });

  const halfW = width / 2;
  const halfD = depth / 2;
  const gateWidth = 90; // Độ mở các Cổng chính

  const makeWallSegment = (len: number, x: number, z: number, rotY = 0) => {
    const seg = new THREE.Group();
    const wallMesh = new THREE.Mesh(new THREE.BoxGeometry(len, wallHeight, wallThickness), wallMat);
    wallMesh.position.y = wallHeight / 2;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    seg.add(wallMesh);

    // Gờ mũ tường màu trắng (Wall Cap Molding)
    const capMesh = new THREE.Mesh(new THREE.BoxGeometry(len + 1, 2, wallThickness + 2), capMat);
    capMesh.position.y = wallHeight + 1;
    seg.add(capMesh);

    seg.position.set(x, 0, z);
    seg.rotation.y = rotY;
    return seg;
  };

  // Cạnh Bắc (2 đoạn hai bên Cổng Bắc)
  const northLen = (width - gateWidth) / 2;
  wallsGroup.add(makeWallSegment(northLen, centerX - width / 4 - gateWidth / 4, centerZ - halfD));
  wallsGroup.add(makeWallSegment(northLen, centerX + width / 4 + gateWidth / 4, centerZ - halfD));

  // Cạnh Nam (2 đoạn hai bên Cổng Nam)
  wallsGroup.add(makeWallSegment(northLen, centerX - width / 4 - gateWidth / 4, centerZ + halfD));
  wallsGroup.add(makeWallSegment(northLen, centerX + width / 4 + gateWidth / 4, centerZ + halfD));

  // Cạnh Tây (2 đoạn hai bên Cổng Tây)
  const westLen = (depth - gateWidth) / 2;
  wallsGroup.add(makeWallSegment(westLen, centerX - halfW, centerZ - depth / 4 - gateWidth / 4, Math.PI / 2));
  wallsGroup.add(makeWallSegment(westLen, centerX - halfW, centerZ + depth / 4 + gateWidth / 4, Math.PI / 2));

  // Cạnh Đông (2 đoạn hai bên Cổng Đông)
  wallsGroup.add(makeWallSegment(westLen, centerX + halfW, centerZ - depth / 4 - gateWidth / 4, Math.PI / 2));
  wallsGroup.add(makeWallSegment(westLen, centerX + halfW, centerZ + depth / 4 + gateWidth / 4, Math.PI / 2));

  // Cổng vòm 4 hướng (Arched Gates with Sims Signboard)
  const makeGateSign = (text: string, x: number, z: number, rotY = 0) => {
    const gate = new THREE.Group();
    // 2 Trụ cổng vuông
    const pMat = new THREE.MeshStandardMaterial({ color: '#076C31', roughness: 0.4 });
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(6, 26, 6), pMat);
    p1.position.set(-gateWidth / 2 + 3, 13, 0);
    p1.castShadow = true;
    gate.add(p1);

    const p2 = p1.clone();
    p2.position.x = gateWidth / 2 - 3;
    gate.add(p2);

    // Xà ngang cổng
    const beam = new THREE.Mesh(new THREE.BoxGeometry(gateWidth, 4, 6), pMat);
    beam.position.set(0, 26, 0);
    gate.add(beam);

    // Biển tên Cổng
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 64);
      ctx.strokeStyle = '#076C31';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 252, 60);
      ctx.fillStyle = '#076C31';
      ctx.font = 'bold 26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 32);
    }
    const signTex = new THREE.CanvasTexture(canvas);
    const signMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 9),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    signMesh.position.set(0, 31, 0);
    gate.add(signMesh);

    gate.position.set(x, 0, z);
    gate.rotation.y = rotY;
    return gate;
  };

  wallsGroup.add(makeGateSign('CỔNG BẮC', centerX, centerZ - halfD));
  wallsGroup.add(makeGateSign('CỔNG NAM', centerX, centerZ + halfD));
  wallsGroup.add(makeGateSign('CỔNG TÂY', centerX - halfW, centerZ, Math.PI / 2));
  wallsGroup.add(makeGateSign('CỔNG ĐÔNG', centerX + halfW, centerZ, -Math.PI / 2));

  scene.add(wallsGroup);
  return wallsGroup;
}
