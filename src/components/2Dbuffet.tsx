import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Types for our simulation
interface Player {
  id: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  velocity: THREE.Vector3;
  score: number;
  color: string;
}

interface FoodItem {
  id: number;
  position: THREE.Vector4;
  type: 'cube' | 'sphere' | 'triangle';
  consumed: boolean;
  color: string;
}

// 4D Vector class to handle 4D operations
class Vector4 extends THREE.Vector4 {
  constructor(x = 0, y = 0, z = 0, w = 0) {
    super(x, y, z, w);
  }

  // Project 4D to 3D based on w-coordinate
  projectTo3D(): THREE.Vector3 {
    const wComponent = this.w;
    // Prevent division by zero or very small numbers if w is close to -5
    const denominator = 5 + wComponent;
    if (Math.abs(denominator) < 0.0001) {
        // Handle singularity: project as if w is very large or very small, or return a default
        // For now, let's assume a large w, pushing it far away (small scale)
        // Or, alternatively, treat as w=0 for a 1:1 projection if w is problematic.
        // A simple safe fallback:
        if (denominator === 0) return new THREE.Vector3(this.x, this.y, this.z); // or some other default like (0,0,0)
    }
    const scale = 5 / denominator;

    return new THREE.Vector3(
      this.x * scale,
      this.y * scale,
      this.z * scale
    );
  }
}

// Player component
const PlayerMesh: React.FC<{ player: Player }> = ({ player }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.copy(player.position);
      meshRef.current.quaternion.copy(player.quaternion);
    }
  });

  return (
    <mesh ref={meshRef} position={player.position}>
      <coneGeometry args={[0.5, 1.5, 8]} />
      <meshStandardMaterial color={player.color} />
    </mesh>
  );
};

// Food item component
const FoodItemMesh: React.FC<{ item: FoodItem }> = ({ item }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const projectedPosition = new Vector4(
    item.position.x,
    item.position.y,
    item.position.z,
    item.position.w
  ).projectTo3D();

  projectedPosition.y = -0.4; // Place items slightly above ground plane to avoid z-fighting, ground is at -0.5

  if (item.consumed) return null;

  return (
    <mesh ref={meshRef} position={projectedPosition}>
      {item.type === 'cube' && <boxGeometry args={[0.8, 0.8, 0.8]} />}
      {item.type === 'sphere' && <sphereGeometry args={[0.5, 16, 16]} />}
      {item.type === 'triangle' && <tetrahedronGeometry args={[0.6]} />}
      <meshStandardMaterial color={item.color} />
    </mesh>
  );
};

