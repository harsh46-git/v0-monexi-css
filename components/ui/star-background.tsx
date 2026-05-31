"use client";

import React, { useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";

const NetworkMesh = (props: any) => {
  const meshRef = useRef<any>();

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Very slow rotation for a subtle effect
      meshRef.current.rotation.x += delta / 50;
      meshRef.current.rotation.y += delta / 60;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      {/* Using Float makes it gently bob up and down, adding life.
        We use a TorusKnot for complex, interesting geometry.
      */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={meshRef} scale={[3.5, 3.5, 3.5]} position={[0, 0, -2]}>
          {/* args: [radius, tube, tubularSegments, radialSegments, p, q] */}
          {/* Lower segments = chunkier, more "digital" look */}
          <torusKnotGeometry args={[1, 0.3, 128, 16]} />
          <meshBasicMaterial
            color="#10b981" // Monexi Green
            wireframe={true}
            transparent={true}
            opacity={0.15} // Very subtle opacity
          />
        </mesh>
      </Float>
    </group>
  );
};

const ThreeDBackground = () => {
  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1], fov: 50 }}>
        {/* Adds subtle reflections to make it look more 3D */}
        {/* <Environment preset="city" /> */}
        <Suspense fallback={null}>
          <NetworkMesh />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default ThreeDBackground;