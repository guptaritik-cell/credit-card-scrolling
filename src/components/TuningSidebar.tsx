import React, { useState, useEffect } from 'react';
import { TuningConfig, DEFAULT_TUNING } from '../types';
import { haptics } from '../utils/haptics';
import {
  Sliders,
  Sun,
  RotateCw,
  Eye,
  CircleDot,
  Compass,
  Zap,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Scale,
  Crosshair,
} from 'lucide-react';

interface TuningFieldProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  sliderMin: number;
  sliderMax: number;
  step?: number;
  unit?: string;
  subtext?: string;
  leftSubtext?: string;
  rightSubtext?: string;
  colorScheme?: 'emerald' | 'amber' | 'cyan' | 'purple';
}

// Reusable Dual Tuning Component:
// 1. Sliding Bar for intuitive visual dragging
// 2. Manual Number Input with NO LIMIT on typed values (any negative, positive, huge, fractional numbers)
const TuningField: React.FC<TuningFieldProps> = ({
  label,
  value,
  onChange,
  sliderMin,
  sliderMax,
  step = 1,
  unit = '',
  subtext,
  leftSubtext,
  rightSubtext,
  colorScheme = 'emerald',
}) => {
  const [textVal, setTextVal] = useState<string>(String(value ?? 0));

  // Sync if external value changes (e.g. Reset or Preset)
  useEffect(() => {
    setTextVal(String(value ?? 0));
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextVal(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(textVal);
    if (isNaN(parsed)) {
      setTextVal(String(value ?? 0));
    } else {
      setTextVal(String(parsed));
      onChange(parsed);
    }
  };

  // Dynamic slider range: if user types a value outside the default sliderMin/sliderMax,
  // the slider automatically expands to fit, ensuring the slider NEVER breaks or gets clamped!
  const numVal = typeof value === 'number' && !isNaN(value) ? value : 0;
  const effectiveMin = Math.min(sliderMin, numVal);
  const effectiveMax = Math.max(sliderMax, numVal);

  const colorText = {
    emerald: 'text-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/50',
    amber: 'text-amber-400 focus:border-amber-400 focus:ring-amber-400/50',
    cyan: 'text-cyan-400 focus:border-cyan-400 focus:ring-cyan-400/50',
    purple: 'text-purple-400 focus:border-purple-400 focus:ring-purple-400/50',
  }[colorScheme];

  const accentColor = {
    emerald: 'accent-emerald-400',
    amber: 'accent-amber-400',
    cyan: 'accent-cyan-400',
    purple: 'accent-purple-400',
  }[colorScheme];

  return (
    <div>
      <div className="flex justify-between items-center text-[11px] text-neutral-300 mb-1">
        <span className="font-medium text-neutral-200">{label}</span>
        <div className="flex items-center gap-1">
          {/* Manual Number Input with NO LIMIT on value */}
          <input
            type="number"
            step={step}
            value={textVal}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className={`w-20 px-1.5 py-0.5 text-right font-mono text-xs rounded bg-neutral-900 border border-neutral-700/90 focus:outline-none focus:ring-1 ${colorText}`}
            placeholder="0"
            title="Type any number manually (no min/max limit)"
          />
          {unit ? <span className="text-[10px] text-neutral-400 font-mono w-4">{unit}</span> : null}
        </div>
      </div>
      <input
        type="range"
        min={effectiveMin}
        max={effectiveMax}
        step={step}
        value={numVal}
        onChange={(e) => {
          const num = Number(e.target.value);
          setTextVal(String(num));
          onChange(num);
        }}
        className={`w-full cursor-pointer ${accentColor}`}
      />
      {(leftSubtext || rightSubtext) && (
        <div className="flex justify-between text-[9px] text-neutral-500">
          <span>{leftSubtext}</span>
          <span>{rightSubtext}</span>
        </div>
      )}
      {subtext && <span className="text-[9px] text-neutral-500 block mt-0.5">{subtext}</span>}
    </div>
  );
};

interface TuningSidebarProps {
  tuning: TuningConfig;
  onTuningChange: (tuning: TuningConfig) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export const TuningSidebar: React.FC<TuningSidebarProps> = ({
  tuning,
  onTuningChange,
  soundEnabled,
  onSoundToggle,
}) => {
  // Collapsible section states for smooth navigation
  const [openSections, setOpenSections] = useState({
    snapSymmetry: true,
    centerCard: true,
    lightShadows: true,
    fanCurve: true,
    cameraDimensions: true,
    motionGlow: true,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <aside className="w-full h-full flex flex-col bg-neutral-900/95 border-l border-neutral-800/80 backdrop-blur-xl select-none text-neutral-200 overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="shrink-0 px-4 py-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide uppercase">3D Physics & Tuning</h2>
            <p className="text-[10px] text-neutral-400">Dual slider + unlimited manual number inputs</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onTuningChange({ ...DEFAULT_TUNING })}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[11px] text-neutral-200 font-medium transition-colors border border-neutral-700"
          title="Reset to default reference values"
        >
          <RotateCw className="w-3 h-3 text-emerald-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* Scrollable Tuning Parameters List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs custom-scrollbar">

        {/* SECTION 0: ULTRA-SMOOTH SNAP & 100% SYMMETRY ENGINE */}
        <div className="border border-emerald-500/40 rounded-xl bg-neutral-950/60 overflow-hidden shadow-lg">
          <button
            type="button"
            onClick={() => toggleSection('snapSymmetry')}
            className="w-full px-3 py-2.5 flex items-center justify-between bg-emerald-950/20 hover:bg-emerald-950/30 text-left transition-colors border-b border-emerald-500/30"
          >
            <div className="flex items-center gap-2 font-semibold text-emerald-300">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ultra-Smooth Snap & Symmetry</span>
            </div>
            {openSections.snapSymmetry ? (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>

          {openSections.snapSymmetry && (
            <div className="p-3 space-y-3.5">
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Guarantees the swiped card stops with buttery smoothness in the exact middle of screen, with 100% symmetric padding, angles, and card count on both sides.
              </p>

              {/* Symmetric Flanking Cards Count */}
              <div>
                <TuningField
                  label="Symmetric Side Cards (Per Side)"
                  value={tuning.flankingCardsCount ?? 5}
                  onChange={(val) => onTuningChange({ ...tuning, flankingCardsCount: Math.round(val) })}
                  sliderMin={1}
                  sliderMax={6}
                  step={1}
                  unit="cards"
                  colorScheme="emerald"
                />
                <div className="grid grid-cols-5 gap-1.5 pt-1.5">
                  {[1, 2, 3, 4, 5].map((count) => {
                    const isActive = (tuning.flankingCardsCount ?? 5) === count;
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => onTuningChange({ ...tuning, flankingCardsCount: count })}
                        className={`py-1 px-1.5 rounded text-[11px] font-semibold border transition-all ${
                          isActive
                            ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold'
                            : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                        }`}
                      >
                        ±{count} ({2 * count + 1} cards)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ultra-Smooth Snap Spring Stiffness */}
              <TuningField
                label="Snap Spring Stiffness"
                value={tuning.snapStiffness ?? 180}
                onChange={(val) => onTuningChange({ ...tuning, snapStiffness: val })}
                sliderMin={80}
                sliderMax={320}
                step={5}
                leftSubtext="Slow Gentle Glide"
                rightSubtext="Snappy Direct"
                colorScheme="emerald"
              />

              {/* Ultra-Smooth Snap Damping */}
              <TuningField
                label="Snap Damping (Smooth Deceleration)"
                value={tuning.snapDamping ?? 27}
                onChange={(val) => onTuningChange({ ...tuning, snapDamping: val })}
                sliderMin={16}
                sliderMax={42}
                step={1}
                leftSubtext="Bouncy"
                rightSubtext="Critically Damped (Zero Jitter)"
                colorScheme="emerald"
              />

              {/* Swipe Sensitivity (Direct control of swiping feel) */}
              <TuningField
                label="Swipe Sensitivity"
                value={tuning.swipeSensitivity ?? 0.35}
                onChange={(val) =>
                  onTuningChange({ ...tuning, swipeSensitivity: val, dragSensitivity: val })
                }
                sliderMin={0.2}
                sliderMax={3.5}
                step={0.1}
                unit="x"
                leftSubtext="Heavier Swipe (0.5x)"
                rightSubtext="Ultra-Fast (3.0x)"
                subtext="Controls how fast & easily cards glide when swiping left or right"
                colorScheme="emerald"
              />

              {/* Swipe Advance Threshold */}
              <TuningField
                label="Swipe Trigger Distance"
                value={tuning.swipeThreshold ?? 36}
                onChange={(val) => onTuningChange({ ...tuning, swipeThreshold: val })}
                sliderMin={10}
                sliderMax={80}
                step={2}
                unit="px"
                subtext="Lower = light flick advances card; Higher = firm swipe"
                colorScheme="emerald"
              />

              {/* Symmetric Studio Lighting Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/70 border border-neutral-800">
                <div>
                  <span className="text-[11px] font-medium text-neutral-200 block">Symmetric Studio Lighting</span>
                  <span className="text-[9px] text-neutral-400 block">Identical mirrored shadows on left & right</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onTuningChange({
                      ...tuning,
                      symmetricLighting: !(tuning.symmetricLighting ?? true),
                    })
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    (tuning.symmetricLighting ?? true) ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      (tuning.symmetricLighting ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Symmetry Crosshair & Guide Overlay Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/70 border border-neutral-800">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[11px] font-medium text-neutral-200">Show Symmetry Guides</span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onTuningChange({
                      ...tuning,
                      showSymmetryGuides: !tuning.showSymmetryGuides,
                    })
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    tuning.showSymmetryGuides ? 'bg-cyan-500' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      tuning.showSymmetryGuides ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 1: CENTER CARD 3D JOURNEY & PERSPECTIVE */}
        <div className="border border-neutral-800/90 rounded-xl bg-neutral-950/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('centerCard')}
            className="w-full px-3 py-2.5 flex items-center justify-between bg-neutral-900/60 hover:bg-neutral-800/40 text-left transition-colors border-b border-neutral-800/60"
          >
            <div className="flex items-center gap-2 font-semibold text-neutral-100">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>Center Card 3D Journey</span>
            </div>
            {openSections.centerCard ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {openSections.centerCard && (
            <div className="p-3 space-y-3.5">
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Tune the center card's dedicated 3D perspective and full emergence trajectory as it ascends from the deck.
              </p>

              {/* Center Card Dedicated Perspective */}
              <TuningField
                label="Center Card Perspective"
                value={tuning.centerPerspective ?? 1800}
                onChange={(val) => onTuningChange({ ...tuning, centerPerspective: val })}
                sliderMin={280}
                sliderMax={1800}
                step={20}
                unit="px"
                subtext="Lower = dramatic wide-angle 3D; Higher = telephoto flat"
                colorScheme="emerald"
              />

              {/* Middle Card Elevation (Up) */}
              <TuningField
                label="Elevation Journey (Lift Y)"
                value={tuning.heroLiftY ?? 46}
                onChange={(val) => onTuningChange({ ...tuning, heroLiftY: val })}
                sliderMin={0}
                sliderMax={240}
                step={1}
                unit="px"
                colorScheme="emerald"
              />

              {/* Pop-Forward Depth (Z) */}
              <TuningField
                label="Pop-Forward Z-Depth"
                value={tuning.heroPopZ ?? 54}
                onChange={(val) => onTuningChange({ ...tuning, heroPopZ: val })}
                sliderMin={-50}
                sliderMax={160}
                step={1}
                unit="px"
                colorScheme="emerald"
              />

              {/* Center Card 3D Yaw */}
              <TuningField
                label="Center 3D Yaw (Rotate Y)"
                value={tuning.heroRotY ?? -1}
                onChange={(val) => onTuningChange({ ...tuning, heroRotY: val })}
                sliderMin={-70}
                sliderMax={30}
                step={1}
                unit="°"
                colorScheme="emerald"
              />

              {/* Center Card 3D Pitch (Tilt X) */}
              <TuningField
                label="Center 3D Pitch (Tilt X)"
                value={tuning.heroTiltX ?? -13}
                onChange={(val) => onTuningChange({ ...tuning, heroTiltX: val })}
                sliderMin={-35}
                sliderMax={35}
                step={1}
                unit="°"
                colorScheme="emerald"
              />

              {/* Center Card 3D Roll (Tilt Z) */}
              <TuningField
                label="Center 3D Roll (Tilt Z)"
                value={tuning.heroRotZ ?? 0}
                onChange={(val) => onTuningChange({ ...tuning, heroRotZ: val })}
                sliderMin={-20}
                sliderMax={20}
                step={0.5}
                unit="°"
                colorScheme="emerald"
              />

              {/* Center Scale Active */}
              <TuningField
                label="Center Card Active Scale"
                value={tuning.cardScaleActive ?? 1.09}
                onChange={(val) => onTuningChange({ ...tuning, cardScaleActive: val })}
                sliderMin={0.8}
                sliderMax={1.4}
                step={0.01}
                unit="x"
                colorScheme="emerald"
              />

              {/* Emergence Transition Curve */}
              <TuningField
                label="Emergence Curve Sharpness"
                value={tuning.heroTravelCurve ?? 3.1}
                onChange={(val) => onTuningChange({ ...tuning, heroTravelCurve: val })}
                sliderMin={0.8}
                sliderMax={5.0}
                step={0.1}
                colorScheme="emerald"
              />
            </div>
          )}
        </div>

        {/* SECTION 2: LIGHT SOURCE & DYNAMIC SHADOWS */}
        <div className="border border-neutral-800/90 rounded-xl bg-neutral-950/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('lightShadows')}
            className="w-full px-3 py-2.5 flex items-center justify-between bg-neutral-900/60 hover:bg-neutral-800/40 text-left transition-colors border-b border-neutral-800/60"
          >
            <div className="flex items-center gap-2 font-semibold text-neutral-100">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Light Source & Shadows</span>
            </div>
            {openSections.lightShadows ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {openSections.lightShadows && (
            <div className="p-3 space-y-3.5">
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Dynamic light source casts realistic shadows and specular sheen from front cards onto neighbor cards.
              </p>

              {/* Light Source Y Position */}
              <TuningField
                label="Light Position Y (Screen %)"
                value={tuning.lightSourceY ?? 1}
                onChange={(val) => onTuningChange({ ...tuning, lightSourceY: val })}
                sliderMin={-30}
                sliderMax={50}
                step={1}
                unit="%"
                colorScheme="amber"
              />

              {/* Card-on-Card Cast Shadows Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/70 border border-neutral-800">
                <span className="text-[11px] font-medium text-neutral-200">Cast Shadow on Neighbors</span>
                <button
                  type="button"
                  onClick={() =>
                    onTuningChange({
                      ...tuning,
                      castShadowOnNeighbors: !(tuning.castShadowOnNeighbors ?? true),
                    })
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    (tuning.castShadowOnNeighbors ?? true) ? 'bg-amber-500' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      (tuning.castShadowOnNeighbors ?? true) ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Cast Shadow Opacity */}
              <TuningField
                label="Card-on-Card Shadow Opacity"
                value={tuning.castShadowOpacity ?? 1.0}
                onChange={(val) => onTuningChange({ ...tuning, castShadowOpacity: val })}
                sliderMin={0.0}
                sliderMax={1.0}
                step={0.02}
                colorScheme="amber"
              />

              {/* Drop Shadow Darkness */}
              <TuningField
                label="3D Drop Shadow Darkness"
                value={tuning.shadowIntensity ?? 0.56}
                onChange={(val) => onTuningChange({ ...tuning, shadowIntensity: val })}
                sliderMin={0.1}
                sliderMax={1.0}
                step={0.02}
                colorScheme="amber"
              />

              {/* Shadow Softness (Blur) */}
              <TuningField
                label="Shadow Softness (Blur)"
                value={tuning.shadowSoftness ?? 31}
                onChange={(val) => onTuningChange({ ...tuning, shadowSoftness: val })}
                sliderMin={2}
                sliderMax={45}
                step={1}
                unit="px"
                colorScheme="amber"
              />

              {/* Specular Surface Sheen */}
              <TuningField
                label="Specular Rim & Surface Sheen"
                value={tuning.specularSheen ?? 1.0}
                onChange={(val) => onTuningChange({ ...tuning, specularSheen: val })}
                sliderMin={0.0}
                sliderMax={1.0}
                step={0.05}
                colorScheme="amber"
              />
            </div>
          )}
        </div>

        {/* SECTION 3: FANNING CURVE & CIRCLE RADIUS */}
        <div className="border border-neutral-800/90 rounded-xl bg-neutral-950/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('fanCurve')}
            className="w-full px-3 py-2.5 flex items-center justify-between bg-neutral-900/60 hover:bg-neutral-800/40 text-left transition-colors border-b border-neutral-800/60"
          >
            <div className="flex items-center gap-2 font-semibold text-neutral-100">
              <CircleDot className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fanning Curve & Circle Radius</span>
            </div>
            {openSections.fanCurve ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {openSections.fanCurve && (
            <div className="p-3 space-y-3.5">
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Control the circular carousel cylinder: shrink or expand the diameter and radius along which cards rotate.
              </p>

              {/* Circle Arc Radius / Diameter Control */}
              <TuningField
                label="Circle Arc Radius (R)"
                value={tuning.fanRadius ?? 210}
                onChange={(val) => onTuningChange({ ...tuning, fanRadius: val })}
                sliderMin={100}
                sliderMax={750}
                step={10}
                unit="px"
                leftSubtext={`Tight Cylinder (Ø ${((tuning.fanRadius ?? 210) * 2)}px)`}
                rightSubtext="Wide Arc"
                colorScheme="cyan"
              />

              {/* Card Spacing */}
              <TuningField
                label="Card Spacing"
                value={tuning.fanSpacing ?? 1}
                onChange={(val) => onTuningChange({ ...tuning, fanSpacing: val })}
                sliderMin={0}
                sliderMax={180}
                step={1}
                unit="px"
                colorScheme="cyan"
              />

              {/* Fan Roll Angle Spread */}
              <TuningField
                label="Fan Roll Spread Angle"
                value={tuning.fanTiltStep ?? 0.5}
                onChange={(val) => onTuningChange({ ...tuning, fanTiltStep: val })}
                sliderMin={0.5}
                sliderMax={10.0}
                step={0.1}
                unit="°"
                colorScheme="cyan"
              />

              {/* Side Inward Angle (Yaw) */}
              <TuningField
                label="Side Inward Yaw Angle"
                value={tuning.yawAngle ?? 63}
                onChange={(val) => onTuningChange({ ...tuning, yawAngle: val })}
                sliderMin={10}
                sliderMax={85}
                step={1}
                unit="°"
                colorScheme="cyan"
              />

              {/* Z-Depth Curvature */}
              <TuningField
                label="Z-Depth Curvature"
                value={tuning.curveDepth ?? 51}
                onChange={(val) => onTuningChange({ ...tuning, curveDepth: val })}
                sliderMin={0}
                sliderMax={140}
                step={1}
                unit="px"
                colorScheme="cyan"
              />

              {/* Base Vertical Offset Y */}
              <TuningField
                label="Base Y Offset"
                value={tuning.baseYOffset ?? 74}
                onChange={(val) => onTuningChange({ ...tuning, baseYOffset: val })}
                sliderMin={-40}
                sliderMax={140}
                step={1}
                unit="px"
                colorScheme="cyan"
              />
            </div>
          )}
        </div>

        {/* SECTION 4: CAMERA & CARD DIMENSIONS */}
        <div className="border border-neutral-800/90 rounded-xl bg-neutral-950/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('cameraDimensions')}
            className="w-full px-3 py-2.5 flex items-center justify-between bg-neutral-900/60 hover:bg-neutral-800/40 text-left transition-colors border-b border-neutral-800/60"
          >
            <div className="flex items-center gap-2 font-semibold text-neutral-100">
              <Compass className="w-3.5 h-3.5 text-purple-400" />
              <span>Camera & Dimensions</span>
            </div>
            {openSections.cameraDimensions ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {openSections.cameraDimensions && (
            <div className="p-3 space-y-3.5">
              {/* Orientation Mode */}
              <div>
                <label className="block text-[11px] text-neutral-300 mb-1.5 font-semibold">Card Orientation</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onTuningChange({
                        ...tuning,
                        cardOrientation: 'vertical',
                        cardWidth: tuning.cardOrientation === 'horizontal' ? 118 : tuning.cardWidth,
                      })
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      (tuning.cardOrientation ?? 'vertical') === 'vertical'
                        ? 'bg-purple-500 text-neutral-950 border-purple-400 shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Vertical (Portrait)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onTuningChange({
                        ...tuning,
                        cardOrientation: 'horizontal',
                        cardWidth: tuning.cardOrientation === 'vertical' ? 240 : tuning.cardWidth,
                      })
                    }
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      tuning.cardOrientation === 'horizontal'
                        ? 'bg-purple-500 text-neutral-950 border-purple-400 shadow-sm'
                        : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                    }`}
                  >
                    Horizontal (Landscape)
                  </button>
                </div>
              </div>

              {/* Card Width */}
              <TuningField
                label="Card Width"
                value={tuning.cardWidth ?? 118}
                onChange={(val) => onTuningChange({ ...tuning, cardWidth: val })}
                sliderMin={tuning.cardOrientation === 'horizontal' ? 160 : 90}
                sliderMax={tuning.cardOrientation === 'horizontal' ? 360 : 250}
                step={1}
                unit="px"
                colorScheme="purple"
              />

              {/* Global 3D Perspective */}
              <TuningField
                label="Global Stage 3D Perspective"
                value={tuning.perspective ?? 1900}
                onChange={(val) => onTuningChange({ ...tuning, perspective: val })}
                sliderMin={350}
                sliderMax={1900}
                step={25}
                unit="px"
                colorScheme="purple"
              />

              {/* Global Tilt Pitch (X) */}
              <TuningField
                label="Vertical Stage Tilt (Pitch)"
                value={tuning.tiltX ?? 35}
                onChange={(val) => onTuningChange({ ...tuning, tiltX: val })}
                sliderMin={-35}
                sliderMax={35}
                step={1}
                unit="°"
                colorScheme="purple"
              />
            </div>
          )}
        </div>

        {/* SECTION 5: MOTION, GLOW & HAPTICS */}
        <div className="border border-neutral-800/90 rounded-xl bg-neutral-950/40 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('motionGlow')}
            className="w-full px-3 py-2.5 flex items-center justify-between bg-neutral-900/60 hover:bg-neutral-800/40 text-left transition-colors border-b border-neutral-800/60"
          >
            <div className="flex items-center gap-2 font-semibold text-neutral-100">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Motion, Glow & Haptics</span>
            </div>
            {openSections.motionGlow ? (
              <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>

          {openSections.motionGlow && (
            <div className="p-3 space-y-3.5">
              {/* Wheel Sound & Haptics Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/70 border border-neutral-800">
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
                  <span className="text-[11px] font-medium text-neutral-200">iOS Wheel Haptic Sound</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSoundToggle();
                    if (!soundEnabled) {
                      haptics.unlockAudio();
                      haptics.triggerTick(1.2);
                    }
                  }}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    soundEnabled ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-Rotation Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/70 border border-neutral-800">
                <span className="text-[11px] font-medium text-neutral-200">Continuous Auto-Rotate</span>
                <button
                  type="button"
                  onClick={() =>
                    onTuningChange({
                      ...tuning,
                      autoRotate: !tuning.autoRotate,
                    })
                  }
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                    tuning.autoRotate ? 'bg-emerald-500' : 'bg-neutral-700'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      tuning.autoRotate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto Rotate Speed */}
              <TuningField
                label="Auto-Rotate Speed"
                value={tuning.autoRotateSpeed ?? 25}
                onChange={(val) => onTuningChange({ ...tuning, autoRotateSpeed: val })}
                sliderMin={-50}
                sliderMax={50}
                step={1}
                unit="°/s"
                colorScheme="emerald"
              />

              {/* Ambient Spotlight Intensity */}
              <TuningField
                label="Spotlight Glow Intensity"
                value={tuning.glowIntensity ?? 0.8}
                onChange={(val) => onTuningChange({ ...tuning, glowIntensity: val })}
                sliderMin={0}
                sliderMax={1.8}
                step={0.05}
                colorScheme="emerald"
              />

              {/* Glow Style Palette */}
              <div>
                <label className="block text-[11px] text-neutral-300 mb-1">Spotlight Color Mode</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    [
                      ['neon-green', 'Neon Lime (Video)'],
                      ['card-brand', 'Bank Brand Color'],
                      ['cyan', 'Cyan Electric'],
                      ['amber', 'Warm Gold'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => onTuningChange({ ...tuning, glowColorMode: mode })}
                      className={`px-2 py-1.5 rounded text-[10px] font-medium border text-left truncate transition-colors ${
                        tuning.glowColorMode === mode
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
