import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Box, Grid, Text } from '@react-three/drei';
import * as THREE from 'three';

interface RackViewerProps {
  p: number; // Panjang (cm) - mapped to X axis
  l: number; // Lebar (cm) - mapped to Z axis
  t: number; // Tinggi (cm) - mapped to Y axis
  susun: number; // Jumlah susun
  displayP?: number;
  displayL?: number;
  displayT?: number;
  unit?: string;
  usePlates?: boolean;
}

const RackViewer: React.FC<RackViewerProps> = ({ p, l, t, susun, displayP, displayL, displayT, unit, usePlates = true }) => {
  // Scale down cm to meters for the 3D scene representation
  const widthX = p / 100;
  const depthZ = l / 100;
  const heightY = t / 100;
  const thickness = 0.04; // 4cm 

  // Position of shelves based on number of tiers (1st is at bottom, last is at top)
  const shelves = [];
  for (let i = 0; i < susun; i++) {
    // If only 1 tier, place at heightY. Otherwise distribute from bottom allowance up to heightY
    let yPos = i * (heightY / (susun - 1 || 1));
    if (susun === 1) yPos = heightY;
    if (i === 0 && susun > 1) {
      // Bottom shelf usually has a slight gap from floor, like 10cm. 
      yPos = 0.1;
    } else if (i === susun - 1 && susun > 1) {
      // Top shelf is flush with top
      yPos = heightY - thickness / 2;
    }
    shelves.push(yPos);
  }

  // Material for the iron structure
  const ironMaterial = new THREE.MeshStandardMaterial({ 
    color: '#374151', // Dark Gray
    roughness: 0.7,
    metalness: 0.3
  });

  // Material for the boards/shelves
  const boardMaterial = new THREE.MeshStandardMaterial({
    color: '#D1D5DB', // Light Gray
    roughness: 0.9,
    metalness: 0.1
  });

  // Material for the plat siku (Zinc / Gold color)
  const plateMaterial = new THREE.MeshStandardMaterial({
    color: '#fcd34d', // Yellow/Gold
    roughness: 0.3,
    metalness: 0.6
  });

  const plateSize = 0.08; // 8cm
  const plateThick = 0.003; // 3mm for visibility

  return (
    <div className="w-full h-full min-h-[400px] bg-slate-900 rounded-lg overflow-hidden relative shadow-inner">
      <div className="absolute bottom-4 left-4 z-10 text-xs text-slate-500">
        Drag untuk memutar. Scroll untuk zoom.
      </div>
      <Canvas camera={{ position: [widthX * 1.5 + 1, heightY + 1, depthZ * 1.5 + 1], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-5, 5, 5]} intensity={0.8} />

        {/* Center the rack at origin */}
        <group position={[-widthX / 2, 0, -depthZ / 2]}>
          {/* Dimension Labels */}
          <Text position={[widthX / 2, heightY + 0.1, depthZ]} fontSize={0.08} color="#fbbf24" anchorX="center" anchorY="bottom" outlineWidth={0.005} outlineColor="#000000">
            P: {p} cm
          </Text>
          <Text position={[widthX + 0.1, heightY + 0.1, depthZ / 2]} fontSize={0.08} color="#fbbf24" anchorX="center" anchorY="bottom" rotation={[0, Math.PI / 2, 0]} outlineWidth={0.005} outlineColor="#000000">
            L: {l} cm
          </Text>
          <Text position={[-0.1, heightY / 2, depthZ]} fontSize={0.08} color="#fbbf24" anchorX="right" anchorY="middle" outlineWidth={0.005} outlineColor="#000000">
            T: {t} cm
          </Text>

          {/* Vertical Posts */}
          <Box args={[thickness, heightY, thickness]} position={[0, heightY / 2, 0]} material={ironMaterial} />
          <Box args={[thickness, heightY, thickness]} position={[widthX, heightY / 2, 0]} material={ironMaterial} />
          <Box args={[thickness, heightY, thickness]} position={[0, heightY / 2, depthZ]} material={ironMaterial} />
          <Box args={[thickness, heightY, thickness]} position={[widthX, heightY / 2, depthZ]} material={ironMaterial} />

          {/* Shelves & Horizontal Beams */}
          {shelves.map((y, idx) => (
            <group key={idx} position={[0, y, 0]}>
              {/* Length Beams */}
              <Box args={[widthX, thickness, thickness]} position={[widthX / 2, 0, 0]} material={ironMaterial} />
              <Box args={[widthX, thickness, thickness]} position={[widthX / 2, 0, depthZ]} material={ironMaterial} />
              
              {/* Width Beams */}
              <Box args={[thickness, thickness, depthZ]} position={[0, 0, depthZ / 2]} material={ironMaterial} />
              <Box args={[thickness, thickness, depthZ]} position={[widthX, 0, depthZ / 2]} material={ironMaterial} />

              {/* Shelf Board */}
              <Box args={[widthX - thickness, thickness / 2, depthZ - thickness]} position={[widthX / 2, thickness / 4, depthZ / 2]} material={boardMaterial} />
              
              {/* Corner Plates (Plat Siku) */}
              {(usePlates && (idx === 0 || idx === susun - 1)) && (
                [
                  { x: 0, z: 0, signX: 1, signZ: 1 },
                  { x: widthX, z: 0, signX: -1, signZ: 1 },
                  { x: 0, z: depthZ, signX: 1, signZ: -1 },
                  { x: widthX, z: depthZ, signX: -1, signZ: -1 }
                ].map((corner, cIdx) => {
                  const signY = idx === 0 ? 1 : -1;
                  const yOffset = signY * 0.02; // Position slightly vertically
                  return (
                    <group key={`plat-${cIdx}`}>
                      {/* X-axis plate */}
                      <Box 
                        args={[plateSize, plateSize, plateThick]} 
                        position={[corner.x + corner.signX * (plateSize/2), yOffset, corner.z + corner.signZ * 0.0215]} 
                        material={plateMaterial} 
                      />
                      {/* Z-axis plate */}
                      <Box 
                        args={[plateThick, plateSize, plateSize]} 
                        position={[corner.x + corner.signX * 0.0215, yOffset, corner.z + corner.signZ * (plateSize/2)]} 
                        material={plateMaterial} 
                      />
                    </group>
                  );
                })
              )}
            </group>
          ))}
        </group>

        {/* Floor Grid */}
        <Grid position={[0, -0.01, 0]} args={[10, 10]} fadeDistance={20} fadeStrength={1} cellColor="#475569" sectionColor="#1e293b" />
        
        <OrbitControls makeDefault minDistance={0.5} maxDistance={20} target={[0, heightY / 2, 0]} />
      </Canvas>
    </div>
  );
};

export default RackViewer;