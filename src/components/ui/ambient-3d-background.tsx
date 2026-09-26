'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function Ambient3DBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 280;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // 1. Floating Isometric Low-Poly Wireframe Boxes (Amber & Indigo)
    const boxGroup = new THREE.Group();
    const boxGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    
    // Amber wireframe material
    const amberMaterial = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });

    // Indigo wireframe material
    const indigoMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });

    const boxes: Array<{ mesh: THREE.Mesh; rotX: number; rotY: number; speed: number }> = [];

    // Create 9 floating warehouse cubes
    for (let i = 0; i < 9; i++) {
      const isAmber = i % 2 === 0;
      const mesh = new THREE.Mesh(boxGeometry, isAmber ? amberMaterial : indigoMaterial);
      mesh.position.set(
        (Math.random() - 0.5) * 38,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 12
      );
      const scale = 0.6 + Math.random() * 0.8;
      mesh.scale.set(scale, scale, scale);
      boxGroup.add(mesh);
      boxes.push({
        mesh,
        rotX: (Math.random() - 0.5) * 0.005,
        rotY: (Math.random() - 0.5) * 0.008,
        speed: 0.002 + Math.random() * 0.003,
      });
    }
    scene.add(boxGroup);

    // 2. Slow-Drifting Particle Field
    const particleCount = 65;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const amberColor = new THREE.Color(0xf59e0b);
    const indigoColor = new THREE.Color(0x6366f1);
    const skyColor = new THREE.Color(0x0284c7);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 45;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 16;

      const col = i % 3 === 0 ? amberColor : i % 3 === 1 ? indigoColor : skyColor;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mouseX = (e.clientX / innerWidth - 0.5) * 2;
      mouseY = (e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Pause rendering when tab hidden
    let isVisible = true;
    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      // Smooth mouse interpolation
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;

      boxGroup.rotation.y = targetX * 0.25;
      boxGroup.rotation.x = -targetY * 0.15;

      particles.rotation.y += 0.0006;
      particles.rotation.x += 0.0003;

      // Animate individual cubes
      boxes.forEach((b) => {
        b.mesh.rotation.x += b.rotX;
        b.mesh.rotation.y += b.rotY;
        b.mesh.position.y += Math.sin(Date.now() * 0.001 * b.speed) * 0.003;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden opacity-35 z-0"
      style={{
        maskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 20%, transparent 80%)',
      }}
    />
  );
}
