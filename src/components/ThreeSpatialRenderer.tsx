'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { StallEntity } from '../spatial/model/types';
import { deriveStallVisual } from '../spatial/presentation/stallVisualAdapter';

interface ThreeSpatialRendererProps {
  stalls: StallEntity[];
  selectedStall: StallEntity | null;
  onSelectStall: (stall: StallEntity) => void;
  zoomLevel?: number;
  className?: string;
}

export default function ThreeSpatialRenderer({
  stalls,
  selectedStall,
  onSelectStall,
  zoomLevel = 1.0,
  className = 'h-[580px]'
}: ThreeSpatialRendererProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const stallsGroupRef = useRef<THREE.Group | null>(null);
  const stallMeshMap = useRef<Map<THREE.Mesh, StallEntity>>(new Map());

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 540;

    // 1. Scene setup — Bright Architectural Studio Theme
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f1f5f9'); // Clean light slate background
    sceneRef.current = scene;

    // 2. Camera setup (Isometric 2.5D angle adjusted for 160 stalls in widescreen)
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    camera.position.set(840, 1300, 1150);
    camera.lookAt(840, 0, 440);
    cameraRef.current = camera;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(1000, 1600, 900);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 0.4);
    fillLight.position.set(-400, 400, -300);
    scene.add(fillLight);

    // 5. Floor Ground & Architectural Grid
    const floorGeo = new THREE.PlaneGeometry(2400, 1600);
    const floorMat = new THREE.MeshStandardMaterial({ 
      color: '#ffffff', 
      roughness: 0.9, 
      metalness: 0.05 
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(840, -1, 440);
    floorMesh.receiveShadow = true;
    scene.add(floorMesh);

    // Light subtle grid lines
    const gridHelper = new THREE.GridHelper(2400, 48, '#076C31', '#e2e8f0');
    gridHelper.position.set(840, -0.5, 440);
    scene.add(gridHelper);

    // 6. Stall Meshes Group
    const stallsGroup = new THREE.Group();
    scene.add(stallsGroup);
    stallsGroupRef.current = stallsGroup;

    // Raycasting for interactive selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(stallsGroup.children, true);

      if (intersects.length > 0) {
        const hit = intersects[0].object as THREE.Mesh;
        const targetStall = stallMeshMap.current.get(hit) || 
          (hit.parent ? stallMeshMap.current.get(hit.parent as any) : undefined);
        if (targetStall) {
          onSelectStall(targetStall);
        }
      }
    };

    renderer.domElement.addEventListener('click', handleClick);

    // Drag Orbit Controls for Camera Rotation
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const handleMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      camera.position.x -= deltaX * 1.6;
      camera.position.z += deltaY * 1.6;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      renderer.dispose();
    };
  }, []);

  // Update stalls in 3D scene when stalls or selectedStall changes
  useEffect(() => {
    const stallsGroup = stallsGroupRef.current;
    if (!stallsGroup) return;

    // Clear previous stall meshes
    while (stallsGroup.children.length > 0) {
      const obj = stallsGroup.children[0];
      stallsGroup.remove(obj);
    }
    stallMeshMap.current.clear();

    // Generate crisp canvas texture for stall top face (Clean Light Aesthetic)
    const createStallTexture = (code: string, name: string, isLight: boolean, bgColor: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 256, 256);

        // Border inside texture
        ctx.strokeStyle = isLight ? '#cbd5e1' : 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 248, 248);

        ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
        ctx.font = 'bold 72px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(code, 128, 95);

        ctx.fillStyle = isLight ? '#475569' : 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(name.slice(0, 13), 128, 175);
      }
      return new THREE.CanvasTexture(canvas);
    };

    stalls.forEach((stall) => {
      const isSelected = selectedStall?.id === stall.id;
      const descriptor = deriveStallVisual(stall, { selected: isSelected });

      // Calculate stall bounding box
      let x = 0, y = 0, width = 60, height = 40;
      if (stall.geometry.type === 'rectangle') {
        x = stall.geometry.x;
        y = stall.geometry.y;
        width = stall.geometry.width;
        height = stall.geometry.height;
      } else if (stall.geometry.type === 'polygon' && stall.boundingBox) {
        x = stall.boundingBox.minX;
        y = stall.boundingBox.minY;
        width = stall.boundingBox.width;
        height = stall.boundingBox.height;
      }

      // Height of 3D stall block
      const blockHeight = descriptor.primaryTheme === 'complaint' ? 38 : isSelected ? 32 : 22;

      // Color mapping for Light Studio Theme
      let blockColor = '#ffffff'; // Normal pure white
      let textureBg = '#f8fafc';
      let isLightText = true;

      if (descriptor.primaryTheme === 'complaint') {
        blockColor = '#f43f5e'; // Rose-500
        textureBg = '#e11d48';
        isLightText = false;
      } else if (descriptor.primaryTheme === 'expiring') {
        blockColor = '#f59e0b'; // Amber-500
        textureBg = '#d97706';
        isLightText = false;
      } else if (descriptor.primaryTheme === 'maintenance') {
        blockColor = '#94a3b8'; // Slate-400
        textureBg = '#64748b';
        isLightText = false;
      } else if (descriptor.primaryTheme === 'empty') {
        blockColor = '#f1f5f9'; // Slate-100
        textureBg = '#e2e8f0';
        isLightText = true;
      }

      // 3D Box Geometry
      const stallGeo = new THREE.BoxGeometry(width, blockHeight, height);
      
      const topTexture = createStallTexture(stall.code, stall.metadata?.name || '', isLightText, textureBg);
      const materials = [
        new THREE.MeshStandardMaterial({ color: blockColor, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: blockColor, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ map: topTexture, roughness: 0.3 }),
        new THREE.MeshStandardMaterial({ color: blockColor }),
        new THREE.MeshStandardMaterial({ color: blockColor, roughness: 0.4 }),
        new THREE.MeshStandardMaterial({ color: blockColor, roughness: 0.4 }),
      ];

      const stallMesh = new THREE.Mesh(stallGeo, materials);
      stallMesh.position.set(x + width / 2, blockHeight / 2, y + height / 2);
      stallMesh.castShadow = true;
      stallMesh.receiveShadow = true;

      // Selected Halo Ring
      if (isSelected) {
        const ringGeo = new THREE.BoxGeometry(width + 8, 4, height + 8);
        const ringMat = new THREE.MeshBasicMaterial({ color: '#076C31' });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.set(x + width / 2, 2, y + height / 2);
        stallsGroup.add(ringMesh);
      }

      stallsGroup.add(stallMesh);
      stallMeshMap.current.set(stallMesh, stall);
    });
  }, [stalls, selectedStall]);

  return (
    <div className={`relative w-full bg-slate-100 rounded-b overflow-hidden select-none border-t border-slate-200 ${className}`}>
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* 3D Viewport Light Frosted Glass HUD */}
      <div className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-lg border border-slate-200/80 text-slate-800 text-xs font-sans flex items-center gap-2.5 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-[#076C31] animate-pulse"></span>
        <span className="font-extrabold text-slate-900">Three.js 2.5D Studio</span>
        <span className="text-slate-400">• Click sạp để mở chi tiết • Giữ chuột xoay góc nhìn</span>
      </div>
    </div>
  );
}
