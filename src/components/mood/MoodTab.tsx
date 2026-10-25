import React from 'react';
import { MoodType, MOODS } from './moodConfigs';
import { MoodWallpaper } from './MoodWallpaper';
import {
  Flame,
  CloudRain,
  Crown,
  Ghost,
  SunMedium,
  Zap,
  Palette,
  Check,
} from 'lucide-react';

interface MoodTabProps {
  currentMood: MoodType;
  onSelectMood: (mood: MoodType) => void;
  worldTitle: string;
}

export const MoodTab: React.FC<MoodTabProps> = ({
  currentMood,
  onSelectMood,
  worldTitle,
}) => {
  const moodList: MoodType[] = ['cozy', 'eerie', 'epic', 'melancholy', 'hopeful', 'chaotic'];

  const getMoodIcon = (mood: MoodType) => {
    switch (mood) {
      case 'cozy':
        return <Flame size={18} className="text-[#a2562b]" />;
      case 'eerie':
        return <Ghost size={18} className="text-[#43685e]" />;
      case 'epic':
        return <Crown size={18} className="text-[#9c2f2f]" />;
      case 'melancholy':
        return <CloudRain size={18} className="text-[#4f7a8a]" />;
      case 'hopeful':
        return <SunMedium size={18} className="text-[#4a6b4f]" />;
      case 'chaotic':
        return <Zap size={18} className="text-[#b3473b]" />;
    }
  };

  return (
    <div className="space-y-8 animate-ink-bleed">
      {/* Mood Selector Header on Parchment */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#ead9b8] border-2 border-[#826a4c] shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <Palette size={16} className="text-[#a2562b]" />
          <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-widest font-bold">
            Cartographic Dispositions
          </span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl text-[#2b2118] font-normal mb-2">
          Select Realm Atmosphere
        </h2>
        <p className="text-xs sm:text-sm text-[#5a4632] leading-relaxed max-w-2xl font-body">
          Each disposition re-themes the folio with an authentic watercolor wash and renders a custom
          hand-drawn vector wallpaper in pure SVG.
        </p>

        {/* 6 Mood Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          {moodList.map((m) => {
            const config = MOODS[m];
            const isSelected = currentMood === m;

            return (
              <button
                key={m}
                onClick={() => onSelectMood(m)}
                className={`p-3.5 rounded-2xl text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group border-2 ${
                  isSelected
                    ? 'bg-[#fbf4e4] border-[#a2562b] shadow-md ring-2 ring-[#a2562b]/30'
                    : 'bg-[#fbf5e6] hover:bg-[#fbf4e4] border-[#c4b08c] hover:border-[#a2562b]'
                }`}
              >
                {/* Active check indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#a2562b] text-white flex items-center justify-center">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}

                <div>
                  <div className="w-8 h-8 rounded-lg bg-[#ead9b8] border border-[#ab9676] flex items-center justify-center mb-2.5 shadow-xs">
                    {getMoodIcon(m)}
                  </div>
                  <div className="font-heading text-base sm:text-lg text-[#2b2118] font-bold leading-tight">
                    {config.label}
                  </div>
                </div>

                {/* Color swatch dots */}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#d8c5a2]">
                  <div
                    className="w-3 h-3 rounded-full border border-[#3c2e22]/40"
                    style={{ backgroundColor: config.palette.primary }}
                    title={config.palette.name}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-[#3c2e22]/40"
                    style={{ backgroundColor: config.palette.secondary }}
                  />
                  <span className="text-[9px] font-notes text-[#78634d] ml-auto uppercase">
                    {m.slice(0, 3)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Mood Synopsis Banner */}
      <div className="p-5 rounded-2xl bg-[#fbf4e4] border-2 border-[#826a4c] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#ead9b8] border border-[#ab9676] flex items-center justify-center shrink-0">
            {getMoodIcon(currentMood)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider font-bold">
                Active Disposition: {MOODS[currentMood].label}
              </span>
              <span className="text-[10px] font-notes text-[#78634d]">
                ({MOODS[currentMood].palette.name})
              </span>
            </div>
            <p className="text-xs text-[#5a4632] mt-0.5 italic font-body">
              "{MOODS[currentMood].tagline}"
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-[11px] text-[#5a4632] font-notes">
          <span className="w-2 h-2 rounded-full bg-[#a2562b]" />
          <span>Folio Re-Themed in Ink</span>
        </div>
      </div>

      {/* Procedural SVG Wallpaper with Download PNG */}
      <MoodWallpaper mood={currentMood} worldTitle={worldTitle} />
    </div>
  );
};
