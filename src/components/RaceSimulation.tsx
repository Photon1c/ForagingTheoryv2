import { useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';
// Make THREE available globally for OrbitControls.js
if (typeof window !== 'undefined') {
  (window as any).THREE = THREE;
}
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import React, { forwardRef } from 'react';
import { EffectComposer, Outline } from '@react-three/postprocessing';
import { extend } from '@react-three/fiber';
import { updateBuffetPlayers } from './buffetplayers';
extend({ OrbitControls: OrbitControlsImpl });

// TypeScript: allow <orbitControls /> in JSX
declare global {
  namespace JSX {
    interface IntrinsicElements {
      orbitControls: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & { ref?: any; args?: any };
    }
  }
}

// Types for our simulation
interface Player {
  id: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  score: number;
  color: string;
  isJumping?: boolean;
  verticalVelocity?: number;
}

interface FoodItem {
  id: number;
  position: THREE.Vector3;
  type: 'cube' | 'sphere' | 'triangle';
  consumed: boolean;
  color: string;
}

// Player outline color palette
const outlineColors = [
  '#1976d2', // blue
  '#43a047', // green
  '#d32f2f', // red
  '#fbc02d', // yellow
  '#8e24aa', // purple
  '#f57c00', // orange
  '#00838f', // teal
  '#c2185b', // pink
];

// Player component with outline, now using forwardRef
const PlayerMesh = forwardRef<null, { player: Player; meshArrayRef: React.MutableRefObject<THREE.Mesh[]>; isFollowed: boolean; onClick: () => void }>(
  ({ player, meshArrayRef, isFollowed, onClick }, _ref) => {
    const groupRef = useRef<THREE.Group>(null);
    const gltf = useGLTF('/models/workert.glb');
    const outlineColor = outlineColors[player.id % outlineColors.length];
    const [hovered, setHovered] = useState(false);
    // Collect all meshes after model load
    useLayoutEffect(() => {
      if (gltf && gltf.scene && groupRef.current) {
        const meshes: THREE.Mesh[] = [];
        groupRef.current.traverse(obj => {
          if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
        });
        meshArrayRef.current = meshes;
      }
    }, [gltf]);
    useFrame(() => {
      if (groupRef.current) {
        groupRef.current.position.copy(player.position);
        groupRef.current.quaternion.copy(player.quaternion);
      }
    });
    return (
      <group ref={groupRef} scale={[0.5, 0.5, 0.5]}>
        {/* Larger color circle above player, now clickable */}
        <mesh
          position={[0, 12, 0]}
          onClick={onClick}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <circleGeometry args={[3, 64]} />
          <meshBasicMaterial color={outlineColor} transparent opacity={0.85} />
        </mesh>
        {isFollowed && (
          <mesh position={[0, 12, 0]}>
            <circleGeometry args={[3.4, 64]} />
            <meshBasicMaterial color={'white'} transparent opacity={0.7} />
          </mesh>
        )}
        {gltf && gltf.scene ? (
          <primitive object={gltf.scene.clone()} />
        ) : (
          <mesh position={player.position} scale={[0.5, 0.5, 0.5]}>
            <coneGeometry args={[0.5, 1.5, 8]} />
            <meshStandardMaterial color={player.color} />
          </mesh>
        )}
        {/* Set pointer cursor on hover */}
        {hovered && (
          <primitive object={document.body} style={{ cursor: 'pointer' }} />
        )}
      </group>
    );
  }
);

// Food item component
const FoodItemMesh: React.FC<{ item: FoodItem }> = ({ item }) => {
  const meshRef = useRef<THREE.Group>(null);
  const position = item.position.clone();
  const gltf = useGLTF('/models/food.glb');

  if (item.consumed) return null;

  // Place apple on ground: y = -0.5 + apple base offset
  const adjustedPosition = position.clone();
  adjustedPosition.y = -0.5 + 0.5; // ground + apple base offset
  return (
    <group ref={meshRef} position={adjustedPosition} scale={[5, 5, 5]}>
      {gltf && gltf.scene ? (
        <primitive object={gltf.scene.clone()} />
      ) : (
        <mesh>
          <sphereGeometry args={[0.2, 4, 4]} />
          <meshStandardMaterial color={item.color} />
        </mesh>
      )}
    </group>
  );
};

// --- Add a constant for map boundaries ---
const MAP_SIZE = 40; // Map is from -MAP_SIZE to +MAP_SIZE in x and z (half as big)

// --- Update Player AI logic to respect boundaries ---
// (We will pass MAP_SIZE to updateBuffetPlayers and clamp positions after update)

const INSTRUCTIONS = `\n[Base Template] This is a foundational project for foraging theory experiments. Advanced concepts and features are in development.\n\n🍽️ Welcome to Buffet Race! 🍽️\n\nThis simulation is inspired by foraging theory and natural systems.\n\nApplications & Concepts:\n\n- 🦉 Foraging Theory: Study how agents (players) search for and consume resources (food) in a shared environment.\n- 🧑‍🤝‍🧑 Producer-Scrounger Models: Explore how some agents find food while others exploit their discoveries.\n- 🦆 Ideal Free Distribution: See how agents distribute themselves among food patches to maximize intake.\n- 🌳 Marginal Value Theorem: Understand when agents should leave a depleted patch for a richer one.\n- 🏗️ Asset Modeling: Use this as a base for 3D asset or crowd simulation.\n- 🌱 Natural Systems: Model animal, human, or robot foraging, resource competition, and more!\n\nControls:\n- Press 'Start' to begin the race.\n- Use the parameters bar to set player and food count.\n- Press 'i' to toggle these instructions.\n- Watch the scorecard for live results!\n\nHave fun exploring! 🚀`;

// --- Main component ---
interface RaceSimulationProps {
  playerCount: number;
  foodAmount: number;
  minutes: number;
  isSimulationRunning: boolean;
  isGameOver: boolean;
  setIsGameOver: (v: boolean) => void;
  setIsSimulationRunning: (v: boolean) => void;
  handlePlayAgain: () => void;
}

const RaceSimulation: React.FC<RaceSimulationProps> = ({
  playerCount,
  foodAmount,
  minutes,
  isSimulationRunning,
  isGameOver,
  setIsGameOver,
  setIsSimulationRunning,
  handlePlayAgain,
}) => {
  const [scores, setScores] = useState<number[]>([]);
  const [foodLeft, setFoodLeft] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60); // Initial time: 60 seconds
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const timerRef = useRef<number | null>(null);
  const meshArrayRefs = React.useRef(Array.from({ length: playerCount }, () => ({ current: [] as THREE.Mesh[] }))).current;
  // Memoize all meshes for Outline
  const allPlayerMeshes = React.useMemo(
    () => meshArrayRefs.slice(0, playerCount).flatMap(ref => ref.current || []),
    [playerCount]
  );
  const [followedPlayerId, setFollowedPlayerId] = useState<number | null>(null);
  const [runMode, setRunMode] = useState(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // Hide the title after 15 seconds
  useEffect(() => {
    if (showTitle) {
      const t = setTimeout(() => setShowTitle(false), 15000);
      return () => clearTimeout(t);
    }
  }, [showTitle]);

  useEffect(() => {
    if (isSimulationRunning && !isGameOver) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            setIsGameOver(true);
            setIsSimulationRunning(false);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isSimulationRunning, isGameOver]);

  // Callback for Simulation to notify when food runs out
  const handleFoodDepleted = () => {
    setIsGameOver(true);
    setIsSimulationRunning(false);
  };

  // Keyboard handler for instructions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        setShowInstructions((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        setRunMode((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-screen bg-gray-900 text-white relative overflow-hidden flex flex-col" style={{ margin: 0, padding: 0 }}>
      {/* Instructions Modal */}
      {showInstructions && <DraggableResizableInstructionsModal onClose={() => setShowInstructions(false)} />}
      {/* Fixed parameters bar at the top, only before race starts */}
      {/* Parameter bar removed: now handled by App.tsx */}
      {/* Top right title with instructions prompt */}
      <div className="absolute top-2 right-2 z-50 flex items-center gap-4 justify-end" style={{ fontSize: 15, fontWeight: 700, color: '#1976d2', whiteSpace: 'nowrap', letterSpacing: 0.5, textAlign: 'right' }}>
        <span>Foraging Algorithms: Buffet Race Experiment</span>
        <span style={{ fontWeight: 500, color: '#fff', background: '#222', borderRadius: 6, padding: '2px 10px', fontSize: 12, marginLeft: 8, opacity: 0.92 }}>
          (Press <b>I</b> for instructions)
        </span>
        <a
          href="https://github.com/Photon1c/ForagingTheoryv2"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontWeight: 500, color: '#fff', background: '#222', borderRadius: 6, padding: '2px 10px', fontSize: 12, marginLeft: 8, opacity: 0.92, textDecoration: 'none' }}
        >
          Git
        </a>
      </div>
      {/* Top horizontal scoreboard bar with player scores, timer, and right-aligned label */}
      {(isSimulationRunning || isGameOver) && (
        <div className="w-full flex flex-row items-center px-2 py-1" style={{ background: '#f8f9fa', borderBottom: '1px solid #e5e7eb', fontSize: 13, minHeight: 28, position: 'relative' }}>
          <div className="flex-1 flex flex-row items-center justify-center gap-x-4">
            {scores.map((score, index) => {
              const colorEmojis = ['🔵', '🟢', '🟣', '🟡', '🟠', '🟤', '🔴', '⚫'];
              return (
                <span key={index} className="flex items-center gap-x-1">
                  <span>{colorEmojis[index % colorEmojis.length]}</span>
                  <span className="font-bold">P{index + 1}:</span>
                  <span className="font-mono">{score}</span>
                </span>
              );
            })}
            <span className="flex items-center gap-x-1 font-mono">
              <span>⏱</span>
              <span>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
            </span>
            <span className="flex items-center gap-x-1 font-mono">
              <span role="img" aria-label="food">🍏</span>
              <span>{foodLeft} left</span>
            </span>
          </div>
        </div>
      )}
      {/* Full-width, full-height canvas below scoreboard */}
      <div className="w-full flex-1 flex items-center justify-center relative" style={{ height: 'calc(100vh - 28px)', minHeight: 0 }}>
        {(isSimulationRunning || isGameOver) && (
          <>
            <Canvas style={{ width: '100%', height: '100%', display: 'block' }} camera={{ position: [12, 10, 12], up: [0, 1, 0], fov: 60, near: 0.1, far: 1000 }}>
              <ambientLight intensity={0.5} />
              <CustomOrbitControls />
              <FPSControls />
              {Array.isArray(allPlayerMeshes) && allPlayerMeshes.length > 0 && (
                <EffectComposer>
                  <Outline
                    selection={allPlayerMeshes}
                    edgeStrength={10}
                    visibleEdgeColor={outlineColors[0] ? new THREE.Color(outlineColors[0]).getHex() : 0xffffff}
                    hiddenEdgeColor={new THREE.Color('black').getHex()}
                    blur
                    xRay
                  />
                </EffectComposer>
              )}
              <Simulation
                playerCount={playerCount}
                setScores={setScores}
                isGameOver={isGameOver}
                isSimulationRunning={isSimulationRunning}
                foodAmount={foodAmount}
                mapSize={MAP_SIZE}
                onFoodDepleted={handleFoodDepleted}
                meshArrayRefs={meshArrayRefs}
                followedPlayerId={followedPlayerId}
                setFollowedPlayerId={setFollowedPlayerId}
                runMode={runMode}
                setFoodLeft={setFoodLeft}
              />
            </Canvas>
            {/* Blinking instructions prompt at bottom center */}
            <BlinkingInstructionsPrompt onClick={() => setShowInstructions(true)} />
            {/* Game Over Overlay */}
            {isGameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 z-20">
                <h1 className="text-4xl font-bold mb-4">Race Over!</h1>
                <button
                  onClick={handlePlayAgain}
                  className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-semibold transition-colors"
                >
                  Play Again?
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Bottom center blinking instructions prompt */}
      <BlinkingInstructionsPrompt onClick={() => setShowInstructions(true)} />
    </div>
  );
};

