import React from "react";
import * as THREE from "three";

export function HeroBoneModel() {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
    });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    const model = new THREE.Group();
    const mouse = new THREE.Vector2(0, 0);
    const clock = new THREE.Clock();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    camera.position.set(0, 0.15, 8.2);
    scene.add(camera);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x7dd3fc, 12, 11);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    scene.add(new THREE.HemisphereLight(0xf7fbff, 0x8fb7b9, 1.4));

    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4f7f1,
      roughness: 0.5,
      metalness: 0.04,
    });
    const accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f8b92,
      roughness: 0.36,
      metalness: 0.16,
      emissive: 0x064e52,
      emissiveIntensity: 0.28,
    });

    const meshes: THREE.Object3D[] = [];

    function addBone(length: number, radius: number, position: THREE.Vector3, rotation: THREE.Euler) {
      const bone = new THREE.Group();
      const shaft = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.58, radius * 0.58, length, 28),
        boneMaterial,
      );
      const top = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), boneMaterial);
      const bottom = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 20), boneMaterial);
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(radius * 0.16, radius * 0.16, length * 0.96, 18),
        accentMaterial,
      );

      top.position.y = length / 2;
      bottom.position.y = -length / 2;
      core.scale.set(1, 1, 1);
      bone.position.copy(position);
      bone.rotation.copy(rotation);
      bone.add(shaft, top, bottom, core);
      model.add(bone);
      meshes.push(shaft, top, bottom, core);

      return bone;
    }

    addBone(3.35, 0.46, new THREE.Vector3(0.35, 0.05, 0), new THREE.Euler(0.18, 0.25, -0.58));
    addBone(2.25, 0.28, new THREE.Vector3(1.52, -1.02, 0.12), new THREE.Euler(-0.2, -0.1, 0.86));
    addBone(2.08, 0.24, new THREE.Vector3(-0.92, 0.88, -0.22), new THREE.Euler(0.35, 0.25, 0.64));

    const vertebrae = new THREE.Group();
    for (let index = 0; index < 7; index += 1) {
      const vertebra = new THREE.Mesh(
        new THREE.TorusGeometry(0.28 + index * 0.018, 0.055, 14, 36),
        index % 2 === 0 ? boneMaterial : accentMaterial,
      );
      vertebra.position.set(-1.65, 1.35 - index * 0.34, -0.08);
      vertebra.rotation.set(Math.PI / 2.2, 0.2, -0.32);
      vertebrae.add(vertebra);
      meshes.push(vertebra);
    }
    model.add(vertebrae);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.95, 0.012, 12, 96),
      new THREE.MeshBasicMaterial({ color: 0x17858b, transparent: true, opacity: 0.32 }),
    );
    ring.rotation.set(1.18, 0.16, -0.5);
    model.add(ring);
    meshes.push(ring);

    const pointGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(90);
    for (let index = 0; index < positions.length; index += 3) {
      const radius = 1.4 + Math.random() * 2.2;
      const angle = Math.random() * Math.PI * 2;
      positions[index] = Math.cos(angle) * radius;
      positions[index + 1] = (Math.random() - 0.5) * 3.8;
      positions[index + 2] = Math.sin(angle) * radius * 0.24 - 0.65;
    }
    pointGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const points = new THREE.Points(
      pointGeometry,
      new THREE.PointsMaterial({
        color: 0x0f8b92,
        size: 0.035,
        transparent: true,
        opacity: 0.5,
      }),
    );
    model.add(points);
    meshes.push(points);

    model.position.set(1.45, -0.05, 0);
    model.rotation.set(0.08, -0.2, 0.02);
    scene.add(model);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);

      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      mouse.y = -((event.clientY - rect.top) / rect.height - 0.5) * 2;
    }

    let animationFrame = 0;
    function render() {
      const elapsed = clock.getElapsedTime();
      model.rotation.y += (mouse.x * 0.14 - model.rotation.y + Math.sin(elapsed * 0.34) * 0.1) * 0.035;
      model.rotation.x += (mouse.y * 0.08 + 0.08 - model.rotation.x) * 0.035;
      model.rotation.z = Math.sin(elapsed * 0.42) * 0.04;
      ring.rotation.z = elapsed * 0.08;
      points.rotation.y = elapsed * 0.035;
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    }

    resize();
    render();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onPointerMove);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", onPointerMove);
      renderer.dispose();
      meshes.forEach((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full" />;
}
