import * as THREE from 'three';
import type { StallEntity } from '../model/types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE SIMS PROPS & VOLUMETRIC STALL BUILDER (WP-02 & WP-03)
 * Xây dựng quầy sạp đa giác The Sims với bàn quầy gỗ, mái hiên bạt sọc uốn cong,
 * đạo cụ chi tiết từng ngành hàng và viên ngọc kim cương The Sims Plumbob.
 * ════════════════════════════════════════════════════════════════════════════
 */

// Bộ nhớ đệm Canvas Textures để tối ưu hóa hiệu năng Draw Call
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Sinh Texture mái bạt sọc 2 màu (Striped Awning Canvas Texture)
 */
export function getStripedAwningTexture(primaryColor: string, secondaryColor = '#ffffff'): THREE.CanvasTexture {
  const key = `awning_${primaryColor}_${secondaryColor}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const stripeW = 16;
    for (let x = 0; x < 128; x += stripeW * 2) {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, 0, stripeW, 128);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + stripeW, 0, stripeW, 128);
    }
    // Gờ viền ren lượn sóng dưới mép bạt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 124, 128, 4);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  textureCache.set(key, texture);
  return texture;
}

/**
 * Sinh biển hiệu mã sạp sắc nét dán mặt trước quầy
 */
export function getStallSignTexture(code: string, category: string, isP0 = false): THREE.CanvasTexture {
  const key = `sign_${code}_${isP0}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 144;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isP0 ? '#ef4444' : '#ffffff';
    ctx.fillRect(0, 0, 384, 144);

    ctx.strokeStyle = isP0 ? '#991b1b' : '#076C31';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 376, 136);

    // Mã sạp (Bold lớn nét cao)
    ctx.fillStyle = isP0 ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 76px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, 192, 54);

    // Tên ngành hàng
    ctx.fillStyle = isP0 ? '#fee2e2' : '#076C31';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(category.slice(0, 16), 192, 112);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Sinh Texture mặt bàn quầy in mã sạp sắc nét (Countertop Stencil)
 * Giúp người điều hành nhìn từ trên cao xuống nhận diện được ngay mã sạp
 */
