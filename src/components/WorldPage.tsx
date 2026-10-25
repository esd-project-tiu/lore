import React, { useState } from 'react';
import { World, Place, Character, CanonContradiction } from '../types';
import { RealmMap } from './map/RealmMap';
import { MoodTab } from './mood/MoodTab';
import { MoodType, MOODS } from './mood/moodConfigs';
import { CartographicCompass } from './CartographicCompass';
import { worldsService } from '../services/worldsService';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  ScrollText,
  Users,
  Feather,
  Sparkles,
  Quote,
  Palette,
  Check,
  Share2,
  Download,
  ShieldCheck,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  Plus,
  X,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  GitMerge,
} from 'lucide-react';

interface WorldPageProps {
  world: World;
  onBack: () => void;
  onGenerateLore?: (world: World) => void;
  isGenerating?: boolean;
  initialTab?: 'overview' | 'map' | 'mood';
  readOnly?: boolean;
}

export const WorldPage: React.FC<WorldPageProps> = ({
  world: initialWorld,
  onBack,
  onGenerateLore,
  isGenerating = false,
  initialTab,
  readOnly = false,
}) => {
  const { user } = useAuth();
  const [world, setWorld] = useState<World>(initialWorld);

  const places = world.places || [];
  const characters = world.characters || [];
  const storyHooks = world.storyHooks || [];
  const hasLore = Boolean(world.blurb && places.length > 0);

  const isOwner = Boolean(user && user.uid === world.userId && !readOnly);

  const [activeTab, setActiveTab] = useState<'overview' | 'map' | 'mood'>(
    initialTab || (places.length > 0 ? 'map' : 'overview')
  );
  const [currentMood, setCurrentMood] = useState<MoodType>('cozy');

  // Continuity check ("Check canon") state
  const [isCheckingCanon, setIsCheckingCanon] = useState(false);
  const [showCanonModal, setShowCanonModal] = useState(false);
  const [canonContradictions, setCanonContradictions] = useState<CanonContradiction[]>([]);
  const [canonError, setCanonError] = useState<string | null>(null);

  // Share Modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [isPublic, setIsPublic] = useState(world.isPublic || false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Single place regeneration state
  const [isRegeneratingPlace, setIsRegeneratingPlace] = useState(false);

  // Edit / Add Character Modal state
  const [editingCharacterIndex, setEditingCharacterIndex] = useState<number | null>(null);
  const [isAddingCharacter, setIsAddingCharacter] = useState(false);
  const [charForm, setCharForm] = useState<Character>({
    name: '',
    role: '',
    description: '',
    place_id: '',
  });

  // Add Place Modal state
  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [placeForm, setPlaceForm] = useState<{
    name: string;
    description: string;
    connects_to: string[];
  }>({
    name: '',
    description: '',
    connects_to: [],
  });

  const moodTheme = MOODS[currentMood];

  // Helper to persist world changes to Firestore if owner
  const saveWorldPlaces = async (newPlaces: Place[]) => {
    setWorld((prev) => ({ ...prev, places: newPlaces }));
    if (isOwner && world.id) {
      try {
        await worldsService.updateWorldPlaces(world.id, newPlaces);
      } catch (err) {
        console.error('Failed to update places in Firestore:', err);
      }
    }
  };

  const saveWorldCharacters = async (newCharacters: Character[]) => {
    setWorld((prev) => ({ ...prev, characters: newCharacters }));
    if (isOwner && world.id) {
      try {
        await worldsService.updateWorldCharacters(world.id, newCharacters);
      } catch (err) {
        console.error('Failed to update characters in Firestore:', err);
      }
    }
  };

  // Place update callback
  const handleUpdatePlace = (updatedPlace: Place) => {
    const updated = places.map((p) => (p.id === updatedPlace.id ? updatedPlace : p));
    saveWorldPlaces(updated);
  };

  // Place delete callback
  const handleDeletePlace = (placeId: string) => {
    const updated = places.filter((p) => p.id !== placeId);
    saveWorldPlaces(updated);
  };

  // Regenerate single place on demand via Gemini server endpoint
  const handleRegeneratePlace = async (placeToRegen: Place) => {
    if (!isOwner) return;
    setIsRegeneratingPlace(true);
    try {
      const regenerated = await worldsService.regeneratePlaceViaServer(world, placeToRegen);
      const updated = places.map((p) => (p.id === placeToRegen.id ? regenerated : p));
      saveWorldPlaces(updated);
    } catch (err: any) {
      alert(`Could not regenerate place: ${err?.message || 'Error occurred'}`);
    } finally {
      setIsRegeneratingPlace(false);
    }
  };

  // Add new place
  const handleSaveNewPlace = () => {
    if (!placeForm.name.trim()) return;
    const newId = `prov_${placeForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_${Date.now().toString().slice(-4)}`;
    const newPlace: Place = {
      id: newId,
      name: placeForm.name.trim(),
      description: placeForm.description.trim() || 'A newly discovered border province.',
      connects_to: placeForm.connects_to,
      locked: false,
      sourceColor: '#a2562b',
    };
    saveWorldPlaces([...places, newPlace]);
    setIsAddingPlace(false);
    setPlaceForm({ name: '', description: '', connects_to: [] });
  };

  // Character lock toggle
  const handleToggleCharacterLock = (index: number) => {
    const updated = characters.map((c, i) =>
      i === index ? { ...c, locked: !c.locked } : c
    );
    saveWorldCharacters(updated);
  };

  // Character delete
  const handleDeleteCharacter = (index: number) => {
    const updated = characters.filter((_, i) => i !== index);
    saveWorldCharacters(updated);
  };

  // Character save edit
  const handleSaveCharacter = () => {
    if (!charForm.name.trim()) return;
    if (editingCharacterIndex !== null) {
      const updated = characters.map((c, i) =>
        i === editingCharacterIndex ? { ...charForm } : c
      );
      saveWorldCharacters(updated);
      setEditingCharacterIndex(null);
    } else if (isAddingCharacter) {
      saveWorldCharacters([...characters, { ...charForm }]);
      setIsAddingCharacter(false);
    }
    setCharForm({ name: '', role: '', description: '', place_id: '' });
  };

  // Continuity check: "Check Canon"
  const handleCheckCanon = async () => {
    setIsCheckingCanon(true);
    setCanonError(null);
    try {
      const contradictions = await worldsService.checkCanonViaServer(world);
      setCanonContradictions(contradictions);
      setShowCanonModal(true);
    } catch (err: any) {
      console.error('Check canon error:', err);
      setCanonError(err?.message || 'Failed to check canon continuity.');
      setShowCanonModal(true);
    } finally {
      setIsCheckingCanon(false);
    }
  };

  // Apply a canon fix suggested by Gemini
  const handleApplyCanonFix = (contradiction: CanonContradiction) => {
    let placeMatched = false;
    let charMatched = false;

    const updatedPlaces = places.map((p) => {
      const match = contradiction.itemsInvolved.some(
        (item) => item.toLowerCase() === p.name.toLowerCase() || item.toLowerCase() === p.id.toLowerCase()
      );
      if (match && !placeMatched) {
        placeMatched = true;
        return {
          ...p,
          description: `${p.description} [Canon Note: ${contradiction.suggestedFix}]`,
        };
      }
      return p;
    });

    if (placeMatched) {
      saveWorldPlaces(updatedPlaces);
    } else {
      const updatedChars = characters.map((c) => {
        const match = contradiction.itemsInvolved.some(
          (item) => item.toLowerCase() === c.name.toLowerCase()
        );
        if (match && !charMatched) {
          charMatched = true;
          return {
            ...c,
            description: `${c.description} [Canon Note: ${contradiction.suggestedFix}]`,
          };
        }
        return c;
      });
      if (charMatched) {
        saveWorldCharacters(updatedChars);
      }
    }

    setCanonContradictions((prev) => prev.filter((c) => c.id !== contradiction.id));
  };

  const handleDismissCanonContradiction = (id: string) => {
    setCanonContradictions((prev) => prev.filter((c) => c.id !== id));
  };

  // Toggle public share status
  const handleTogglePublic = async (newVal: boolean) => {
    setIsPublic(newVal);
    setWorld((prev) => ({ ...prev, isPublic: newVal }));
    if (isOwner && world.id) {
      await worldsService.setWorldPublicStatus(world.id, newVal);
    }
  };

  const shareUrl = `${window.location.origin}/?world=${world.id}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Download campaign pack as Markdown
  const handleExportMarkdown = () => {
    const mdLines: string[] = [
      `# ${world.title}`,
      `*A fictional world forged in Lore for Game Masters & Writers*`,
      '',
      `**Atmospheric Tone:** ${world.tone || 'Uncharted'}`,
      `**Governing Themes:** ${(world.themes || []).join(', ')}`,
      '',
      `## Cosmological Genesis`,
      `> "${world.blurb || ''}"`,
      '',
      `---`,
      '',
      `## Campaign Story Hooks for GMs`,
      ...(storyHooks.length > 0
        ? storyHooks.map((hook, i) => `${i + 1}. **Hook:** ${hook}`)
        : [
            '1. An ancient boundary gate opens unexpectedly between two outer provinces.',
            '2. A missing relic is rumored to be buried beneath the deepest province.',
            '3. Two opposing factions dispatch envoys to negotiate a tense border treaty.',
            '4. A quiet celestial omen foretells the awakening of a long-dormant presence.',
            '5. A wandering cartographer arrives carrying a map showing provinces that do not yet exist.',
          ]),
      '',
      `---`,
      '',
      `## Interconnected Provinces (${places.length})`,
      '',
      ...places.map((p) => {
        return [
          `### ${p.name} \`[#${p.id}]\`${p.isBridge ? ' *(Convergence Bridge)*' : ''}${p.locked ? ' *(Locked)*' : ''}`,
          p.sourceTag ? `*Origin:* ${p.sourceTag}` : '',
          p.description,
          `*Routes:* ${p.connects_to.length > 0 ? p.connects_to.map((id) => `\`#${id}\``).join(', ') : 'Isolated'}`,
          '',
        ]
          .filter(Boolean)
          .join('\n');
      }),
      `---`,
      '',
      `## Inhabitants & Archetypal Figures (${characters.length})`,
      '',
      ...characters.map((c) => {
        return [
          `### ${c.name} — ${c.role}${c.locked ? ' *(Locked)*' : ''}`,
          c.place_id ? `*Stationed at province:* \`#${c.place_id}\`` : '',
          c.description,
          '',
        ]
          .filter(Boolean)
          .join('\n');
      }),
      '',
      `---`,
      `*Exported from Lore · Handcrafted worldbuilding assistant*`,
    ];

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${world.title.replace(/[^a-zA-Z0-9_-]/g, '_')}_campaign_pack.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-700 ease-out"
      style={{
        backgroundImage: moodTheme.palette.bgStyle,
      }}
    >
      {/* Read-Only Public Banner if visiting via shared link */}
      {(!isOwner || readOnly) && (
        <div className="mb-6 p-4 rounded-2xl bg-[#ead9b8] border-2 border-[#826a4c] flex items-center justify-between text-xs text-[#2b2118] shadow-sm">
          <div className="flex items-center gap-2">
            <CartographicCompass size={18} color="#5a4632" />
            <span className="font-sc tracking-wider uppercase text-xs text-[#a2562b] font-bold">
              Public Atlas Folio · Read-Only View
            </span>
          </div>
          <span className="text-[11px] text-[#5a4632] font-notes">
            Shared by creator
          </span>
        </div>
      )}

      {/* Return to Dashboard and Action Bar */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-medium text-[#5a4632] hover:text-[#2b2118] transition-colors cursor-pointer group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Return to Atlas Folio</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Mood Button */}
          <button
            onClick={() => setActiveTab('mood')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sc text-[#2b2118] bg-[#ead9b8] border border-[#a89475] hover:border-[#a2562b] transition-all cursor-pointer shadow-xs"
          >
            <Palette size={13} className="text-[#a2562b]" />
            <span className="capitalize">{currentMood} Atmosphere</span>
          </button>

          {/* Check Canon Button */}
          {hasLore && (
            <button
              onClick={handleCheckCanon}
              disabled={isCheckingCanon}
              className="btn-ink px-3 py-1.5 rounded-lg text-xs font-medium text-[#2b2118] bg-[#fbf4e4] border border-[#826a4c] hover:border-[#a2562b] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              title="Audit setting for internal contradictions"
            >
              <ShieldCheck
                size={14}
                className={`text-[#a2562b] ${isCheckingCanon ? 'animate-spin' : ''}`}
              />
              <span>{isCheckingCanon ? 'Auditing Canon...' : 'Check Canon'}</span>
            </button>
          )}

          {/* Export Campaign Pack Markdown */}
          {hasLore && (
            <button
              onClick={handleExportMarkdown}
              className="btn-ink px-3 py-1.5 rounded-lg text-xs font-medium text-[#2b2118] bg-[#fbf4e4] border border-[#826a4c] hover:border-[#a2562b] transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Download Campaign Pack Markdown with story hooks, places, and figures"
            >
              <FileText size={13} className="text-[#a2562b]" />
              <span className="hidden sm:inline">Export Pack</span>
            </button>
          )}

          {/* Share Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="btn-seal px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <Share2 size={13} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* World Page Header Card on Aged Parchment */}
      <div className="mb-8 p-6 sm:p-8 rounded-3xl bg-[#ead9b8] border-2 border-[#826a4c] shadow-lg relative overflow-hidden paper-fold">
        <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
          <CartographicCompass size={220} color="#5a4632" />
        </div>

        <div className="max-w-3xl relative z-10">
          <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest mb-1.5 flex items-center gap-2 flex-wrap font-bold">
            <span>Living Realm Codex</span>
            <span>·</span>
            <span className="capitalize text-[#5a4632]">{currentMood} Disposition</span>
            {world.generationType === 'blend' && (
              <>
                <span>·</span>
                <span className="text-[#a2562b] flex items-center gap-1">
                  <GitMerge size={10} />
                  Convergence Blend
                </span>
              </>
            )}
            {world.isPublic && (
              <>
                <span>·</span>
                <span className="text-[#2f5c35] font-notes text-[10px] bg-[#e8f2e9] px-2 py-0.5 rounded border border-[#6b9e71]">
                  Public Folio
                </span>
              </>
            )}
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl text-[#2b2118] font-bold leading-tight mb-3">
            {world.title}
          </h1>

          {world.tone && (
            <p className="text-sm sm:text-base text-[#735d44] italic font-body leading-relaxed">
              "{world.tone}"
            </p>
          )}

          {!hasLore && onGenerateLore && isOwner && (
            <div className="mt-5">
              <button
                onClick={() => onGenerateLore(world)}
                disabled={isGenerating}
                className="btn-seal px-6 py-2.5 rounded-xl text-xs font-medium tracking-wide flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
                    <span>Synthesizing World via Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Synthesize World Lore & Chart Map</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 mb-8 border-b-2 border-[#c4b08c] pb-3 flex-wrap">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-[#a2562b] text-[#fbf4e4] shadow-sm font-semibold'
              : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
          }`}
        >
          <ScrollText size={15} />
          <span>Overview & Inhabitants</span>
        </button>

        <button
          onClick={() => setActiveTab('map')}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'map'
              ? 'bg-[#a2562b] text-[#fbf4e4] shadow-sm font-semibold'
              : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
          }`}
        >
          <Compass size={15} />
          <span>Realm Map</span>
          {places.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbf4e4] text-[#2b2118] font-notes font-bold">
              {places.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mood')}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'mood'
              ? 'bg-[#a2562b] text-[#fbf4e4] shadow-sm font-semibold'
              : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
          }`}
        >
          <Palette size={15} />
          <span>Mood & Wallpaper</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fbf4e4] text-[#2b2118] font-notes capitalize font-bold">
            {currentMood}
          </span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & INHABITANTS */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-ink-bleed">
          {world.note && (
            <div className="p-5 rounded-2xl bg-[#ead9b8] border-2 border-[#c4b08c] shadow-xs">
              <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                <Quote size={12} />
                Foundational Setting Notes & Premise
              </div>
              <p className="text-sm text-[#2b2118] italic leading-relaxed font-body">
                "{world.note}"
              </p>
            </div>
          )}

          {hasLore ? (
            <>
              {/* World Blurb */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#fbf4e4] border-2 border-[#826a4c] shadow-md paper-fold">
                <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-3 font-bold">
                  Cosmological Genesis & Daily Reality
                </div>
                <p className="font-heading text-2xl sm:text-3xl text-[#2b2118] leading-relaxed font-normal italic">
                  "{world.blurb}"
                </p>
              </div>

              {/* Campaign Story Hooks */}
              {storyHooks.length > 0 && (
                <div>
                  <div className="text-xs font-sc text-[#a2562b] uppercase tracking-wider mb-3 flex items-center gap-1.5 font-bold">
                    <Sparkles size={14} />
                    <span>Story Hooks & Campaign Seeds for GMs & Writers ({storyHooks.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {storyHooks.map((hook, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-[#fbf4e4] border border-[#c4b08c] flex items-start gap-3 shadow-xs"
                      >
                        <div className="w-5 h-5 rounded-full bg-[#ead9b8] border border-[#a89475] flex items-center justify-center text-[11px] font-notes text-[#a2562b] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-[#2b2118] leading-relaxed font-body">
                          {hook}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Governing Themes */}
              {world.themes && world.themes.length > 0 && (
                <div>
                  <div className="text-xs font-sc text-[#a2562b] uppercase tracking-wider mb-3 font-bold">
                    Governing Canonical Themes ({world.themes.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {world.themes.map((theme, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#ead9b8] border border-[#c4b08c] flex items-center gap-2.5 shadow-xs"
                      >
                        <div className="w-6 h-6 rounded-md bg-[#fbf4e4] border border-[#ab9676] flex items-center justify-center text-[11px] font-sc text-[#a2562b] font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-semibold text-[#2b2118] font-body">{theme}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inhabitants & Figures Management */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-sc text-[#a2562b] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Users size={14} />
                    <span>Inhabitants & Lorekeepers ({characters.length})</span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setCharForm({ name: '', role: '', description: '', place_id: places[0]?.id || '' });
                        setIsAddingCharacter(true);
                      }}
                      className="btn-ink px-3 py-1 rounded-md text-xs font-medium text-[#2b2118] bg-[#fbf4e4] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} className="text-[#a2562b]" />
                      <span>Add Figure</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {characters.map((char, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-[#fbf4e4] border-2 border-[#c4b08c] hover:border-[#a2562b] transition-colors relative group shadow-sm atlas-tag-1"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <Feather size={14} className="text-[#a2562b]" />
                          <h4 className="font-heading text-xl text-[#2b2118] font-bold">
                            {char.name}
                          </h4>
                        </div>

                        {/* Owner Controls */}
                        {isOwner && (
                          <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggleCharacterLock(idx)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                char.locked
                                  ? 'text-[#a2562b] bg-[#ead9b8]'
                                  : 'text-[#78634d] hover:text-[#2b2118]'
                              }`}
                              title={char.locked ? 'Locked (click to unlock)' : 'Unlocked'}
                            >
                              {char.locked ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>

                            <button
                              onClick={() => {
                                setEditingCharacterIndex(idx);
                                setCharForm({ ...char });
                              }}
                              className="p-1 rounded text-[#78634d] hover:text-[#2b2118] transition-colors cursor-pointer"
                              title="Edit figure"
                            >
                              <Edit3 size={13} />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Remove figure "${char.name}" from atlas?`)) {
                                  handleDeleteCharacter(idx);
                                }
                              }}
                              className="p-1 rounded text-[#9c2f2f] hover:text-[#6e1a1a] transition-colors cursor-pointer"
                              title="Delete figure"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="text-xs font-sc text-[#a2562b] mb-2 font-bold">
                        {char.role}
                      </div>

                      {char.place_id && (
                        <div className="text-[11px] font-notes text-[#78634d] mb-2 flex items-center gap-1">
                          <Compass size={11} />
                          <span>
                            Stationed at:{' '}
                            {places.find((p) => p.id === char.place_id)?.name || `#${char.place_id}`}
                          </span>
                        </div>
                      )}

                      <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed font-body">
                        {char.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Provinces Overview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs font-sc text-[#a2562b] uppercase tracking-wider flex items-center gap-1.5 font-bold">
                    <Compass size={14} />
                    <span>Interconnected Provinces ({places.length})</span>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => {
                        setPlaceForm({ name: '', description: '', connects_to: [] });
                        setIsAddingPlace(true);
                      }}
                      className="btn-ink px-3 py-1 rounded-md text-xs font-medium text-[#2b2118] bg-[#fbf4e4] flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} className="text-[#a2562b]" />
                      <span>Add Province</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {places.map((place) => (
                    <div
                      key={place.id}
                      className="p-4 rounded-xl bg-[#fbf4e4] border-2 border-[#c4b08c] flex flex-col justify-between shadow-xs"
                      style={{
                        borderLeftColor: place.sourceColor || '#a2562b',
                        borderLeftWidth: '4px',
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <h5 className="font-heading text-base text-[#2b2118] font-bold">
                            {place.name}
                          </h5>
                          {place.locked && (
                            <span title="Locked" className="text-[#a2562b]">
                              <Lock size={12} />
                            </span>
                          )}
                        </div>

                        {place.sourceTag && (
                          <div className="text-[10px] font-notes text-[#a2562b] mb-1.5 font-bold">
                            {place.sourceTag}
                          </div>
                        )}

                        <p className="text-xs text-[#5a4632] line-clamp-3 mb-3 font-body">
                          {place.description}
                        </p>
                      </div>

                      <div className="text-[10px] text-[#78634d] font-notes pt-2 border-t border-[#d8c5a2] flex justify-between items-center">
                        <span>{place.connects_to.length} trails</span>
                        <span>#{place.id}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 px-6 text-center bg-[#ead9b8] rounded-3xl border-2 border-[#826a4c] max-w-lg mx-auto shadow-md">
              <div className="w-16 h-16 rounded-full bg-[#fbf4e4] border-2 border-[#826a4c] flex items-center justify-center mx-auto mb-4">
                <CartographicCompass size={32} color="#5a4632" />
              </div>
              <h3 className="font-heading text-2xl text-[#2b2118] mb-2 font-bold">
                Lore Awaiting Synthesis
              </h3>
              <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed mb-6 font-body">
                Call the Gemini server function to synthesize the 60-word genesis blurb, canonical themes,
                interconnected provinces, figures, and campaign hooks.
              </p>
              {onGenerateLore && isOwner && (
                <button
                  onClick={() => onGenerateLore(world)}
                  disabled={isGenerating}
                  className="btn-seal px-6 py-3 rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing World via Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Synthesize World Lore</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REALM MAP */}
      {activeTab === 'map' && (
        <div className="animate-ink-bleed space-y-4">
          {hasLore && places.length > 0 ? (
            <RealmMap
              places={places}
              characters={characters}
              worldTitle={world.title}
              readOnly={!isOwner}
              onUpdatePlace={handleUpdatePlace}
              onDeletePlace={handleDeletePlace}
              onRegeneratePlace={handleRegeneratePlace}
              isRegenerating={isRegeneratingPlace}
            />
          ) : (
            <div className="py-24 px-6 text-center bg-[#ead9b8] rounded-3xl border-2 border-[#826a4c] max-w-lg mx-auto shadow-md">
              <div className="w-16 h-16 rounded-full bg-[#fbf4e4] border-2 border-[#826a4c] flex items-center justify-center mx-auto mb-4">
                <Compass size={32} className="text-[#a2562b]" />
              </div>
              <h3 className="font-heading text-2xl text-[#2b2118] mb-2 font-bold">
                Uncharted Geography
              </h3>
              <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed mb-6 font-body">
                To generate the interactive hand-drawn map with interconnected provinces and figures,
                synthesize world lore first.
              </p>
              {onGenerateLore && isOwner && (
                <button
                  onClick={() => onGenerateLore(world)}
                  disabled={isGenerating}
                  className="btn-seal px-6 py-3 rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>Synthesize World Lore & Chart Map</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MOOD & WALLPAPER */}
      {activeTab === 'mood' && (
        <MoodTab
          currentMood={currentMood}
          onSelectMood={setCurrentMood}
          worldTitle={world.title}
        />
      )}

      {/* MODAL 1: CHECK CANON MODAL */}
      {showCanonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-ink-bleed">
          <div className="bg-[#fbf4e4] border-4 border-[#5a4632] rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#d8c5a2] flex items-center justify-between bg-[#ead9b8]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-[#a2562b]" />
                <h3 className="font-heading text-xl text-[#2b2118] font-bold">
                  Canon Continuity Audit
                </h3>
              </div>
              <button
                onClick={() => setShowCanonModal(false)}
                className="p-1.5 rounded-lg text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {canonError ? (
                <div className="p-4 rounded-xl bg-[#fcedeb] border border-[#d98b8b] text-xs text-[#852525]">
                  {canonError}
                </div>
              ) : canonContradictions.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 size={40} className="text-[#4a6b4f] mx-auto mb-3" />
                  <h4 className="font-heading text-xl text-[#2b2118] mb-1 font-bold">
                    Canon is Harmonious
                  </h4>
                  <p className="text-xs text-[#5a4632] font-body max-w-md mx-auto">
                    Gemini evaluated all provinces, lorekeepers, routes, and notes. No logical or thematic
                    contradictions were detected in this world's tapestry.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-[#5a4632] font-body">
                    The lore auditor scrutinized your world's places and inhabitants. You can apply the suggested editorial fixes directly to reconcile your universe.
                  </p>
                  <div className="space-y-4">
                    {canonContradictions.map((c) => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl bg-[#ead9b8] border-2 border-[#c4b08c] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[#9c2f2f] text-xs font-sc font-bold">
                            <AlertTriangle size={13} />
                            <span>Contradiction</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {c.itemsInvolved.map((item, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-[#fbf4e4] border border-[#ab9676] text-[10px] font-notes text-[#2b2118]"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="text-xs text-[#2b2118] leading-relaxed font-body">
                          {c.conflictDescription}
                        </div>

                        <div className="p-3 rounded-xl bg-[#fbf5e6] border border-[#a2562b] text-xs text-[#2b2118]">
                          <span className="font-sc text-[10px] uppercase block mb-1 text-[#a2562b] font-bold">
                            Suggested Resolution:
                          </span>
                          <span className="font-body text-[#5a4632]">{c.suggestedFix}</span>
                        </div>

                        {isOwner && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#d8c5a2]">
                            <button
                              onClick={() => handleDismissCanonContradiction(c.id)}
                              className="px-3 py-1 rounded-lg text-xs text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleApplyCanonFix(c)}
                              className="btn-seal px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer flex items-center gap-1.5"
                            >
                              <Check size={12} />
                              <span>Apply Fix</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t border-[#d8c5a2] bg-[#ead9b8] flex justify-end">
              <button
                onClick={() => setShowCanonModal(false)}
                className="btn-ink px-5 py-2 rounded-xl text-xs text-[#2b2118] bg-[#fbf4e4] cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-ink-bleed">
          <div className="bg-[#fbf4e4] border-4 border-[#5a4632] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Share2 size={18} className="text-[#a2562b]" />
                <h3 className="font-heading text-xl text-[#2b2118] font-bold">Share This Realm</h3>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-lg text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 text-xs text-[#5a4632]">
              {/* Toggle Public Access */}
              {isOwner ? (
                <div className="p-4 rounded-xl bg-[#ead9b8] border border-[#c4b08c] flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#2b2118] text-sm mb-0.5 font-heading">
                      Public Read-Only Access
                    </div>
                    <div className="text-[11px] text-[#5a4632] font-body">
                      Anyone with this folio link can inspect the map and lore without logging in.
                    </div>
                  </div>
                  <button
                    onClick={() => handleTogglePublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                      isPublic ? 'bg-[#a2562b]' : 'bg-[#c4b08c]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-[#ead9b8] border border-[#c4b08c]">
                  {world.isPublic ? (
                    <span className="text-[#2f5c35] font-semibold">This realm is public and viewable via link.</span>
                  ) : (
                    <span className="text-[#a2562b]">This realm is private to the creator.</span>
                  )}
                </div>
              )}

              {/* Copy URL */}
              {isPublic && (
                <div>
                  <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1.5 font-bold">
                    Public Share Link
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl}
                      className="flex-1 px-3 py-2 input-parchment text-xs text-[#2b2118] font-notes select-all"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="btn-seal px-3.5 py-2 rounded-xl text-xs font-medium cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#d8c5a2] flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="btn-ink px-5 py-2 rounded-xl text-xs text-[#2b2118] bg-[#fbf4e4] cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD / EDIT CHARACTER MODAL */}
      {(isAddingCharacter || editingCharacterIndex !== null) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-ink-bleed">
          <div className="bg-[#fbf4e4] border-4 border-[#5a4632] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#a2562b]" />
                <h3 className="font-heading text-xl text-[#2b2118] font-bold">
                  {isAddingCharacter ? 'Add Inhabitant / Lorekeeper' : 'Edit Figure'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddingCharacter(false);
                  setEditingCharacterIndex(null);
                }}
                className="p-1.5 rounded-lg text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Name *
                </label>
                <input
                  type="text"
                  value={charForm.name}
                  onChange={(e) => setCharForm({ ...charForm, name: e.target.value })}
                  placeholder="e.g. Master Cartographer Orix"
                  className="w-full px-3 py-2 input-parchment text-xs text-[#2b2118]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Station or Role *
                </label>
                <input
                  type="text"
                  value={charForm.role}
                  onChange={(e) => setCharForm({ ...charForm, role: e.target.value })}
                  placeholder="e.g. Keeper of the Subterranean Archives"
                  className="w-full px-3 py-2 input-parchment text-xs text-[#2b2118]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Linked Province
                </label>
                <select
                  value={charForm.place_id || ''}
                  onChange={(e) => setCharForm({ ...charForm, place_id: e.target.value })}
                  className="w-full px-3 py-2 input-parchment text-xs text-[#2b2118]"
                >
                  <option value="">No specific province</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Lore & Agenda
                </label>
                <textarea
                  rows={4}
                  value={charForm.description}
                  onChange={(e) => setCharForm({ ...charForm, description: e.target.value })}
                  placeholder="What secret agenda, relic, or dilemma defines this figure?"
                  className="w-full px-3 py-2 input-parchment text-xs text-[#2b2118] font-body"
                />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#d8c5a2] flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingCharacter(false);
                  setEditingCharacterIndex(null);
                }}
                className="btn-ink px-4 py-2 rounded-xl text-xs text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCharacter}
                disabled={!charForm.name.trim()}
                className="btn-seal px-5 py-2 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40"
              >
                Save Figure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD PROVINCE MODAL */}
      {isAddingPlace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-ink-bleed">
          <div className="bg-[#fbf4e4] border-4 border-[#5a4632] rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-[#a2562b]" />
                <h3 className="font-heading text-xl text-[#2b2118] font-bold">Add New Province</h3>
              </div>
              <button
                onClick={() => setIsAddingPlace(false)}
                className="p-1.5 rounded-lg text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Province Name *
                </label>
                <input
                  type="text"
                  value={placeForm.name}
                  onChange={(e) => setPlaceForm({ ...placeForm, name: e.target.value })}
                  placeholder="e.g. The Sunken Citadel of Salt"
                  className="w-full px-3 py-2 input-parchment text-xs text-[#2b2118]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Topography & Lore
                </label>
                <textarea
                  rows={4}
                  value={placeForm.description}
                  onChange={(e) => setPlaceForm({ ...placeForm, description: e.target.value })}
                  placeholder="Describe its atmospheric sensory details, secrets, and geography..."
                  className="w-full px-3 py-2 input-parchment text-xs text-[#2b2118] font-body"
                />
              </div>

              <div>
                <label className="block text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 font-bold">
                  Connects with Existing Provinces
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-[#ead9b8] border border-[#c4b08c] rounded-xl">
                  {places.map((p) => {
                    const isChecked = placeForm.connects_to.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPlaceForm((prev) => ({
                            ...prev,
                            connects_to: isChecked
                              ? prev.connects_to.filter((id) => id !== p.id)
                              : [...prev.connects_to, p.id],
                          }));
                        }}
                        className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-[#fbf4e4] border border-[#a2562b] text-[#2b2118] font-bold'
                            : 'bg-[#fbf5e6] text-[#5a4632] hover:text-[#2b2118]'
                        }`}
                      >
                        <span className="truncate">{p.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-notes ${
                            isChecked ? 'bg-[#a2562b] text-white' : 'text-[#8a7355]'
                          }`}
                        >
                          {isChecked ? 'Connected' : '+ Connect'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#d8c5a2] flex items-center justify-end gap-2">
              <button
                onClick={() => setIsAddingPlace(false)}
                className="btn-ink px-4 py-2 rounded-xl text-xs text-[#5a4632] hover:text-[#2b2118] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewPlace}
                disabled={!placeForm.name.trim()}
                className="btn-seal px-5 py-2 rounded-xl text-xs font-medium cursor-pointer disabled:opacity-40"
              >
                Add Province
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