// Simulation logic component
const Simulation: React.FC<{
  playerCount: number,
  foodAmount: number,
  setScores: React.Dispatch<React.SetStateAction<number[]>>,
  isGameOver: boolean
}> = ({ playerCount, foodAmount, setScores, isGameOver }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  
  // Initialize simulation
  useEffect(() => {
    // Temporarily disable all logic within useEffect
    /*
    // Camera setup is now fully handled by the <Canvas> prop and OrbitControls default target or explicit target prop.
    // No camera manipulation in this useEffect needed.
    */
    // Create players
    const newPlayers: Player[] = [];
    const playerColors = [
      '#FF5733', '#33FF57', '#3357FF', '#F3FF33', 
      '#FF33F3', '#33FFF3', '#F333FF', '#FFA533'
    ];
    
    for (let i = 0; i < playerCount; i++) {
      const angle = (i / playerCount) * Math.PI * 2;
      const radius = 10;
      
      newPlayers.push({
        id: i,
        position: new THREE.Vector3(
          Math.cos(angle) * radius,
          0.75, // Player height
          Math.sin(angle) * radius
        ),
        quaternion: new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          -angle // Pointing inwards initially, adjust if needed
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        score: 0,
        color: playerColors[i % playerColors.length]
      });
    }
    
    setPlayers(newPlayers);
    
    // Create food items in 4D space
    const newFoodItems: FoodItem[] = [];
    const foodTypes: ('cube' | 'sphere' | 'triangle')[] = ['cube', 'sphere', 'triangle'];
    const foodColors = ['#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF', '#99FFFF'];
    
    for (let i = 0; i < foodAmount; i++) {
      newFoodItems.push({
        id: i,
        position: new Vector4(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          Math.random() * 5
        ),
        type: foodTypes[Math.floor(Math.random() * foodTypes.length)],
        consumed: false,
        color: foodColors[Math.floor(Math.random() * foodColors.length)]
      });
    }
    
    setFoodItems(newFoodItems);
    
  }, [playerCount, foodAmount]); // Removed camera from dependencies as it's static here
  
  // Game loop
  useFrame((_, delta) => {
    // Temporarily disable all logic within useFrame
    /*
    if (isGameOver || players.length === 0 || foodItems.length === 0) return;
    */
    if (isGameOver) return; // Simplified condition for stopping updates
    if (players.length === 0 || foodItems.length === 0) {
      // If there are no players or food, there's nothing to update.
      // This can happen if initialization hasn't completed or if all food is consumed etc.
      // console.log("Skipping frame: No players or food items.");
      return;
    }
    
    // Update player positions
    const updatedPlayers = players.map(p => ({...p, velocity: new THREE.Vector3(p.velocity.x, p.velocity.y, p.velocity.z), position: new THREE.Vector3(p.position.x, p.position.y, p.position.z), quaternion: new THREE.Quaternion(p.quaternion.x, p.quaternion.y, p.quaternion.z, p.quaternion.w) })); // Deep clone
    const updatedFoodItems = foodItems.map(f => ({...f, position: new Vector4(f.position.x, f.position.y, f.position.z, f.position.w)})); // Deep clone
    let scoresChanged = false;
    
    updatedPlayers.forEach(player => {
      // AI movement logic - move toward nearest food
      const availableFoodItems = updatedFoodItems.filter(food => !food.consumed);
      
      if (availableFoodItems.length === 0) {
        player.velocity.set(0,0,0); // No food, stop moving
        return;
      }
      
      let nearestFood: FoodItem | null = null;
      let nearestDistanceSq = Infinity; // Use squared distance for comparison to avoid sqrt
      
      for (const food of availableFoodItems) {
        const foodPos3D = new Vector4(
          food.position.x,
          food.position.y,
          food.position.z,
          food.position.w
        ).projectTo3D();
        
        const distanceSq = player.position.distanceToSquared(foodPos3D);
        
        if (distanceSq < nearestDistanceSq) {
          nearestDistanceSq = distanceSq;
          nearestFood = food;
        }
      }

      if (!nearestFood) { // Should not happen if availableFoodItems is not empty
          player.velocity.set(0,0,0);
          return;
      }
      
      // Create a 3D projection of the food's 4D position
      const foodPos3D = new Vector4(
        nearestFood.position.x,
        nearestFood.position.y,
        nearestFood.position.z,
        nearestFood.position.w
      ).projectTo3D();
      foodPos3D.y = -0.4; // Ensure AI targets food on the ground level
      
      // Calculate direction to food
      const direction = new THREE.Vector3()
        .subVectors(foodPos3D, player.position);
      
      if (direction.lengthSq() > 0.0001) { // Only normalize and set velocity if there's a direction
        direction.normalize();
        const speed = 2 + Math.random() * 1; // Player speed
        player.velocity.x = direction.x * speed;
        player.velocity.z = direction.z * speed; // Movement is primarily in XZ plane
        player.velocity.y = 0; // Ensure players don't fly off
      } else {
        player.velocity.set(0,0,0); // Stop if no direction (already at target or very close)
      }
      
      // Look at food (only if there's a direction)
      if (direction.lengthSq() > 0.0001) {
        const lookAtTarget = new THREE.Vector3().copy(player.position).add(direction);
        // Ensure lookAt target is at the same height as the player for stable rotation
        lookAtTarget.y = player.position.y; 
        
        const targetQuaternion = new THREE.Quaternion();
        const lookAtMatrix = new THREE.Matrix4().lookAt(player.position, lookAtTarget, new THREE.Vector3(0, 1, 0));
        targetQuaternion.setFromRotationMatrix(lookAtMatrix);

        // Smoothly interpolate quaternion
        player.quaternion.slerp(targetQuaternion, 0.1);

      } // else, player keeps its current orientation
      
      // Update position
      player.position.x += player.velocity.x * delta;
      player.position.z += player.velocity.z * delta;
      player.position.y = 0.75; // Keep player on the ground (cone base is at y=0, height 1.5, so center is 0.75)
      
      // Check for food consumption
      // Use distance to the actual 3D position of food, not just nearestDistanceSq which could be to a different item if array order changed
      if (nearestFood && player.position.distanceToSquared(foodPos3D) < 1.2 * 1.2) { // 1.2 is consumption radius
        const foodToConsume = updatedFoodItems.find(f => f.id === nearestFood!.id);
        if (foodToConsume && !foodToConsume.consumed) {
            foodToConsume.consumed = true;
            player.score += 1;
            scoresChanged = true;
        }
      }
    });
    
    if (scoresChanged) {
      setScores(updatedPlayers.map(p => p.score));
    }
    
    setPlayers(updatedPlayers);
    setFoodItems(updatedFoodItems);
    
  });
  
  return (
    <>
      {/* Environment */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} />
      
      {/* Debug cube at origin */}
      {/* 
      <mesh position={[0,0,0]}>
        <boxGeometry args={[1,1,1]} />
        <meshStandardMaterial color="yellow" />
      </mesh>
      */}
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#444466" />
      </mesh>
      
      {/* 
      4D Axis indicators - Temporarily disable 
      <group>
        <mesh position={[12, 0, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="red" />
        </mesh>
        <Text position={[14, 0, 0]} color="red" fontSize={1}>
          X
        </Text>
        
        <mesh position={[0, 12, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="green" />
        </mesh>
        <Text position={[0, 14, 0]} color="green" fontSize={1}>
          Y
        </Text>
        
        <mesh position={[0, 0, 12]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        <Text position={[0, 0, 14]} color="blue" fontSize={1}>
          Z
        </Text>
        
        {/* <mesh position={[8, 8, 8]}> // W-axis indicator might be confusing for users
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="purple" />
        </mesh>
        <Text position={[9, 9, 9]} color="purple" fontSize={1}>
          W
        </Text> *//*}
      </group> 
      */}
      
      {/* Players */}
      {players.map(player => (
        <PlayerMesh key={player.id} player={player} />
      ))}
      
      {/* Food Items */}
      {foodItems.map(item => (
        !item.consumed && <FoodItemMesh key={item.id} item={item} />
      ))}
    </>
  );
};

