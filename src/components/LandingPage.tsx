import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ALICE_DEMO_WORLD, ALICE_PLACES, ALICE_CHARACTERS } from '../data/aliceDemoWorld';
import { RealmMap } from './map/RealmMap';
import { CartographicCompass } from './CartographicCompass';
import { MoodType, MOODS } from './mood/moodConfigs';
import {
  BookOpen,
  MapPin,
  Users,
  Sparkles,
  ArrowRight,
  Compass,
  ScrollText,
  GitBranch,
  Feather,
  Palette,
  Maximize2,
  Minimize2,
  Flame,
  CloudRain,
  Crown,
  Ghost,
  SunMedium,
  Zap,
} from 'lucide-react';

interface HeroLandmark {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  description: string;
  connectsTo: string[];
}

const HERO_LANDMARKS: HeroLandmark[] = [
  {
    id: 'basalt-spire',
    name: 'The Basalt Spire',
    type: 'Watchtower',
    x: 180,
    y: 120,
    description: 'An ancient observation tower where star charts were inked directly into volcanic stone.',
    connectsTo: ['sunken-scriptorium', 'brass-orchard'],
  },
  {
    id: 'sunken-scriptorium',
    name: 'The Sunken Scriptorium',
    type: 'Library',
    x: 470,
    y: 90,
    description: 'A drowned hall of papyrus scrolls preserved inside terracotta urns below sea level.',
    connectsTo: ['basalt-spire', 'solitary-beacon', 'echoing-caverns'],
  },
  {
    id: 'brass-orchard',
    name: 'The Brass Orchard',
    type: 'Grove',
    x: 240,
    y: 290,
    description: 'Terraced groves of metallic foliage that turn with lunar seasons and toll like windchimes.',
    connectsTo: ['basalt-spire', 'silent-tribunal', 'echoing-caverns'],
  },
  {
    id: 'solitary-beacon',
    name: 'The Solitary Beacon',
    type: 'Harbor Haven',
    x: 740,
    y: 130,
    description: 'A stone lighthouse guarding foggy channels where pilgrim barques seek harbor.',
    connectsTo: ['sunken-scriptorium', 'echoing-caverns', 'glass-cliffs'],
  },
  {
    id: 'echoing-caverns',
    name: 'The Echoing Caverns',
    type: 'Underway',
    x: 520,
    y: 300,
    description: 'Subterranean tunnels carved by vanished miners where whispered words carry for leagues.',
    connectsTo: ['sunken-scriptorium', 'brass-orchard', 'solitary-beacon', 'silent-tribunal'],
  },
  {
    id: 'glass-cliffs',
    name: 'The Glass Cliffs',
    type: 'Coastline',
    x: 780,
    y: 320,
    description: 'Sheer obsidian shores that reflect the sunrise like a giant hand-polished mirror.',
    connectsTo: ['solitary-beacon', 'silent-tribunal'],
  },
  {
    id: 'silent-tribunal',
    name: 'The Silent Tribunal',
    type: 'Ruins',
    x: 410,
    y: 430,
    description: 'Weathered stone arches where elders once sealed treaties under open skies.',
    connectsTo: ['brass-orchard', 'echoing-caverns', 'glass-cliffs'],
  },
];

