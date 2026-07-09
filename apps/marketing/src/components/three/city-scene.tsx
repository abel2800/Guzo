'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Line, Stars } from '@react-three/drei';
import * as THREE from 'three';

function seededRandom(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function FuturisticTower({
  position,
  width,
  depth,
  height,
  seed,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  seed: number;
}) {
  const group = useRef<THREE.Group>(null!);
  const accent = seededRandom(seed) > 0.5 ? '#22C55E' : '#10B981';

  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh && child.userData.isWindow) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = 0.2 + Math.sin(clock.elapsedTime * 1.5 + i + seed) * 0.15;
      }
    });
  });

  const windows = useMemo(() => {
    const rows = Math.floor(height * 3);
    const cols = Math.floor(width * 4);
    const items: [number, number, number][] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (seededRandom(seed + r * 17 + c) > 0.35) {
          items.push([
            (c - cols / 2) * 0.14 + width / 2 - 0.08,
            0.12 + r * 0.22,
            depth / 2 + 0.02,
          ]);
        }
      }
    }
    return items;
  }, [height, width, depth, seed]);

  return (
    <group ref={group} position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#0a1224" emissive={accent} emissiveIntensity={0.08} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, height + 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.04, 0.3, 6]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.8} />
      </mesh>
      {windows.map((w, i) => (
        <mesh key={i} position={w} userData={{ isWindow: true }}>
          <planeGeometry args={[0.08, 0.1]} />
          <meshStandardMaterial color="#1e293b" emissive={accent} emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function DeliveryRider({ path, speed = 0.08, color = '#22C55E' }: { path: THREE.Vector3[]; speed?: number; color?: string }) {
  const ref = useRef<THREE.Group>(null!);
  const trail = useRef<THREE.Mesh>(null!);
  const curve = useMemo(() => new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0.4), [path]);

  useFrame(({ clock }) => {
    const t = (clock.elapsedTime * speed) % 1;
    const p = curve.getPoint(t);
    const ahead = curve.getPoint((t + 0.02) % 1);
    ref.current.position.copy(p);
    ref.current.lookAt(ahead);
    if (trail.current) {
      trail.current.scale.x = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.1;
    }
  });

  return (
    <group ref={ref}>
      <mesh ref={trail} position={[0, 0.05, -0.25]}>
        <boxGeometry args={[0.08, 0.02, 0.35]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.28, 0.18, 0.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.14, 0.22]}>
        <boxGeometry args={[0.26, 0.14, 0.18]} />
        <meshStandardMaterial color="#0F172A" emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <pointLight position={[0, 0.1, 0.35]} intensity={0.4} color={color} distance={1.2} />
    </group>
  );
}

function StreetGrid() {
  const lines = useMemo(() => {
    const pts: THREE.Vector3[][] = [];
    for (let i = -5; i <= 5; i++) {
      pts.push([new THREE.Vector3(i, 0.02, -5.5), new THREE.Vector3(i, 0.02, 5.5)]);
      pts.push([new THREE.Vector3(-5.5, 0.02, i), new THREE.Vector3(5.5, 0.02, i)]);
    }
    return pts;
  }, []);

  return (
    <>
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color="#22C55E" lineWidth={1} transparent opacity={i % 2 === 0 ? 0.12 : 0.06} />
      ))}
    </>
  );
}

function CityScene() {
  const buildings = useMemo(() => {
    const items: { pos: [number, number, number]; w: number; d: number; h: number; seed: number }[] = [];
    let seed = 1;
    for (let x = -4.5; x <= 4.5; x += 1.4) {
      for (let z = -4.5; z <= 4.5; z += 1.4) {
        if (Math.abs(x) < 0.8 && Math.abs(z) < 0.8) continue;
        const h = 0.6 + seededRandom(seed) * 2.4;
        const w = 0.55 + seededRandom(seed + 1) * 0.35;
        items.push({ pos: [x, 0, z], w, d: w * 0.85, h, seed: seed++ });
      }
    }
    return items;
  }, []);

  const mainRoute = useMemo(
    () => [
      new THREE.Vector3(-4.2, 0.08, -3.5),
      new THREE.Vector3(-2, 0.08, -2),
      new THREE.Vector3(0, 0.08, -0.5),
      new THREE.Vector3(1.5, 0.08, 1.2),
      new THREE.Vector3(3.2, 0.08, 2.8),
      new THREE.Vector3(4.5, 0.08, 4),
    ],
    [],
  );

  const crossRoute = useMemo(
    () => [
      new THREE.Vector3(4, 0.08, -4),
      new THREE.Vector3(2.5, 0.08, -1),
      new THREE.Vector3(0.5, 0.08, 0.5),
      new THREE.Vector3(-2, 0.08, 2.5),
      new THREE.Vector3(-4, 0.08, 4.2),
    ],
    [],
  );

  const orbitRoute = useMemo(
    () => [
      new THREE.Vector3(-3.5, 0.25, 0),
      new THREE.Vector3(-1, 0.35, -2.5),
      new THREE.Vector3(2, 0.4, -1.5),
      new THREE.Vector3(3.5, 0.35, 1.5),
      new THREE.Vector3(0, 0.3, 3.5),
      new THREE.Vector3(-3.5, 0.25, 0),
    ],
    [],
  );

  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 15, 8]} intensity={0.5} color="#a7f3d0" />
      <pointLight position={[0, 6, 0]} intensity={0.8} color="#22C55E" />
      <pointLight position={[-6, 4, -4]} intensity={0.5} color="#10B981" />
      <Stars radius={100} depth={50} count={1200} factor={4} saturation={0.1} fade speed={0.3} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial color="#030712" />
      </mesh>

      <StreetGrid />

      {buildings.map((b, i) => (
        <FuturisticTower
          key={i}
          position={[b.pos[0], b.h / 2, b.pos[2]]}
          width={b.w}
          depth={b.d}
          height={b.h}
          seed={b.seed}
        />
      ))}

      <Line points={mainRoute} color="#22C55E" lineWidth={2.5} transparent opacity={0.7} />
      <Line points={crossRoute} color="#10B981" lineWidth={2} transparent opacity={0.55} />
      <Line points={orbitRoute} color="#34d399" lineWidth={1.5} transparent opacity={0.35} />

      <DeliveryRider path={mainRoute} speed={0.09} color="#22C55E" />
      <DeliveryRider path={crossRoute} speed={0.13} color="#10B981" />
      <DeliveryRider path={orbitRoute} speed={0.06} color="#34d399" />

      <Float speed={1.5} floatIntensity={0.5}>
        <group position={[2.5, 2.2, -2]}>
          <mesh>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color="#22C55E" emissive="#22C55E" emissiveIntensity={0.9} />
          </mesh>
        </group>
      </Float>
      <Float speed={2} floatIntensity={0.6}>
        <group position={[-3, 2.8, 1.5]}>
          <mesh>
            <boxGeometry args={[0.1, 0.07, 0.1]} />
            <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.9} />
          </mesh>
        </group>
      </Float>
    </>
  );
}

function CameraRig() {
  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime * 0.08;
    camera.position.x = 9 + Math.sin(t) * 1.2;
    camera.position.z = 9 + Math.cos(t) * 1.2;
    camera.lookAt(0, 0.5, 0);
  });
  return null;
}

export function HeroCanvas() {
  return (
    <div className="absolute inset-0 opacity-80 [mask-image:linear-gradient(to_bottom,black_15%,transparent_92%)]">
      <Canvas
        camera={{ position: [9, 8, 9], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <CityScene />
        <CameraRig />
      </Canvas>
    </div>
  );
}
