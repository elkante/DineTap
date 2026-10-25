import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ShaderGradientCanvasProps {
  className?: string;
  speed?: number;
  palette?: 'emeraldGold' | 'midnightLuxury' | 'sunsetAmber';
  interactive?: boolean;
}

// GLSL Vertex Shader: Fullscreen quad with UV coordinates
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// GLSL Fragment Shader: Multi-octave organic liquid wave and chromatic aberration
const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform vec2 u_resolution;
  uniform vec3 u_colorA;
  uniform vec3 u_colorB;
  uniform vec3 u_colorC;
  uniform vec3 u_colorD;
  varying vec2 vUv;

  // Simplex-inspired 2D noise
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 st = vUv;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    st.x *= aspect;

    // Fluid distortion influenced by mouse displacement
    vec2 mouse = u_mouse * vec2(aspect, 1.0);
    float mouseDist = length(st - mouse);
    float mouseWave = exp(-mouseDist * 3.2) * 0.35;

    // Liquid Domain Warping
    float t = u_time * 0.32;
    vec2 q = vec2(
      snoise(st * 1.4 + vec2(t * 0.4, t * 0.2)),
      snoise(st * 1.3 - vec2(t * 0.3, t * 0.4))
    );

    vec2 r = vec2(
      snoise(st * 2.1 + 4.0 * q + vec2(1.7, 9.2) + mouseWave),
      snoise(st * 2.0 + 4.0 * q + vec2(8.3, 2.8) - mouseWave)
    );

    float f = snoise(st * 1.8 + 4.0 * r + t * 0.15);
    float normF = clamp((f + 1.0) * 0.5, 0.0, 1.0);

    // Multi-gradient blending
    vec3 col = mix(u_colorA, u_colorB, clamp(length(q), 0.0, 1.0));
    col = mix(col, u_colorC, clamp(length(r.x), 0.0, 1.0));
    col = mix(col, u_colorD, normF * normF);

    // Specular liquid sheen highlight
    float specular = pow(clamp(dot(q, r), 0.0, 1.0), 3.5);
    col += u_colorD * specular * 0.45;

    // Subtle vignette
    float vig = 1.0 - smoothstep(0.4, 1.4, length(vUv - 0.5));
    col *= (vig * 0.3 + 0.7);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const ShaderGradientCanvas: React.FC<ShaderGradientCanvasProps> = ({
  className = '',
  speed = 1.0,
  palette = 'emeraldGold',
  interactive = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL to adapt pixel ratio according to Three.js guidelines
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
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isSoftwareGl,
      alpha: true,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);

    // Color definitions
    const palettes = {
      emeraldGold: {
        a: new THREE.Color('#0c2e22'), // Deep Emerald
        b: new THREE.Color('#051b14'), // Midnight Jade
        c: new THREE.Color('#b8860b'), // Antique Gold
        d: new THREE.Color('#d4af37'), // Brilliant Metallic Gold
      },
      midnightLuxury: {
        a: new THREE.Color('#09090b'),
        b: new THREE.Color('#1c1917'),
        c: new THREE.Color('#d4af37'),
        d: new THREE.Color('#f59e0b'),
      },
      sunsetAmber: {
        a: new THREE.Color('#1e1b4b'),
        b: new THREE.Color('#831843'),
        c: new THREE.Color('#d97706'),
        d: new THREE.Color('#fbbf24'),
      },
    };

    const currentPalette = palettes[palette] || palettes.emeraldGold;

    // Pre-allocated uniforms
    const uniforms = {
      u_time: { value: 0 },
      u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
      u_resolution: { value: new THREE.Vector2(container.clientWidth, container.clientHeight) },
      u_colorA: { value: currentPalette.a },
      u_colorB: { value: currentPalette.b },
      u_colorC: { value: currentPalette.c },
      u_colorD: { value: currentPalette.d },
    };

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    // Mouse movement smoothing
    const targetMouse = new THREE.Vector2(0.5, 0.5);
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const rect = container.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      targetMouse.x = (clientX - rect.left) / rect.width;
      targetMouse.y = 1.0 - (clientY - rect.top) / rect.height;
    };

    if (interactive) {
      window.addEventListener('pointermove', handlePointerMove, { passive: true });
    }

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let animationId = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      uniforms.u_time.value += delta * speed;
      // Exponential damping for fluid mouse response
      uniforms.u_mouse.value.lerp(targetMouse, 0.08);

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      if (interactive) {
        window.removeEventListener('pointermove', handlePointerMove);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (canvas.parentElement) {
        canvas.parentElement.removeChild(canvas);
      }
    };
  }, [palette, speed, interactive]);

  return <div ref={mountRef} className={`relative overflow-hidden ${className}`} />;
};
