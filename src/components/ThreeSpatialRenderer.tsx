'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RotateCw, RotateCcw, ZoomIn, ZoomOut, Home, Eye, Sparkles, Target } from 'lucide-react';
import type { StallEntity } from '../spatial/model/types';
import { deriveStallVisual } from '../spatial/presentation/stallVisualAdapter';
import { createSimsGroundAndYard, createCutawayWalls, type SceneDimensions } from '../spatial/three/simsSceneBuilder';
import { 
  createThemedStallMesh, 
  createPlumbobMesh, 
  createDutyBeaconMesh,
  createFloatingAlertBillboard,
  extractStallAlertInfo,
} from '../spatial/three/simsPropsBuilder';
import { isStallMatchingDuty, type DutyView } from '../types/stallVisual';

export interface ThreeSpatialRendererProps {
  stalls: StallEntity[];
  selectedStall: StallEntity | null;
  onSelectStall: (stall: StallEntity) => void;
  zoomLevel?: number;
  className?: string;
  dutyView?: DutyView;
  highlightedEntityIds?: Set<string> | string[] | null;
}

export default function ThreeSpatialRenderer({
  stalls,
  selectedStall,
  onSelectStall,
  zoomLevel = 1.0,
  className = 'w-full h-full min-h-[680px]',
  dutyView = 'all',
  highlightedEntityIds = null,
}: ThreeSpatialRendererProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const stallsGroupRef = useRef<THREE.Group | null>(null);
  const plumbobGroupRef = useRef<THREE.Group | null>(null);
  const dutyBeaconsGroupRef = useRef<THREE.Group | null>(null);
  const floatingAlertsGroupRef = useRef<THREE.Group | null>(null);
  const stallMeshMap = useRef<Map<THREE.Object3D, StallEntity>>(new Map());

  // Camera Orbit Angle State (The Sims 4 góc nhìn 90 độ)
  const [cameraAngleIndex, setCameraAngleIndex] = useState<number>(0);
  const [viewPreset, setViewPreset] = useState<'comfort' | 'overview' | 'focus'>('comfort');
  const cameraAngleRef = useRef<number>(Math.PI / 4);
  const targetAngleRef = useRef<number>(Math.PI / 4);
  const basePlumbobYRef = useRef<number>(38);

  // Tham số góc nhìn linh hoạt (Comfort: thấp vừa tầm mắt 28°, Overview: cao 40°, Focus: soi sạp)
  const cameraHeightRef = useRef<number>(330);
  const targetHeightRef = useRef<number>(330);
  const cameraRadiusRef = useRef<number>(640);
  const targetRadiusRef = useRef<number>(640);
  const frustumSizeRef = useRef<number>(440);

  // Tâm nhìn của Camera (Hỗ trợ Pan di chuyển mượt mà)
  const cameraCenterRef = useRef<{ x: number; y: number; z: number }>({ x: 500, y: 15, z: 340 });
  const targetCenterRef = useRef<{ x: number; y: number; z: number }>({ x: 500, y: 15, z: 340 });

  // Tính toán vùng bao không gian thực tế của chợ
  const sceneDimensions: SceneDimensions = React.useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    stalls.forEach((s) => {
      let x = 0, y = 0, w = 60, h = 40;
      if (s.geometry.type === 'rectangle') {
        x = s.geometry.x;
        y = s.geometry.y;
        w = s.geometry.width;
        h = s.geometry.height;
      } else if (s.geometry.type === 'polygon' && s.boundingBox) {
        x = s.boundingBox.minX;
        y = s.boundingBox.minY;
        w = s.boundingBox.width;
        h = s.boundingBox.height;
      }
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + w);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + h);
    });

    if (minX === Infinity) {
      return { width: 1000, depth: 680, centerX: 500, centerZ: 340 };
    }

    const width = Math.max(maxX - minX + 80, 960);
    const depth = Math.max(maxY - minY + 80, 640);
    const cx = (minX + maxX) / 2;
    const cz = (minY + maxY) / 2;

    cameraCenterRef.current = { x: cx, y: 15, z: cz };
    targetCenterRef.current = { x: cx, y: 15, z: cz };

    return {
      width,
      depth,
      centerX: cx,
      centerZ: cz,
    };
  }, [stalls]);

  // Cập nhật ma trận trực giao khi thay đổi Frustum
  const updateCameraProjection = useCallback(() => {
    const camera = cameraRef.current;
    const container = mountRef.current;
    if (!camera || !container) return;
    const width = container.clientWidth || 1024;
    const height = container.clientHeight || 700;
    const aspect = width / height;
    const f = frustumSizeRef.current;
    camera.left = (f * aspect) / -2;
    camera.right = (f * aspect) / 2;
    camera.top = f / 2;
    camera.bottom = f / -2;
    camera.updateProjectionMatrix();
  }, []);

  // 1. KHỞI TẠO SCENE, CAMERA TRỰC GIAO THE SIMS VÀ RENDERER
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 1024;
    const height = container.clientHeight || 700;
    const { centerX, centerZ } = sceneDimensions;

    // A. Three.js Scene Setup — Bầu trời trong xanh dịu mát The Sims
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e0f2fe'); // Sims clear sky blue
    scene.fog = new THREE.FogExp2('#e0f2fe', 0.00035);
    sceneRef.current = scene;

    // B. Orthographic Camera Isometric The Sims (Góc nghiêng vừa tầm mắt ~28°)
    const aspect = width / height;
    const frustumSize = frustumSizeRef.current;
    const camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      1,
      6000
    );

    const radius = targetRadiusRef.current;
    const heightY = targetHeightRef.current;
    const initAngle = targetAngleRef.current;
    camera.position.set(centerX + radius * Math.cos(initAngle), heightY, centerZ + radius * Math.sin(initAngle));
    camera.lookAt(centerX, 15, centerZ);
    cameraRef.current = camera;

    // C. WebGL Renderer với đổ bóng mềm PCFShadowMap
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // D. Ánh sáng ấm áp ban ngày The Sims
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.88);
    scene.add(ambientLight);

    // Nguồn sáng mặt trời xiên đổ bóng
    const sunLight = new THREE.DirectionalLight('#fffbeb', 1.25);
    sunLight.position.set(centerX + 650, 1100, centerZ + 550);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 100;
    sunLight.shadow.camera.far = 3000;
    const d = 900;
    sunLight.shadow.camera.left = -d;
    sunLight.shadow.camera.right = d;
    sunLight.shadow.camera.top = d;
    sunLight.shadow.camera.bottom = -d;
    sunLight.shadow.bias = -0.0002;
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight('#bae6fd', 0.5);
    fillLight.position.set(centerX - 600, 500, centerZ - 600);
    scene.add(fillLight);

    // E. Dựng Cảnh Quan Ngoại Cảnh, Hàng Rào Trắng & Tường Cắt The Sims
    createSimsGroundAndYard(scene, sceneDimensions);
    createCutawayWalls(scene, sceneDimensions);

    // F. Group chứa toàn bộ quầy sạp
    const stallsGroup = new THREE.Group();
    stallsGroup.name = 'SimsStallsGroup';
    scene.add(stallsGroup);
    stallsGroupRef.current = stallsGroup;

    // G. Xử lý tương tác Chuột: Click chọn sạp, Xoay 360°, Pan di chuyển, và Cuộn thu phóng
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isOrbitDragging = false;
    let isPanDragging = false;
    let prevMouse = { x: 0, y: 0 };
    let totalDragDistance = 0;

    const handleMouseDown = (e: MouseEvent) => {
      prevMouse = { x: e.clientX, y: e.clientY };
      totalDragDistance = 0;

      if (e.button === 0 && !e.shiftKey) {
        // Chuột trái: Xoay góc nhìn 360 độ
        isOrbitDragging = true;
      } else if (e.button === 2 || e.button === 1 || (e.button === 0 && e.shiftKey)) {
        // Chuột phải hoặc Shift+Chuột trái: Pan di chuyển tâm nhìn quanh chợ
        isPanDragging = true;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;
      totalDragDistance += Math.abs(deltaX) + Math.abs(deltaY);
      prevMouse = { x: e.clientX, y: e.clientY };

      if (isOrbitDragging) {
        targetAngleRef.current += deltaX * 0.005;
      } else if (isPanDragging) {
        const curAng = cameraAngleRef.current;
        const panSpeed = frustumSizeRef.current * 0.0018;
        const rightX = -Math.sin(curAng);
        const rightZ = Math.cos(curAng);
        const forwardX = -Math.cos(curAng);
        const forwardZ = -Math.sin(curAng);

        targetCenterRef.current.x -= (rightX * deltaX + forwardX * deltaY) * panSpeed;
        targetCenterRef.current.z -= (rightZ * deltaX + forwardZ * deltaY) * panSpeed;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      // Nếu thao tác là click chuẩn (khoảng di chuột < 6px), kích hoạt chọn sạp
      if (totalDragDistance < 6 && e.button === 0 && !e.shiftKey) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(stallsGroup.children, true);

        if (intersects.length > 0) {
          for (const hit of intersects) {
            let cur: THREE.Object3D | null = hit.object;
            while (cur && cur !== stallsGroup) {
              const target = stallMeshMap.current.get(cur);
              if (target) {
                const enrichedStall = {
                  ...target,
                  _clientPos: { x: e.clientX, y: e.clientY }
                };
                onSelectStall(enrichedStall as any);
                return;
              }
              cur = cur.parent;
            }
          }
        }
      }

      isOrbitDragging = false;
      isPanDragging = false;
    };

    // Ngăn chặn context menu trình duyệt khi kéo chuột phải
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Cuộn con lăn chuột để Thu/Phóng (Mouse Wheel Zoom) siêu mượt
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 0.88 : 1.14;
      const newFrustum = Math.max(160, Math.min(880, frustumSizeRef.current * zoomFactor));
      frustumSizeRef.current = newFrustum;

      const containerEl = mountRef.current;
      if (containerEl) {
        const w = containerEl.clientWidth || 1024;
        const h = containerEl.clientHeight || 700;
        const asp = w / h;
        camera.left = (newFrustum * asp) / -2;
        camera.right = (newFrustum * asp) / 2;
        camera.top = newFrustum / 2;
        camera.bottom = newFrustum / -2;
        camera.updateProjectionMatrix();
      }
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('contextmenu', handleContextMenu);
    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // H. Animation Loop: Mượt mà 60 FPS, chuyển động nội suy Camera & Plumbob
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Nội suy góc xoay Camera
      cameraAngleRef.current += (targetAngleRef.current - cameraAngleRef.current) * 0.09;
      // Nội suy độ cao & bán kính Camera (chuyển đổi mượt giữa các góc nhìn)
      cameraHeightRef.current += (targetHeightRef.current - cameraHeightRef.current) * 0.09;
      cameraRadiusRef.current += (targetRadiusRef.current - cameraRadiusRef.current) * 0.09;
      // Nội suy tâm nhìn Camera
      cameraCenterRef.current.x += (targetCenterRef.current.x - cameraCenterRef.current.x) * 0.09;
      cameraCenterRef.current.z += (targetCenterRef.current.z - cameraCenterRef.current.z) * 0.09;

      const curAngle = cameraAngleRef.current;
      const curRadius = cameraRadiusRef.current;
      const curHeight = cameraHeightRef.current;
      const curCenter = cameraCenterRef.current;

      camera.position.x = curCenter.x + curRadius * Math.cos(curAngle);
      camera.position.y = curCenter.y + curHeight;
      camera.position.z = curCenter.z + curRadius * Math.sin(curAngle);
      camera.lookAt(curCenter.x, curCenter.y, curCenter.z);

      // Hiệu ứng Plumbob xoay vòng và bập bồng sóng sin
      if (plumbobGroupRef.current) {
        const diamond = plumbobGroupRef.current.getObjectByName('PlumbobDiamond');
        if (diamond) {
          diamond.rotation.y += 0.04;
        }
        const dangerRing = plumbobGroupRef.current.getObjectByName('PlumbobDangerRing');
        if (dangerRing) {
          dangerRing.rotation.z += 0.05;
        }
        const bob = Math.sin(Date.now() * 0.004) * 3.5;
        plumbobGroupRef.current.position.y = basePlumbobYRef.current + bob;
      }

      // Hiệu ứng các đèn hiệu ca trực xoay vòng và bập bồng nhẹ
      if (dutyBeaconsGroupRef.current) {
        const time = Date.now() * 0.004;
        dutyBeaconsGroupRef.current.children.forEach((beacon, i) => {
          beacon.rotation.y += 0.025;
          beacon.position.y = 34 + Math.sin(time + i * 0.5) * 1.5;
        });
      }

      // Hiệu ứng thẻ cảnh báo nổi luôn hướng về camera (Billboard) và nhấp nhô sóng sin
      if (floatingAlertsGroupRef.current) {
        const time = Date.now() * 0.003;
        floatingAlertsGroupRef.current.children.forEach((alertObj, i) => {
          alertObj.quaternion.copy(camera.quaternion);
          const baseY = (alertObj as any)._baseY || 46;
          alertObj.position.y = baseY + Math.sin(time + i * 0.8) * 1.6;
        });
      }

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      const newAspect = newW / newH;
      const f = frustumSizeRef.current;
      camera.left = (f * newAspect) / -2;
      camera.right = (f * newAspect) / 2;
      camera.top = f / 2;
      camera.bottom = f / -2;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, [sceneDimensions, onSelectStall]);

  // Đồng bộ phóng to/thu nhỏ khi zoomLevel từ Toolbar cha thay đổi
  useEffect(() => {
    if (zoomLevel) {
      const baseF = viewPreset === 'overview' ? 720 : viewPreset === 'focus' ? 240 : 440;
      frustumSizeRef.current = Math.max(160, Math.min(880, baseF / zoomLevel));
      updateCameraProjection();
    }
  }, [zoomLevel, viewPreset, updateCameraProjection]);

  // 2. DỰNG QUẦY SẠP, THẺ CẢNH BÁO NỔI & VIÊN NGỌC PLUMBOB KHI DỮ LIỆU ĐỔI
  useEffect(() => {
    const stallsGroup = stallsGroupRef.current;
    const scene = sceneRef.current;
    if (!stallsGroup || !scene) return;

    // Dọn dẹp quầy cũ
    while (stallsGroup.children.length > 0) {
      stallsGroup.remove(stallsGroup.children[0]);
    }
    stallMeshMap.current.clear();

    // Dọn dẹp Plumbob cũ
    if (plumbobGroupRef.current) {
      scene.remove(plumbobGroupRef.current);
      plumbobGroupRef.current = null;
    }

    // Dọn dẹp Duty Beacons cũ
    if (dutyBeaconsGroupRef.current) {
      scene.remove(dutyBeaconsGroupRef.current);
      dutyBeaconsGroupRef.current = null;
    }

    // Dọn dẹp Floating Alerts cũ
    if (floatingAlertsGroupRef.current) {
      scene.remove(floatingAlertsGroupRef.current);
      floatingAlertsGroupRef.current = null;
    }

    const dutyBeaconsGroup = new THREE.Group();
    dutyBeaconsGroup.name = 'SimsDutyBeaconsGroup';
    scene.add(dutyBeaconsGroup);
    dutyBeaconsGroupRef.current = dutyBeaconsGroup;

    const floatingAlertsGroup = new THREE.Group();
    floatingAlertsGroup.name = 'SimsFloatingAlertsGroup';
    scene.add(floatingAlertsGroup);
    floatingAlertsGroupRef.current = floatingAlertsGroup;

    let activeStallCenter: { x: number; y: number; z: number } | null = null;
    let activeTheme = 'normal';

    for (const stall of stalls) {
      const isSelected = selectedStall?.id === stall.id;
      const isHighlighted = highlightedEntityIds
        ? (highlightedEntityIds instanceof Set ? highlightedEntityIds.has(stall.id) : highlightedEntityIds.includes(stall.id))
        : true;
      const isDutyMatch = dutyView && dutyView !== 'all' ? isStallMatchingDuty(stall, dutyView) : true;
      const isDimmed = !isHighlighted || (dutyView && dutyView !== 'all' && !isDutyMatch);

      const descriptor = deriveStallVisual(stall, { selected: isSelected, dutyView });

      let x = 0, y = 0, width = 56, depth = 38;
      if (stall.geometry.type === 'rectangle') {
        x = stall.geometry.x;
        y = stall.geometry.y;
        width = stall.geometry.width;
        depth = stall.geometry.height;
      } else if (stall.geometry.type === 'polygon' && stall.boundingBox) {
        x = stall.boundingBox.minX;
        y = stall.boundingBox.minY;
        width = stall.boundingBox.width;
        depth = stall.boundingBox.height;
      }

      const stallCenterX = x + width / 2;
      const stallCenterZ = y + depth / 2;

      // Sinh quầy sạp đa giác The Sims với khung hở (Open Trellis Frame)
      const { stallGroup, hitMesh } = createThemedStallMesh(stall, isSelected, descriptor.primaryTheme, isDimmed);
      stallGroup.position.set(stallCenterX, 0, stallCenterZ);
      stallsGroup.add(stallGroup);

      // Nếu đang trong chế độ ca trực và sạp khớp ca: cắm đèn hiệu nghiệp vụ 3D xoay tròn
      if (dutyView && dutyView !== 'all' && isDutyMatch && !isSelected) {
        const beacon = createDutyBeaconMesh(dutyView);
        beacon.position.set(stallCenterX, 34, stallCenterZ);
        dutyBeaconsGroup.add(beacon);
      }

      // THẺ CẢNH BÁO NỔI 3D (3D FLOATING INCIDENT BILLBOARD)
      // Xuất hiện lơ lửng phía trên sạp gặp sự cố
      const alertInfo = extractStallAlertInfo(stall);
      if (alertInfo && (!isDimmed || isDutyMatch)) {
        const alertBillboard = createFloatingAlertBillboard(alertInfo);
        const alertBaseY = 46;
        alertBillboard.position.set(stallCenterX, alertBaseY, stallCenterZ);
        (alertBillboard as any)._baseY = alertBaseY;
        floatingAlertsGroup.add(alertBillboard);
      }

      // Đăng ký hit mesh để bắt Raycast click
      stallMeshMap.current.set(hitMesh, stall);
      stallMeshMap.current.set(stallGroup, stall);

      // Vòng sáng sàn The Sims dưới chân quầy đang chọn
      if (isSelected) {
        activeStallCenter = { x: stallCenterX, y: 36, z: stallCenterZ };
        activeTheme = descriptor.primaryTheme;

        const groundRing = new THREE.Mesh(
          new THREE.RingGeometry(Math.min(width, depth) * 0.45, Math.max(width, depth) * 0.65, 32),
          new THREE.MeshBasicMaterial({
            color: activeTheme === 'complaint' ? '#ef4444' : '#10b981',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
          })
        );
        groundRing.rotation.x = -Math.PI / 2;
        groundRing.position.set(stallCenterX, 0.5, stallCenterZ);
        stallsGroup.add(groundRing);
      }
    }

    // 3. TẠO VIÊN NGỌC THE SIMS PLUMBOB LƠ LỬNG TRÊN SẠP ACTIVE
    if (activeStallCenter) {
      const center = activeStallCenter as { x: number; y: number; z: number };
      const isP0 = activeTheme === 'complaint';
      const plumbobColor = isP0 ? '#ef4444' : activeTheme === 'expiring' ? '#f59e0b' : '#10b981';
      const plumbob = createPlumbobMesh(plumbobColor, isP0);
      plumbob.position.set(center.x, center.y, center.z);
      basePlumbobYRef.current = center.y;
      scene.add(plumbob);
      plumbobGroupRef.current = plumbob;
    }

    return () => {
      if (dutyBeaconsGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(dutyBeaconsGroupRef.current);
        dutyBeaconsGroupRef.current = null;
      }
      if (floatingAlertsGroupRef.current && sceneRef.current) {
        sceneRef.current.remove(floatingAlertsGroupRef.current);
        floatingAlertsGroupRef.current = null;
      }
    };
  }, [stalls, selectedStall, dutyView, highlightedEntityIds]);

  // 1. Chế độ Vừa tầm mắt (Comfort 28°): hạ độ cao, nhìn trực diện mặt sạp, đọc rõ thông tin
  const setComfortView = useCallback(() => {
    setViewPreset('comfort');
    targetHeightRef.current = 320;
    targetRadiusRef.current = 620;
    frustumSizeRef.current = 420;
    targetCenterRef.current = { x: sceneDimensions.centerX, y: 15, z: sceneDimensions.centerZ };
    updateCameraProjection();
  }, [sceneDimensions, updateCameraProjection]);

  // 2. Chế độ Toàn cảnh (Overview 40°): nhìn bao quát 86 sạp
  const setOverviewView = useCallback(() => {
    setViewPreset('overview');
    targetHeightRef.current = 620;
    targetRadiusRef.current = 880;
    frustumSizeRef.current = 720;
    targetCenterRef.current = { x: sceneDimensions.centerX, y: 15, z: sceneDimensions.centerZ };
    updateCameraProjection();
  }, [sceneDimensions, updateCameraProjection]);

  // 3. Chế độ Soi cận cảnh sạp (Focus)
  const focusOnStall = useCallback((stall: StallEntity) => {
    setViewPreset('focus');
    let sx = 0, sy = 0, sw = 60, sh = 40;
    if (stall.geometry.type === 'rectangle') {
      sx = stall.geometry.x;
      sy = stall.geometry.y;
      sw = stall.geometry.width;
      sh = stall.geometry.height;
    } else if (stall.geometry.type === 'polygon' && stall.boundingBox) {
      sx = stall.boundingBox.minX;
      sy = stall.boundingBox.minY;
      sw = stall.boundingBox.width;
      sh = stall.boundingBox.height;
    }
    targetCenterRef.current = { x: sx + sw / 2, y: 15, z: sy + sh / 2 };
    targetHeightRef.current = 190;
    targetRadiusRef.current = 380;
    frustumSizeRef.current = 240;
    updateCameraProjection();
  }, [updateCameraProjection]);

  // Thu phóng 1 chạm từ nút HUD
  const handleZoomIn = useCallback(() => {
    frustumSizeRef.current = Math.max(160, frustumSizeRef.current * 0.82);
    updateCameraProjection();
  }, [updateCameraProjection]);

  const handleZoomOut = useCallback(() => {
    frustumSizeRef.current = Math.min(880, frustumSizeRef.current * 1.2);
    updateCameraProjection();
  }, [updateCameraProjection]);

  // Điều khiển xoay 4 góc 90 độ (The Sims Classic View Switcher)
  const rotateCamera = useCallback((direction: 'cw' | 'ccw') => {
    const delta = direction === 'cw' ? Math.PI / 2 : -Math.PI / 2;
    targetAngleRef.current += delta;
    setCameraAngleIndex((prev) => (prev + (direction === 'cw' ? 1 : 3)) % 4);
  }, []);

  const resetCamera = useCallback(() => {
    targetAngleRef.current = Math.PI / 4; // Góc 45 độ chuẩn
    setCameraAngleIndex(0);
    setComfortView();
  }, [setComfortView]);

  return (
    <div className={`relative w-full bg-slate-900/5 select-none overflow-hidden ${className}`}>
      {/* 3D Canvas Mount Point */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* THE SIMS HUD: CỤM ĐIỀU KHIỂN GÓC NHÌN & TRẠNG THÁI GAME */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-200/90 shadow-lg flex flex-wrap items-center gap-2.5 text-xs font-sans max-w-[calc(100%-24px)]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#076C31]"></span>
          </span>
          <span className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1">
            The Sims 3D
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </span>
        </div>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Nút chọn Preset Góc nhìn (Vừa tầm mắt vs Toàn cảnh) */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={setComfortView}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewPreset === 'comfort'
                ? 'bg-[#076C31] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title="Góc nhìn vừa tầm mắt 28°: đọc chữ & bảng biển siêu rõ"
          >
            <Eye className="w-3.5 h-3.5" />
            Vừa tầm mắt (30°)
          </button>
          <button
            type="button"
            onClick={setOverviewView}
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
              viewPreset === 'overview'
                ? 'bg-[#076C31] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
            title="Góc nhìn bao quát toàn bộ 86 sạp từ trên cao"
          >
            Toàn cảnh (45°)
          </button>
          {selectedStall && (
            <button
              type="button"
              onClick={() => focusOnStall(selectedStall)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                viewPreset === 'focus'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-700 hover:text-amber-900 hover:bg-amber-100'
              }`}
              title={`Lia cận cảnh vào sạp ${selectedStall.code}`}
            >
              <Target className="w-3.5 h-3.5" />
              Soi sạp {selectedStall.code}
            </button>
          )}
        </div>

        {/* Nút Thu/Phóng nhanh */}
        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Phóng to (+)"
            aria-label="Phóng to 3D"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Thu nhỏ (-)"
            aria-label="Thu nhỏ 3D"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Nút xoay 90 độ góc nhìn chuẩn game The Sims */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => rotateCamera('ccw')}
            className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Xoay trái 90°"
            aria-label="Xoay góc nhìn sang trái"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-bold font-mono px-1.5 text-slate-500">
            {cameraAngleIndex * 90}°
          </span>
          <button
            type="button"
            onClick={() => rotateCamera('cw')}
            className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
            title="Xoay phải 90°"
            aria-label="Xoay góc nhìn sang phải"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={resetCamera}
          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-[#076C31] border border-slate-200 transition-colors cursor-pointer"
          title="Đặt lại góc nhìn mặc định"
          aria-label="Đặt lại góc nhìn mặc định"
        >
          <Home className="w-4 h-4" />
        </button>

        <div className="text-[11px] text-slate-500 hidden xl:flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Lăn chuột: Phóng to/Thu nhỏ • Chuột phải: Kéo di chuyển • Chuột trái: Xoay 360°</span>
        </div>
      </div>

      {/* Thông tin sạp đang chọn với viên ngọc Plumbob */}
      {selectedStall && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-emerald-300 shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-extrabold text-xs font-mono shadow-xs">
            {selectedStall.code}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <span>{selectedStall.metadata?.name || selectedStall.code}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-medium">
                {selectedStall.metadata?.category || 'Gian hàng'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Chủ sạp: <strong className="text-slate-700">{selectedStall.metadata?.merchantName || 'Đang cập nhật'}</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => focusOnStall(selectedStall)}
            className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <Target className="w-3 h-3" />
            Lia tới
          </button>
        </div>
      )}
    </div>
  );
}
