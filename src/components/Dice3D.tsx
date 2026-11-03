import React, { useEffect, useState, useRef } from 'react';
import { PlayerColor, COLOR_HEX } from '../lib/ludoEngine.js';
import {
  DICE_FACE_ANGLES,
  DICE_PIP_POSITIONS,
  calculateRollAngles,
  DiceRotation,
} from '../lib/diceOrientation.js';

interface Dice3DProps {
  value: number | null;
  isRolling: boolean;
  canRoll: boolean;
  onRoll: () => void;
  color: PlayerColor;
  size?: 'sm' | 'md' | 'lg';
}

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  canRoll,
  onRoll,
  color,
  size = 'md',
}) => {
  const colorTheme = COLOR_HEX[color] || COLOR_HEX.red;

  // Pixel dimensions based on size
  const dimensionConfig = {
    sm: { cubeSize: 44, half: 22, pipSize: 6, p1PipSize: 10, perspective: 450 },
    md: { cubeSize: 58, half: 29, pipSize: 8, p1PipSize: 14, perspective: 600 },
    lg: { cubeSize: 72, half: 36, pipSize: 10, p1PipSize: 18, perspective: 750 },
  }[size];

  const { cubeSize, half, pipSize, p1PipSize, perspective } = dimensionConfig;

  // Stored accumulated rotation angles to ensure forward tumbling
  const rotationRef = useRef<DiceRotation>({ rotateX: -14, rotateY: 18, rotateZ: 0 });
  const [rotation, setRotation] = useState<DiceRotation>(rotationRef.current);
  const [isLanding, setIsLanding] = useState(false);
  const prevIsRollingRef = useRef(isRolling);
  const tumbleIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manage tumbling and landing transitions
  useEffect(() => {
    // Phase 1: Rolling Starts -> rapid 3D tumbling sequence
    if (isRolling) {
      setIsLanding(false);
      let step = 0;
      if (tumbleIntervalRef.current) clearInterval(tumbleIntervalRef.current);

      tumbleIntervalRef.current = setInterval(() => {
        step += 1;
        // Generate dynamic continuous multi-axis tumbling
        rotationRef.current = {
          rotateX: rotationRef.current.rotateX + 90 + Math.sin(step) * 45,
          rotateY: rotationRef.current.rotateY + 120 + Math.cos(step) * 45,
          rotateZ: rotationRef.current.rotateZ + 45,
        };
        setRotation({ ...rotationRef.current });
      }, 70);

      prevIsRollingRef.current = true;
      return () => {
        if (tumbleIntervalRef.current) clearInterval(tumbleIntervalRef.current);
      };
    }

    // Phase 2: Rolling Ends -> Decelerate and settle squarely on authoritative value
    if (prevIsRollingRef.current && !isRolling) {
      if (tumbleIntervalRef.current) {
        clearInterval(tumbleIntervalRef.current);
        tumbleIntervalRef.current = null;
      }

      const targetVal = value !== null && value >= 1 && value <= 6 ? value : 1;
      const targetAngles = calculateRollAngles(targetVal, rotationRef.current, 2);
      rotationRef.current = targetAngles;
      setRotation(targetAngles);

      // Trigger landing bounce
      setIsLanding(true);
      const timer = setTimeout(() => {
        setIsLanding(false);
      }, 350);

      prevIsRollingRef.current = false;
      return () => clearTimeout(timer);
    }

    // Phase 3: External authoritative update when not actively rolling (e.g., initial state or online sync)
    if (!isRolling && value !== null && value >= 1 && value <= 6) {
      const baseAngles = DICE_FACE_ANGLES[value];
      // If angles differ significantly, align to face
      const diffX = Math.abs((rotationRef.current.rotateX % 360) - baseAngles.rotateX);
      const diffY = Math.abs((rotationRef.current.rotateY % 360) - baseAngles.rotateY);
      if (diffX > 5 || diffY > 5) {
        const next = calculateRollAngles(value, rotationRef.current, 0);
        rotationRef.current = next;
        setRotation(next);
      }
    }
    prevIsRollingRef.current = isRolling;
  }, [isRolling, value]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tumbleIntervalRef.current) clearInterval(tumbleIntervalRef.current);
    };
  }, []);

  // Render individual face pips with realistic recessed styling
  const renderFacePips = (faceNum: number) => {
    const coords = DICE_PIP_POSITIONS[faceNum] || [];
    const isSinglePip = faceNum === 1;

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 sm:p-2 pointer-events-none select-none">
        {Array.from({ length: 9 }).map((_, idx) => {
          const r = Math.floor(idx / 3);
          const c = idx % 3;
          const hasPip = coords.some(([pr, pc]) => pr === r && pc === c);

          if (!hasPip) {
            return <div key={idx} />;
          }

          const currentPipPx = isSinglePip ? p1PipSize : pipSize;
          const isRed = isSinglePip || faceNum === 6;

          return (
            <div key={idx} className="flex items-center justify-center">
              <div
                style={{
                  width: `${currentPipPx}px`,
                  height: `${currentPipPx}px`,
                  backgroundColor: isRed ? '#e11d48' : '#0f172a',
                  boxShadow: isRed
                    ? 'inset 0 1.5px 2px rgba(0,0,0,0.6), 0 0 4px rgba(225,29,72,0.5)'
                    : 'inset 0 1.5px 2px rgba(0,0,0,0.8), 0 0.5px 1px rgba(255,255,255,0.7)',
                }}
                className="rounded-full transition-transform"
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Face CSS definition helper
  const faceStyle = (transform: string): React.CSSProperties => ({
    position: 'absolute',
    width: `${cubeSize}px`,
    height: `${cubeSize}px`,
    transform,
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 45%, #e2e8f0 100%)',
    border: '1.5px solid rgba(203, 213, 225, 0.9)',
    boxShadow:
      'inset 0 1px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 3px rgba(15, 23, 42, 0.12), inset 0 0 5px rgba(0, 0, 0, 0.05)',
  });

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      style={{
        perspective: `${perspective}px`,
        width: `${cubeSize + 16}px`,
        height: `${cubeSize + 20}px`,
      }}
    >
      {/* Radiant Glow Pulse when player is authorized to roll */}
      {canRoll && !isRolling && (
        <span
          className="absolute inset-0 m-auto rounded-3xl opacity-50 animate-ping pointer-events-none"
          style={{
            width: `${cubeSize + 10}px`,
            height: `${cubeSize + 10}px`,
            backgroundColor: colorTheme.primary,
          }}
        />
      )}

      {/* Realistic Dynamic Ground Contact Shadow */}
      <div
        className="absolute bottom-1 pointer-events-none transition-all duration-300"
        style={{
          width: `${cubeSize * 0.9}px`,
          height: '10px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 60%, transparent 80%)',
          transform: isRolling
            ? 'scale(0.7) translateY(4px)'
            : isLanding
            ? 'scale(1.2)'
            : 'scale(1.0)',
          opacity: isRolling ? 0.35 : 0.85,
          filter: isRolling ? 'blur(3px)' : 'blur(1px)',
        }}
      />

      {/* 3D Dice Interactive Cube Container */}
      <div
        role="button"
        tabIndex={canRoll ? 0 : -1}
        onClick={canRoll && !isRolling ? onRoll : undefined}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && canRoll && !isRolling) {
            e.preventDefault();
            onRoll();
          }
        }}
        aria-label={`Dice showing ${value ?? 'ready to roll'}${canRoll ? ', Click to roll' : ''}`}
        className={`relative transition-transform duration-150 ${
          canRoll && !isRolling
            ? 'cursor-pointer hover:scale-108 active:scale-95'
            : 'cursor-default'
        }`}
        style={{
          width: `${cubeSize}px`,
          height: `${cubeSize}px`,
          transformStyle: 'preserve-3d',
          transform: `translate3d(0, ${isRolling ? -16 : isLanding ? 3 : 0}px, 0)`,
          transition: isRolling
            ? 'transform 100ms ease-out'
            : isLanding
            ? 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 300ms ease-out',
        }}
      >
        {/* The 6-Faced CSS 3D Cube */}
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) rotateZ(${rotation.rotateZ}deg)`,
            transition: isRolling
              ? 'transform 70ms linear'
              : 'transform 650ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'transform',
          }}
        >
          {/* Face 1: Front */}
          <div style={faceStyle(`rotateY(0deg) translateZ(${half}px)`)}>
            {renderFacePips(1)}
          </div>

          {/* Face 6: Back (Opposite to 1) */}
          <div style={faceStyle(`rotateY(180deg) translateZ(${half}px)`)}>
            {renderFacePips(6)}
          </div>

          {/* Face 2: Top */}
          <div style={faceStyle(`rotateX(90deg) translateZ(${half}px)`)}>
            {renderFacePips(2)}
          </div>

          {/* Face 5: Bottom (Opposite to 2) */}
          <div style={faceStyle(`rotateX(-90deg) translateZ(${half}px)`)}>
            {renderFacePips(5)}
          </div>

          {/* Face 3: Right */}
          <div style={faceStyle(`rotateY(90deg) translateZ(${half}px)`)}>
            {renderFacePips(3)}
          </div>

          {/* Face 4: Left (Opposite to 3) */}
          <div style={faceStyle(`rotateY(-90deg) translateZ(${half}px)`)}>
            {renderFacePips(4)}
          </div>
        </div>
      </div>
    </div>
  );
};
