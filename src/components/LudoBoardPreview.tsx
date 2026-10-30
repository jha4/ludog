import React from 'react';
import { Crown, Star, Sparkles, Trophy } from 'lucide-react';
import { PlayerColor, COLOR_HEX } from '../lib/ludoEngine.js';

interface LudoBoardPreviewProps {
  className?: string;
  selectedColor?: PlayerColor;
}

export const LudoBoardPreview: React.FC<LudoBoardPreviewProps> = ({
  className = '',
  selectedColor = 'red',
}) => {
  return (
    <div className={`relative w-full max-w-md mx-auto aspect-square rounded-3xl bg-slate-900/90 border border-slate-700/60 p-2 sm:p-3 shadow-2xl shadow-amber-950/20 backdrop-blur-xl select-none ${className}`}>
      {/* Outer ambient glow */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 blur-xl opacity-70 pointer-events-none" />

      {/* 15x15 Ludo Grid */}
      <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 grid grid-cols-15 grid-rows-15 shadow-inner">
        {/* ================= 4 BASE QUADRANTS ================= */}
        {/* Top-Left: RED Yard (Rows 0-5, Cols 0-5) */}
        <div className={`col-start-1 col-end-7 row-start-1 row-end-7 p-2 bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 border-r-2 border-b-2 border-slate-950 relative flex flex-col justify-between transition-all ${selectedColor === 'red' ? 'ring-2 ring-amber-300 ring-inset shadow-lg' : 'opacity-90'}`}>
          <div className="flex items-center justify-between text-white font-black text-[10px] tracking-wider font-fredoka">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-300 inline-block" />
              RED
            </span>
            <Crown className="w-3 h-3 text-amber-300" />
          </div>
          {/* Inner white tray */}
          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100/95 shadow-md border border-rose-900/40 grid grid-cols-2 grid-rows-2 p-1.5 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full h-full rounded-full bg-gradient-to-br from-rose-200 to-rose-300 border border-rose-600 flex items-center justify-center relative shadow-xs">
                {/* Token */}
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top-Right: GREEN Yard (Rows 0-5, Cols 10-15) */}
        <div className={`col-start-10 col-end-16 row-start-1 row-end-7 p-2 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border-l-2 border-b-2 border-slate-950 relative flex flex-col justify-between transition-all ${selectedColor === 'green' ? 'ring-2 ring-amber-300 ring-inset shadow-lg' : 'opacity-90'}`}>
          <div className="flex items-center justify-between text-white font-black text-[10px] tracking-wider font-fredoka">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-300 inline-block" />
              GREEN
            </span>
            <Crown className="w-3 h-3 text-amber-300" />
          </div>
          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100/95 shadow-md border border-emerald-900/40 grid grid-cols-2 grid-rows-2 p-1.5 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full h-full rounded-full bg-gradient-to-br from-emerald-200 to-emerald-300 border border-emerald-600 flex items-center justify-center relative shadow-xs">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Right: YELLOW Yard (Rows 10-15, Cols 10-15) */}
        <div className={`col-start-10 col-end-16 row-start-10 row-end-16 p-2 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800 border-l-2 border-t-2 border-slate-950 relative flex flex-col justify-between transition-all ${selectedColor === 'yellow' ? 'ring-2 ring-white ring-inset shadow-lg' : 'opacity-90'}`}>
          <div className="flex items-center justify-between text-slate-950 font-black text-[10px] tracking-wider font-fredoka">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-950 inline-block" />
              YELLOW
            </span>
            <Crown className="w-3 h-3 text-slate-950" />
          </div>
          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100/95 shadow-md border border-amber-900/40 grid grid-cols-2 grid-rows-2 p-1.5 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full h-full rounded-full bg-gradient-to-br from-amber-200 to-amber-300 border border-amber-600 flex items-center justify-center relative shadow-xs">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom-Left: BLUE Yard (Rows 10-15, Cols 0-5) */}
        <div className={`col-start-1 col-end-7 row-start-10 row-end-16 p-2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-r-2 border-t-2 border-slate-950 relative flex flex-col justify-between transition-all ${selectedColor === 'blue' ? 'ring-2 ring-amber-300 ring-inset shadow-lg' : 'opacity-90'}`}>
          <div className="flex items-center justify-between text-white font-black text-[10px] tracking-wider font-fredoka">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-300 inline-block" />
              BLUE
            </span>
            <Crown className="w-3 h-3 text-amber-300" />
          </div>
          <div className="absolute inset-0 m-auto w-[68%] h-[68%] rounded-2xl bg-slate-100/95 shadow-md border border-blue-900/40 grid grid-cols-2 grid-rows-2 p-1.5 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-full h-full rounded-full bg-gradient-to-br from-blue-200 to-blue-300 border border-blue-600 flex items-center justify-center relative shadow-xs">
                <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-100" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= CENTRAL FINISHING TRIANGLES (Rows 6-8, Cols 6-8) ================= */}
        <div className="col-start-7 col-end-10 row-start-7 row-end-10 bg-slate-950 relative overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
          {/* Top Triangle: RED */}
          <div className="absolute inset-0 bg-rose-600 [clip-path:polygon(0_0,_100%_0,_50%_50%)]" />
          {/* Right Triangle: GREEN */}
          <div className="absolute inset-0 bg-emerald-600 [clip-path:polygon(100%_0,_100%_100%,_50%_50%)]" />
          {/* Bottom Triangle: YELLOW */}
          <div className="absolute inset-0 bg-amber-500 [clip-path:polygon(100%_100%,_0_100%,_50%_50%)]" />
          {/* Left Triangle: BLUE */}
          <div className="absolute inset-0 bg-blue-600 [clip-path:polygon(0_100%,_0_0,_50%_50%)]" />

          {/* Center Emblem */}
          <div className="relative z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950 border border-amber-400/80 shadow-lg flex items-center justify-center">
            <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* ================= TRACK SQUARES & HOME LANES ================= */}
        {/* Top Arm (Cols 6-8, Rows 0-5) - RED Home Lane in Middle Col 7 */}
        <div className="col-start-7 col-end-10 row-start-1 row-end-7 grid grid-cols-3 grid-rows-6 border-b border-slate-900 bg-slate-900/60">
          {[...Array(18)].map((_, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const isRedHomeLane = col === 1 && row > 0;
            const isRedStart = col === 0 && row === 1;
            const isSafeStar = col === 2 && row === 2;

            return (
              <div
                key={`top-arm-${idx}`}
                className={`border-[0.5px] border-slate-800 flex items-center justify-center relative ${
                  isRedHomeLane
                    ? 'bg-rose-600/90 border-rose-500'
                    : isRedStart
                    ? 'bg-rose-500 border-rose-400'
                    : 'bg-slate-900/80'
                }`}
              >
                {isRedStart && <span className="text-[8px] font-black text-white">START</span>}
                {isSafeStar && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
              </div>
            );
          })}
        </div>

        {/* Right Arm (Cols 9-14, Rows 6-8) - GREEN Home Lane in Middle Row 7 */}
        <div className="col-start-10 col-end-16 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3 border-l border-slate-900 bg-slate-900/60">
          {[...Array(18)].map((_, idx) => {
            const row = Math.floor(idx / 6);
            const col = idx % 6;
            const isGreenHomeLane = row === 1 && col < 5;
            const isGreenStart = row === 0 && col === 4;
            const isSafeStar = row === 2 && col === 3;

            return (
              <div
                key={`right-arm-${idx}`}
                className={`border-[0.5px] border-slate-800 flex items-center justify-center relative ${
                  isGreenHomeLane
                    ? 'bg-emerald-600/90 border-emerald-500'
                    : isGreenStart
                    ? 'bg-emerald-500 border-emerald-400'
                    : 'bg-slate-900/80'
                }`}
              >
                {isGreenStart && <span className="text-[8px] font-black text-white">START</span>}
                {isSafeStar && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
              </div>
            );
          })}
        </div>

        {/* Bottom Arm (Cols 6-8, Rows 9-14) - YELLOW Home Lane in Middle Col 7 */}
        <div className="col-start-7 col-end-10 row-start-10 row-end-16 grid grid-cols-3 grid-rows-6 border-t border-slate-900 bg-slate-900/60">
          {[...Array(18)].map((_, idx) => {
            const row = Math.floor(idx / 3);
            const col = idx % 3;
            const isYellowHomeLane = col === 1 && row < 5;
            const isYellowStart = col === 2 && row === 4;
            const isSafeStar = col === 0 && row === 3;

            return (
              <div
                key={`bottom-arm-${idx}`}
                className={`border-[0.5px] border-slate-800 flex items-center justify-center relative ${
                  isYellowHomeLane
                    ? 'bg-amber-500/90 border-amber-400'
                    : isYellowStart
                    ? 'bg-amber-500 border-amber-300'
                    : 'bg-slate-900/80'
                }`}
              >
                {isYellowStart && <span className="text-[8px] font-black text-slate-950">START</span>}
                {isSafeStar && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
              </div>
            );
          })}
        </div>

        {/* Left Arm (Cols 0-5, Rows 6-8) - BLUE Home Lane in Middle Row 7 */}
        <div className="col-start-1 col-end-7 row-start-7 row-end-10 grid grid-cols-6 grid-rows-3 border-r border-slate-900 bg-slate-900/60">
          {[...Array(18)].map((_, idx) => {
            const row = Math.floor(idx / 6);
            const col = idx % 6;
            const isBlueHomeLane = row === 1 && col > 0;
            const isBlueStart = row === 2 && col === 1;
            const isSafeStar = row === 0 && col === 2;

            return (
              <div
                key={`left-arm-${idx}`}
                className={`border-[0.5px] border-slate-800 flex items-center justify-center relative ${
                  isBlueHomeLane
                    ? 'bg-blue-600/90 border-blue-500'
                    : isBlueStart
                    ? 'bg-blue-500 border-blue-400'
                    : 'bg-slate-900/80'
                }`}
              >
                {isBlueStart && <span className="text-[8px] font-black text-white">START</span>}
                {isSafeStar && <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative Floating Overlay Badges */}
      <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold text-amber-300 font-fredoka">
        <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
        <span>Authoritative 52-Tile Grid</span>
      </div>

      <div className="absolute bottom-4 right-4 z-20 px-2.5 py-1 rounded-xl bg-slate-950/90 border border-slate-700/80 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-[10px] font-bold text-emerald-300 font-fredoka">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>Live Multiplayer Ready</span>
      </div>
    </div>
  );
};
