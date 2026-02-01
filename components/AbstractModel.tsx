import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere, Cylinder, OrbitControls, Text, Float, Ring, ContactShadows, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { CheckStep } from '../types';

export type ModelVariant = 'soft' | 'medical';

interface AbstractModelProps {
  step: CheckStep;
  onInteract: () => void;
  handPosition?: { x: number; y: number } | null;
  freeRoam?: boolean;
  variant?: ModelVariant;
}

// Anatomical Positions - adjusted for better framing
const POS_LEFT: [number, number, number] = [-1.3, -0.3, 0];
const POS_RIGHT: [number, number, number] = [1.3, -0.7, 0]; 

// --- ANATOMICAL COMPONENTS ---

/**
 * Procedural Epididymis
 * Simulates the collected tube structure on the posterior margin.
 */
const Epididymis = ({ color, active }: { color: string, active: boolean }) => {
  const curve = useMemo(() => {
    // Tighter, more anatomical C-curve wrapping the back
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 1.1, -0.1),   // Head Top
      new THREE.Vector3(-0.1, 1.2, -0.3),  // Head Back
      new THREE.Vector3(-0.2, 0.8, -0.7),  // Neck
      new THREE.Vector3(-0.25, -0.2, -0.85), // Body
      new THREE.Vector3(-0.1, -0.9, -0.7), // Tail Start
      new THREE.Vector3(0.05, -1.0, -0.4), // Tail End
    ]);
  }, []);

  return (
    <group>
        <mesh>
            <tubeGeometry args={[curve, 64, 0.25, 16, false]} />
            <meshPhysicalMaterial 
                color={color} 
                roughness={0.5}
                clearcoat={0.3}
                clearcoatRoughness={0.4}
                envMapIntensity={0.8}
            />
        </mesh>
        {/* Epididymal Head (Globus Major) Detail */}
        <mesh position={[-0.05, 1.15, -0.25]} scale={[1, 0.7, 1]}>
             <sphereGeometry args={[0.35, 32, 32]} />
             <meshPhysicalMaterial 
                color={color} 
                roughness={0.6} 
                clearcoat={0.3} 
                envMapIntensity={0.8}
             />
        </mesh>
    </group>
  );
};

/**
 * Spermatic Cord
 */
const SpermaticCord = ({ color }: { color: string }) => {
    return (
        <group position={[0, 2.1, -0.3]} rotation={[0.08, 0, 0]}>
            <mesh>
                <cylinderGeometry args={[0.2, 0.25, 2.5, 32]} />
                <meshPhysicalMaterial 
                    color={color} 
                    roughness={0.6} 
                    clearcoat={0.1}
                />
            </mesh>
        </group>
    )
}

/**
 * The Main Anatomical Unit
 */
