import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { World } from '../types';
import { worldsService } from '../services/worldsService';
import { CartographicCompass } from './CartographicCompass';
import {
  Compass,
  Sparkles,
  Scroll,
  AlertCircle,
  CheckCircle2,
  Zap,
  MapPin,
  Users,
  RotateCw,
  ArrowLeft,
  GitMerge,
  X,
} from 'lucide-react';

interface AddTitlePageProps {
  onBackToDashboard: () => void;
  onSuccess: (world?: World) => void;
}

type InputMode = 'setting' | 'blend';

const GENESIS_STAGES_SETTING = [
  { label: 'Inscribing realm premise into the parchment folio...', icon: Scroll },
  { label: 'Synthesizing atmospheric tone & 60-word genesis blurb...', icon: Compass },
  { label: 'Charting 5–8 interconnected provinces & inked trail routes...', icon: MapPin },
  { label: 'Stationing archetypal figures & lorekeepers...', icon: Users },
  { label: 'Crafting 5 campaign story hooks for writers & GMs...', icon: Sparkles },
  { label: 'Finalizing hand-drawn cartography & unrolling map...', icon: CheckCircle2 },
];

const GENESIS_STAGES_BLEND = [
  { label: 'Inscribing convergence blend into the folio...', icon: Scroll },
  { label: 'Synthesizing conflicting aesthetics & unified tone...', icon: Compass },
  { label: 'Forging provinces and original convergence bridge sanctuaries...', icon: GitMerge },
  { label: 'Color-coding territorial origins with wax seals & trails...', icon: MapPin },
  { label: 'Stationing faction figures & crafting 5 campaign seeds...', icon: Users },
  { label: 'Finalizing hand-drawn cartography & unrolling map...', icon: CheckCircle2 },
];

