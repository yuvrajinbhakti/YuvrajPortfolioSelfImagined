"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

const ShaderAnimation = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    let camera, scene, renderer;
    let uniforms;
    const divisor = 1 / 8;
    const textureFraction = 1 / 1;
    let w = window.innerWidth;
    let h = window.innerHeight;
    let rtTexture, rtTexture2;
    const newmouse = {
      x: 0,
      y: 0,
    };

    const vertexShader = `
      void main() {
          gl_Position = vec4( position, 1.0 );
      }
    `;

    const fragmentShader = `
      uniform vec2 u_resolution;
      uniform vec4 u_mouse;
      uniform float u_time;
      uniform sampler2D u_noise;
      uniform sampler2D u_buffer;
      uniform bool u_renderpass;
      uniform int u_frame;
      
      #define PI 3.141592653589793
      #define TAU 6.283185307179586
      
      const float multiplier = 25.5;
      const float zoomSpeed = 3.;
      const int layers = 5;
      
      mat2 rotate2d(float _angle){
          return mat2(cos(_angle),sin(_angle),
                    -sin(_angle),cos(_angle));
      }
      
      vec2 hash2(vec2 p)
      {
        vec2 o = texture2D( u_noise, (p+0.5)/256.0, -100.0 ).xy;
        return o;
      }
      
      vec3 hsb2rgb( in vec3 c ){
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),
                                 6.0)-3.0)-1.0,
                         0.0,
                         1.0 );
        rgb = rgb*rgb*(3.0-2.0*rgb);
        return c.z * mix( vec3(1.0), rgb, c.y);
      }
      
      vec3 domain(vec2 z){
        return vec3(hsb2rgb(vec3(atan(z.y,z.x)/TAU,1.,1.)));
      }
      
      vec3 colour(vec2 z) {
          return domain(z);
      }
      
      vec3 render(vec2 uv, float scale) {
        vec2 id = floor(uv);
        vec2 subuv = fract(uv);
        vec2 rand = hash2(id);
        float bokeh = abs(scale) * 1.;
        
        float particle = 0.;
        
        if(length(rand) > 1.3) {
          vec2 pos = subuv-.5;
          float field = length(pos);
          particle = smoothstep(.7, 0., field);
          particle += smoothstep(.2, 0.2 * bokeh, field);
        }
        return vec3(particle*2.);
      }
      
      vec3 renderLayer(int layer, int layers, vec2 uv, inout float opacity) {
        vec2 _uv = uv;
        float scale = mod((u_time + zoomSpeed / float(layers) * float(layer)) / zoomSpeed, -1.);
        uv *= 20.;
        uv *= scale*scale;
        uv = rotate2d(u_time / 10.) * uv;
        uv += vec2(25. + sin(u_time*.1)*.2) * float(layer);
        vec3 pass = render(uv * multiplier, scale) * .2;
        opacity = 1. + scale;
        float _opacity = opacity;
        float endOpacity = smoothstep(0., 0.4, scale * -1.);
        opacity += endOpacity;
        return pass * _opacity * endOpacity;
      }
      
      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
        vec2 texCoord = gl_FragCoord.xy / u_resolution.xy;
        
        vec4 fragcolour = vec4(0.0);
        
        if(u_renderpass) {
          if(u_frame > 5) {
            fragcolour = texture2D(u_buffer, texCoord) * 6.;
          }
          uv *= rotate2d(u_time*.5);
          
          float opacity = 1.;
          float opacity_sum = 1.;
          for(int i = 1; i <= layers; i++) {
            fragcolour += clamp(vec4(renderLayer(i, layers, uv, opacity), 1.) * 5., 0., 5.);
            opacity_sum += opacity;
          }
          fragcolour *= 1./opacity_sum;
        } else {
          fragcolour = texture2D(u_buffer, texCoord) * 5.;
        }
        
        gl_FragColor = fragcolour;
      }
    `;

    const init = () => {
      camera = new THREE.Camera();
      camera.position.z = 1;
      scene = new THREE.Scene();
      const geometry = new THREE.PlaneGeometry(2, 2);

      rtTexture = new THREE.WebGLRenderTarget(
        w * textureFraction,
        h * textureFraction
      );
      rtTexture2 = new THREE.WebGLRenderTarget(
        w * textureFraction,
        h * textureFraction
      );

      uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_noise: { type: "t", value: null },
        u_buffer: { type: "t", value: rtTexture.texture },
        u_mouse: { type: "v4", value: new THREE.Vector4() }, // Changed from Vector3 to Vector4
        u_frame: { type: "i", value: -1 },
        u_renderpass: { type: "b", value: false },
      };

      const material = new THREE.ShaderMaterial({
        uniforms,
        vertexShader,
        fragmentShader,
      });
      material.extensions.derivatives = true;

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current?.appendChild(renderer.domElement);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin("anonymous");
      loader.load(
        "https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png",
        (texture) => {
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          texture.minFilter = THREE.LinearFilter;
          uniforms.u_noise.value = texture;
        }
      );

      onWindowResize();
      window.addEventListener("resize", onWindowResize, false);
      setupEventListeners();
      animate();
    };

    const setupEventListeners = () => {
      const handlePointerMove = (e) => {
        const ratio = window.innerHeight / window.innerWidth;
        if (window.innerHeight > window.innerWidth) {
          newmouse.x = (e.pageX - window.innerWidth / 2) / window.innerWidth;
          newmouse.y =
            ((e.pageY - window.innerHeight / 2) / window.innerHeight) *
            -1 *
            ratio;
        } else {
          newmouse.x =
            (e.pageX - window.innerWidth / 2) / window.innerWidth / ratio;
          newmouse.y =
            ((e.pageY - window.innerHeight / 2) / window.innerHeight) * -1;
        }
        e.preventDefault();
      };

      const handlePointerDown = (e) => {
        if (e.button === 0) {
          uniforms.u_mouse.value.z = 1;
        } else if (e.button === 2) {
          uniforms.u_mouse.value.w = 1;
        }
        e.preventDefault();
      };

      const handlePointerUp = (e) => {
        if (e.button === 0) {
          uniforms.u_mouse.value.z = 0;
        } else if (e.button === 2) {
          uniforms.u_mouse.value.w = 0;
        }
        e.preventDefault();
      };

      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("pointerup", handlePointerUp);

      return () => {
        document.removeEventListener("pointermove", handlePointerMove);
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("pointerup", handlePointerUp);
      };
    };

    const onWindowResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.x = renderer.domElement.width;
      uniforms.u_resolution.value.y = renderer.domElement.height;
      uniforms.u_frame.value = 0;

      rtTexture = new THREE.WebGLRenderTarget(
        w * textureFraction,
        h * textureFraction
      );
      rtTexture2 = new THREE.WebGLRenderTarget(
        w * textureFraction,
        h * textureFraction
      );
    };

    const renderTexture = () => {
      const odims = uniforms.u_resolution.value.clone();
      uniforms.u_resolution.value.x = w * textureFraction;
      uniforms.u_resolution.value.y = h * textureFraction;
      uniforms.u_buffer.value = rtTexture2.texture;
      uniforms.u_renderpass.value = true;

      renderer.setRenderTarget(rtTexture);
      renderer.render(scene, camera);

      const buffer = rtTexture;
      rtTexture = rtTexture2;
      rtTexture2 = buffer;

      uniforms.u_buffer.value = rtTexture.texture;
      uniforms.u_resolution.value = odims;
      uniforms.u_renderpass.value = false;
    };

    const render = (delta) => {
      uniforms.u_frame.value++;
      uniforms.u_mouse.value.x +=
        (newmouse.x - uniforms.u_mouse.value.x) * divisor;
      uniforms.u_mouse.value.y +=
        (newmouse.y - uniforms.u_mouse.value.y) * divisor;
      uniforms.u_time.value = delta * 0.0005;
      renderer.render(scene, camera);
      renderTexture();
    };

    const animate = (delta) => {
      requestAnimationFrame(animate);
      render(delta);
    };

    init();

    return () => {
      if (renderer) {
        renderer.dispose();
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default ShaderAnimation;