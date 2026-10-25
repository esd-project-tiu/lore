import React, { useState } from 'react';
import { World } from '../types';
import { CartographicCompass } from './CartographicCompass';
import {
  X,
  BookOpen,
  Tv,
  MapPin,
  Users,
  Compass,
  Sparkles,
  Link2,
  Calendar,
  Quote,
  Feather,
} from 'lucide-react';

interface WorldDetailModalProps {
  world: World;
  onClose: () => void;
  onGenerateLore?: (world: World) => void;
  onOpenWorldPage?: (world: World) => void;
  isGenerating?: boolean;
}

export const WorldDetailModal: React.FC<WorldDetailModalProps> = ({
  world,
  onClose,
  onGenerateLore,
  onOpenWorldPage,
  isGenerating = false,
}) => {
  const [activeTab, setActiveTab] = useState<'blurb' | 'places' | 'characters'>('blurb');

  const hasLore = Boolean(world.blurb && world.places && world.places.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-ink-bleed">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#fbf4e4] rounded-3xl border-4 border-[#5a4632] shadow-2xl overflow-hidden my-auto paper-fold">
        {/* Header Bar */}
        <div className="flex items-start justify-between p-6 sm:p-8 border-b-2 border-[#d8c5a2] bg-[#ead9b8] shrink-0">
          <div className="pr-6">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-sc font-bold uppercase tracking-wider ${
                  world.type === 'book'
                    ? 'bg-[#fbf4e4] text-[#a2562b] border border-[#c4b08c]'
                    : 'bg-[#e2ebef] text-[#4f7a8a] border border-[#b1c4cb]'
                }`}
              >
                {world.type === 'book' ? <BookOpen size={11} /> : <Tv size={11} />}
                <span>{world.type}</span>
              </span>

              {hasLore ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-notes bg-[#e8f2e9] border border-[#6b9e71] text-[#2f5c35] font-bold">
                  <Sparkles size={10} />
                  World Lore Charted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-notes bg-[#fbf5e6] border border-[#c4b08c] text-[#78634d]">
                  Title Inscribed
                </span>
              )}
            </div>

            <h2 className="font-heading text-2xl sm:text-4xl text-[#2b2118] font-bold leading-snug">
              {world.title}
            </h2>

            {world.tone && (
              <p className="text-xs sm:text-sm text-[#735d44] mt-1.5 font-body italic">
                "{world.tone}"
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5a4632] hover:text-[#2b2118] hover:bg-[#dfcdab] transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1">
          {/* User's Original Note */}
          {world.note && (
            <div className="p-4 rounded-xl bg-[#ead9b8] border border-[#c4b08c]">
              <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
                <Quote size={11} />
                What Captivated You About This Story
              </div>
              <p className="text-xs sm:text-sm text-[#2b2118] italic leading-relaxed font-body">
                "{world.note}"
              </p>
            </div>
          )}

          {hasLore ? (
            <>
              {/* Canonical Themes */}
              {world.themes && world.themes.length > 0 && (
                <div>
                  <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 font-bold">
                    Governing Themes ({world.themes.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {world.themes.map((theme, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#ead9b8] border border-[#c4b08c] text-[#2b2118] shadow-xs"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b-2 border-[#c4b08c] pb-3">
                <button
                  onClick={() => setActiveTab('blurb')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'blurb'
                      ? 'bg-[#a2562b] text-[#fbf4e4] font-bold shadow-xs'
                      : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
                  }`}
                >
                  <Compass size={13} />
                  <span>Genesis & Blurb</span>
                </button>
                <button
                  onClick={() => setActiveTab('places')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'places'
                      ? 'bg-[#a2562b] text-[#fbf4e4] font-bold shadow-xs'
                      : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
                  }`}
                >
                  <MapPin size={13} />
                  <span>Charted Provinces ({world.places?.length || 0})</span>
                </button>
                <button
                  onClick={() => setActiveTab('characters')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'characters'
                      ? 'bg-[#a2562b] text-[#fbf4e4] font-bold shadow-xs'
                      : 'bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118]'
                  }`}
                >
                  <Users size={13} />
                  <span>Figures ({world.characters?.length || 0})</span>
                </button>
              </div>

              {/* Tab 1: Blurb */}
              {activeTab === 'blurb' && (
                <div className="space-y-4">
                  <div className="p-5 rounded-2xl bg-[#fbf5e6] border-2 border-[#c4b08c]">
                    <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 font-bold">
                      World Inscription (Max 60 Words)
                    </div>
                    <p className="font-heading text-xl sm:text-2xl text-[#2b2118] leading-relaxed italic">
                      "{world.blurb}"
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Places */}
              {activeTab === 'places' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {world.places?.map((place, idx) => (
                    <div
                      key={place.id || idx}
                      className="p-5 rounded-xl bg-[#fbf5e6] border-2 border-[#c4b08c] hover:border-[#a2562b] transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#a2562b]" />
                          <h4 className="font-heading text-lg sm:text-xl text-[#2b2118] font-bold">
                            {place.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-notes text-[#78634d]">
                          #{place.id}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed mb-3 font-body">
                        {place.description}
                      </p>

                      {place.connects_to && place.connects_to.length > 0 && (
                        <div className="pt-2 border-t border-[#d8c5a2] flex items-center gap-1.5 flex-wrap">
                          <Link2 size={11} className="text-[#a2562b]" />
                          <span className="text-[10px] font-sc text-[#78634d] font-bold">
                            Trails to:
                          </span>
                          {place.connects_to.map((connId, cIdx) => (
                            <span
                              key={cIdx}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#ead9b8] border border-[#c4b08c] text-[#2b2118] font-notes"
                            >
                              {connId}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Characters */}
              {activeTab === 'characters' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {world.characters?.map((char, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl bg-[#fbf5e6] border-2 border-[#c4b08c] hover:border-[#a2562b] transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Feather size={14} className="text-[#a2562b]" />
                        <h4 className="font-heading text-lg sm:text-xl text-[#2b2118] font-bold">
                          {char.name}
                        </h4>
                      </div>
                      <div className="text-xs text-[#a2562b] font-sc mb-2 font-bold">
                        {char.role}
                      </div>
                      <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed font-body">
                        {char.description}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Unsynthesized State */
            <div className="py-12 px-6 text-center bg-[#ead9b8] rounded-2xl border-2 border-[#826a4c]">
              <div className="w-14 h-14 rounded-full bg-[#fbf4e4] border-2 border-[#826a4c] flex items-center justify-center mx-auto mb-4">
                <CartographicCompass size={28} color="#5a4632" />
              </div>
              <h3 className="font-heading text-2xl text-[#2b2118] mb-2 font-bold">
                Lore Awaiting Synthesis
              </h3>
              <p className="text-xs sm:text-sm text-[#5a4632] max-w-md mx-auto mb-6 leading-relaxed font-body">
                This title is inscribed in your atlas folio. Call upon the server-side Gemini function
                to synthesize its tone, canonical themes, 60-word blurb, interconnected provinces,
                and key figures.
              </p>

              {onGenerateLore && (
                <button
                  onClick={() => onGenerateLore(world)}
                  disabled={isGenerating}
                  className="btn-seal px-6 py-3 rounded-xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#fbf4e4] border-t-transparent rounded-full animate-spin" />
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

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-[#ead9b8] border-t-2 border-[#d8c5a2] flex items-center justify-between text-xs text-[#5a4632] font-notes shrink-0">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-[#a2562b]" />
            <span>Recorded {new Date(world.createdAt).toLocaleDateString()}</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWorldPage && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWorldPage(world);
                }}
                className="btn-seal px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Compass size={13} />
                <span>Open Realm Map</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn-ink px-4 py-1.5 rounded-lg text-xs font-medium text-[#2b2118] bg-[#fbf4e4] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
