import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

interface LiquidLogo3DProps {
  className?: string;
  size?: number;
  interactive?: boolean;
}

// Pre-allocated vectors outside render loop to prevent garbage collection
const _targetRot = new THREE.Vector2(0, 0);
const _currentRot = new THREE.Vector2(0, 0);

export const LiquidLogo3D: React.FC<LiquidLogo3DProps> = ({
  className = '',
  size = 180,
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 4.8);

    // Renderer setup following Three.js guidelines
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(size, size);

    // Mandatory Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio 3-point lighting rig
    const keyLight = new THREE.DirectionalLight('#fff8e7', 3.5);
    keyLight.position.set(3, 4, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#d4af37', 2.8);
    rimLight.position.set(-3, -2, -3);
    scene.add(rimLight);

    const hemiLight = new THREE.HemisphereLight('#ffffff', '#0c2e22', 1.0);
    scene.add(hemiLight);

    // Composite 3-12 Part Procedural Model: Luxury Liquid Gold & Glass Medallion Group
    const logoGroup = new THREE.Group();

    // 1. Primary Medallion Base (Brushed Imperial Gold Coin)
    const coinGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.16, 64);
    const goldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#d4af37'),
      metalness: 0.95,
      roughness: 0.18,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      reflectivity: 1.0,
    });
    const coinMesh = new THREE.Mesh(coinGeo, goldMat);
    coinMesh.rotation.x = Math.PI / 2;
    logoGroup.add(coinMesh);

    // 2. Liquid Glass Outer Torus Ring (Fluid Glass Refraction)
    const ringGeo = new THREE.TorusGeometry(1.48, 0.14, 32, 64);
    const liquidGlassMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ffffff'),
      transmission: isSoftwareGl ? 0 : 0.92,
      opacity: isSoftwareGl ? 0.35 : 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 1.4,
      attenuationColor: new THREE.Color('#d4af37'),
      attenuationDistance: 2.0,
      clearcoat: 1.0,
    });
    const ringMesh = new THREE.Mesh(ringGeo, liquidGlassMat);
    logoGroup.add(ringMesh);

    // 3. Debossed Emerald Leather / Velveteen Inlay
    const inlayGeo = new THREE.CylinderGeometry(1.12, 1.12, 0.18, 48);
    const emeraldMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0c2e22'),
      metalness: 0.35,
      roughness: 0.45,
      clearcoat: 0.8,
    });
    const inlayMesh = new THREE.Mesh(inlayGeo, emeraldMat);
    inlayMesh.rotation.x = Math.PI / 2;
    logoGroup.add(inlayMesh);

    // 4. Procedural Monogram "T" (Primary Silhouette Accent)
    const monogramGroup = new THREE.Group();

    // Horizontal crossbar of "T"
    const crossbarGeo = new THREE.BoxGeometry(0.95, 0.22, 0.12);
    const crossbarMesh = new THREE.Mesh(crossbarGeo, goldMat);
    crossbarMesh.position.set(0, 0.36, 0.12);
    monogramGroup.add(crossbarMesh);

    // Vertical stem of "T"
    const stemGeo = new THREE.BoxGeometry(0.24, 0.78, 0.12);
    const stemMesh = new THREE.Mesh(stemGeo, goldMat);
    stemMesh.position.set(0, -0.06, 0.12);
    monogramGroup.add(stemMesh);

    // Left and right serif brackets
    const serifLeftGeo = new THREE.BoxGeometry(0.08, 0.12, 0.12);
    const serifLeft = new THREE.Mesh(serifLeftGeo, goldMat);
    serifLeft.position.set(-0.44, 0.26, 0.12);
    monogramGroup.add(serifLeft);

    const serifRightGeo = new THREE.BoxGeometry(0.08, 0.12, 0.12);
    const serifRight = new THREE.Mesh(serifRightGeo, goldMat);
    serifRight.position.set(0.44, 0.26, 0.12);
    monogramGroup.add(serifRight);

    logoGroup.add(monogramGroup);

    // 5. Perimeter Royal Studs (Accent Detail)
    const studGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const studCount = 12;
    for (let i = 0; i < studCount; i++) {
      const angle = (i / studCount) * Math.PI * 2;
      const studMesh = new THREE.Mesh(studGeo, goldMat);
      studMesh.position.set(Math.cos(angle) * 1.22, Math.sin(angle) * 1.22, 0.08);
      logoGroup.add(studMesh);
    }

    scene.add(logoGroup);

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.cursor = interactive ? 'grab' : 'default';
    container.appendChild(canvas);

    // Mouse / Touch Interaction with exponential damping
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMouseX = clientX;
      prevMouseY = clientY;
      canvas.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if (isDragging) {
        const deltaX = clientX - prevMouseX;
        const deltaY = clientY - prevMouseY;
        prevMouseX = clientX;
        prevMouseY = clientY;

        _targetRot.y += deltaX * 0.015;
        _targetRot.x += deltaY * 0.015;
      } else if (interactive) {
        const rect = container.getBoundingClientRect();
        const nx = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const ny = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        _targetRot.x = THREE.MathUtils.clamp(-ny * 0.45, -0.6, 0.6);
        _targetRot.y = THREE.MathUtils.clamp(nx * 0.55, -0.7, 0.7);
      }
    };

    const onPointerUp = () => {
      isDragging = false;
      canvas.style.cursor = interactive ? 'grab' : 'default';
    };

    if (interactive) {
      canvas.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove, { passive: true });
      window.addEventListener('mouseup', onPointerUp);

      canvas.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);
    }

    let frameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle continuous ambient oscillation when not dragging
      if (!isDragging) {
        _targetRot.y += 0.22 * dt;
        logoGroup.position.y = Math.sin(elapsed * 1.8) * 0.08;
      }

      // Smooth frame-rate independent exponential damping
      _currentRot.x = THREE.MathUtils.damp(_currentRot.x, _targetRot.x, 6, dt);
      _currentRot.y = THREE.MathUtils.damp(_currentRot.y, _targetRot.y, 6, dt);

      logoGroup.rotation.x = _currentRot.x;
      logoGroup.rotation.y = _currentRot.y;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      if (interactive) {
        canvas.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        canvas.removeEventListener('touchstart', onPointerDown);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
      }
      coinGeo.dispose();
      goldMat.dispose();
      ringGeo.dispose();
      liquidGlassMat.dispose();
      inlayGeo.dispose();
      emeraldMat.dispose();
      crossbarGeo.dispose();
      stemGeo.dispose();
      serifLeftGeo.dispose();
      serifRightGeo.dispose();
      studGeo.dispose();
      renderer.dispose();
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    };
  }, [size, interactive]);

  return (
    <div 
      ref={mountRef} 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      title="3D Liquid Emblem: Drag or move cursor to interact"
    />
  );
};
