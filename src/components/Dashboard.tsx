import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { World } from '../types';
import { worldsService } from '../services/worldsService';
import { CartographicCompass } from './CartographicCompass';
import { WorldDetailModal } from './WorldDetailModal';
import { RecommendationsPanel } from './recommendations/RecommendationsPanel';
import {
  BookOpen,
  Tv,
  Plus,
  Trash2,
  Calendar,
  Search,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Quote,
  CheckCircle2,
  Zap,
  Compass,
} from 'lucide-react';

interface DashboardProps {
  onNavigateToAdd: () => void;
  onNavigateToPreview: () => void;
  onOpenWorld: (world: World) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigateToAdd,
  onNavigateToPreview,
  onOpenWorld,
}) => {
  const { user } = useAuth();
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'book' | 'show'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Modal and generation states
  const [selectedWorld, setSelectedWorld] = useState<World | null>(null);
  const [generatingWorldId, setGeneratingWorldId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dailyGenerationsRemaining, setDailyGenerationsRemaining] = useState<number>(10);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch user rate limit
    worldsService.getRateLimit(user.uid).then((res) => {
      setDailyGenerationsRemaining(res.remaining);
    });

    const unsubscribe = worldsService.subscribeToUserWorlds(
      user.uid,
      (fetchedWorlds) => {
        setWorlds(fetchedWorlds);
        setLoading(false);
        setSelectedWorld((prev) =>
          prev ? fetchedWorlds.find((w) => w.id === prev.id) || prev : null
        );
      },
      (err) => {
        console.error('Error fetching worlds:', err);
        setError('Unable to load your saved worlds from Firestore. Check your connection or rules.');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (worldId: string) => {
    try {
      setDeletingId(worldId);
      await worldsService.deleteWorld(worldId);
      setDeleteConfirmId(null);
      if (selectedWorld?.id === worldId) {
        setSelectedWorld(null);
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError('Could not delete world. ' + (err?.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  const handleGenerateLore = async (world: World) => {
    if (!user) return;
    setGeneratingWorldId(world.id);
    setError(null);

    try {
      const result = await worldsService.generateWorldViaServer(
        world.title,
        world.type,
        world.note,
        world.id
      );

      setDailyGenerationsRemaining(result.remainingGenerations);
      const cacheNote = result.cached ? ' (Retrieved from cache)' : '';
      setToastMessage(`World synthesized successfully for "${world.title}"!${cacheNote}`);

      setSelectedWorld({
        ...world,
        tone: result.data.tone,
        themes: result.data.themes,
        blurb: result.data.blurb,
        places: result.data.places,
        characters: result.data.characters,
        status: 'ready',
      });

      setTimeout(() => setToastMessage(null), 5000);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      setError(err?.message || 'Failed to synthesize world lore.');
    } finally {
      setGeneratingWorldId(null);
    }
  };

  const filteredWorlds = worlds.filter((w) => {
    const matchesFilter = filterType === 'all' || w.type === filterType;
    const matchesSearch =
      !searchQuery.trim() ||
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.note && w.note.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (w.blurb && w.blurb.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const bookCount = worlds.filter((w) => w.type === 'book').length;
  const showCount = worlds.filter((w) => w.type === 'show').length;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-xl bg-[#e8f2e9] border-2 border-[#6b9e71] text-[#2f5c35] text-xs shadow-xl flex items-center gap-2.5 animate-ink-bleed">
          <CheckCircle2 size={16} className="text-[#2f5c35] shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-[#c4b08c]">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest font-bold">
              Explorer's Folio
            </span>
            <span className="text-xs text-[#8a7355]">·</span>
            <span className="text-xs text-[#5a4632]">
              {worlds.length} {worlds.length === 1 ? 'realm' : 'realms'} charted
            </span>
            <span className="text-xs text-[#8a7355]">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-notes text-[#2b2118] bg-[#ead9b8] px-2.5 py-0.5 rounded border border-[#ab9676]">
              <Zap size={11} className="text-[#a2562b]" />
              {dailyGenerationsRemaining}/10 generations left today
            </span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl text-[#2b2118] font-bold">
            Your Realm Folios
          </h1>
          <p className="text-xs sm:text-sm text-[#5a4632] mt-1 font-body">
            The foundational stories and custom settings that shape your personal mythology.
          </p>
        </div>

        <button
          onClick={onNavigateToAdd}
          className="btn-seal self-start sm:self-auto px-5 py-3 rounded-xl text-sm font-medium tracking-wide flex items-center gap-2.5 cursor-pointer shadow-md"
        >
          <Plus size={16} />
          <span>Chart a New Realm</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-8">
        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-[#ead9b8] p-1 rounded-xl border border-[#c4b08c] self-start sm:self-auto shadow-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filterType === 'all'
                ? 'bg-[#fbf4e4] text-[#2b2118] shadow-xs font-bold border border-[#ab9676]'
                : 'text-[#5a4632] hover:text-[#2b2118]'
            }`}
          >
            All ({worlds.length})
          </button>
          <button
            onClick={() => setFilterType('book')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'book'
                ? 'bg-[#fbf4e4] text-[#2b2118] shadow-xs font-bold border border-[#ab9676]'
                : 'text-[#5a4632] hover:text-[#2b2118]'
            }`}
          >
            <BookOpen size={12} className="text-[#a2562b]" />
            Books ({bookCount})
          </button>
          <button
            onClick={() => setFilterType('show')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              filterType === 'show'
                ? 'bg-[#fbf4e4] text-[#2b2118] shadow-xs font-bold border border-[#ab9676]'
                : 'text-[#5a4632] hover:text-[#2b2118]'
            }`}
          >
            <Tv size={12} className="text-[#4f7a8a]" />
            Shows ({showCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78634d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search titles, themes, or notes..."
            className="w-full pl-9 pr-4 py-2 input-parchment text-xs text-[#2b2118] placeholder-[#78634d]"
          />
        </div>
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="mb-8 p-5 rounded-2xl bg-[#fcedeb] border-2 border-[#d98b8b] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#9c2f2f] shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-[#852525] font-heading">Folio Notice</h4>
              <p className="text-xs text-[#852525]/90 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="px-4 py-1.5 rounded-lg bg-[#f7d9d7] border border-[#d98b8b] text-xs text-[#852525] hover:bg-[#edd0ce] transition-colors flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <RefreshCw size={12} />
            <span>Dismiss</span>
          </button>
        </div>
      )}

      {/* LOADING STATE */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-[#ead9b8] border-2 border-[#c4b08c] rounded-2xl p-6 animate-pulse"
            >
              <div className="flex justify-between items-center mb-4">
                <div className="h-5 w-20 bg-[#dfcdab] rounded-md" />
                <div className="h-4 w-4 bg-[#dfcdab] rounded" />
              </div>
              <div className="h-8 w-3/4 bg-[#d8c5a2] rounded mb-4" />
              <div className="space-y-2 mb-6">
                <div className="h-3 w-full bg-[#dfcdab] rounded" />
                <div className="h-3 w-4/5 bg-[#dfcdab] rounded" />
              </div>
              <div className="h-3 w-28 bg-[#dfcdab] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !error && filteredWorlds.length === 0 && (
        <div className="py-20 px-6 text-center bg-[#ead9b8] rounded-3xl border-2 border-[#826a4c] max-w-xl mx-auto shadow-md">
          <div className="w-16 h-16 rounded-full bg-[#fbf4e4] border-2 border-[#826a4c] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CartographicCompass size={32} color="#5a4632" />
          </div>

          <h3 className="font-heading text-2xl sm:text-3xl text-[#2b2118] mb-3 font-bold">
            {searchQuery || filterType !== 'all'
              ? 'No matching chronicles found'
              : 'Your atlas is yet unmapped'}
          </h3>

          <p className="text-sm text-[#5a4632] leading-relaxed mb-8 max-w-md mx-auto font-body">
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search criteria or clearing filters to view all recorded titles.'
              : 'Add your first beloved book, show, or custom premise to begin weaving your personal realm map.'}
          </p>

          {searchQuery || filterType !== 'all' ? (
            <button
              onClick={() => {
                setFilterType('all');
                setSearchQuery('');
              }}
              className="btn-ink px-5 py-2.5 rounded-xl text-xs font-medium bg-[#fbf4e4]"
            >
              Reset Filters
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onNavigateToAdd}
                className="btn-seal w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-medium shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Chart Your First Realm</span>
              </button>
              <button
                onClick={onNavigateToPreview}
                className="btn-ink w-full sm:w-auto px-6 py-3 rounded-xl text-xs font-medium bg-[#fbf4e4] text-[#5a4632] hover:text-[#2b2118]"
              >
                Inspect Alice Demo
              </button>
            </div>
          )}
        </div>
      )}

      {/* POPULATED WORLDS GRID (Paper Tags with subtle random rotations) */}
      {!loading && !error && filteredWorlds.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorlds.map((world, idx) => {
            const formattedDate = new Date(world.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            const hasLore = Boolean(world.blurb && world.places && world.places.length > 0);
            const isGeneratingThis = generatingWorldId === world.id;

            // Subtle rotation for physical paper tag aesthetic
            const tagTiltClass = idx % 3 === 0 ? 'atlas-tag-1' : idx % 3 === 1 ? 'atlas-tag-2' : 'atlas-tag-3';

            return (
              <div
                key={world.id}
                className={`group relative bg-[#fbf4e4] rounded-2xl p-6 border-2 border-[#826a4c] shadow-md transition-all duration-300 flex flex-col justify-between hover:shadow-xl ${tagTiltClass}`}
              >
                <div>
                  {/* Card Header: Type Badge & Action Menu */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium tracking-wide ${
                          world.type === 'book'
                            ? 'bg-[#ead9b8] text-[#a2562b] border border-[#c4b08c]'
                            : 'bg-[#e2ebef] text-[#4f7a8a] border border-[#b1c4cb]'
                        }`}
                      >
                        {world.type === 'book' ? <BookOpen size={12} /> : <Tv size={12} />}
                        <span className="capitalize">{world.type}</span>
                      </span>

                      {hasLore ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#e8f2e9] border border-[#6b9e71] text-[#2f5c35] flex items-center gap-1 font-notes font-bold">
                          <Sparkles size={9} />
                          Map Ready
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ead9b8] border border-[#c4b08c] text-[#78634d] font-notes">
                          Inscribed
                        </span>
                      )}
                    </div>

                    {/* Delete Trigger / Modal confirmation */}
                    {deleteConfirmId === world.id ? (
                      <div className="flex items-center gap-1.5 bg-[#fcedeb] px-2 py-1 rounded-md border border-[#d98b8b]">
                        <span className="text-[10px] text-[#852525] font-bold">Remove?</span>
                        <button
                          onClick={() => handleDelete(world.id)}
                          disabled={deletingId === world.id}
                          className="text-[10px] text-[#852525] hover:underline font-bold cursor-pointer disabled:opacity-50"
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="text-[10px] text-[#78634d] hover:text-[#2b2118] ml-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(world.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#78634d] hover:text-[#9c2f2f] transition-all cursor-pointer"
                        title="Remove realm from atlas"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* World Title - Clicking opens World Page */}
                  <h3
                    onClick={() => onOpenWorld(world)}
                    className="font-heading text-2xl sm:text-3xl text-[#2b2118] font-bold mb-2 leading-snug hover:text-[#a2562b] transition-all cursor-pointer"
                  >
                    {world.title}
                  </h3>

                  {/* Tone if generated */}
                  {world.tone && (
                    <p className="text-xs text-[#735d44] italic mb-3 line-clamp-2 font-body">
                      "{world.tone}"
                    </p>
                  )}

                  {/* Blurb or Note */}
                  {hasLore && world.blurb ? (
                    <div className="relative pl-3.5 py-1 mb-4 border-l-2 border-[#a2562b] bg-[#ead9b8]/40 rounded-r-lg pr-2.5">
                      <p className="text-xs text-[#5a4632] leading-relaxed italic line-clamp-3 font-body">
                        "{world.blurb}"
                      </p>
                    </div>
                  ) : world.note ? (
                    <div className="relative pl-3.5 py-1 mb-4 border-l-2 border-[#826a4c] bg-[#ead9b8]/30 rounded-r-lg pr-2.5">
                      <Quote size={10} className="text-[#8a7355] absolute -left-1 -top-1" />
                      <p className="text-xs text-[#5a4632] leading-relaxed italic line-clamp-3 font-body">
                        "{world.note}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-[#78634d] italic mb-4 font-body">
                      Awaiting synthesis into living cartography.
                    </p>
                  )}

                  {/* Themes preview chips */}
                  {world.themes && world.themes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {world.themes.slice(0, 3).map((theme, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#ead9b8] border border-[#c4b08c] text-[#2b2118] font-notes"
                        >
                          {theme}
                        </span>
                      ))}
                      {world.themes.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-[#78634d] font-notes">
                          +{world.themes.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-[#d8c5a2] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#78634d] font-notes">
                    <Calendar size={12} className="text-[#a2562b]" />
                    <span>{formattedDate}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasLore ? (
                      <button
                        onClick={() => onOpenWorld(world)}
                        className="btn-ink px-3 py-1.5 rounded-lg text-xs text-[#2b2118] bg-[#fbf5e6] hover:bg-[#ead9b8] transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                      >
                        <Compass size={12} className="text-[#a2562b]" />
                        <span>Open Realm Map</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGenerateLore(world)}
                        disabled={isGeneratingThis}
                        className="btn-seal px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        {isGeneratingThis ? (
                          <>
                            <div className="w-3 h-3 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
                            <span>Synthesizing...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={12} />
                            <span>Generate Lore</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vector Resonance Recommendations */}
      {user && (
        <RecommendationsPanel
          userWorlds={worlds}
          userId={user.uid}
          onWorldAdded={() => {
            setToastMessage('Recommended title inscribed into your atlas folio!');
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}

      {/* World Detail Modal */}
      {selectedWorld && (
        <WorldDetailModal
          world={selectedWorld}
          onClose={() => setSelectedWorld(null)}
          onGenerateLore={handleGenerateLore}
          onOpenWorldPage={onOpenWorld}
          isGenerating={generatingWorldId === selectedWorld.id}
        />
      )}
    </div>
  );
};
