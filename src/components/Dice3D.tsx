import React, { useEffect, useState, useRef, useCallback } from 'react';
import { PlayerColor, COLOR_HEX } from '../lib/ludoEngine.js';
import {
  DICE_FACE_ANGLES,
  DICE_PIP_POSITIONS,
  calculateRollAngles,
  DiceRotation,
} from '../lib/diceOrientation.js';
import { isReducedMotionPreferred } from '../lib/tokenAnimation.js';

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

  // Responsive cube & pip geometry
  const dimensionConfig = {
    sm: { cubeSize: 44, half: 22, pipSize: 7, perspective: 450 },
    md: { cubeSize: 58, half: 29, pipSize: 9, perspective: 600 },
    lg: { cubeSize: 72, half: 36, pipSize: 11, perspective: 750 },
  }[size];

  const { cubeSize, half, pipSize, perspective } = dimensionConfig;

  // DOM ref to the 3D cube element for direct GPU transform manipulation during rolling
  const cubeRef = useRef<HTMLDivElement | null>(null);

  // Stored accumulated rotation angles to ensure forward tumbling without reversals
  const rotationRef = useRef<DiceRotation>({ rotateX: -14, rotateY: 18, rotateZ: 0 });
  const [rotation, setRotation] = useState<DiceRotation>(rotationRef.current);
  const [isLanding, setIsLanding] = useState(false);

  // Animation frame and timer tracking
  const rafIdRef = useRef<number | null>(null);
  const landingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const prevIsRollingRef = useRef<boolean>(isRolling);

  // Stop active rAF loop
  const stopTumblingRaf = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  // Cleanup all timers and animation frames on unmount
  useEffect(() => {
    return () => {
      stopTumblingRaf();
      if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
  }, [stopTumblingRaf]);

  // Rolling lifecycle management
  useEffect(() => {
    const isReduced = isReducedMotionPreferred();

    // PHASE 1: Rolling starts -> Continuous smooth multi-axis tumbling
    if (isRolling) {
      setIsLanding(false);
      if (landingTimeoutRef.current) clearTimeout(landingTimeoutRef.current);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
      stopTumblingRaf();

      if (!isReduced) {
        lastTimestampRef.current = performance.now();

        const tumbleLoop = (now: number) => {
          const dt = Math.min((now - lastTimestampRef.current) / 1000, 0.05);
          lastTimestampRef.current = now;

          // Multi-axis continuous rotation (X and Y tumbling with subtle Z wobble)
          rotationRef.current.rotateX += dt * 680;
          rotationRef.current.rotateY += dt * 820;
          rotationRef.current.rotateZ = Math.sin(now * 0.006) * 18;

          if (cubeRef.current) {
            cubeRef.current.style.transition = 'none';
            cubeRef.current.style.transform = `rotateX(${rotationRef.current.rotateX}deg) rotateY(${rotationRef.current.rotateY}deg) rotateZ(${rotationRef.current.rotateZ}deg)`;
          }

          rafIdRef.current = requestAnimationFrame(tumbleLoop);
        };

        rafIdRef.current = requestAnimationFrame(tumbleLoop);
      }

      prevIsRollingRef.current = true;
      return;
    }

    // PHASE 2: Rolling ends -> Decelerate smoothly into the authoritative face
    if (prevIsRollingRef.current && !isRolling) {
      stopTumblingRaf();

      const targetVal = value !== null && value >= 1 && value <= 6 ? value : 1;
      const targetAngles = calculateRollAngles(
        targetVal,
        rotationRef.current,
        isReduced ? 0 : 2
      );
      rotationRef.current = targetAngles;
      setRotation(targetAngles);

      if (cubeRef.current) {
        if (isReduced) {
          cubeRef.current.style.transition = 'transform 120ms ease-out';
          cubeRef.current.style.transform = `rotateX(${targetAngles.rotateX}deg) rotateY(${targetAngles.rotateY}deg) rotateZ(0deg)`;
        } else {
          // Gradual deceleration curve over 850ms settling onto the authoritative face
          cubeRef.current.style.transition = 'transform 850ms cubic-bezier(0.16, 1, 0.3, 1)';
          cubeRef.current.style.transform = `rotateX(${targetAngles.rotateX}deg) rotateY(${targetAngles.rotateY}deg) rotateZ(0deg)`;

          // Trigger subtle landing bounce as the rotation settles
          landingTimeoutRef.current = setTimeout(() => {
            setIsLanding(true);
            settleTimeoutRef.current = setTimeout(() => {
              setIsLanding(false);
            }, 200);
          }, 780);
        }
      }

      prevIsRollingRef.current = false;
      return;
    }

    // PHASE 3: External authoritative state sync (when not rolling)
    if (!isRolling && value !== null && value >= 1 && value <= 6) {
      const baseAngles = DICE_FACE_ANGLES[value];
      const diffX = Math.abs((((rotationRef.current.rotateX % 360) + 360) % 360) - (((baseAngles.rotateX % 360) + 360) % 360));
      const diffY = Math.abs((((rotationRef.current.rotateY % 360) + 360) % 360) - (((baseAngles.rotateY % 360) + 360) % 360));

      if (diffX > 2 || diffY > 2) {
        const next = calculateRollAngles(value, rotationRef.current, 0);
        rotationRef.current = next;
        setRotation(next);

        if (cubeRef.current) {
          cubeRef.current.style.transition = isReduced ? 'transform 100ms ease-out' : 'transform 450ms cubic-bezier(0.2, 1, 0.3, 1)';
          cubeRef.current.style.transform = `rotateX(${next.rotateX}deg) rotateY(${next.rotateY}deg) rotateZ(0deg)`;
        }
      }
    }

    prevIsRollingRef.current = isRolling;
  }, [isRolling, value, stopTumblingRaf]);

  // Consistent pip styling across all 6 faces
  const renderFacePips = (faceNum: number) => {
    const coords = DICE_PIP_POSITIONS[faceNum] || [];

    return (
      <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-1.5 sm:p-2 pointer-events-none select-none">
        {Array.from({ length: 9 }).map((_, idx) => {
          const r = Math.floor(idx / 3);
          const c = idx % 3;
          const hasPip = coords.some(([pr, pc]) => pr === r && pc === c);

          if (!hasPip) {
            return <div key={idx} />;
          }

          return (
            <div key={idx} className="flex items-center justify-center">
              <div
                style={{
                  width: `${pipSize}px`,
                  height: `${pipSize}px`,
                  backgroundColor: '#0f172a',
                  boxShadow:
                    'inset 0 1.5px 2px rgba(0,0,0,0.8), 0 0.5px 1px rgba(255,255,255,0.7)',
                }}
                className="rounded-full"
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Face CSS definition helper for standard cube geometry
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
          background:
            'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 80%)',
          transform: isRolling
            ? 'scale(0.7) translateY(4px)'
            : isLanding
            ? 'scale(1.18)'
            : 'scale(1.0)',
          opacity: isRolling ? 0.35 : isLanding ? 0.85 : 0.7,
          filter: isRolling ? 'blur(3px)' : 'blur(1.2px)',
        }}
      />

      {/* 3D Dice Interactive Cube Container with vertical lift and landing bounce */}
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
          transform: `translate3d(0, ${isRolling ? -16 : isLanding ? 2.5 : 0}px, 0)`,
          transition: isRolling
            ? 'transform 150ms ease-out'
            : isLanding
            ? 'transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 300ms ease-out',
        }}
      >
        {/* The 6-Faced CSS 3D Cube */}
        <div
          ref={cubeRef}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            transformStyle: 'preserve-3d',
            transform: `rotateX(${rotation.rotateX}deg) rotateY(${rotation.rotateY}deg) rotateZ(${rotation.rotateZ}deg)`,
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