// --- Update Simulation to accept foodAmount and mapSize, and clamp player positions ---
const TILE_COLS = 2; // Fewer, larger wall tiles
const TILE_ROWS = 2;

// Helper to clamp hue to [0, 1]
// function clampHue(h: number) {
//   return (h % 1 + 1) % 1;
// }

// Instanced food mesh for high food counts
function InstancedFoodMesh({ items }: { items: FoodItem[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const gltf = useGLTF('/models/food.glb');
  // Only unconsumed items
  const filtered = items.filter(item => !item.consumed);
  useEffect(() => {
    if (!meshRef.current) return;
    filtered.forEach((item, i) => {
      const m = new THREE.Matrix4();
      // Place apple on ground: y = -0.5 + apple base offset
      m.setPosition(item.position.x, -0.5 + 0.5, item.position.z);
      meshRef.current!.setMatrixAt(i, m);
    });
    meshRef.current.count = filtered.length;
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [filtered]);
  if (!gltf || !gltf.scene) return null;
  // Find the first mesh in the GLTF scene
  let meshObj: any = null;
  gltf.scene.traverse((obj: any) => {
    if (!meshObj && (obj as THREE.Mesh).isMesh) meshObj = obj;
  });
  if (!meshObj || !(meshObj instanceof THREE.Mesh)) return null;
  return (
    <instancedMesh ref={meshRef} args={[meshObj.geometry as THREE.BufferGeometry, meshObj.material as THREE.Material, filtered.length]} scale={[5, 5, 5]} />
  );
}

const Simulation: React.FC<{
  playerCount: number,
  setScores: React.Dispatch<React.SetStateAction<number[]>>,
  isGameOver: boolean,
  isSimulationRunning: boolean,
  foodAmount: number,
  mapSize: number,
  onFoodDepleted: () => void,
  meshArrayRefs: React.MutableRefObject<THREE.Mesh[]>[],
  followedPlayerId: number | null,
  setFollowedPlayerId: (id: number) => void,
  runMode: boolean,
  setFoodLeft: React.Dispatch<React.SetStateAction<number>>,
}> = ({ playerCount, setScores, isGameOver, isSimulationRunning, foodAmount, mapSize, onFoodDepleted, meshArrayRefs, followedPlayerId, setFollowedPlayerId, runMode, setFoodLeft }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  // Load backdrop texture
  const backdropTexture = useTexture('/models/backdrop.png');
  // Load grass texture for ground
  const grassTexture = useTexture('/models/grass.png');
  // Make grass tile smaller and brighter
  if (grassTexture) {
    grassTexture.wrapS = grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(16, 16);
  }
  // Memoize wall tile data for consistency
  const wallTiles = useMemo(() => {
    function makeTiles() {
      const tiles = [];
      for (let row = 0; row < TILE_ROWS; row++) {
        for (let col = 0; col < TILE_COLS; col++) {
          // Alternate flipping and offset for more differentiation
          const flipX = (col + row) % 2 === 0;
          const flipY = (col + row) % 2 === 1;
          // Random zoom: 0.7 to 1.3
          const zoom = 0.7 + Math.random() * 0.6;
          // Random offset for zoomed tile (allow full vertical range for clouds)
          const offsetX = Math.random() * (1 - 1 / zoom);
          const offsetY = Math.random() * (1 - 1 / zoom);
          tiles.push({ row, col, flipX, flipY, zoom, offsetX, offsetY });
        }
      }
      return tiles;
    }
    return {
      back: makeTiles(),
      front: makeTiles(),
      left: makeTiles(),
      right: makeTiles(),
    };
  }, []);

  // Initialize simulation
  useEffect(() => {
    // Create players
    const newPlayers: Player[] = [];
    const playerColors = [
      '#FF5733', '#33FF57', '#3357FF', '#F3FF33', 
      '#FF33F3', '#33FFF3', '#F333FF', '#FFA533'
    ];
    for (let i = 0; i < playerCount; i++) {
      const angle = (i / playerCount) * Math.PI * 2;
      const radius = mapSize * 0.75;
      newPlayers.push({
        id: i,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          0.5,
          Math.sin(angle) * radius
        ),
        quaternion: new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -angle
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        score: 0,
        color: playerColors[i % playerColors.length],
        isJumping: false,
        verticalVelocity: 0,
      });
    }
    setPlayers(newPlayers);
    // Create food items in 3D space (on ground)
    const newFoodItems: FoodItem[] = [];
    const foodTypes: ('cube' | 'sphere' | 'triangle')[] = ['cube', 'sphere', 'triangle'];
    const foodColors = ['#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF', '#99FFFF'];
    for (let i = 0; i < foodAmount; i++) {
      // Clamp spawn to inside the ground plane (avoid edges)
      const min = -mapSize + 0.5;
      const max = mapSize - 0.5;
      newFoodItems.push({
        id: i,
        position: new THREE.Vector3(
          Math.random() * (max - min) + min, // x: min to max
          0.5,
          Math.random() * (max - min) + min // z: min to max
        ),
        type: foodTypes[Math.floor(Math.random() * foodTypes.length)],
        consumed: false,
        color: foodColors[Math.floor(Math.random() * foodColors.length)]
      });
    }
    setFoodItems(newFoodItems);
  }, [playerCount, foodAmount, mapSize]);

  // Game loop
  useFrame((_, delta) => {
    if (players.length === 0 || foodItems.length === 0) return;
    let updatedPlayers = players;
    let updatedFoodItems = foodItems;
    if (isSimulationRunning && !isGameOver) {
      // Only update positions and food if the game is running
      const speedMultiplier = runMode ? 8 : 1;
      const result = updateBuffetPlayers(players, foodItems, delta * speedMultiplier);
      updatedPlayers = result.players;
      updatedFoodItems = result.foodItems;
      // Clamp player positions to map boundaries
      updatedPlayers = updatedPlayers.map(p => {
        p.position.x = Math.max(-mapSize, Math.min(mapSize, p.position.x));
        p.position.z = Math.max(-mapSize, Math.min(mapSize, p.position.z));
        return p;
      });
      setPlayers(updatedPlayers);
      setFoodItems(updatedFoodItems);
      // If all food is consumed, trigger game over
      if (updatedFoodItems.every(item => item.consumed)) {
        onFoodDepleted();
      }
    }
    // Always update scores for the overlay
    setScores(updatedPlayers.map(p => p.score));
    setFoodLeft(updatedFoodItems.filter((f: FoodItem) => !f.consumed).length);
  });

  // Camera follow logic
  const { camera } = useThree();
  useFrame(() => {
    if (followedPlayerId !== null) {
      const player = players.find(p => p.id === followedPlayerId);
      if (player) {
        // Camera offset: behind and above the player
        const offset = new THREE.Vector3(0, 30, 40);
        const target = player.position.clone();
        camera.position.lerp(target.clone().add(offset), 0.1);
        camera.lookAt(target);
      }
    }
  });

  return (
    <>
      {/* Environment */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[mapSize * 2, mapSize * 2]} />
        <meshStandardMaterial map={grassTexture} color="#d6ffb3" />
      </mesh>
      {/* Procedural backdrop walls */}
      {/* Back wall (positive z) */}
      {wallTiles.back.map(({ row, col, flipX, flipY, zoom, offsetX, offsetY }, i) => (
        <mesh
          key={`back-${i}`}
          position={[
            -mapSize + (col + 0.5) * (mapSize * 2 / TILE_COLS),
            (row + 0.5) * (mapSize / TILE_ROWS / 2), // halve the wall height
            mapSize
          ]}
          rotation={[0, 0, 0]}
        >
          <planeGeometry args={[mapSize * 2 / TILE_COLS, mapSize / TILE_ROWS / 2]} />
          <meshBasicMaterial
            map={backdropTexture}
            toneMapped={false}
            color={'#eaf6ff'} // brighter wall tiles
            side={THREE.DoubleSide}
            transparent
            opacity={0.98}
          />
          <primitive
            object={(() => {
              // Set texture transform for this tile
              const tex = backdropTexture.clone();
              tex.needsUpdate = true;
              tex.repeat.set((flipX ? -1 : 1) / zoom, (flipY ? -1 : 1) / zoom);
              tex.offset.set(offsetX, offsetY);
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              return tex;
            })()}
            attach="material.map"
          />
        </mesh>
      ))}
      {/* Front wall (negative z) */}
      {wallTiles.front.map(({ row, col, flipX, flipY, zoom, offsetX, offsetY }, i) => (
        <mesh
          key={`front-${i}`}
          position={[
            -mapSize + (col + 0.5) * (mapSize * 2 / TILE_COLS),
            (row + 0.5) * (mapSize / TILE_ROWS / 2), // halve the wall height
            -mapSize
          ]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[mapSize * 2 / TILE_COLS, mapSize / TILE_ROWS / 2]} />
          <meshBasicMaterial
            map={backdropTexture}
            toneMapped={false}
            color={'#eaf6ff'} // brighter wall tiles
            side={THREE.DoubleSide}
            transparent
            opacity={0.98}
          />
          <primitive
            object={(() => {
              const tex = backdropTexture.clone();
              tex.needsUpdate = true;
              tex.repeat.set((flipX ? -1 : 1) / zoom, (flipY ? -1 : 1) / zoom);
              tex.offset.set(offsetX, offsetY);
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              return tex;
            })()}
            attach="material.map"
          />
        </mesh>
      ))}
      {/* Left wall (negative x) */}
      {wallTiles.left.map(({ row, col, flipX, flipY, zoom, offsetX, offsetY }, i) => (
        <mesh
          key={`left-${i}`}
          position={[
            -mapSize,
            (row + 0.5) * (mapSize * 2 / TILE_ROWS / 2), // half the previous wall height
            -mapSize + (col + 0.5) * (mapSize * 2 / TILE_COLS)
          ]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[mapSize * 2 / TILE_COLS, mapSize * 2 / TILE_ROWS / 2]} />
          <meshBasicMaterial
            map={backdropTexture}
            toneMapped={false}
            color={'#eaf6ff'} // brighter wall tiles
            side={THREE.DoubleSide}
            transparent
            opacity={0.98}
          />
          <primitive
            object={(() => {
              const tex = backdropTexture.clone();
              tex.needsUpdate = true;
              tex.repeat.set((flipX ? -1 : 1) / zoom, (flipY ? -1 : 1) / zoom);
              tex.offset.set(offsetX, offsetY);
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              return tex;
            })()}
            attach="material.map"
          />
        </mesh>
      ))}
      {/* Right wall (positive x) */}
      {wallTiles.right.map(({ row, col, flipX, flipY, zoom, offsetX, offsetY }, i) => (
        <mesh
          key={`right-${i}`}
          position={[
            mapSize,
            (row + 0.5) * (mapSize * 2 / TILE_ROWS / 2), // half the previous wall height
            -mapSize + (col + 0.5) * (mapSize * 2 / TILE_COLS)
          ]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[mapSize * 2 / TILE_COLS, mapSize * 2 / TILE_ROWS / 2]} />
          <meshBasicMaterial
            map={backdropTexture}
            toneMapped={false}
            color={'#eaf6ff'} // brighter wall tiles
            side={THREE.DoubleSide}
            transparent
            opacity={0.98}
          />
          <primitive
            object={(() => {
              const tex = backdropTexture.clone();
              tex.needsUpdate = true;
              tex.repeat.set((flipX ? -1 : 1) / zoom, (flipY ? -1 : 1) / zoom);
              tex.offset.set(offsetX, offsetY);
              tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
              return tex;
            })()}
            attach="material.map"
          />
        </mesh>
      ))}
      {/* Players */}
      {players.map((player, i) => (
        <PlayerMesh
          key={player.id}
          player={player}
          meshArrayRef={meshArrayRefs[i]}
          isFollowed={followedPlayerId === player.id}
          onClick={() => setFollowedPlayerId(player.id)}
        />
      ))}
      {/* Food Items: instanced for 15000+, normal for less */}
      {foodItems.length >= 15000 ? (
        <InstancedFoodMesh items={foodItems} />
      ) : (
        foodItems.map(item => (
          !item.consumed && <FoodItemMesh key={item.id} item={item} />
        ))
      )}
    </>
  );
};

// FPSControls: WASD/arrow keys, shift for speed, Q/E for yaw
function FPSControls() {
  const { camera } = useThree();
  const move = useRef({ forward: false, backward: false, left: false, right: false, boost: false, yawLeft: false, yawRight: false });
  const yaw = useRef(0);
  const baseSpeed = 0.5;
  const boostMultiplier = 3;
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': move.current.forward = true; break;
        case 'KeyS': case 'ArrowDown': move.current.backward = true; break;
        case 'KeyA': case 'ArrowLeft': move.current.left = true; break;
        case 'KeyD': case 'ArrowRight': move.current.right = true; break;
        case 'ShiftLeft': case 'ShiftRight': move.current.boost = true; break;
        case 'KeyQ': move.current.yawLeft = true; break;
        case 'KeyE': move.current.yawRight = true; break;
      }
    };
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': move.current.forward = false; break;
        case 'KeyS': case 'ArrowDown': move.current.backward = false; break;
        case 'KeyA': case 'ArrowLeft': move.current.left = false; break;
        case 'KeyD': case 'ArrowRight': move.current.right = false; break;
        case 'ShiftLeft': case 'ShiftRight': move.current.boost = false; break;
        case 'KeyQ': move.current.yawLeft = false; break;
        case 'KeyE': move.current.yawRight = false; break;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);
  useFrame((_, delta) => {
    let speed = baseSpeed * (move.current.boost ? boostMultiplier : 1);
    let dir = new THREE.Vector3();
    if (move.current.forward) dir.z -= 1;
    if (move.current.backward) dir.z += 1;
    if (move.current.left) dir.x -= 1;
    if (move.current.right) dir.x += 1;
    if (dir.lengthSq() > 0) {
      dir.normalize().applyAxisAngle(new THREE.Vector3(0,1,0), yaw.current);
      camera.position.addScaledVector(dir, speed);
    }
    // Q/E for yaw
    if (move.current.yawLeft) yaw.current += 1.5 * delta;
    if (move.current.yawRight) yaw.current -= 1.5 * delta;
    // Apply yaw to camera
    const target = new THREE.Vector3();
    camera.getWorldDirection(target);
    const r = Math.sqrt(target.x*target.x + target.z*target.z);
    const theta = Math.atan2(target.z, target.x) + yaw.current;
    target.x = Math.cos(theta) * r;
    target.z = Math.sin(theta) * r;
    camera.lookAt(camera.position.clone().add(target));
  });
  return null;
}

