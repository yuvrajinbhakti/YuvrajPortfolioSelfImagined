"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createNoise4D } from "simplex-noise";
import chroma from "chroma-js";

interface AppConfig {
  fov: number;
  cameraZ: number;
  xyCoef: number;
  zCoef: number;
  lightIntensity: number;
  ambientColor: number;
  light1Color: number;
  light2Color: number;
  light3Color: number;
  light4Color: number;
}

export default function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colors, setColors] = useState<number[]>([
    0x0e09dc, 0x1cd1e1, 0x18c02c, 0xee3bcf,
  ]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const conf: AppConfig = {
      fov: 75,
      cameraZ: 75,
      xyCoef: 50,
      zCoef: 10,
      lightIntensity: 1.5,
      ambientColor: 0x404040,
      light1Color: colors[0],
      light2Color: colors[1],
      light3Color: colors[2],
      light4Color: colors[3],
    };

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let plane: THREE.Mesh;
    let light1: THREE.PointLight,
      light2: THREE.PointLight,
      light3: THREE.PointLight,
      light4: THREE.PointLight;

    const noise4D = createNoise4D();
    const mouse = new THREE.Vector2();
    const mousePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const mousePosition = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();

    function init() {
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current!,
        antialias: true,
        alpha: true,
      });

      camera = new THREE.PerspectiveCamera(conf.fov);
      camera.position.z = conf.cameraZ;

      updateSize();
      window.addEventListener("resize", updateSize);
      document.addEventListener("mousemove", handleMouseMove);

      initScene();
      animate();

      return () => {
        window.removeEventListener("resize", updateSize);
        document.removeEventListener("mousemove", handleMouseMove);
        renderer.dispose();
        scene.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry.dispose();
            object.material.dispose();
          }
        });
      };
    }

    function handleMouseMove(e: MouseEvent) {
      const { innerWidth: width, innerHeight: height } = window;
      const v = new THREE.Vector3();
      camera.getWorldDirection(v);
      v.normalize();
      mousePlane.normal = v;
      mouse.x = (e.clientX / width) * 2 - 1;
      mouse.y = -(e.clientY / height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(mousePlane, mousePosition);
    }

    function initScene() {
      scene = new THREE.Scene();
      const ambientLight = new THREE.AmbientLight(conf.ambientColor);
      scene.add(ambientLight);

      initLights();

      const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.5,
        roughness: 0.5,
        side: THREE.DoubleSide,
      });

      const { width: wWidth, height: wHeight } = getRendererSize();
      const geo = new THREE.PlaneGeometry(
        wWidth,
        wHeight,
        wWidth / 2,
        wHeight / 2
      );
      plane = new THREE.Mesh(geo, mat);
      scene.add(plane);

      plane.rotation.x = -Math.PI / 2 - 0.2;
      plane.position.y = -25;
      camera.position.z = 60;
    }

    function initLights() {
      const r = 30,
        y = 10,
        lightDistance = 500;

      light1 = new THREE.PointLight(
        new THREE.Color(conf.light1Color),
        conf.lightIntensity,
        lightDistance
      );
      light1.position.set(0, y, r);
      scene.add(light1);

      light2 = new THREE.PointLight(
        new THREE.Color(conf.light2Color),
        conf.lightIntensity,
        lightDistance
      );
      light2.position.set(0, -y, -r);
      scene.add(light2);

      light3 = new THREE.PointLight(
        new THREE.Color(conf.light3Color),
        conf.lightIntensity,
        lightDistance
      );
      light3.position.set(r, y, 0);
      scene.add(light3);

      light4 = new THREE.PointLight(
        new THREE.Color(conf.light4Color),
        conf.lightIntensity,
        lightDistance
      );
      light4.position.set(-r, y, 0);
      scene.add(light4);
    }

    function animate() {
      requestAnimationFrame(animate);
      animatePlane();
      animateLights();
      renderer.render(scene, camera);
    }

    function animatePlane() {
      const gArray = plane.geometry.attributes.position.array;
      const time = Date.now() * 0.0002;
      for (let i = 0; i < gArray.length; i += 3) {
        gArray[i + 2] =
          noise4D(
            gArray[i] / conf.xyCoef,
            gArray[i + 1] / conf.xyCoef,
            time,
            mouse.x + mouse.y
          ) * conf.zCoef;
      }
      plane.geometry.attributes.position.needsUpdate = true;
    }

    function animateLights() {
      const time = Date.now() * 0.001;
      const d = 50;
      light1.position.x = Math.sin(time * 0.1) * d;
      light1.position.z = Math.cos(time * 0.2) * d;
      light2.position.x = Math.cos(time * 0.3) * d;
      light2.position.z = Math.sin(time * 0.4) * d;
      light3.position.x = Math.sin(time * 0.5) * d;
      light3.position.z = Math.sin(time * 0.6) * d;
      light4.position.x = Math.sin(time * 0.7) * d;
      light4.position.z = Math.cos(time * 0.8) * d;
    }

    function updateSize() {
      const { innerWidth: width, innerHeight: height } = window;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function getRendererSize() {
      const cam = new THREE.PerspectiveCamera(camera.fov, camera.aspect);
      const vFOV = (cam.fov * Math.PI) / 180;
      const height = 2 * Math.tan(vFOV / 2) * Math.abs(conf.cameraZ);
      const width = height * cam.aspect;
      return { width, height };
    }

    const cleanup = init();
    return () => cleanup();
  }, [colors]);

  const handleRandomColors = () => {
    const newColors = [
      parseInt(chroma.random().hex().replace("#", "0x")),
      parseInt(chroma.random().hex().replace("#", "0x")),
      parseInt(chroma.random().hex().replace("#", "0x")),
      parseInt(chroma.random().hex().replace("#", "0x")),
    ];
    setColors(newColors);
  };

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 -z-10" />
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handleRandomColors}
          className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white"
        >
          Random Colors
        </button>
      </div>
    </>
  );
}