export const AddTitlePage: React.FC<AddTitlePageProps> = ({ onBackToDashboard, onSuccess }) => {
  const { user } = useAuth();

  const [mode, setMode] = useState<InputMode>('setting');

  // Single Setting state
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  // Blend state (1-3 titles/genres)
  const [sources, setSources] = useState<string[]>(['Dune', 'Bloodborne']);
  const [sourceInput, setSourceInput] = useState('');
  const [blendTitle, setBlendTitle] = useState('');
  const [blendNote, setBlendNote] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStage, setActiveStage] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [remainingGens, setRemainingGens] = useState<number>(10);

  useEffect(() => {
    if (user) {
      worldsService.getRateLimit(user.uid).then((res) => {
        setRemainingGens(res.remaining);
      });
    }
  }, [user]);

  // Stage timer during generation for realistic visual feedback
  const activeStages = mode === 'blend' ? GENESIS_STAGES_BLEND : GENESIS_STAGES_SETTING;
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGenerating && activeStage < activeStages.length - 2) {
      timer = setTimeout(() => {
        setActiveStage((prev) => Math.min(prev + 1, activeStages.length - 2));
      }, 1400);
    }
    return () => clearTimeout(timer);
  }, [isGenerating, activeStage, activeStages.length]);

  const addSource = () => {
    const trimmed = sourceInput.trim();
    if (trimmed && sources.length < 3 && !sources.includes(trimmed)) {
      setSources([...sources, trimmed]);
      setSourceInput('');
      if (!blendTitle) {
        setBlendTitle(`${[...sources, trimmed].join(' × ')} Convergence`);
      }
    }
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  // Preset inspiration prompts for tabletop GMs & writers
  const gmPresets = [
    { title: 'Subterranean Fungal Citadel', note: 'Bioluminescent moss, silent deep-dwarf cartographers, and bottled echoes traded as currency.' },
    { title: 'Solarpunk Sun-Archive', note: 'Canopy universities built on giant migratory trees, glass lenses concentrating pure sunlight, and radical ecological harmony.' },
    { title: 'Eldritch Western Frontier', note: 'A dusty desert railway bordered by bone-white canyons where old gods sleep beneath the gold mines.' },
    { title: 'Gothic Necropolis of Glass', note: 'Obsidian cathedrals overlooking a calm mercury sea where clockwork penitents ring bells for the drowned.' },
  ];

  const blendPresets = [
    { sources: ['Dune', 'Bloodborne'], title: 'Desert of the Blood Moon' },
    { sources: ['Piranesi', 'Blade Runner'], title: 'The Infinite Rain Pavilion' },
    { sources: ['Grimdark Fantasy', 'Cyberpunk', 'Solarpunk'], title: 'The Neon Ruins of Eden' },
    { sources: ['Arcane', 'Dark Souls'], title: 'Hextech Ashes of Lothric' },
  ];

  // Save only without AI generation
  const handleSaveOnly = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      setErrorMessage('You must be signed in to save a realm.');
      return;
    }

    const currentTitle = mode === 'setting' ? title.trim() : blendTitle.trim() || sources.join(' + ');
    if (!currentTitle) {
      setErrorMessage('Please provide a title or setting concept.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setIsRateLimited(false);

    try {
      await worldsService.createWorld(user.uid, {
        title: currentTitle,
        type: mode === 'setting' ? 'setting' : 'blend',
        note: mode === 'setting' ? note.trim() || undefined : blendNote.trim() || undefined,
        sources: mode === 'blend' ? sources : undefined,
        generationType: mode,
      });

      setShowSuccessToast(true);
      setTimeout(() => {
        onSuccess();
      }, 700);
    } catch (err: any) {
      console.error('Failed to save world:', err);
      setErrorMessage(
        err?.message || 'Failed to save realm to Firestore. Please check your connection and retry.'
      );
      setIsSubmitting(false);
    }
  };

  // Main flow: Inscribe AND Generate World Lore via Gemini
  const handleSaveAndGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      setErrorMessage('You must be signed in to generate a realm.');
      return;
    }

    const currentTitle = mode === 'setting' ? title.trim() : blendTitle.trim() || sources.join(' + ');
    if (!currentTitle) {
      setErrorMessage(
        mode === 'setting'
          ? 'Please enter a title or setting name.'
          : 'Please enter a title for your converged realm.'
      );
      return;
    }

    if (mode === 'blend' && sources.length < 2) {
      setErrorMessage('Please add at least 2 titles or genres to converge.');
      return;
    }

    setIsGenerating(true);
    setActiveStage(0);
    setErrorMessage(null);
    setIsRateLimited(false);

    try {
      const currentNote = mode === 'setting' ? note.trim() : blendNote.trim();

      // Create world doc in Firestore
      const worldId = await worldsService.createWorld(user.uid, {
        title: currentTitle,
        type: mode === 'setting' ? 'setting' : 'blend',
        note: currentNote || undefined,
        sources: mode === 'blend' ? sources : undefined,
        generationType: mode,
      });

      setActiveStage(1);

      // Call server-side generateWorld
      const genResult = await worldsService.generateWorldViaServer(
        currentTitle,
        mode === 'setting' ? 'setting' : 'blend',
        currentNote || undefined,
        worldId,
        mode === 'blend' ? sources : undefined
      );

      setActiveStage(4);
      setRemainingGens(genResult.remainingGenerations);
      setActiveStage(5);

      const createdWorld: World = {
        id: worldId,
        userId: user.uid,
        title: currentTitle,
        type: mode === 'setting' ? 'setting' : 'blend',
        note: currentNote || undefined,
        sources: mode === 'blend' ? sources : undefined,
        generationType: mode,
        status: 'ready',
        tone: genResult.data.tone,
        themes: genResult.data.themes,
        blurb: genResult.data.blurb,
        places: genResult.data.places,
        characters: genResult.data.characters,
        storyHooks: genResult.data.storyHooks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setShowSuccessToast(true);
      setTimeout(() => {
        onSuccess(createdWorld);
      }, 900);
    } catch (err: any) {
      console.error('Generate world error:', err);
      const isLimit =
        err?.message?.includes('limit') ||
        err?.message?.includes('10 generations') ||
        err?.code === 'RATE_LIMIT_EXCEEDED';

      if (isLimit) {
        setIsRateLimited(true);
        setErrorMessage(
          'You have reached the daily generation limit (10 worlds per day). You can save this realm as a draft!'
        );
      } else {
        setErrorMessage(
          err?.message || 'Failed to synthesize world lore. Please check your connection or retry.'
        );
      }
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      {/* Return navigation & Daily quota */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBackToDashboard}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5a4632] hover:text-[#2b2118] transition-colors cursor-pointer group disabled:opacity-50"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Return to Atlas Folio</span>
        </button>

        <span className="inline-flex items-center gap-1.5 text-[11px] font-notes text-[#2b2118] bg-[#ead9b8] px-3 py-1 rounded-lg border border-[#c4b08c]">
          <Zap size={12} className="text-[#a2562b]" />
          {remainingGens}/10 generations left today
        </span>
      </div>

      {/* Main Parchment Card */}
      <div className="bg-[#fbf4e4] rounded-3xl p-6 sm:p-10 border-4 border-[#5a4632] shadow-2xl relative overflow-hidden paper-fold">
        {/* Subtle decorative stamp */}
        <div className="absolute top-6 right-6 text-right hidden sm:block opacity-40 pointer-events-none">
          <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest font-bold">
            Cartographer's Workshop
          </div>
          <div className="text-[10px] font-notes text-[#78634d]">Folio Inscription</div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <CartographicCompass size={20} color="#5a4632" />
            <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest font-bold">
              World Creation
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl text-[#2b2118] font-bold">
            Forge an Imagined Realm
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4632] mt-1 font-body leading-relaxed">
            Craft an original world for your novel, campaign, or tabletop RPG. Describe a custom premise,
            or blend 1–3 beloved titles and genres into an interconnected tapestry with bridge sanctuaries.
          </p>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-[#fcedeb] border-2 border-[#d98b8b] flex items-start gap-3">
            <AlertCircle size={18} className="text-[#9c2f2f] shrink-0 mt-0.5" />
            <div className="text-xs text-[#852525] leading-relaxed flex-1 font-body">
              <div>{errorMessage}</div>
              {isRateLimited && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleSaveOnly}
                    disabled={isSubmitting}
                    className="btn-ink px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer bg-[#fbf4e4]"
                  >
                    Save as Draft Only (Skip AI Generation)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Toast */}
        {showSuccessToast && (
          <div className="mb-6 p-4 rounded-xl bg-[#e8f2e9] border-2 border-[#6b9e71] flex items-center gap-3">
            <CheckCircle2 size={18} className="text-[#2f5c35] shrink-0" />
            <div className="text-xs text-[#2f5c35] font-medium font-body">
              Realm forged and charted on parchment! Opening Realm Map...
            </div>
          </div>
        )}

        {/* LIVE GENESIS ANIMATION (Paper unfold, ink drawing) */}
        {isGenerating && (
          <div className="mb-8 p-6 rounded-2xl bg-[#ead9b8] border-2 border-[#a2562b] shadow-md animate-ink-bleed">
            <div className="flex items-center gap-4 mb-5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[#fbf4e4] border-2 border-[#826a4c] flex items-center justify-center shadow-xs">
                  <CartographicCompass size={28} color="#5a4632" />
                </div>
              </div>
              <div>
                <h4 className="font-heading text-lg sm:text-xl text-[#2b2118] font-bold">
                  {mode === 'blend'
                    ? `Converging ${sources.join(' + ')}`
                    : `Inscribing "${title || 'Imagined Realm'}"`}
                </h4>
                <div className="text-xs text-[#5a4632] font-body">
                  Querying Gemini server-side · Drawing provinces, bridge sanctuaries & story hooks in ink
                </div>
              </div>
            </div>

            {/* Stages checklist */}
            <div className="space-y-2.5">
              {activeStages.map((st, idx) => {
                const isPassed = activeStage > idx;
                const isCurrent = activeStage === idx;
                const IconComponent = st.icon;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                      isCurrent
                        ? 'bg-[#fbf4e4] border-2 border-[#a2562b] text-[#2b2118] font-bold shadow-xs'
                        : isPassed
                        ? 'bg-[#fbf5e6]/70 text-[#5a4632]'
                        : 'opacity-40 text-[#8a7355]'
                    }`}
                  >
                    <div className="shrink-0">
                      {isPassed ? (
                        <CheckCircle2 size={15} className="text-[#4a6b4f]" />
                      ) : isCurrent ? (
                        <RotateCw
                          size={15}
                          className="text-[#a2562b] animate-spin motion-reduce:animate-none"
                        />
                      ) : (
                        <IconComponent size={15} className="text-[#8a7355]" />
                      )}
                    </div>
                    <span className="font-body">{st.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-[#c4b08c] flex items-center justify-between text-[11px] text-[#78634d] font-notes">
              <span>Free tier quota: 10/day</span>
              <span>Validating schema via Zod</span>
            </div>
          </div>
        )}

        {/* MODE TOGGLE: Describe Setting vs Blend Sources */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setMode('setting')}
            disabled={isGenerating || isSubmitting}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              mode === 'setting'
                ? 'bg-[#fbf5e6] border-[#a2562b] shadow-sm text-[#2b2118]'
                : 'bg-[#ead9b8] border-[#c4b08c] text-[#5a4632] hover:border-[#a2562b]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                mode === 'setting'
                  ? 'bg-[#ead9b8] text-[#a2562b] border-[#a2562b]'
                  : 'bg-[#fbf4e4] text-[#5a4632] border-[#c4b08c]'
              }`}
            >
              <Compass size={20} />
            </div>
            <div>
              <div className="text-sm font-bold font-heading">Describe a Setting</div>
              <div className="text-[11px] opacity-80 font-body">
                Original premise for novel or campaign
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('blend')}
            disabled={isGenerating || isSubmitting}
            className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-3.5 ${
              mode === 'blend'
                ? 'bg-[#fbf5e6] border-[#a2562b] shadow-sm text-[#2b2118]'
                : 'bg-[#ead9b8] border-[#c4b08c] text-[#5a4632] hover:border-[#a2562b]'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                mode === 'blend'
                  ? 'bg-[#ead9b8] text-[#a2562b] border-[#a2562b]'
                  : 'bg-[#fbf4e4] text-[#5a4632] border-[#c4b08c]'
              }`}
            >
              <GitMerge size={20} />
            </div>
            <div>
              <div className="text-sm font-bold font-heading">Blend 1–3 Titles or Genres</div>
              <div className="text-[11px] opacity-80 font-body">
                Convergence with bridge provinces
              </div>
            </div>
          </button>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handleSaveAndGenerate} className="space-y-6">
          {/* MODE 1: DESCRIBE A SETTING */}
          {mode === 'setting' && (
            <>
              {/* Setting Title */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="settingTitleInput"
                    className="block text-xs font-sc text-[#2b2118] uppercase tracking-wider font-bold"
                  >
                    Setting or Realm Title <span className="text-[#a2562b]">*</span>
                  </label>
                  <span className="text-[10px] font-notes text-[#78634d]">
                    {title.length}/200
                  </span>
                </div>
                <input
                  id="settingTitleInput"
                  type="text"
                  value={title}
                  maxLength={200}
                  disabled={isGenerating || isSubmitting}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. The Rust Sea of Ouroboros, The Sunken Metropolis of Babel..."
                  className="w-full px-4 py-3 input-parchment text-sm text-[#2b2118] placeholder-[#78634d] disabled:opacity-50"
                  required
                />
              </div>

              {/* Setting Description / Vision */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label
                    htmlFor="settingNoteInput"
                    className="block text-xs font-sc text-[#2b2118] uppercase tracking-wider font-bold"
                  >
                    Premise, Atmosphere & World Rules <span className="text-[#78634d] text-[10px] font-notes">(optional)</span>
                  </label>
                  <span className="text-[10px] font-notes text-[#78634d]">
                    {note.length}/2000
                  </span>
                </div>
                <textarea
                  id="settingNoteInput"
                  value={note}
                  maxLength={2000}
                  rows={4}
                  disabled={isGenerating || isSubmitting}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe the geography, factions, sensory atmosphere, ancient machine gods, forbidden magic rituals, or ecological oddities of your world..."
                  className="w-full px-4 py-3 input-parchment text-sm text-[#2b2118] placeholder-[#78634d] font-body leading-relaxed disabled:opacity-50"
                />

                {/* Tabletop Presets */}
                <div className="mt-4">
                  <div className="text-[10px] font-sc text-[#5a4632] uppercase tracking-wider mb-2 flex items-center gap-1 font-bold">
                    <Sparkles size={11} className="text-[#a2562b]" />
                    Inspiration presets for writers & GMs:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {gmPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isGenerating || isSubmitting}
                        onClick={() => {
                          setTitle(preset.title);
                          setNote(preset.note);
                        }}
                        className="text-left p-3 rounded-xl bg-[#ead9b8] border border-[#c4b08c] hover:border-[#a2562b] hover:bg-[#fbf4e4] transition-all cursor-pointer disabled:opacity-50"
                      >
                        <div className="text-xs font-heading text-[#2b2118] font-bold">
                          {preset.title}
                        </div>
                        <div className="text-[11px] text-[#5a4632] line-clamp-1 mt-0.5 font-body">
                          {preset.note}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MODE 2: BLEND 1-3 TITLES OR GENRES */}
          {mode === 'blend' && (
            <>
              {/* Convergence Sources Input */}
              <div>
                <label className="block text-xs font-sc text-[#2b2118] uppercase tracking-wider mb-2 font-bold">
                  Sources or Genres to Blend (1–3) <span className="text-[#a2562b]">*</span>
                </label>

                {/* Active Source Chips as Wax Seals */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {sources.map((src, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#ead9b8] border-2 border-[#826a4c] text-xs font-medium text-[#2b2118] shadow-xs"
                    >
                      <span className="w-2.5 h-2.5 rounded-full bg-[#a2562b]" />
                      <span className="font-bold">{src}</span>
                      <button
                        type="button"
                        onClick={() => removeSource(idx)}
                        disabled={isGenerating || isSubmitting}
                        className="text-[#5a4632] hover:text-[#9c2f2f] cursor-pointer ml-1"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add Source Input */}
                {sources.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={sourceInput}
                      onChange={(e) => setSourceInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSource();
                        }
                      }}
                      placeholder="Add title or genre (e.g. Dune, Bloodborne, Solarpunk, Arcane...)"
                      className="flex-1 px-4 py-2.5 input-parchment text-sm text-[#2b2118] placeholder-[#78634d]"
                    />
                    <button
                      type="button"
                      onClick={addSource}
                      disabled={!sourceInput.trim()}
                      className="btn-ink px-4 py-2.5 rounded-xl text-xs font-medium bg-[#ead9b8] hover:bg-[#dfcdab] cursor-pointer disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Blend Presets */}
                <div className="mt-3">
                  <div className="text-[10px] font-sc text-[#5a4632] uppercase tracking-wider mb-1.5 flex items-center gap-1 font-bold">
                    <GitMerge size={11} className="text-[#a2562b]" />
                    Popular convergence blends:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {blendPresets.map((bp, idx) => (
                      <button
                        key={idx}
                        type="button"
                        disabled={isGenerating || isSubmitting}
                        onClick={() => {
                          setSources(bp.sources);
                          setBlendTitle(bp.title);
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-[#ead9b8] border border-[#c4b08c] text-[#5a4632] hover:text-[#2b2118] hover:border-[#a2562b] transition-colors cursor-pointer disabled:opacity-50 font-notes"
                      >
                        {bp.sources.join(' + ')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Converged Realm Title */}
              <div>
                <label
                  htmlFor="blendTitleInput"
                  className="block text-xs font-sc text-[#2b2118] uppercase tracking-wider mb-2 font-bold"
                >
                  Unified Realm Title <span className="text-[#a2562b]">*</span>
                </label>
                <input
                  id="blendTitleInput"
                  type="text"
                  value={blendTitle}
                  onChange={(e) => setBlendTitle(e.target.value)}
                  placeholder="e.g. Desert of the Blood Moon, Hextech Ashes..."
                  className="w-full px-4 py-3 input-parchment text-sm text-[#2b2118] placeholder-[#78634d]"
                />
              </div>

              {/* Blend Notes */}
              <div>
                <label
                  htmlFor="blendNoteInput"
                  className="block text-xs font-sc text-[#2b2118] uppercase tracking-wider mb-2 font-bold"
                >
                  Creative Vision for the Convergence <span className="text-[#78634d] text-[10px] font-notes">(optional)</span>
                </label>
                <textarea
                  id="blendNoteInput"
                  rows={3}
                  value={blendNote}
                  onChange={(e) => setBlendNote(e.target.value)}
                  placeholder="How do these worlds collide? Do ancient blood-rites fuel subterranean machinery? Are monks defending ruined towers in a neon wasteland?"
                  className="w-full px-4 py-3 input-parchment text-sm text-[#2b2118] placeholder-[#78634d] font-body"
                />
              </div>
            </>
          )}

          {/* SUBMIT ACTIONS */}
          <div className="pt-6 border-t-2 border-[#c4b08c] flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={onBackToDashboard}
              disabled={isSubmitting || isGenerating}
              className="btn-ink w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-50 bg-[#ead9b8]"
            >
              Cancel
            </button>

            {/* Save Draft Only */}
            <button
              type="button"
              onClick={handleSaveOnly}
              disabled={
                isSubmitting ||
                isGenerating ||
                (mode === 'setting' ? !title.trim() : sources.length === 0)
              }
              className="btn-ink w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 bg-[#ead9b8]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-[#a2562b] border-t-transparent rounded-full animate-spin" />
                  <span>Saving Draft...</span>
                </>
              ) : (
                <>
                  <Scroll size={14} className="text-[#a2562b]" />
                  <span>Save Draft Only</span>
                </>
              )}
            </button>

            {/* Primary Action: Synthesize World & Generate Realm Map */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isGenerating ||
                (mode === 'setting' ? !title.trim() : sources.length < 2)
              }
              className="btn-seal w-full sm:w-auto px-7 py-3 rounded-xl text-xs sm:text-sm font-medium tracking-wide shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing World & Map...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>
                    {mode === 'blend'
                      ? 'Converge & Generate Realm Map'
                      : 'Inscribe & Generate Realm Map'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