const AnatomicalTesticle = ({ 
  position, 
  active, 
  onClick,
  isHoveredByHand = false,
  label,
  side
}: { 
  position: [number, number, number]; 
  active: boolean;
  onClick?: () => void;
  isHoveredByHand?: boolean;
  label: string;
  side: 'left' | 'right';
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  
  const wasHandHovered = useRef(false);
  if (isHoveredByHand && !wasHandHovered.current) {
     if (onClick) onClick();
     wasHandHovered.current = true;
  } else if (!isHoveredByHand) {
     wasHandHovered.current = false;
  }

  const isInteracting = hovered || isHoveredByHand;

  useFrame((state) => {
    if (groupRef.current) {
        const t = state.clock.getElapsedTime();
        // Organic idle movement
        groupRef.current.position.y = position[1] + Math.sin(t * 0.3 + (side === 'left' ? 0 : 2)) * 0.03;
        
        // Responsive Rotation
        const targetRot = isInteracting ? 0.5 : 0;
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRot, 0.05);
        groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.05; // Slight tilt

        // Scale feedback
        const targetScale = isInteracting ? 1.02 : 1;
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  // Realistic Medical Silicone Colors
  const tissueColor = "#eecaca"; // Pale organic pink
  const epididymisColor = "#e6bcbc"; // Slightly deeper
  const activeColor = "#fca5a5"; // Warmer when active

  return (
    <group ref={groupRef} position={position}>
        {/* Label */}
        <Float speed={2} rotationIntensity={0.05} floatIntensity={0.2}>
            <Text 
                position={[0, 2.8, 0]} 
                fontSize={0.15} 
                color="white" 
                anchorX="center" 
                anchorY="middle"
                fillOpacity={isInteracting ? 0.9 : 0.4}
                outlineWidth={0.01}
                outlineColor="#000000"
                outlineOpacity={0.2}
            >
                {label.toUpperCase()}
            </Text>
        </Float>

        <group 
            onPointerOver={() => setHover(true)}
            onPointerOut={() => setHover(false)}
            onClick={onClick}
        >
            {/* Testis Body */}
            <mesh scale={[1.0, 1.3, 1.0]}>
                <sphereGeometry args={[1, 64, 64]} /> 
                <meshPhysicalMaterial 
                    color={isInteracting ? activeColor : tissueColor}
                    roughness={0.4}       // Smooth but not glass
                    metalness={0.0}
                    clearcoat={0.8}       // High clearcoat for wet membrane look (Tunica)
                    clearcoatRoughness={0.2}
                    sheen={0.5}           // Fuzziness of tissue
                    sheenColor="#ffffff"
                    transmission={0}      // Opaque
                    reflectivity={0.5}
                    envMapIntensity={1}   // Strong reflections from studio environment
                />
            </mesh>

            <Epididymis 
                color={isInteracting ? activeColor : epididymisColor} 
                active={isInteracting}
            />

            <SpermaticCord color={isInteracting ? activeColor : epididymisColor} />
        </group>

        {/* Selected State Ring */}
        {isInteracting && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}>
                <ringGeometry args={[1.2, 1.25, 64]} />
                <meshBasicMaterial color="#2dd4bf" transparent opacity={0.6} />
            </mesh>
        )}
    </group>
  );
};

// --- CURSOR COMPONENT ---

const VirtualScannerCursor = ({ 
    handPosition,
    onProximity,
}: {
    handPosition: { x: number, y: number } | null;
    onProximity: (target: 'LEFT' | 'RIGHT' | null) => void;
}) => {
    const { viewport } = useThree();
    const groupRef = useRef<THREE.Group>(null);
    const ringRef = useRef<THREE.Mesh>(null);
    const [target, setTarget] = useState<'LEFT' | 'RIGHT' | null>(null);

    useFrame((state, delta) => {
        if (!handPosition || !groupRef.current) return;
        
        // Map 2D normalized hand pos to 3D Viewport
        // CameraView mirrors video, so x=0 is left visually.
        // x comes in 0..1.
        const x = (1 - handPosition.x - 0.5) * viewport.width; 
        const y = (1 - handPosition.y - 0.5) * viewport.height * -1;
        
        groupRef.current.position.lerp(new THREE.Vector3(x, y, 2), 0.3); 

        // Collision Detection
        const cursorWorldPos = groupRef.current.position.clone().setZ(0);
        const distLeft = cursorWorldPos.distanceTo(new THREE.Vector3(...POS_LEFT));
        const distRight = cursorWorldPos.distanceTo(new THREE.Vector3(...POS_RIGHT));

        const THRESHOLD = 1.5;
        let newTarget: 'LEFT' | 'RIGHT' | null = null;
        if (distLeft < THRESHOLD) newTarget = 'LEFT';
        else if (distRight < THRESHOLD) newTarget = 'RIGHT';

        setTarget(newTarget);
        onProximity(newTarget);

        // Animation
        if (ringRef.current) {
            ringRef.current.rotation.z -= delta * (newTarget ? 4 : 1);
            const scale = newTarget ? 1.2 : 1;
            groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
        }
    });

    if (!handPosition) return null;

    return (
        <group ref={groupRef}>
            {/* Medical Reticle Design */}
            <mesh ref={ringRef}>
                <ringGeometry args={[0.25, 0.26, 64]} />
                <meshBasicMaterial color={target ? "#2dd4bf" : "white"} transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh>
                <circleGeometry args={[0.03, 16]} />
                <meshBasicMaterial color={target ? "#2dd4bf" : "white"} />
            </mesh>
            {/* Crosshairs */}
            <mesh position={[0.3, 0, 0]}>
                <planeGeometry args={[0.1, 0.01]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} />
            </mesh>
            <mesh position={[-0.3, 0, 0]}>
                <planeGeometry args={[0.1, 0.01]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 0.3, 0]} rotation={[0,0,Math.PI/2]}>
                <planeGeometry args={[0.1, 0.01]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, -0.3, 0]} rotation={[0,0,Math.PI/2]}>
                <planeGeometry args={[0.1, 0.01]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} />
            </mesh>

            {target && (
                 <Text position={[0, -0.5, 0]} fontSize={0.1} color="#2dd4bf">
                    ANALYZING
                 </Text>
            )}
        </group>
    );
}

// --- MAIN SCENE ---

export const AbstractModel: React.FC<AbstractModelProps> = ({ 
    step, 
    onInteract, 
    handPosition, 
    freeRoam = false, 
}) => {
  const [handTarget, setHandTarget] = useState<'LEFT' | 'RIGHT' | null>(null);
  const isHandTouching = (targetName: string) => handTarget === targetName;

  return (
    <div className="w-full h-full min-h-[400px] relative bg-slate-950">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={40} />
        
        {/* PRO STUDIO LIGHTING */}
        {/* Environment map provides realistic reflections */}
        <Environment preset="city" blur={1} />
        
        <ambientLight intensity={0.2} color="#ccfbf1" />
        <spotLight position={[5, 10, 5]} angle={0.5} penumbra={1} intensity={1} castShadow color="white" />
        <pointLight position={[-5, 0, -5]} intensity={0.5} color="#2dd4bf" />

        <group position={[0, 0.5, 0]}>
            <AnatomicalTesticle 
                position={POS_LEFT} 
                active={freeRoam || step === CheckStep.LEFT_TESTICLE}
                isHoveredByHand={isHandTouching('LEFT')}
                onClick={() => onInteract()}
                label="Left Testicle"
                side="left"
            />
            <AnatomicalTesticle 
                position={POS_RIGHT} 
                active={freeRoam || step === CheckStep.RIGHT_TESTICLE}
                isHoveredByHand={isHandTouching('RIGHT')}
                onClick={() => onInteract()}
                label="Right Testicle"
                side="right"
            />
        </group>

        <VirtualScannerCursor 
            handPosition={handPosition || null} 
            onProximity={setHandTarget} 
        />

        <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={10} blur={2.5} far={4} />

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          minPolarAngle={Math.PI / 3} 
          maxPolarAngle={Math.PI / 1.8}
          rotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Floating Instructions */}
      <div className="absolute bottom-6 w-full flex justify-center pointer-events-none">
        <div className={`
            px-4 py-2 rounded-full border backdrop-blur-md transition-all duration-500
            ${handPosition ? 'bg-teal-900/50 border-teal-500/50 text-teal-100' : 'bg-slate-900/50 border-slate-700/50 text-slate-400'}
        `}>
          <span className="text-sm font-medium tracking-wide">
            {handPosition ? "Scanner Active: Hover to Examine" : "Digital Twin Mode"}
          </span>
        </div>
      </div>
    </div>
  );
};
