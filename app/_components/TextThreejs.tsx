"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ThreeJsTextExample = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let camera, scene, renderer;
    let frameId;

    const init = async () => {
      // Setup camera
      camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        10000
      );
      camera.position.set(0, -400, 600);

      // Setup scene
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      // Setup renderer
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(renderer.domElement);

      // Setup controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.set(0, 0, 0);
      controls.update();
      controls.addEventListener("change", render);

      // Create text using basic geometry instead of loading font
      const textMaterial = new THREE.MeshBasicMaterial({
        color: 0x006699,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
      });

      const outlineMaterial = new THREE.LineBasicMaterial({
        color: 0x006699,
        side: THREE.DoubleSide,
      });

      // Create simple text geometry using boxes
      const textGroup = new THREE.Group();

      const createLetter = (x, width = 40, height = 100) => {
        const geometry = new THREE.BoxGeometry(width, height, 10);
        const mesh = new THREE.Mesh(geometry, textMaterial);
        mesh.position.x = x;

        // Create outline
        const edges = new THREE.EdgesGeometry(geometry);
        const outline = new THREE.LineSegments(edges, outlineMaterial);
        outline.position.x = x;

        textGroup.add(mesh);
        textGroup.add(outline);
      };

      // Create "THREE.JS" text
      const spacing = 50;
      let currentX = -150;

      ["T", "H", "R", "E", "E", ".", "J", "S"].forEach((letter, i) => {
        createLetter(currentX);
        currentX += spacing;
      });

      textGroup.position.z = -150;
      scene.add(textGroup);

      render();
    };

    const onWindowResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      render();
    };

    const render = () => {
      if (!renderer || !scene || !camera) return;
      renderer.render(scene, camera);
    };

    // Initialize scene
    init();

    // Add window resize listener
    window.addEventListener("resize", onWindowResize);

    // Cleanup function
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      if (renderer) {
        renderer.dispose();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-0 left-0 p-4 text-gray-600">
        <a
          href="https://threejs.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700"
        >
          three.js
        </a>{" "}
        webgl - simple text example
      </div>
    </div>
  );
};

export default ThreeJsTextExample;
