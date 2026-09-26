'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function CubeLogo3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const width = 48;
    const height = 48;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(2.8, 2.4, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Outer amber wireframe cube
    const geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.9,
    });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    scene.add(wireframe);

    // Inner glowing solid cube
    const innerGeometry = new THREE.BoxGeometry(0.75, 0.75, 0.75);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.25,
    });
    const innerMesh = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerMesh);

    let animationFrameId: number;
    let isVisible = true;

    const handleVisibilityChange = () => {
      isVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!isVisible) return;

      wireframe.rotation.y += 0.008;
      wireframe.rotation.x += 0.004;

      innerMesh.rotation.y += 0.008;
      innerMesh.rotation.x += 0.004;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      renderer.dispose();
      geometry.dispose();
      edges.dispose();
      lineMaterial.dispose();
      innerGeometry.dispose();
      innerMaterial.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-10 h-10 shrink-0 pointer-events-none drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]"
    />
  );
}