// Custom OrbitControls component with WASD/arrow key panning
function CustomOrbitControls() {
  const { camera, gl } = useThree();
  const controls = useRef<any>();
  useEffect(() => {
    if (!controls.current) return;
    // Set mouse button mapping: left=rotate, right=pan, middle=zoom
    controls.current.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    controls.current.enablePan = true;
    controls.current.enableRotate = true;
    controls.current.enableZoom = true;
    controls.current.enableDamping = true;
    controls.current.dampingFactor = 0.1;
    controls.current.minDistance = 10;
    controls.current.minPolarAngle = 0;
    controls.current.maxPolarAngle = Math.PI / 2;
    controls.current.target.set(0, 0.5, 0);
  }, []);
  useFrame(() => controls.current && controls.current.update());
  return (
    <orbitControls ref={controls} args={[camera, gl.domElement]} />
  );
}

// Custom hook for blinking prompt
function useBlinkingPrompt(interval = 30000, visibleDuration = 10000) {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    let timeout: any;
    let intervalId: any;
    function startCycle() {
      setVisible(true);
      timeout = setTimeout(() => setVisible(false), visibleDuration);
    }
    startCycle();
    intervalId = setInterval(startCycle, interval);
    return () => {
      clearTimeout(timeout);
      clearInterval(intervalId);
    };
  }, [interval, visibleDuration]);
  return visible;
}

