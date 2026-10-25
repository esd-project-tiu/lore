import React, { useState } from 'react';
import { World, RankedRecommendation, MoodType } from '../../types';
import { rankCatalogForUser } from '../../services/recommendationService';
import { worldsService } from '../../services/worldsService';
import { MOODS } from '../mood/moodConfigs';
import {
  Compass,
  Sparkles,
  BookOpen,
  Tv,
  Plus,
  Check,
  Quote,
  Layers,
} from 'lucide-react';

interface RecommendationsPanelProps {
  userWorlds: World[];
  userId: string;
  onWorldAdded?: () => void;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  userWorlds,
  userId,
  onWorldAdded,
}) => {
  const [selectedMoodFilter, setSelectedMoodFilter] = useState<MoodType | 'all'>('all');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const activeMood = selectedMoodFilter === 'all' ? undefined : selectedMoodFilter;

  // Compute top 6 recommendations dynamically
  const { recommendations, userAveragedThemes } = rankCatalogForUser(
    userWorlds,
    activeMood,
    6
  );

  const handleInscribe = async (rec: RankedRecommendation) => {
    try {
      setAddingId(rec.item.id);
      await worldsService.createWorld(userId, {
        title: rec.item.title,
        type: rec.item.type,
        note: `Discovered via Lore recommendations: ${rec.whyThisFits}`,
      });
      setAddedIds((prev) => new Set([...prev, rec.item.id]));
      if (onWorldAdded) {
        onWorldAdded();
      }
    } catch (err) {
      console.error('Failed to inscribe recommended title:', err);
    } finally {
      setAddingId(null);
    }
  };

  const moodFilterOptions: { id: MoodType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Moods' },
    { id: 'cozy', label: 'Cozy' },
    { id: 'melancholy', label: 'Melancholy' },
    { id: 'epic', label: 'Epic' },
    { id: 'eerie', label: 'Eerie' },
    { id: 'hopeful', label: 'Hopeful' },
    { id: 'chaotic', label: 'Chaotic' },
  ];

  return (
    <div className="mt-14 pt-10 border-t-2 border-[#c4b08c]">
      {/* Header with Title and Explanation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest flex items-center gap-1.5 font-bold">
              <Compass size={13} />
              Harmonic Resonance
            </span>
            <span className="text-xs text-[#8a7355]">·</span>
            <span className="text-xs text-[#5a4632]">60-Title Seed Catalog</span>
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl text-[#2b2118] font-bold">
            Echoes Across the Codex
          </h2>
          <p className="text-xs sm:text-sm text-[#5a4632] mt-1 max-w-2xl font-body leading-relaxed">
            Ranked by mathematical cosine similarity against your personal 20-dimensional theme
            vector, amplified by harmonic mood alignment.
          </p>
        </div>

        {/* Mood Boost Filters */}
        <div className="flex items-center gap-1.5 bg-[#ead9b8] p-1 rounded-xl border border-[#c4b08c] overflow-x-auto max-w-full shadow-xs">
          <span className="text-[10px] font-sc text-[#5a4632] px-2 py-1 uppercase hidden lg:inline font-bold">
            Mood Wash:
          </span>
          {moodFilterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedMoodFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedMoodFilter === opt.id
                  ? 'bg-[#fbf4e4] text-[#2b2118] border border-[#ab9676] shadow-xs font-bold'
                  : 'text-[#5a4632] hover:text-[#2b2118]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* User's Averaged Theme Signature Summary */}
      {userAveragedThemes.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-[#ead9b8] border border-[#c4b08c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Layers size={14} className="text-[#a2562b]" />
            <span className="text-[11px] font-sc text-[#2b2118] uppercase tracking-wider font-bold">
              Your Dominant Themes:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {userAveragedThemes.slice(0, 5).map((theme, i) => (
              <span
                key={i}
                className="text-[10px] px-2.5 py-0.5 rounded-md bg-[#fbf4e4] border border-[#ab9676] text-[#2b2118] font-bold"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top 6 Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((rec, idx) => {
          const isAdded = addedIds.has(rec.item.id);
          const isAdding = addingId === rec.item.id;
          const matchPercent = Math.min(99, Math.round(rec.score * 100));
          const moodConfig = MOODS[rec.item.mood];
          const tagTiltClass = idx % 2 === 0 ? 'atlas-tag-1' : 'atlas-tag-2';

          return (
            <div
              key={rec.item.id}
              className={`bg-[#fbf4e4] rounded-2xl p-6 border-2 border-[#826a4c] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ${tagTiltClass}`}
            >
              <div>
                {/* Header: Type, Year, Mood, Resonance badge */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium tracking-wide ${
                        rec.item.type === 'book'
                          ? 'bg-[#ead9b8] text-[#a2562b] border border-[#c4b08c]'
                          : 'bg-[#e2ebef] text-[#4f7a8a] border border-[#b1c4cb]'
                      }`}
                    >
                      {rec.item.type === 'book' ? <BookOpen size={10} /> : <Tv size={10} />}
                      <span className="capitalize">{rec.item.type}</span>
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#fbf5e6] border border-[#c4b08c] text-[#5a4632] font-notes">
                      {rec.item.year}
                    </span>

                    <span
                      className="text-[9px] px-2 py-0.5 rounded-full capitalize font-notes border"
                      style={{
                        backgroundColor: moodConfig.palette.cardBg,
                        borderColor: moodConfig.palette.border,
                        color: moodConfig.palette.primary,
                      }}
                    >
                      {rec.item.mood}
                    </span>
                  </div>

                  {/* Match percentage */}
                  <span className="text-[10px] font-notes px-2 py-0.5 rounded bg-[#ead9b8] border border-[#a89475] text-[#2b2118] font-bold flex items-center gap-1">
                    <Sparkles size={9} className="text-[#a2562b]" />
                    {matchPercent}%
                  </span>
                </div>

                {/* Title & Creator */}
                <h3 className="font-heading text-2xl text-[#2b2118] font-bold leading-snug mb-1 hover:text-[#a2562b] transition-colors">
                  {rec.item.title}
                </h3>
                <div className="text-xs text-[#5a4632] font-sc mb-3 font-semibold">
                  by {rec.item.creator}
                </div>

                {/* "Why this fits" line */}
                <div className="p-3 rounded-xl bg-[#ead9b8]/60 border border-[#c4b08c] mb-4 relative">
                  <div className="text-[9px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 flex items-center gap-1 font-bold">
                    <Quote size={9} />
                    Resonance with your folios:
                  </div>
                  <p className="text-xs text-[#2b2118] italic leading-relaxed font-body">
                    "{rec.whyThisFits}"
                  </p>
                </div>

                {/* Blurb */}
                <p className="text-xs text-[#5a4632] leading-relaxed mb-4 line-clamp-2 font-body">
                  {rec.item.blurb}
                </p>

                {/* Shared themes pills */}
                <div className="flex flex-wrap gap-1 mb-4">
                  {rec.item.themes.map((theme, i) => {
                    const isShared = rec.sharedThemes.includes(theme);
                    return (
                      <span
                        key={i}
                        className={`text-[9px] px-2 py-0.5 rounded font-notes ${
                          isShared
                            ? 'bg-[#ead9b8] text-[#a2562b] border border-[#a2562b] font-bold'
                            : 'bg-[#fbf5e6] text-[#78634d] border border-[#c4b08c]'
                        }`}
                      >
                        {isShared ? `★ ${theme}` : theme}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#d8c5a2]">
                <button
                  onClick={() => handleInscribe(rec)}
                  disabled={isAdded || isAdding}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isAdded
                      ? 'bg-[#e8f2e9] border border-[#6b9e71] text-[#2f5c35] font-bold'
                      : 'btn-seal text-[#fbf4e4]'
                  } disabled:opacity-75`}
                >
                  {isAdding ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
                      <span>Inscribing into Folio...</span>
                    </>
                  ) : isAdded ? (
                    <>
                      <Check size={13} className="text-[#2f5c35]" />
                      <span>Inscribed in Your Folio</span>
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      <span>Inscribe to My Realms</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
