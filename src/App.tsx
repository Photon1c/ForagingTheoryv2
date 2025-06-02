import './App.css';
import RaceSimulation from './components/RaceSimulation';
import Buffet2D from './components/2Dbuffet';
import { useState } from 'react';
// import { Canvas } from '@react-three/fiber'; // No longer needed here
// import { OrbitControls, Box } from '@react-three/drei'; // No longer needed here
// import * as THREE from 'three'; // No longer needed here

// function MinimalTestScene() { ... } // Remove minimal scene

function App() {
  // Shared simulation state
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [playerCount, setPlayerCount] = useState<number>(4);
  const [foodAmount, setFoodAmount] = useState<number>(100);
  const [minutes, setMinutes] = useState<number>(1);
  const [isSimulationRunning, setIsSimulationRunning] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Only show parameter bar before simulation starts
  const showParameterBar = !isSimulationRunning && !isGameOver && mode === '3d';
  // Only show switch to 2D mode button after simulation starts
  const showSwitch2D = isSimulationRunning && !isGameOver && mode === '3d';

  // Handler to start simulation
  const startSimulation = () => {
    setIsGameOver(false);
    setIsSimulationRunning(true);
  };
  // Handler to play again (reset to parameter bar)
  const handlePlayAgain = () => {
    setIsGameOver(false);
    setIsSimulationRunning(false);
    setMode('3d');
  };

  return (
    <div>
      {/* Parameter bar (only before simulation starts, in 3D mode) */}
      {showParameterBar && (
        <div className="w-full flex flex-row items-center px-2 py-2 bg-white z-10" style={{ position: 'absolute', top: 0, left: 0 }}>
          <label htmlFor="playerCount" className="text-xs mr-1 whitespace-nowrap text-gray-800">Players:</label>
          <input
            id="playerCount"
            type="number"
            min="1"
            max="8"
            value={playerCount}
            onChange={(e) => setPlayerCount(Math.max(1, Math.min(8, parseInt(e.target.value) || 1)))}
            className="px-1 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-400 w-10 text-center text-xs"
            style={{ height: 28 }}
          />
          <label htmlFor="foodAmount" className="text-xs ml-2 mr-1 whitespace-nowrap text-gray-800">Food:</label>
          <input
            id="foodAmount"
            type="number"
            min="1"
            max="30000"
            value={foodAmount}
            onChange={(e) => setFoodAmount(Math.max(1, Math.min(20000, parseInt(e.target.value) || 1)))}
            className="px-1 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-400 w-12 text-center text-xs"
            style={{ height: 28 }}
          />
          <label htmlFor="minutes" className="text-xs ml-2 mr-1 whitespace-nowrap text-gray-800">Minutes:</label>
          <input
            id="minutes"
            type="number"
            min="1"
            max="720"
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, Math.min(720, parseInt(e.target.value) || 1)))}
            className="px-1 py-0.5 rounded bg-gray-100 text-gray-900 border border-gray-400 w-12 text-center text-xs"
            style={{ height: 28 }}
          />
          <button
            onClick={startSimulation}
            className="ml-2 rounded bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors border border-blue-700"
            style={{ height: 28, padding: '0 14px', minWidth: 0, lineHeight: 1.1 }}
          >
            Start
          </button>
        </div>
      )}
      {/* Switch to 2D mode button (only after simulation starts) */}
      {showSwitch2D && (
        <div style={{ position: 'absolute', top: 36, right: 24, zIndex: 100, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setMode('2d')}
            style={{
              background: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              padding: '2px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              opacity: 0.92,
              transition: 'background 0.2s',
              minHeight: 0,
              minWidth: 0,
              lineHeight: 1.1,
            }}
          >
            Switch to 2D Mode
          </button>
        </div>
      )}
      {/* 3D or 2D simulation view */}
      {mode === '3d' ? (
        <RaceSimulation
          playerCount={playerCount}
          foodAmount={foodAmount}
          isSimulationRunning={isSimulationRunning}
          isGameOver={isGameOver}
          setIsGameOver={setIsGameOver}
          setIsSimulationRunning={setIsSimulationRunning}
          handlePlayAgain={handlePlayAgain}
        />
      ) : (
        <Buffet2D
          playerCount={playerCount}
          foodAmount={foodAmount}
          minutes={minutes}
          isSimulationRunning={isSimulationRunning}
          isGameOver={isGameOver}
          setIsGameOver={setIsGameOver}
          setIsSimulationRunning={setIsSimulationRunning}
          handlePlayAgain={handlePlayAgain}
          switchTo3D={() => setMode('3d')}
        />
      )}
    </div>
  );
}

export default App;
