'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';

/** Procedural isometric city — buildings, routes, vans, drones. */
function Building({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  const mesh = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (mesh.current) {
      const mat = mesh.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.15 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.08;
    }
  });

  return (
    <mesh ref={mesh} position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#0F172A" emissive="#22C55E" emissiveIntensity={0.2} metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

function MovingVan({ path, speed = 0.15 }: { path: THREE.Vector3[]; speed?: number }) {
  const ref = useRef<THREE.Group>(null!);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path), [path]);
  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * speed) % 1;
    const p = curve.getPoint(t);
    const next = curve.getPoint((t + 0.01) % 1);
    ref.current.position.copy(p);
    ref.current.lookAt(next);
  });

  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.35, 0.2, 0.55]} />
        <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Drone({ position }: { position: [number, number, number] }) {
  return (
    <Float speed={2} floatIntensity={0.8} rotationIntensity={0.2}>
      <group position={position}>
        <mesh>
          <octahedronGeometry args={[0.12]} />
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

function CityScene() {
  const buildings = useMemo(() => {
    const items: { pos: [number, number, number]; size: [number, number, number] }[] = [];
    for (let x = -4; x <= 4; x += 1.2) {
      for (let z = -4; z <= 4; z += 1.2) {
        if (Math.abs(x) < 1 && Math.abs(z) < 1) continue;
        const h = 0.4 + Math.random() * 1.8;
        items.push({ pos: [x, h / 2, z], size: [0.7, h, 0.7] });
      }
    }
    return items;
  }, []);

  const route1 = useMemo(
    () => [new THREE.Vector3(-3, 0.15, -2), new THREE.Vector3(-1, 0.15, 0), new THREE.Vector3(2, 0.15, 1), new THREE.Vector3(4, 0.15, 3)],
    [],
  );
  const route2 = useMemo(
    () => [new THREE.Vector3(3, 0.15, -3), new THREE.Vector3(1, 0.15, -1), new THREE.Vector3(-2, 0.15, 2)],
    [],
  );

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[5, 8, 5]} intensity={1.2} color="#22C55E" />
      <pointLight position={[-5, 6, -3]} intensity={0.6} color="#10B981" />
      <Stars radius={80} depth={40} count={800} factor={3} saturation={0} fade speed={0.5} />

      {/* Ground grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[14, 14, 14, 14]} />
        <meshStandardMaterial color="#050816" wireframe opacity={0.15} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#0a1020" />
      </mesh>

      {buildings.map((b, i) => (
        <Building key={i} position={b.pos} size={b.size} />
      ))}

      <Line points={route1} color="#22C55E" lineWidth={2} transparent opacity={0.6} />
      <Line points={route2} color="#10B981" lineWidth={2} transparent opacity={0.5} />

      <MovingVan path={route1} speed={0.12} />
      <MovingVan path={route2} speed={0.18} />

      <Drone position={[2, 2.5, -1]} />
      <Drone position={[-2.5, 3, 2]} />
      <Drone position={[0, 2.8, 3.5]} />
    </>
  );
}

export function HeroCanvas() {
  return (
    <div className="absolute inset-0 opacity-70 [mask-image:linear-gradient(to_bottom,black_20%,transparent_95%)]">
      <Canvas
        camera={{ position: [8, 7, 8], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <CityScene />
      </Canvas>
    </div>
  );
}