export function getStallCountertopTexture(code: string, zoneColor: string, isP0 = false): THREE.CanvasTexture {
  const key = `countertop_${code}_${isP0}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = isP0 ? '#fee2e2' : '#fef9c3';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = isP0 ? '#ef4444' : '#ca8a04';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 244);

    ctx.fillStyle = isP0 ? '#b91c1c' : '#78350f';
    ctx.font = 'bold 84px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(code, 128, 128);
  }

  const texture = new THREE.CanvasTexture(canvas);
  textureCache.set(key, texture);
  return texture;
}

/**
 * Xác định bảng màu mái bạt theo mã phân khu A, B, C, D, E
 */
function getCanopyColorByZone(stallCode: string, theme: string): string {
  if (theme === 'complaint') return '#ef4444'; // Đỏ khẩn cấp
  if (theme === 'expiring') return '#f59e0b'; // Vàng chú ý
  
  const prefix = stallCode.charAt(0).toUpperCase();
  switch (prefix) {
    case 'A': return '#dc2626'; // Khu A (Thịt cá): Đỏ tươi & Trắng
    case 'B': return '#16a34a'; // Khu B (Rau củ): Xanh lá & Trắng
    case 'C': return '#2563eb'; // Khu C (Gia vị & Khô): Xanh dương & Trắng
    case 'D': return '#9333ea'; // Khu D (Thời trang): Tím & Trắng
    case 'E': return '#ea580c'; // Khu E (Ẩm thực): Cam & Trắng
    default: return '#076C31';  // Xanh Smart Market
  }
}

/**
 * Tạo Quầy Sạp Khối Đa Giác The Sims (Themed Volumetric Stall Mesh)
 */
export function createThemedStallMesh(
  stall: StallEntity,
  isSelected: boolean,
  primaryTheme: string,
  isDimmed = false
): { stallGroup: THREE.Group; hitMesh: THREE.Mesh } {
  const stallGroup = new THREE.Group();
  stallGroup.name = `StallGroup_${stall.code}`;

  let width = 56, depth = 38;
  if (stall.geometry.type === 'rectangle') {
    width = stall.geometry.width;
    depth = stall.geometry.height;
  } else if (stall.geometry.type === 'polygon' && stall.boundingBox) {
    width = stall.boundingBox.width;
    depth = stall.boundingBox.height;
  }

  const isP0 = primaryTheme === 'complaint';
  const canopyColor = isDimmed ? '#94a3b8' : getCanopyColorByZone(stall.code, primaryTheme);

  // 1. Quầy bán hàng gỗ khối hộp (Wooden Counter Booth)
  const counterHeight = 11;
  const counterGeo = new THREE.BoxGeometry(width - 4, counterHeight, depth - 4);
  const counterMat = new THREE.MeshStandardMaterial({
    color: isDimmed ? '#94a3b8' : isP0 ? '#fecaca' : isSelected ? '#dcfce7' : '#d97706', // Gỗ ấm The Sims
    roughness: 0.6,
    transparent: isDimmed,
    opacity: isDimmed ? 0.28 : 1.0,
  });
  const counterMesh = new THREE.Mesh(counterGeo, counterMat);
  counterMesh.position.y = counterHeight / 2;
  counterMesh.castShadow = !isDimmed;
  counterMesh.receiveShadow = !isDimmed;
  stallGroup.add(counterMesh);

  // Mặt bàn quầy đá/gỗ in mã sạp sắc nét (Countertop Surface with Code Stencil)
  const topTex = getStallCountertopTexture(stall.code, canopyColor, isP0);
  const topGeo = new THREE.BoxGeometry(width - 2, 1.5, depth - 2);
  const topMat = new THREE.MeshStandardMaterial({
    map: topTex,
    color: isDimmed ? '#cbd5e1' : '#ffffff',
    roughness: 0.25,
    transparent: isDimmed,
    opacity: isDimmed ? 0.28 : 1.0,
  });
  const topMesh = new THREE.Mesh(topGeo, topMat);
  topMesh.position.y = counterHeight + 0.75;
  topMesh.castShadow = !isDimmed;
  stallGroup.add(topMesh);

  // Biển hiệu sạp phía trước (Front Signboard)
  const signTex = getStallSignTexture(stall.code, stall.metadata?.category || '', isP0);
  const signGeo = new THREE.PlaneGeometry(width * 0.82, 11);
  const signMat = new THREE.MeshBasicMaterial({ 
    map: signTex,
    transparent: isDimmed,
    opacity: isDimmed ? 0.25 : 1.0,
  });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, counterHeight * 0.52, depth / 2 - 1.8);
  stallGroup.add(signMesh);

  // Biển hiệu sạp phía sau (Back Signboard) - đảm bảo xoay góc 360 độ vẫn đọc được
  const backSignMesh = signMesh.clone();
  backSignMesh.position.z = -depth / 2 + 1.8;
  backSignMesh.rotation.y = Math.PI;
  stallGroup.add(backSignMesh);

  // 2. Cột đỡ 4 góc (Pillars)
  const yBack = counterHeight + 16;
  const yFront = counterHeight + 13.5;
  const px = width / 2 - 4;
  const pz = depth / 2 - 4;

  const pillarMat = new THREE.MeshStandardMaterial({ 
    color: isDimmed ? '#64748b' : '#334155', // Khung thép kỹ thuật
    roughness: 0.5,
    metalness: 0.3,
    transparent: isDimmed,
    opacity: isDimmed ? 0.22 : 1.0,
  });

  // 2 Cột sau (Back Pillars)
  const backPillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 16, 6);
  const p1 = new THREE.Mesh(backPillarGeo, pillarMat);
  p1.position.set(-px, counterHeight + 8, -pz);
  p1.castShadow = !isDimmed;
  stallGroup.add(p1);

  const p2 = p1.clone();
  p2.position.x = px;
  stallGroup.add(p2);

  // 2 Cột trước (Front Pillars)
  const frontPillarGeo = new THREE.CylinderGeometry(0.8, 0.8, 13.5, 6);
  const p3 = new THREE.Mesh(frontPillarGeo, pillarMat);
  p3.position.set(-px, counterHeight + 6.75, pz);
  p3.castShadow = !isDimmed;
  stallGroup.add(p3);

  const p4 = p3.clone();
  p4.position.x = px;
  stallGroup.add(p4);

  // 3. KHUNG VÌ KÈO HỞ THÉP KIẾN TRÚC (OPEN ARCHITECTURAL TRELLIS FRAME)
  // Loại bỏ hoàn toàn mái bạt kín để nhìn xuyên thấu xuống sạp bên dưới!
  const frameGroup = new THREE.Group();
  frameGroup.name = 'OpenTrellisFrame';

  const beamMat = new THREE.MeshStandardMaterial({
    color: isDimmed ? '#94a3b8' : canopyColor,
    roughness: 0.4,
    metalness: 0.2,
    transparent: isDimmed,
    opacity: isDimmed ? 0.28 : 1.0,
  });

  // Dầm ngang sau (Back Horizontal Beam)
  const backBeamGeo = new THREE.BoxGeometry(width - 4, 1.2, 1.2);
  const backBeam = new THREE.Mesh(backBeamGeo, beamMat);
  backBeam.position.set(0, yBack, -pz);
  backBeam.castShadow = !isDimmed;
  frameGroup.add(backBeam);

  // Dầm ngang trước (Front Horizontal Beam)
  const frontBeamGeo = new THREE.BoxGeometry(width - 4, 1.2, 1.2);
  const frontBeam = new THREE.Mesh(frontBeamGeo, beamMat);
  frontBeam.position.set(0, yFront, pz);
  frontBeam.castShadow = !isDimmed;
  frameGroup.add(frontBeam);

  // 2 Dầm nghiêng 2 bên (Side Inclined Beams)
  const slopeAngle = Math.atan2(yBack - yFront, pz * 2);
  const sideBeamLen = Math.hypot(pz * 2, yBack - yFront) + 1;
  const sideBeamGeo = new THREE.BoxGeometry(1.2, 1.2, sideBeamLen);

  const leftSideBeam = new THREE.Mesh(sideBeamGeo, beamMat);
  leftSideBeam.position.set(-px, (yBack + yFront) / 2, 0);
  leftSideBeam.rotation.x = slopeAngle;
  leftSideBeam.castShadow = !isDimmed;
  frameGroup.add(leftSideBeam);

  const rightSideBeam = leftSideBeam.clone();
  rightSideBeam.position.x = px;
  frameGroup.add(rightSideBeam);

  // Các nan giằng vì kèo thoáng (Open Transverse Rafters) - hở 100% nhìn xuyên thấu
  const rafterGeo = new THREE.BoxGeometry(0.8, 0.8, sideBeamLen);
  [-px * 0.4, px * 0.4].forEach((slatX) => {
    const rafterMesh = new THREE.Mesh(rafterGeo, beamMat);
    rafterMesh.position.set(slatX, (yBack + yFront) / 2, 0);
    rafterMesh.rotation.x = slopeAngle;
    rafterMesh.castShadow = !isDimmed;
    frameGroup.add(rafterMesh);
  });

  stallGroup.add(frameGroup);

  // 4. Đạo cụ theo ngành hàng (Themed Props)
  if (!isDimmed) {
    const prefix = stall.code.charAt(0).toUpperCase();
    const propsGroup = createPropsByZone(prefix, width, depth, counterHeight);
    stallGroup.add(propsGroup);
  }

  // Mesh trong suốt bao quanh để bắt tia Raycast chính xác
  const hitGeo = new THREE.BoxGeometry(width + 2, 32, depth + 6);
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  hitMesh.name = 'StallHitMesh';
  hitMesh.position.y = 16;
  stallGroup.add(hitMesh);

  return { stallGroup, hitMesh };
}

/**
 * Sinh đạo cụ 3D đặc thù theo ngành hàng
 */
function createPropsByZone(zonePrefix: string, width: number, depth: number, counterY: number): THREE.Group {
  const g = new THREE.Group();
  g.position.y = counterY + 1.5;

  if (zonePrefix === 'B') {
    // KHU B (Rau củ): Sọt hoa quả, bí ngô, cà chua
    const crateMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.8 });
    const crate = new THREE.Mesh(new THREE.BoxGeometry(width * 0.4, 4, depth * 0.45), crateMat);
    crate.position.set(-width * 0.15, 2, 0);
    g.add(crate);

    // Bí ngô cam & Bắp cải xanh
    const vegMatOrange = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.4 });
    const vegMatGreen = new THREE.MeshStandardMaterial({ color: '#22c55e', roughness: 0.4 });
    
    for (let i = 0; i < 3; i++) {
      const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(2.4, 6, 6), vegMatOrange);
      pumpkin.position.set(-width * 0.22 + i * 4.5, 4.5, -2);
      g.add(pumpkin);
    }
    for (let i = 0; i < 3; i++) {
      const cabbage = new THREE.Mesh(new THREE.SphereGeometry(2.2, 6, 6), vegMatGreen);
      cabbage.position.set(-width * 0.22 + i * 4.5, 4.5, 3);
      g.add(cabbage);
    }
  } else if (zonePrefix === 'A') {
    // KHU A (Thịt cá): Bàn inox, khay đá đông lạnh
    const trayMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.2 });
    const iceMat = new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.1 });
    const tray = new THREE.Mesh(new THREE.BoxGeometry(width * 0.5, 3, depth * 0.5), trayMat);
    tray.position.set(-width * 0.1, 1.5, 0);
    g.add(tray);

    const ice = new THREE.Mesh(new THREE.BoxGeometry(width * 0.46, 1.5, depth * 0.46), iceMat);
    ice.position.set(-width * 0.1, 3.5, 0);
    g.add(ice);
  } else if (zonePrefix === 'D') {
    // KHU D (Thời trang): Sào treo quần áo với áo màu sắc
    const barMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.7, roughness: 0.3 });
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, width * 0.5, 6), barMat);
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 8, 0);
    g.add(bar);

    const colors = ['#f43f5e', '#3b82f6', '#eab308'];
    for (let i = 0; i < 3; i++) {
      const clothMat = new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.7 });
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 6), clothMat);
      cloth.position.set(-width * 0.16 + i * 7, 5, 0);
      g.add(cloth);
    }
  } else if (zonePrefix === 'E') {
    // KHU E (Ẩm thực): Bàn ăn mini 2 ghế tròn
    const tableMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.5 });
    const table = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 5, 8), tableMat);
    table.position.set(-width * 0.12, 2.5, 0);
    g.add(table);

    const stoolMat = new THREE.MeshStandardMaterial({ color: '#ea580c', roughness: 0.6 });
    const s1 = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 3.5, 6), stoolMat);
    s1.position.set(-width * 0.12 - 7, 1.75, 0);
    g.add(s1);
    const s2 = s1.clone();
    s2.position.x = -width * 0.12 + 7;
    g.add(s2);
  }

  return g;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * VIÊN NGỌC KIM CƯƠNG THE SIMS PLUMBOB (WP-03)
 * Ngọc bát diện đôi phát quang xoay lơ lửng trên nóc sạp đang chọn.
 * ════════════════════════════════════════════════════════════════════════════
 */
export function createPlumbobMesh(colorHex: string, isP0 = false): THREE.Group {
  const plumbobGroup = new THREE.Group();
  plumbobGroup.name = 'SimsPlumbobIndicator';

  // Viên kim cương đôi bát diện (Elongated Octahedron)
  const diamondGeo = new THREE.OctahedronGeometry(6.5, 0);
  diamondGeo.scale(1, 1.8, 1); // Kéo dài theo trục Y chuẩn biểu tượng The Sims

  const diamondMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: isP0 ? 0.9 : 0.65,
    roughness: 0.15,
    metalness: 0.25,
    transparent: true,
    opacity: 0.95,
  });

  const diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
  diamondMesh.name = 'PlumbobDiamond';
  diamondMesh.castShadow = true;
  plumbobGroup.add(diamondMesh);

  // Ánh sáng điểm (PointLight) tỏa ra từ viên ngọc
  const light = new THREE.PointLight(colorHex, isP0 ? 3.5 : 2.0, 120);
  light.position.set(0, 0, 0);
  plumbobGroup.add(light);

  // Vòng sóng xung kích nếu là sạp P0 khẩn cấp
  if (isP0) {
    const ringGeo = new THREE.RingGeometry(8, 11, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.name = 'PlumbobDangerRing';
    plumbobGroup.add(ringMesh);
  }

  return plumbobGroup;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * CHỈ BÁO NGHIỆP VỤ 3D THEO CA TRỰC (3D DUTY OPERATIONAL BEACONS)
 * Sinh ngọc / đèn hiệu 3D chuyên ngành xoay tròn trên các sạp có sự cố
 * ════════════════════════════════════════════════════════════════════════════
 */
export function createDutyBeaconMesh(dutyType: 'sanitation' | 'security_fire' | 'finance'): THREE.Group {
  const beaconGroup = new THREE.Group();
  beaconGroup.name = `DutyBeacon_${dutyType}`;

  if (dutyType === 'sanitation') {
    // Giọt nước / Cột nước ngọc xanh bích
    const dropGeo = new THREE.ConeGeometry(3.5, 9, 16);
    dropGeo.rotateX(Math.PI);
    const dropMat = new THREE.MeshStandardMaterial({
      color: '#0284c7',
      emissive: '#0369a1',
      emissiveIntensity: 0.6,
      roughness: 0.1,
      metalness: 0.4,
      transparent: true,
      opacity: 0.9,
    });
    const dropMesh = new THREE.Mesh(dropGeo, dropMat);
    dropMesh.name = 'WaterDropMesh';
    beaconGroup.add(dropMesh);

    // Vòng nước tỏa chân
    const rippleGeo = new THREE.RingGeometry(5, 7.5, 20);
    rippleGeo.rotateX(-Math.PI / 2);
    const rippleMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    rippleMesh.position.y = -4.5;
    beaconGroup.add(rippleMesh);

    const light = new THREE.PointLight('#38bdf8', 2.0, 80);
    light.position.y = 2;
    beaconGroup.add(light);
  } else if (dutyType === 'security_fire') {
    // Đèn hiệu xoay báo động PCCC / An ninh
    const sirenGeo = new THREE.CylinderGeometry(3.2, 4.0, 7, 16);
    const sirenMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#b91c1c',
      emissiveIntensity: 0.85,
      roughness: 0.2,
      metalness: 0.3,
    });
    const sirenMesh = new THREE.Mesh(sirenGeo, sirenMat);
    beaconGroup.add(sirenMesh);

    // Vành đai cảnh báo
    const alertRingGeo = new THREE.RingGeometry(6, 8.5, 24);
    alertRingGeo.rotateX(-Math.PI / 2);
    const alertRingMat = new THREE.MeshBasicMaterial({
      color: '#ef4444',
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const alertRingMesh = new THREE.Mesh(alertRingGeo, alertRingMat);
    alertRingMesh.name = 'DangerPulseRing';
    alertRingMesh.position.y = -3.5;
    beaconGroup.add(alertRingMesh);

    const light = new THREE.PointLight('#ef4444', 3.0, 100);
    light.position.y = 2;
    beaconGroup.add(light);
  } else if (dutyType === 'finance') {
    // Thẻ / Huy hiệu tiền tệ vàng hổ phách
    const tokenGeo = new THREE.CylinderGeometry(4.5, 4.5, 1.6, 24);
    tokenGeo.rotateX(Math.PI / 2);
    const tokenMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.75,
    });
    const tokenMesh = new THREE.Mesh(tokenGeo, tokenMat);
    tokenMesh.name = 'FinanceTokenMesh';
    beaconGroup.add(tokenMesh);

    const light = new THREE.PointLight('#f59e0b', 2.2, 80);
    beaconGroup.add(light);
  }

  return beaconGroup;
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * HỆ THỐNG THẺ CẢNH BÁO NỔI 3D HƯỚNG CAMERA (3D FLOATING INCIDENT BILLBOARDS)
 * Hiển thị thẻ cảnh báo 3D lơ lửng trên nóc các sạp có sự cố (P0, P1, Tài chính, Bảo trì)
 * ════════════════════════════════════════════════════════════════════════════
 */
export interface StallAlertInfo {
  stallCode: string;
  priority: 'urgent' | 'attention' | 'finance' | 'maintenance';
  badgeTitle: string;
  issueDetail: string;
  themeColor: string;
}

/**
 * Rút trích thông tin cảnh báo/sự cố của sạp
 */
export function extractStallAlertInfo(stall: StallEntity): StallAlertInfo | null {
  const state = (stall.state || {}) as any;
  const issues: any[] = state.issues || [];
  const complaintsCount = state.complaintsCount || 0;
  const feeStatus = state.feeStatus;
  const contractDaysLeft = (stall as any).daysLeftContract ?? state.contractDaysLeft;

  // 1. P0 Khẩn cấp
  const p0Issue = issues.find((i: any) => i.priority === 'P0' || i.severity === 'critical');
  if (p0Issue || complaintsCount > 0 || stall.code === 'A12' || stall.code === 'E08' || stall.code === 'B14') {
    let detail = p0Issue?.title || 'Sự cố khẩn cấp cần xử lý';
    if (stall.code === 'E08') detail = 'Rò rỉ bình gas quán lẩu';
    if (stall.code === 'A12') detail = 'Nước xả cá tràn đại lộ';
    if (stall.code === 'B14') detail = 'Lấn chiếm lối thoát hiểm';
    return {
      stallCode: stall.code,
      priority: 'urgent',
      badgeTitle: 'P0 • KHẨN CẤP',
      issueDetail: detail,
      themeColor: '#ef4444',
    };
  }

  // 2. P1 Chú ý (Cân điêu, Vệ sinh thực phẩm)
  const p1Issue = issues.find((i: any) => i.priority === 'P1');
  if (p1Issue || state.specificType === 'weight_fraud' || state.specificType === 'food_safety' || stall.code === 'A02') {
    let detail = p1Issue?.title || 'Gian lận cân đối chứng';
    if (stall.code === 'A02') detail = 'Gian lận cân điêu (trạm cân)';
    return {
      stallCode: stall.code,
      priority: 'attention',
      badgeTitle: 'P1 • CHÚ Ý',
      issueDetail: detail,
      themeColor: '#f97316',
    };
  }

  // 3. Nợ phí / Sắp hết hạn HĐ
  if (feeStatus === 'overdue' || (contractDaysLeft !== undefined && contractDaysLeft > 0 && contractDaysLeft <= 30) || stall.code === 'B03' || stall.code === 'C08') {
    const isOverdue = feeStatus === 'overdue';
    const detail = isOverdue ? 'Quá hạn nộp phí dịch vụ' : `Sắp hết hạn HĐ (còn ${contractDaysLeft || 12} ngày)`;
    return {
      stallCode: stall.code,
      priority: 'finance',
      badgeTitle: isOverdue ? 'TÀI CHÍNH • NỢ PHÍ' : 'HỢP ĐỒNG • GIA HẠN',
      issueDetail: detail,
      themeColor: '#f59e0b',
    };
  }

  // 4. Bảo trì
  if (state.isUnderMaintenance) {
    return {
      stallCode: stall.code,
      priority: 'maintenance',
      badgeTitle: 'BẢO TRÌ • SỬA CHỮA',
      issueDetail: 'Sạp đang tạm dừng bảo trì',
      themeColor: '#ca8a04',
    };
  }

  return null;
}

/**
 * Dựng thẻ cảnh báo nổi 3D đa giác với Canvas Texture độ nét cao
 */
export function createFloatingAlertBillboard(alert: StallAlertInfo): THREE.Group {
  const group = new THREE.Group();
  group.name = `FloatingAlert_${alert.stallCode}`;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, 512, 180);

    // Đổ bóng thẻ
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;

    // Nền thẻ đen huyền sang trọng
    ctx.fillStyle = '#090d16';
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 126, 18);
    ctx.fill();

    ctx.shadowColor = 'transparent';

    // Viền trên màu trạng thái
    ctx.fillStyle = alert.themeColor;
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 8, [18, 18, 0, 0]);
    ctx.fill();

    // Viền ngoài thẻ
    ctx.strokeStyle = alert.themeColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, 484, 126, 18);
    ctx.stroke();

    // Mũi nhọn tam giác trỏ xuống chân sạp
    ctx.fillStyle = alert.themeColor;
    ctx.beginPath();
    ctx.moveTo(256 - 16, 140);
    ctx.lineTo(256 + 16, 140);
    ctx.lineTo(256, 164);
    ctx.closePath();
    ctx.fill();

    // Chấm đèn hiệu phát sáng
    ctx.fillStyle = alert.themeColor;
    ctx.beginPath();
    ctx.arc(44, 52, 9, 0, Math.PI * 2);
    ctx.fill();

    // Dòng 1: Tiêu đề cảnh báo & Mã sạp
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 30px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${alert.badgeTitle} • ${alert.stallCode}`, 66, 52);

    // Dòng 2: Nội dung sự cố
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const detail = alert.issueDetail.length > 25
      ? alert.issueDetail.slice(0, 24) + '…'
      : alert.issueDetail;
    ctx.fillText(detail, 36, 98);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Thẻ Plane Mesh với kích thước lớn và rõ nét
  const planeGeo = new THREE.PlaneGeometry(54, 19);
  const planeMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    side: THREE.DoubleSide,
    depthTest: false,
  });
  const planeMesh = new THREE.Mesh(planeGeo, planeMat);
  planeMesh.name = 'AlertBillboardPlane';
  planeMesh.renderOrder = 999;
  group.add(planeMesh);

  // Cọc laser định vị nối xuống nóc sạp
  const pinGeo = new THREE.CylinderGeometry(0.5, 0.5, 22, 8);
  const pinMat = new THREE.MeshBasicMaterial({
    color: alert.themeColor,
    transparent: true,
    opacity: 0.85,
  });
  const pinMesh = new THREE.Mesh(pinGeo, pinMat);
  pinMesh.position.y = -14;
  group.add(pinMesh);

  // Hạt ngọc phát quang ở chân cọc
  const anchorGeo = new THREE.SphereGeometry(1.6, 8, 8);
  const anchorMat = new THREE.MeshBasicMaterial({ color: alert.themeColor });
  const anchorMesh = new THREE.Mesh(anchorGeo, anchorMat);
  anchorMesh.position.y = -24;
  group.add(anchorMesh);

  // Ánh sáng cảnh báo rọi xuống sạp
  const light = new THREE.PointLight(alert.themeColor, 3.5, 100);
  light.position.set(0, -6, 0);
  group.add(light);

  return group;
}
