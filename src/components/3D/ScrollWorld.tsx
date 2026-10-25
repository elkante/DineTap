import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ScrollWorldProps {
  className?: string;
}

export const ScrollWorld: React.FC<ScrollWorldProps> = ({ className = '' }) => {
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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    // 1. Procedural Stardust / Golden Embers Particle Field
    const particleCount = isSoftwareGl ? 50 : 160;
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const phases = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 36;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      scales[i] = Math.random() * 0.18 + 0.04;
      phases[i] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Custom circle particle texture procedurally generated with 2D canvas (Zero external 404s!)
    const particleTexture = (() => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255, 235, 180, 1)');
      grad.addColorStop(0.3, 'rgba(212, 175, 55, 0.8)');
      grad.addColorStop(0.7, 'rgba(180, 130, 30, 0.25)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    })();

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.45,
      map: particleTexture,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 2. Geometric Depth Rings (Luxury Wine & Cocktail Rings at depth intervals)
    const ringGroup = new THREE.Group();
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#d4af37'),
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.8, 0.02, 16, 64), ringMat);
    ring1.position.set(-4.5, 2.0, -4);
    ring1.rotation.x = Math.PI / 3;
    ringGroup.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(5.2, 0.02, 16, 64), ringMat);
    ring2.position.set(5.0, -3.5, -8);
    ring2.rotation.y = Math.PI / 4;
    ringGroup.add(ring2);

    scene.add(ringGroup);

    // Track scroll target with exponential damping
    let targetScrollNorm = 0;
    let currentScrollNorm = 0;

    const onScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      targetScrollNorm = window.scrollY / maxScroll;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Resize handler
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    let frameId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Exponential damping on scroll response
      currentScrollNorm = THREE.MathUtils.damp(currentScrollNorm, targetScrollNorm, 4.5, dt);

      // Camera parallax depth shift based on scroll
      camera.position.y = -currentScrollNorm * 12 + 2;
      camera.position.z = 18 - currentScrollNorm * 4;
      camera.rotation.x = -currentScrollNorm * 0.15;

      // Subtle particle float and slow rotation
      particles.rotation.y = elapsed * 0.03;
      particles.rotation.x = Math.sin(elapsed * 0.05) * 0.05;

      ring1.rotation.z = elapsed * 0.04;
      ring2.rotation.z = -elapsed * 0.03;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', onScroll);
      resizeObserver.disconnect();
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      ring1.geometry.dispose();
      ring2.geometry.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 pointer-events-none overflow-hidden z-0 ${className}`} 
      aria-hidden="true"
    />
  );
};