interface Buffet2DProps {
  playerCount: number;
  foodAmount: number;
  minutes: number;
  isSimulationRunning: boolean;
  isGameOver: boolean;
  setIsGameOver: (v: boolean) => void;
  setIsSimulationRunning: (v: boolean) => void;
  handlePlayAgain: () => void;
  switchTo3D: () => void;
}

const Buffet2D: React.FC<Buffet2DProps> = ({
  playerCount,
  foodAmount,
  minutes,
  isSimulationRunning,
  isGameOver,
  setIsGameOver,
  setIsSimulationRunning,
  handlePlayAgain,
  switchTo3D,
}) => {
  const [scores, setScores] = useState<number[]>([]);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(minutes * 60);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isSimulationRunning && !isPaused && !isGameOver) {
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
  }, [isSimulationRunning, isPaused, isGameOver, setIsGameOver, setIsSimulationRunning]);

  useEffect(() => {
    setTimeLeft(minutes * 60);
  }, [minutes, isSimulationRunning]);

  const handlePauseResume = () => {
    setIsPaused((prev) => !prev);
  };

  // Game Over Screen
  const showGameOverScreen = !isSimulationRunning && isGameOver;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-900 text-white relative">
      {/* Game Over Screen - overlays Canvas */}
      {showGameOverScreen && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-20">
          <h1 className="text-4xl font-bold mb-4">Race Over!</h1>
          <h2 className="text-2xl mb-8">Final Scores:</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-8">
            {scores.map((score, index) => (
              <div key={index} className="flex items-center text-lg">
                <div
                  className="w-5 h-5 rounded-full mr-3 shadow-md"
                  style={{ backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3', '#F333FF', '#FFA533'][index % 8] }}
                />
                <span>Player {index + 1}: {score}</span>
              </div>
            ))}
          </div>
          <button
            onClick={handlePlayAgain}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-semibold transition-colors"
          >
            Play Again?
          </button>
        </div>
      )}
      {/* Canvas and In-Game UI - always rendered, visibility of UI elements controlled by state */}
      <div className={`w-full h-full ${isSimulationRunning && !isGameOver ? 'visible' : 'invisible'}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 60 }}>
        {/* Score Cards and Timer - only visible during active simulation */}
        {(isSimulationRunning && !isGameOver) && (
          <>
            <div className="absolute top-0 left-0 z-10 p-4 bg-black bg-opacity-70 text-white rounded-br-lg shadow-xl">
              <h2 className="text-xl font-bold mb-2">Score Cards</h2>
              <div className="grid grid-cols-2 gap-2">
                {scores.map((score, index) => (
                  <div key={index} className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3', '#33FFF3', '#F333FF', '#FFA533'][index % 8] }}
                    />
                    <span>Player {index + 1}: {score}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-4 right-4 z-10 p-3 bg-black bg-opacity-70 text-white rounded-lg shadow-xl flex items-center gap-4">
              <span className="font-mono text-2xl">Time: {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</span>
              <button
                onClick={handlePauseResume}
                className="ml-2 rounded bg-yellow-500 hover:bg-yellow-600 text-xs font-semibold text-black transition-colors border border-yellow-700 px-4 py-2"
              >
                {isPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={switchTo3D}
                className="ml-2 rounded bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors border border-blue-700 px-4 py-2"
              >
                Switch to 3D Mode
              </button>
            </div>
          </>
        )}
        <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', width: '100vw', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
          <Canvas camera={{ position: [0, 30, 0], up: [0, 1, 0], fov: 55, near: 0.1, far: 1000 }} style={{ width: '100vw', height: '100vh', display: 'block' }}>
            <Simulation playerCount={playerCount} foodAmount={foodAmount} setScores={setScores} isGameOver={isGameOver} />
          </Canvas>
        </div>
      </div>
    </div>
  );
};

export default Buffet2D; 
