import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  PerspectiveCamera, 
  OrbitControls, 
  Stars, 
  Float, 
  RoundedBox,
  MeshDistortMaterial,
  GradientTexture,
  ContactShadows,
  Environment,
  Text,
  Trail
} from '@react-three/drei';
import * as THREE from 'three';

// Engine Particles System
const EngineParticles = ({ active, multiplier }: { active: boolean, multiplier: number }) => {
  const group = useRef<THREE.Group>(null);
  const particleCount = 1500;
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.2; // x
      pos[i * 3 + 1] = -Math.random() * 2; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2; // z
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!group.current) return;
    const speed = active ? 0.3 + multiplier * 0.1 : 0.05;
    group.current.children.forEach((p, i) => {
      p.position.y -= speed;
      if (p.position.y < -5) {
        p.position.y = 0;
        p.position.x = (Math.random() - 0.5) * 0.3;
        p.position.z = (Math.random() - 0.5) * 0.3;
      }
    });
  });

  return (
    <group ref={group}>
      {Array.from({ length: 150 }).map((_, i) => (
        <mesh key={i} position={[
          (Math.random() - 0.5) * 0.4,
          -Math.random() * 4,
          (Math.random() - 0.5) * 0.4
        ]}>
          <boxGeometry args={[0.04, 0.04, 0.04]} />
          <meshBasicMaterial color={new THREE.Color().setHSL(0.05 + Math.random() * 0.1, 1, 0.5)} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

// Procedural Rocket Model
const RocketModel = ({ multiplier, gameState, active }: { multiplier: number, gameState: string, active: boolean }) => {
  const rocketRef = useRef<THREE.Group>(null);
  const engineRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!rocketRef.current) return;
    
    // Smooth Tilt & Sway
    const time = state.clock.getElapsedTime();
    if (gameState === 'RUNNING') {
      rocketRef.current.rotation.x = Math.sin(time * 2) * 0.05;
      rocketRef.current.rotation.z = Math.sin(time) * 0.1;
      // Slight lead into movement
      rocketRef.current.position.x = Math.sin(time * 0.5) * 0.2;
    } else {
      rocketRef.current.position.y = Math.sin(time * 2) * 0.1;
      rocketRef.current.rotation.z = Math.sin(time) * 0.05;
    }

    // Launch Shudder
    if (gameState === 'LAUNCHING') {
      const intensity = 0.05;
      rocketRef.current.position.x += (Math.random() - 0.5) * intensity;
      rocketRef.current.position.z += (Math.random() - 0.5) * intensity;
    }
  });

  return (
    <group ref={rocketRef}>
      {/* Tactical Main Fuselage */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 1.4, 24]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.9} emissive="#4f46e1" emissiveIntensity={0.1} />
      </mesh>
      
      {/* High-Impact Nose Cone */}
      <mesh position={[0, 1.25, 0]}>
        <coneGeometry args={[0.3, 0.7, 24]} />
        <meshStandardMaterial color="#e11d48" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Aerodynamic Fins */}
      {[0, 120, 240].map((angle, i) => (
        <group key={i} rotation={[0, THREE.MathUtils.degToRad(angle), 0]}>
          <mesh position={[0.35, -0.1, 0]} rotation={[0, 0, -0.3]}>
            <boxGeometry args={[0.1, 0.8, 0.4]} />
            <meshStandardMaterial color="#e11d48" metalness={0.5} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Observation Window */}
      <mesh position={[0, 0.5, 0.3]} rotation={[1.2, 0, 0]}>
        <torusGeometry args={[0.12, 0.02, 16, 32]} />
        <meshStandardMaterial color="#slate-400" />
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.11, 16, 16]} />
          <meshPhongMaterial color="#0ea5e9" shininess={100} transparent opacity={0.6} />
        </mesh>
      </mesh>

      {/* Engine Components */}
      <group position={[0, -0.45, 0]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.15, 0.3, 24]} />
          <meshStandardMaterial color="#1f2937" metalness={1} />
        </mesh>
        {/* Thrust Zone */}
        <EngineParticles active={active} multiplier={multiplier} />
      </group>
      
      {/* Speed Trails */}
      {active && (
        <Trail width={1.5} length={12} color={new THREE.Color('#e11d48')} attenuation={(t) => t * t}>
          <mesh position={[0, -0.3, 0]} visible={false} />
        </Trail>
      )}
    </group>
  );
};