interface LandingPageProps {
  onGoToDashboard: () => void;
  onGoToAdd: () => void;
  onExploreDemoWorld: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGoToDashboard,
  onGoToAdd,
  onExploreDemoWorld,
}) => {
  const { user, signInWithGoogle, loading } = useAuth();
  const [selectedMood, setSelectedMood] = useState<MoodType>('cozy');
  const [activeHeroNodeId, setActiveHeroNodeId] = useState<string>('sunken-scriptorium');
  const [isDemoFullscreen, setIsDemoFullscreen] = useState(false);
  const [demoActiveTab, setDemoActiveTab] = useState<'map' | 'cosmology' | 'figures'>('map');
  const [stepFlowIndex, setStepFlowIndex] = useState(0);

  const moodConfig = MOODS[selectedMood];
  const activeLandmark = HERO_LANDMARKS.find((n) => n.id === activeHeroNodeId) || HERO_LANDMARKS[1];

  // Auto-cycle through step flow preview if idle
  useEffect(() => {
    const timer = setInterval(() => {
      setStepFlowIndex((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const getMoodIcon = (m: MoodType) => {
    switch (m) {
      case 'cozy':
        return <Flame size={14} className="text-[#a2562b]" />;
      case 'eerie':
        return <Ghost size={14} className="text-[#43685e]" />;
      case 'epic':
        return <Crown size={14} className="text-[#9c2f2f]" />;
      case 'melancholy':
        return <CloudRain size={14} className="text-[#4f7a8a]" />;
      case 'hopeful':
        return <SunMedium size={14} className="text-[#4a6b4f]" />;
      case 'chaotic':
        return <Zap size={14} className="text-[#b3473b]" />;
    }
  };

  return (
    <div
      className="relative min-h-screen text-[#2b2118] selection:bg-[#a2562b]/20 selection:text-[#2b2118] transition-colors duration-700"
      style={{
        background: moodConfig.palette.bgStyle,
      }}
    >
      {/* Soft paper vignette around page edges */}
      <div
        className="pointer-events-none fixed inset-0 opacity-40 transition-all duration-1000 z-0"
        style={{
          boxShadow: `inset 0 0 120px ${moodConfig.palette.paperWash}`,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-28">
        {/* ========================================================================= */}
        {/* HERO SECTION: UNROLLED MAP ON A DESK WITH LETTERED HEADLINE              */}
        {/* ========================================================================= */}
        <section className="relative pt-2 sm:pt-6 mb-20 sm:mb-28">
          {/* Top Bar: Stamped Atlas Note & Mood Switcher */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-2.5">
              <CartographicCompass size={18} color="#5a4632" />
              <div className="h-3 w-px bg-[#a89475]" />
              <span className="text-[11px] font-sc text-[#5a4632] tracking-[0.2em] uppercase">
                Hand-Drawn Explorer's Folio · Cartographer's Desk
              </span>
            </div>

            {/* STAMPED MOOD SWITCHER (6 paper-and-ink tabs) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#ead9b8] border border-[#c4b08c] shadow-sm">
              <span className="text-[10px] font-sc text-[#5a4632] uppercase tracking-wider px-2 hidden sm:inline">
                Mood Wash:
              </span>
              {(['cozy', 'eerie', 'epic', 'melancholy', 'hopeful', 'chaotic'] as MoodType[]).map((moodKey) => {
                const m = MOODS[moodKey];
                const isActive = selectedMood === moodKey;
                return (
                  <button
                    key={moodKey}
                    onClick={() => setSelectedMood(moodKey)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                      isActive
                        ? 'bg-[#fbf4e4] text-[#2b2118] border border-[#a89475] shadow-xs font-semibold'
                        : 'text-[#5a4632] hover:text-[#2b2118] hover:bg-[#e4d3b0]'
                    }`}
                  >
                    {getMoodIcon(moodKey)}
                    <span className="hidden sm:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lettered Headline Above Unrolled Map */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-7xl font-normal leading-[1.08] text-[#2b2118] tracking-tight">
              Stories woven into a <br />
              <span
                className="italic font-light transition-colors duration-500 underline decoration-wavy decoration-[#a2562b]/40 underline-offset-8"
                style={{ color: moodConfig.palette.primary }}
              >
                living atlas of your own.
              </span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-[#5a4632] max-w-xl mx-auto font-body leading-relaxed">
              Describe an original setting or blend beloved titles into an interconnected explorer's map
              for your tabletop campaigns, sagas, and creative writing.
            </p>

            {/* Single Sienna "Begin Your Atlas" Seal Button & Explore Demo */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              {user ? (
                <>
                  <button
                    onClick={onGoToDashboard}
                    className="btn-seal px-7 py-3.5 rounded-xl font-medium text-sm tracking-wide shadow-md flex items-center gap-2.5 cursor-pointer"
                  >
                    <ScrollText size={16} />
                    <span>Open My Atlas Folio</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={onGoToAdd}
                    className="btn-ink px-5 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#fbf4e4]/80"
                  >
                    <Sparkles size={15} style={{ color: moodConfig.palette.primary }} />
                    <span>Chart a New World</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => signInWithGoogle()}
                    disabled={loading}
                    className="btn-seal px-7 py-3.5 rounded-xl font-medium text-sm tracking-wide shadow-md flex items-center gap-2.5 cursor-pointer disabled:opacity-60"
                  >
                    <CartographicCompass size={16} color="#fbf4e4" />
                    <span>Begin your atlas</span>
                    <ArrowRight size={14} />
                  </button>
                  <a
                    href="#interactive-demo-map"
                    className="btn-ink px-5 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer bg-[#fbf4e4]/80"
                  >
                    <Compass size={15} style={{ color: moodConfig.palette.primary }} />
                    <span>Inspect Alice Demo Map</span>
                  </a>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* UNROLLED PARCHMENT MAP ON A DESK (Hero interactive canvas)               */}
          {/* ========================================================================= */}
          <div className="relative w-full rounded-3xl p-3 sm:p-5 bg-[#d4be95] shadow-2xl border-4 border-[#826a4c]">
            {/* The Unrolled Parchment Sheet */}
            <div
              className="relative w-full h-[400px] sm:h-[480px] lg:h-[520px] rounded-2xl overflow-hidden border-2 border-[#5a4632] shadow-inner transition-all duration-700 bg-[#fbf4e4] paper-fold"
            >
              {/* Cartographic Border / Decorative Inked Frame */}
              <div className="absolute inset-2 sm:inset-3 pointer-events-none border border-[#826a4c] rounded-xl z-20">
                <div className="absolute inset-1 border border-dashed border-[#826a4c]/50 rounded-lg" />
              </div>

              {/* Corner Coordinate Rosettes */}
              <div className="absolute top-4 left-5 z-20 flex items-center gap-2 font-notes text-xs text-[#5a4632] bg-[#fbf4e4]/90 px-2.5 py-1 rounded border border-[#a89475]">
                <CartographicCompass size={14} color="#5a4632" />
                <span>45° 18' N · 12° 20' E</span>
                <span className="text-[#a89475]">·</span>
                <span className="font-sc text-[10px] text-[#a2562b]">Unrolled Folio</span>
              </div>

              {/* Scale Bar on Map */}
              <div className="absolute bottom-4 left-5 z-20 hidden sm:flex items-center gap-2 font-notes text-[10px] text-[#5a4632] bg-[#fbf4e4]/90 px-2.5 py-1 rounded border border-[#a89475]">
                <span>Scale: 0</span>
                <div className="w-16 h-1 bg-[#2b2118] relative">
                  <div className="absolute left-1/2 -top-1 w-px h-3 bg-[#2b2118]" />
                </div>
                <span>50 Leagues</span>
              </div>

              {/* Interactive Inked Map SVG Canvas */}
              <div className="absolute inset-0 overflow-hidden cursor-crosshair">
                <svg
                  viewBox="0 0 960 520"
                  className="w-full h-full select-none"
                >
                  <defs>
                    {/* Topographic Contour Pattern */}
                    <pattern id="contour-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path
                        d="M 0 30 Q 30 10 60 30 T 120 30"
                        fill="none"
                        stroke="#d6c39f"
                        strokeWidth="0.6"
                        opacity="0.4"
                      />
                    </pattern>

                    {/* Paper texture overlay */}
                    <filter id="inkRoughness">
                      <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" result="noise" />
                      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
                    </filter>
                  </defs>

                  {/* Topographic Background */}
                  <rect width="960" height="520" fill="#fbf4e4" />
                  <rect width="960" height="520" fill="url(#contour-pattern)" />

                  {/* Compass Rose Engraving in Canvas */}
                  <g transform="translate(850, 420)" opacity="0.35">
                    <CartographicCompass size={110} color="#5a4632" />
                  </g>

                  {/* Dashed Inked Routes Between Provinces */}
                  <g className="routes">
                    {HERO_LANDMARKS.flatMap((source) =>
                      source.connectsTo.map((targetId) => {
                        const target = HERO_LANDMARKS.find((n) => n.id === targetId);
                        if (!target || source.id > target.id) return null;

                        const isNodeActive =
                          activeHeroNodeId === source.id || activeHeroNodeId === target.id;

                        // Hand-drawn gentle curve
                        const midX = (source.x + target.x) / 2 + (source.y - target.y) * 0.14;
                        const midY = (source.y + target.y) / 2 + (target.x - source.x) * 0.14;

                        return (
                          <g key={`${source.id}-${target.id}`}>
                            {/* Inked Trail Path */}
                            <path
                              d={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                              fill="none"
                              stroke={isNodeActive ? '#a2562b' : '#6b553e'}
                              strokeWidth={isNodeActive ? 2.4 : 1.5}
                              strokeDasharray={isNodeActive ? '5 5' : '4 6'}
                              className="animate-ink-trail"
                              opacity={isNodeActive ? 0.95 : 0.45}
                            />

                            {/* Small waypoint dot drifting on route */}
                            {isNodeActive && (
                              <circle r="3" fill="#a2562b">
                                <animateMotion
                                  path={`M ${source.x} ${source.y} Q ${midX} ${midY} ${target.x} ${target.y}`}
                                  dur="4.5s"
                                  repeatCount="indefinite"
                                />
                              </circle>
                            )}
                          </g>
                        );
                      })
                    )}
                  </g>

                  {/* Hand-Drawn Landmark Pins & Ribbon Labels */}
                  {HERO_LANDMARKS.map((landmark) => {
                    const isSelected = activeHeroNodeId === landmark.id;
                    return (
                      <g
                        key={landmark.id}
                        transform={`translate(${landmark.x}, ${landmark.y})`}
                        className="cursor-pointer group"
                        onClick={() => setActiveHeroNodeId(landmark.id)}
                      >
                        {/* Selected ink bleed circle */}
                        {isSelected && (
                          <circle
                            r="24"
                            fill="#a2562b"
                            opacity="0.12"
                            className="animate-ink-bleed"
                          />
                        )}

                        {/* Hand-drawn Illustrated Pin / Landmark Emblem */}
                        <g transform="translate(0, -10)">
                          {/* Pin base */}
                          <path
                            d="M 0 0 L -5 -16 C -8 -20 -8 -26 0 -26 C 8 -26 8 -20 5 -16 Z"
                            fill={isSelected ? '#a2562b' : '#ead9b8'}
                            stroke="#3c2e22"
                            strokeWidth="1.5"
                            className="transition-colors duration-200"
                          />
                          <circle
                            cx="0"
                            cy="-21"
                            r="3"
                            fill={isSelected ? '#fbf4e4' : '#5a4632'}
                          />
                        </g>

                        {/* Ribbon Label for Name */}
                        <g transform="translate(0, 16)">
                          <rect
                            x={-(landmark.name.length * 3.4) - 8}
                            y="-11"
                            width={landmark.name.length * 6.8 + 16}
                            height="18"
                            rx="4"
                            fill="#fbf4e4"
                            stroke="#5a4632"
                            strokeWidth={isSelected ? 1.5 : 1}
                            className="shadow-sm"
                          />
                          <text
                            x="0"
                            y="2"
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="600"
                            fontFamily="'IM Fell English', Georgia, serif"
                            fill={isSelected ? '#a2562b' : '#2b2118'}
                          >
                            {landmark.name}
                          </text>
                        </g>

                        {/* Province Type in Special Elite */}
                        <text
                          x="0"
                          y="32"
                          textAnchor="middle"
                          fontSize="8.5"
                          fontFamily="'Special Elite', monospace"
                          fill="#78634d"
                        >
                          {landmark.type}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Floating Side Note / Pinned Cartouche for Selected Landmark */}
              <div className="absolute bottom-4 right-4 sm:w-88 z-30">
                <div className="p-4 rounded-xl bg-[#fbf4e4] border-2 border-[#5a4632] shadow-xl atlas-cartouche">
                  {/* Pinned Note Header with Wax Seal dot */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-notes text-[#a2562b] uppercase tracking-wider">
                        <MapPin size={11} />
                        <span>{activeLandmark.type}</span>
                      </div>
                      <h3 className="font-heading text-lg text-[#2b2118] font-semibold leading-tight">
                        {activeLandmark.name}
                      </h3>
                    </div>
                    <span className="w-4 h-4 rounded-full wax-seal shrink-0 mt-0.5" />
                  </div>

                  <p className="text-xs text-[#5a4632] leading-relaxed font-body italic mb-3">
                    "{activeLandmark.description}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#d6c39f] font-notes text-[#78634d]">
                    <div className="flex items-center gap-1">
                      <GitBranch size={11} className="text-[#a2562b]" />
                      <span>{activeLandmark.connectsTo.length} Connected Paths</span>
                    </div>
                    <a
                      href="#interactive-demo-map"
                      className="text-[#a2562b] font-medium hover:underline flex items-center gap-1"
                    >
                      <span>Explore Demo</span>
                      <ArrowRight size={11} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3-STEP FLOW: "Describe or blend → Unfold provinces → Choose atmosphere"   */}
        {/* ========================================================================= */}
        <section className="mb-24 sm:mb-32">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ead9b8] border border-[#c4b08c] text-xs font-sc text-[#a2562b] mb-3">
              <Sparkles size={12} />
              <span>Cartographic Genesis</span>
            </div>
            <h2 className="font-heading text-3xl sm:text-5xl text-[#2b2118] font-normal tracking-tight">
              From premise to living world
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#5a4632] font-body">
              How Lore unfolds your imagination into interconnected realm cartography on aged paper.
            </p>
          </div>

          {/* 3 Physical Paper Tag Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Step 1: Describe or Blend */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 relative flex flex-col justify-between atlas-tag-1 ${
                stepFlowIndex === 0
                  ? 'bg-[#fbf4e4] border-[#a2562b] shadow-xl'
                  : 'bg-[#ead9b8] border-[#c4b08c] hover:border-[#a2562b]'
              }`}
              onMouseEnter={() => setStepFlowIndex(0)}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#f3e7cf] border border-[#ab9676] flex items-center justify-center font-sc text-xs font-bold text-[#a2562b]">
                      01
                    </span>
                    <span className="text-xs font-sc uppercase tracking-wider text-[#5a4632]">
                      Premise
                    </span>
                  </div>
                  <BookOpen size={16} className="text-[#a2562b]" />
                </div>

                <h3 className="font-heading text-xl sm:text-2xl text-[#2b2118] mb-2">
                  Describe or Blend
                </h3>
                <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed mb-6 font-body">
                  Type an original setting concept for your story or campaign, or select 2–3 beloved
                  sources to weave into a unified convergence realm.
                </p>

                {/* Ruled Notebook Mockup for Step 1 */}
                <div className="p-4 rounded-xl bg-[#fbf5e6] border border-[#c9b793] space-y-2.5 font-notes text-xs">
                  <div className="flex items-center justify-between text-[10px] text-[#78634d]">
                    <span>INSCRIBING PREMISE</span>
                    <span className="text-[#4a6b4f]">● Ready</span>
                  </div>
                  <div className="p-2 border-b-2 border-[#a2562b] text-[#2b2118] flex items-center justify-between">
                    <span>The Sunken Metropolis of Glass</span>
                    <span className="text-[10px] text-[#78634d]">Campaign</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded bg-[#ebd8b5] text-[10px] text-[#5a4632] border border-[#c4b08c]">
                      Dune × Bloodborne
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#ebd8b5] text-[10px] text-[#5a4632] border border-[#c4b08c]">
                      Solarpunk Harbor
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#d4c29d] flex items-center justify-between text-xs text-[#78634d] font-notes">
                <span>Sanitized & Cached</span>
                <span className="text-[#a2562b]">Step 1 of 3</span>
              </div>
            </div>

            {/* Step 2: Unfold the Provinces */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 relative flex flex-col justify-between atlas-tag-2 ${
                stepFlowIndex === 1
                  ? 'bg-[#fbf4e4] border-[#a2562b] shadow-xl'
                  : 'bg-[#ead9b8] border-[#c4b08c] hover:border-[#a2562b]'
              }`}
              onMouseEnter={() => setStepFlowIndex(1)}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#f3e7cf] border border-[#ab9676] flex items-center justify-center font-sc text-xs font-bold text-[#a2562b]">
                      02
                    </span>
                    <span className="text-xs font-sc uppercase tracking-wider text-[#5a4632]">
                      Topography
                    </span>
                  </div>
                  <GitBranch size={16} className="text-[#a2562b]" />
                </div>

                <h3 className="font-heading text-xl sm:text-2xl text-[#2b2118] mb-2">
                  Unfold the Provinces
                </h3>
                <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed mb-6 font-body">
                  Gemini analyzes themes across a 20-dimensional matrix, synthesizing interconnected
                  provinces, original bridge sanctuaries, and archetypal figures.
                </p>

                {/* Visual Node Diagram */}
                <div className="p-4 rounded-xl bg-[#fbf5e6] border border-[#c9b793] space-y-2 font-notes text-xs">
                  <div className="flex items-center justify-between text-[10px] text-[#78634d]">
                    <span>REALM CARTOGRAPHY</span>
                    <span className="text-[#a2562b]">6 Provinces</span>
                  </div>
                  <div className="h-20 rounded-lg bg-[#f3e7cf] border border-[#c4b08c] relative flex items-center justify-center">
                    <svg className="w-full h-full" viewBox="0 0 200 80">
                      <line x1="40" y1="40" x2="100" y2="25" stroke="#5a4632" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="100" y1="25" x2="160" y2="45" stroke="#5a4632" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="40" y1="40" x2="100" y2="60" stroke="#5a4632" strokeWidth="1.5" strokeDasharray="3 3" />
                      <line x1="100" y1="60" x2="160" y2="45" stroke="#5a4632" strokeWidth="1.5" strokeDasharray="3 3" />
                      <circle cx="40" cy="40" r="5" fill="#a2562b" stroke="#3c2e22" />
                      <circle cx="100" cy="25" r="5" fill="#ead9b8" stroke="#3c2e22" />
                      <circle cx="100" cy="60" r="5" fill="#ead9b8" stroke="#3c2e22" />
                      <circle cx="160" cy="45" r="5" fill="#9c2f2f" stroke="#3c2e22" />
                    </svg>
                  </div>
                  <div className="text-[10px] text-[#5a4632]">
                    ✓ Linked characters and story hooks generated
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#d4c29d] flex items-center justify-between text-xs text-[#78634d] font-notes">
                <span>Validated via Zod</span>
                <span className="text-[#a2562b]">Step 2 of 3</span>
              </div>
            </div>

            {/* Step 3: Choose Your Atmosphere */}
            <div
              className={`p-6 sm:p-7 rounded-2xl border-2 transition-all duration-300 relative flex flex-col justify-between atlas-tag-3 ${
                stepFlowIndex === 2
                  ? 'bg-[#fbf4e4] border-[#a2562b] shadow-xl'
                  : 'bg-[#ead9b8] border-[#c4b08c] hover:border-[#a2562b]'
              }`}
              onMouseEnter={() => setStepFlowIndex(2)}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#f3e7cf] border border-[#ab9676] flex items-center justify-center font-sc text-xs font-bold text-[#a2562b]">
                      03
                    </span>
                    <span className="text-xs font-sc uppercase tracking-wider text-[#5a4632]">
                      Atmosphere
                    </span>
                  </div>
                  <Palette size={16} className="text-[#a2562b]" />
                </div>

                <h3 className="font-heading text-xl sm:text-2xl text-[#2b2118] mb-2">
                  Choose Your Atmosphere
                </h3>
                <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed mb-6 font-body">
                  Re-skin your world with 6 paper washes: Cozy amber, Eerie lichen, Epic banner bronze,
                  Melancholy sea mist, Hopeful sage, or Chaotic torn ink.
                </p>

                {/* Swatches Grid */}
                <div className="p-4 rounded-xl bg-[#fbf5e6] border border-[#c9b793] space-y-2 font-notes text-xs">
                  <div className="flex items-center justify-between text-[10px] text-[#78634d]">
                    <span>ATMOSPHERIC WASH</span>
                    <span className="text-[#a2562b]">Pure SVG / PNG</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 py-1">
                    {(['cozy', 'eerie', 'epic', 'melancholy', 'hopeful', 'chaotic'] as MoodType[]).map((mKey) => {
                      const m = MOODS[mKey];
                      return (
                        <button
                          key={mKey}
                          onClick={() => setSelectedMood(mKey)}
                          className="h-9 rounded-lg border border-[#c4b08c] flex items-center justify-center gap-1 cursor-pointer hover:border-[#a2562b]"
                          style={{ backgroundColor: m.palette.cardBg }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.palette.primary }} />
                          <span className="text-[9px] text-[#5a4632]">{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-[#5a4632] pt-1">
                    Downloadable 1080p cartographic wallpapers
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#d4c29d] flex items-center justify-between text-xs text-[#78634d] font-notes">
                <span>Hand-Drawn SVG Art</span>
                <span className="text-[#a2562b]">Step 3 of 3</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* INTERACTIVE SPECIMEN REALM MAP: ALICE IN WONDERLAND                      */}
        {/* ========================================================================= */}
        <section
          id="interactive-demo-map"
          className={`relative mb-24 transition-all duration-500 ${
            isDemoFullscreen
              ? 'fixed inset-0 z-50 p-4 sm:p-6 bg-[#f3e7cf] overflow-auto'
              : 'rounded-3xl'
          }`}
        >
          {/* Section Header on Parchment */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 mb-6 pb-4 border-b border-[#c4b08c]">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-sc border font-medium bg-[#ead9b8] border-[#ab9676] text-[#a2562b]">
                  <Compass size={13} />
                  Specimen Realm Map
                </span>
                <span className="text-xs text-[#5a4632] font-notes">
                  Alice's Adventures in Wonderland · Lewis Carroll
                </span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#e8f2e9] border border-[#6b9e71] text-[#2f5c35] font-notes">
                  No Login Required
                </span>
              </div>

              <h2 className="font-heading text-2xl sm:text-4xl text-[#2b2118] font-normal tracking-tight">
                {ALICE_DEMO_WORLD.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#735d44] mt-1 italic font-body max-w-2xl">
                "{ALICE_DEMO_WORLD.tone}"
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDemoFullscreen(!isDemoFullscreen)}
                className="btn-ink px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer bg-[#fbf4e4]"
                title={isDemoFullscreen ? 'Exit Fullscreen' : 'Expand to Fullscreen Map'}
              >
                {isDemoFullscreen ? (
                  <>
                    <Minimize2 size={14} className="text-[#a2562b]" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={14} className="text-[#a2562b]" />
                    <span>Fullscreen Map</span>
                  </>
                )}
              </button>

              <button
                onClick={onExploreDemoWorld}
                className="btn-seal px-5 py-2.5 rounded-xl font-medium text-xs tracking-wide shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Compass size={14} />
                <span>Open in World Folio</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setDemoActiveTab('map')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                demoActiveTab === 'map'
                  ? 'bg-[#a2562b] text-[#fbf4e4] shadow-sm font-semibold'
                  : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
              }`}
            >
              <Compass size={13} />
              <span>Interactive Realm Map ({ALICE_PLACES.length} Provinces)</span>
            </button>

            <button
              onClick={() => setDemoActiveTab('cosmology')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                demoActiveTab === 'cosmology'
                  ? 'bg-[#a2562b] text-[#fbf4e4] shadow-sm font-semibold'
                  : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
              }`}
            >
              <ScrollText size={13} />
              <span>Cosmology & Synthesized Lore</span>
            </button>

            <button
              onClick={() => setDemoActiveTab('figures')}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer ${
                demoActiveTab === 'figures'
                  ? 'bg-[#a2562b] text-[#fbf4e4] shadow-sm font-semibold'
                  : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
              }`}
            >
              <Users size={13} />
              <span>Figures & Lorekeepers ({ALICE_CHARACTERS.length})</span>
            </button>
          </div>

          {/* TAB 1: THE REALM MAP */}
          {demoActiveTab === 'map' && (
            <div className="relative">
              {/* Province tags strip */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-3 text-xs scrollbar-thin">
                <span className="text-[11px] font-sc text-[#78634d] uppercase shrink-0">
                  Provinces:
                </span>
                {ALICE_PLACES.map((p) => (
                  <span
                    key={p.id}
                    className="px-3 py-1 rounded-lg bg-[#fbf5e6] border border-[#c4b08c] text-[#5a4632] text-[11px] shrink-0 font-medium"
                  >
                    {p.name.replace(/^The\s+/, '')}
                  </span>
                ))}
              </div>

              {/* The Hand-Drawn Realm Map */}
              <RealmMap
                places={ALICE_PLACES}
                characters={ALICE_CHARACTERS}
                worldTitle={ALICE_DEMO_WORLD.title}
              />
            </div>
          )}

          {/* TAB 2: COSMOLOGY */}
          {demoActiveTab === 'cosmology' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#ead9b8] border-2 border-[#c4b08c] space-y-6">
              <div className="p-6 rounded-2xl bg-[#fbf4e4] border border-[#c4b08c]">
                <div className="text-[11px] font-sc text-[#a2562b] uppercase tracking-wider mb-2">
                  Synthesized Cosmological Genesis (Lewis Carroll)
                </div>
                <p className="font-heading text-xl sm:text-2xl text-[#2b2118] italic leading-relaxed">
                  "{ALICE_DEMO_WORLD.blurb}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#fbf4e4] border border-[#c4b08c]">
                  <div className="text-xs font-sc text-[#a2562b] uppercase mb-1">
                    Spatial & Mass Inversion
                  </div>
                  <p className="text-xs sm:text-sm text-[#5a4632] font-body leading-relaxed">
                    Microscopic portals conceal royal rose gardens; consuming fungi alters physical
                    mass and bodily scale.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#fbf4e4] border border-[#c4b08c]">
                  <div className="text-xs font-sc text-[#a2562b] uppercase mb-1">
                    Chronomantic Arrest
                  </div>
                  <p className="text-xs sm:text-sm text-[#5a4632] font-body leading-relaxed">
                    Time stands broken in protest at six o'clock, trapping attendees in an endless tea ceremony.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#fbf4e4] border border-[#c4b08c]">
                  <div className="text-xs font-sc text-[#a2562b] uppercase mb-1">
                    Dream-Logic Jurisprudence
                  </div>
                  <p className="text-xs sm:text-sm text-[#5a4632] font-body leading-relaxed">
                    Sentences are proclaimed prior to trial evidence, inverting sovereign law into theatre.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FIGURES */}
          {demoActiveTab === 'figures' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ALICE_CHARACTERS.map((char, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#fbf4e4] border-2 border-[#c4b08c] flex flex-col justify-between shadow-sm atlas-tag-1"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Feather size={14} className="text-[#a2562b]" />
                      <h4 className="font-heading text-xl text-[#2b2118] font-medium">
                        {char.name}
                      </h4>
                    </div>
                    <div className="text-xs font-sc text-[#a2562b] mb-3">{char.role}</div>
                    <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed font-body">
                      {char.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#d4c29d] flex items-center justify-between text-[11px] text-[#78634d] font-notes">
                    <span>Archetype 0{idx + 1}</span>
                    <button
                      onClick={() => setDemoActiveTab('map')}
                      className="text-[#a2562b] font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Locate on Map</span>
                      <ArrowRight size={10} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 6-ATMOSPHERE CHROMATIC WALLPAPER SECTION                                  */}
        {/* ========================================================================= */}
        <section className="mb-24 sm:mb-32">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#ead9b8] border-2 border-[#c4b08c] shadow-lg relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbf4e4] border border-[#ab9676] text-xs font-sc text-[#a2562b]">
                  <Palette size={13} />
                  <span>Cartographic Wallpapers</span>
                </div>
                <h3 className="font-heading text-3xl sm:text-4xl text-[#2b2118] font-normal leading-tight">
                  One world, six atmospheric ink treatments.
                </h3>
                <p className="text-sm text-[#5a4632] font-body leading-relaxed">
                  Every world you generate can be rendered across 6 atmospheric moods. Each mood
                  computes a pure SVG & PNG wallpaper with hand-drawn vector engravings for your desk.
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-[#fbf4e4] border border-[#c4b08c] text-xs font-notes text-[#5a4632]">
                    100% Client-Side Render
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#fbf4e4] border border-[#c4b08c] text-xs font-notes text-[#5a4632]">
                    Vector Engraving
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#fbf4e4] border border-[#c4b08c] text-xs font-notes text-[#5a4632]">
                    1080p Download
                  </span>
                </div>
              </div>

              {/* Atmospheric Grid Showcase */}
              <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'cozy', label: 'Cozy', color: '#a2562b', desc: 'Warm sepia & candle-light vignette' },
                  { id: 'eerie', label: 'Eerie', color: '#43685e', desc: 'Grey-green fog wash & cold ink' },
                  { id: 'epic', label: 'Epic', color: '#9c2f2f', desc: 'Banner crimson & bronze ochre' },
                  { id: 'melancholy', label: 'Melancholy', color: '#4f7a8a', desc: 'Sea blue-grey wash & rain streaks' },
                  { id: 'hopeful', label: 'Hopeful', color: '#4a6b4f', desc: 'Pale sage wash & dawn sunlight' },
                  { id: 'chaotic', label: 'Chaotic', color: '#b3473b', desc: 'Scratchy dry ink & torn edges' },
                ].map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#fbf4e4] border border-[#c4b08c] hover:border-[#a2562b] transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-heading text-base text-[#2b2118] font-semibold">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#5a4632] font-body leading-snug mb-2">
                      {item.desc}
                    </div>
                    <div className="text-[9px] font-notes text-[#a2562b] flex items-center gap-1 group-hover:underline">
                      <span>Preview treatment</span>
                      <ArrowRight size={9} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FINAL CALLOUT BANNER                                                      */}
        {/* ========================================================================= */}
        <section className="p-8 sm:p-14 rounded-3xl bg-[#ead9b8] border-2 border-[#5a4632] text-center shadow-xl">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-[#fbf4e4] border-2 border-[#826a4c]">
              <CartographicCompass size={24} color="#5a4632" />
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl text-[#2b2118] font-normal tracking-tight">
              Begin your personal atlas.
            </h2>

            <p className="text-sm sm:text-base text-[#5a4632] font-body leading-relaxed max-w-lg mx-auto">
              Weave your worldbuilding concepts or favorite literature into an interconnected folio of
              hand-drawn provinces, figures, and story hooks.
            </p>

            {user ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                <button
                  onClick={onGoToDashboard}
                  className="btn-seal w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-sm tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ScrollText size={16} />
                  <span>Open My Atlas Folio</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={onGoToAdd}
                  className="btn-ink w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#fbf4e4] text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles size={16} className="text-[#a2562b]" />
                  <span>Chart First Realm</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
                <button
                  onClick={() => signInWithGoogle()}
                  disabled={loading}
                  className="btn-seal w-full sm:w-auto px-8 py-3.5 rounded-xl font-medium text-sm tracking-wide shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
                >
                  <CartographicCompass size={18} color="#fbf4e4" />
                  <span>Sign in with Google to Begin</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={onExploreDemoWorld}
                  className="btn-ink w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[#fbf4e4] text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass size={15} className="text-[#a2562b]" />
                  <span>Launch Alice Demo Directly</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