// Blinking instructions prompt at bottom center
function BlinkingInstructionsPrompt({ onClick }: { onClick: () => void }) {
  const visible = useBlinkingPrompt(30000, 10000);
  return visible ? (
    <div
      className="fixed left-1/2 bottom-6 z-50 transform -translate-x-1/2 cursor-pointer select-none"
      style={{ animation: 'blink 1s steps(2, start) infinite', pointerEvents: 'auto' }}
      onClick={onClick}
    >
      <span className="text-xs font-semibold text-white bg-black bg-opacity-70 px-4 py-2 rounded shadow-lg border border-white">
        Press <b>I</b> for instructions
      </span>
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  ) : null;
}

// Draggable, resizable instructions modal with solid background
function DraggableResizableInstructionsModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [rel, setRel] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 150 });
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 400, h: 300 });
  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const rect = modalRef.current?.getBoundingClientRect();
    setDragging(true);
    setRel({ x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
    e.stopPropagation();
    e.preventDefault();
  };
  React.useEffect(() => {
    if (!dragging) return;
    const onMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - rel.x, y: e.clientY - rel.y });
    };
    const onMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, rel]);
  // Resize handlers
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const startW = size.w;
    const startH = size.h;
    const startX = e.clientX;
    const startY = e.clientY;
    const onMouseMove = (ev: MouseEvent) => {
      setSize({ w: Math.max(320, startW + (ev.clientX - startX)), h: Math.max(180, startH + (ev.clientY - startY)) });
    };
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ pointerEvents: 'auto', background: 'rgba(0,0,0,0.5)' }}>
      <div
        ref={modalRef}
        className="rounded-lg shadow-2xl p-4 relative animate-fade-in border border-gray-300"
        style={{
          background: '#222',
          color: '#fff',
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          width: size.w,
          height: size.h,
          minWidth: 320,
          minHeight: 180,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflow: 'auto',
          cursor: dragging ? 'move' : 'default',
          zIndex: 1001,
        }}
      >
        <div
          className="absolute top-0 left-0 w-full h-8 flex items-center px-3 cursor-move bg-blue-100 rounded-t-lg select-none"
          style={{ userSelect: 'none', fontWeight: 600, fontSize: 16, background: '#333', color: '#fff' }}
          onMouseDown={onMouseDown}
        >
          🍽️ Buffet Race Instructions
          <button onClick={onClose} className="absolute right-2 top-1 text-2xl text-gray-300 hover:text-white">×</button>
        </div>
        <div className="pt-8 pb-2 px-1" style={{ fontSize: 14, lineHeight: 1.5 }}>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#fff' }}>{INSTRUCTIONS}</pre>
        </div>
        {/* Resize handle */}
        <div
          className="absolute right-0 bottom-0 w-6 h-6 cursor-se-resize"
          style={{ zIndex: 1002 }}
          onMouseDown={onResizeMouseDown}
        >
          <svg width="24" height="24" viewBox="0 0 24 24"><path d="M0 24L24 0" stroke="#888" strokeWidth="2" /></svg>
        </div>
      </div>
    </div>
  );
}

export default RaceSimulation;