// Moving Environment
const SpaceEnvironment = ({ multiplier, gameState }: { multiplier: number, gameState: string }) => {
  const gridRef = useRef<THREE.GridHelper>(null);
  const starsRef = useRef<any>(null);

  useFrame((state, delta) => {
    const speed = gameState === 'RUNNING' ? Math.min(20, multiplier * 2) : 0;
    
    if (gridRef.current) {
      gridRef.current.position.y -= delta * speed;
      if (gridRef.current.position.y < -10) gridRef.current.position.y = 10;
    }
  });

  return (
    <>
      <Stars ref={starsRef} radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      <gridHelper ref={gridRef} args={[100, 50, '#1e293b', '#0f172a']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -5]} />
      <Environment preset="night" />
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
    </>
  );
};

// Main Camera Rig with Dynamic Movement
const Rig = ({ multiplier, gameState }: { multiplier: number, gameState: string }) => {
  const { camera } = useThree();
  const pc = camera as THREE.PerspectiveCamera;
  const vec = new THREE.Vector3();
  const target = new THREE.Vector3();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (gameState === 'RUNNING' && pc.isPerspectiveCamera) {
      // Dynamic Height based on Multiplier
      const targetY = (multiplier - 1) * 2;
      
      // Intense Screen Shake as Multiplier increases
      const shakeIntensity = Math.min(0.25, (multiplier - 1) * 0.02);
      const shakeX = Math.sin(time * 40) * shakeIntensity;
      const shakeY = Math.cos(time * 35) * shakeIntensity;
      
      // Dynamic FOV for "Speed" Feel
      pc.fov = THREE.MathUtils.lerp(pc.fov, 60 + Math.min(30, multiplier * 3), 0.05);
      pc.updateProjectionMatrix();

      // Smooth Chase Lag
      pc.position.lerp(vec.set(2, targetY + 2, 8 + (multiplier * 0.2)), 0.03);
      target.lerp(new THREE.Vector3(0, targetY + 1, 0), 0.1);
      pc.lookAt(target);
      
      pc.position.x += shakeX;
      pc.position.y += shakeY;
    } else if (gameState === 'CRASHED' && pc.isPerspectiveCamera) {
      const shake = (Math.random() - 0.5) * 0.8;
      pc.position.x += shake;
      pc.position.y += shake;
      pc.fov = THREE.MathUtils.lerp(pc.fov, 85, 0.1);
      pc.updateProjectionMatrix();
    } else if (pc.isPerspectiveCamera) {
      pc.fov = THREE.MathUtils.lerp(pc.fov, 60, 0.05);
      pc.updateProjectionMatrix();
      pc.position.lerp(vec.set(0, 0, 8), 0.05);
      pc.lookAt(0, 0, 0);
    }
  });

  return null;
};

// Main 3D Stage
const Stage = ({ multiplier, gameState }: { multiplier: number, gameState: string }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetY = useRef(0);

  useFrame((state, delta) => {
    if (gameState === 'RUNNING') {
      // Smoother vertical movement tied to multiplier
      targetY.current = (multiplier - 1) * 2;
    } else if (gameState === 'IDLE' || gameState === 'WAITING') {
      targetY.current = 0;
    }

    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY.current, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <RocketModel multiplier={multiplier} gameState={gameState} active={gameState === 'RUNNING'} />
    </group>
  );
};

export const Rocket3DScene = ({ multiplier, gameState }: { multiplier: number, gameState: string }) => {
  return (
    <div className="w-full h-full bg-slate-950">
      <Canvas shadows dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault fov={60} position={[0, 0, 8]} />
        
        <SpaceEnvironment multiplier={multiplier} gameState={gameState} />
        
        <Stage multiplier={multiplier} gameState={gameState} />

        {/* Speed Tracers */}
        {gameState === 'RUNNING' && (
          <Stars radius={50} depth={100} count={3000} factor={6} saturation={0} fade speed={multiplier * 2} />
        )}

        <Rig multiplier={multiplier} gameState={gameState} />
      </Canvas>
    </div>
  );
};
