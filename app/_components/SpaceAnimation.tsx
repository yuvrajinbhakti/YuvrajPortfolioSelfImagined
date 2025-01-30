"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

interface AnimationRefs {
  nucleusPosition?: THREE.BufferAttribute;
  originalY?: THREE.BufferAttribute;
  positionsStar?: THREE.BufferAttribute;
  velocitiesStar?: THREE.BufferAttribute;
  startPositions?: THREE.BufferAttribute;
}

const SpaceScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const clockRef = useRef<THREE.Clock>();
  const controlsRef = useRef<OrbitControls>();
  const rafRef = useRef<number>();
  const deltaRef = useRef<number>(0);
  const animationRefs = useRef<AnimationRefs>({});
  const timeRef = useRef<number>(0);

  const meshRefs = useRef({
    nucleus: null as THREE.Mesh | null,
    sphereBg: null as THREE.Mesh | null,
    pointStars: null as THREE.Points | null,
    pointStars2: null as THREE.Points | null,
    pointComet1: null as THREE.Points | null,
    planet1: null as THREE.Points | null,
    planet2: null as THREE.Points | null,
    planet3: null as THREE.Points | null,
    stars: null as THREE.Points | null,
  });

  const createSphereBackground = (scene: THREE.Scene) => {
    const geometrySphereBg = new THREE.SphereGeometry(90, 50, 50);
    const materialSphereBg = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x000000,
    });
    const sphereBg = new THREE.Mesh(geometrySphereBg, materialSphereBg);
    sphereBg.position.set(0, 0, 0);
    scene.add(sphereBg);
    meshRefs.current.sphereBg = sphereBg;
  };

  const createNucleus = (scene: THREE.Scene) => {
    const geometry = new THREE.IcosahedronGeometry(20, 28);
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x555555,
    });
    const nucleus = new THREE.Mesh(geometry, material);
    nucleus.position.set(0, 0, 0);
    scene.add(nucleus);
    meshRefs.current.nucleus = nucleus;
    animationRefs.current.nucleusPosition = geometry.attributes
      .position as THREE.BufferAttribute;
  };

  const createStarField = (scene: THREE.Scene) => {
    // Create star field geometry
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 5000; i++) {
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starVertices, 3)
    );

    // Create star material
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
    });

    // Create star points
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);
    meshRefs.current.pointStars = starPoints;
  };

  const updateScene = () => {
    if (!meshRefs.current.nucleus || !meshRefs.current.sphereBg) return;

    timeRef.current += 0.005;

    // Update nucleus
    meshRefs.current.nucleus.rotation.y += 0.002;
    meshRefs.current.nucleus.rotation.z += 0.002;

    // Update background sphere
    meshRefs.current.sphereBg.rotation.x += 0.002;
    meshRefs.current.sphereBg.rotation.y += 0.002;

    // Update star field if it exists
    if (meshRefs.current.pointStars) {
      meshRefs.current.pointStars.rotation.y += 0.002;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.01,
      1000
    );
    camera.position.set(0, 0, 150);
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      alpha: true,
      antialias: true,
      stencil: false,
    });
    renderer.setSize(
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 5;
    controls.maxDistance = 350;
    controls.minDistance = 150;
    controls.enablePan = false;
    controlsRef.current = controls;

    // Add lights
    const directionalLight = new THREE.DirectionalLight("#fff", 3);
    directionalLight.position.set(0, 50, -20);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight("#ffffff", 1);
    ambientLight.position.set(0, -20, -40);
    scene.add(ambientLight);

    // Create scene elements
    createSphereBackground(scene);
    createNucleus(scene);
    createStarField(scene);

    // Initialize clock
    clockRef.current = new THREE.Clock();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current)
        return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Animation loop
    const animate = () => {
      if (
        !clockRef.current ||
        !controlsRef.current ||
        !rendererRef.current ||
        !sceneRef.current ||
        !cameraRef.current
      )
        return;

      rafRef.current = requestAnimationFrame(animate);
      deltaRef.current += clockRef.current.getDelta();

      if (deltaRef.current > 1 / 60) {
        updateScene();
        controlsRef.current.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        deltaRef.current = deltaRef.current % (1 / 60);
      }
    };

    animate();

    // Cleanup
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      resizeObserver.disconnect();
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      controlsRef.current?.dispose();
    };
  }, []);

  return (
    <>
      <div className="banner">
        You can zoom in and click and drag to explore the scene.
      </div>
      <a
        href="https://www.isladjan.com/about/"
        className="btn btn-left"
        target="_blank"
        rel="noopener noreferrer"
      >
        My Works
      </a>
      <button className="btn btn-right" id="fullscreenBtn">
        Go Fullscreen
      </button>
      <div ref={containerRef} className="webgl" />
      <style jsx>{`
        .banner {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          padding: 15px;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(5px);
          color: white;
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: 16px;
          z-index: 10;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        .webgl {
          width: 100%;
          height: 100vh;
          position: fixed;
          z-index: 3;
          top: 0;
          left: 0;
          outline: none;
        }
        .btn {
          position: fixed;
          bottom: 20px;
          transform: translateY(-50%);
          padding: 12px 24px;
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 30px;
          color: white;
          font-family: Arial, sans-serif;
          font-size: 16px;
          text-decoration: none;
          backdrop-filter: blur(5px);
          transition: all 0.3s ease;
          cursor: pointer;
          z-index: 10;
        }
        .btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-50%) scale(1.05);
        }
        .btn-left {
          left: 30px;
        }
        .btn-right {
          right: 30px;
        }
      `}</style>
    </>
  );
};

export default SpaceScene;
