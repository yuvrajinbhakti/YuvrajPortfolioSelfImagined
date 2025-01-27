"use client";
import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import Stats from "three/addons/libs/stats.module.js";
import { FirstPersonControls } from "three/addons/controls/FirstPersonControls.js";

const ThreeJSScene = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    let camera, controls, scene, renderer, stats;
    let mesh, geometry, material, clock;
    const worldWidth = 128,
      worldDepth = 128;

    const init = () => {
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        20000
      );
      camera.position.y = 200;

      clock = new THREE.Clock();

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xaaccff);
      scene.fog = new THREE.FogExp2(0xaaccff, 0.0007);

      geometry = new THREE.PlaneGeometry(
        20000,
        20000,
        worldWidth - 1,
        worldDepth - 1
      );
      geometry.rotateX(-Math.PI / 2);

      const position = geometry.attributes.position;
      position.usage = THREE.DynamicDrawUsage;

      for (let i = 0; i < position.count; i++) {
        const y = 35 * Math.sin(i / 2);
        position.setY(i, y);
      }

      const texture = new THREE.TextureLoader().load("textures/water.jpg");
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
      texture.colorSpace = THREE.SRGBColorSpace;

      material = new THREE.MeshBasicMaterial({ color: 0x0044ff, map: texture });

      mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setAnimationLoop(animate);
      mountRef.current.appendChild(renderer.domElement);

      controls = new FirstPersonControls(camera, renderer.domElement);
      controls.movementSpeed = 500;
      controls.lookSpeed = 0.1;

      stats = new Stats();
      mountRef.current.appendChild(stats.dom);

      window.addEventListener("resize", onWindowResize);
    };

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      controls.handleResize();
    };

    const animate = () => {
      renderScene();
      stats.update();
    };

    const renderScene = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime() * 10;

      const position = geometry.attributes.position;

      for (let i = 0; i < position.count; i++) {
        const y = 35 * Math.sin(i / 5 + (time + i) / 7);
        position.setY(i, y);
      }

      position.needsUpdate = true;

      controls.update(delta);
      renderer.render(scene, camera);
    };

    init();

    return () => {
      mountRef.current.removeChild(renderer.domElement);
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return (
    <div ref={mountRef}>
      <div id="info">
        <a href="https://threejs.org" target="_blank" rel="noopener noreferrer">
          three.js
        </a>{" "}
        - dynamic geometry
        <br />
        left click: forward, right click: backward
      </div>
    </div>
  );
};

export default ThreeJSScene;
