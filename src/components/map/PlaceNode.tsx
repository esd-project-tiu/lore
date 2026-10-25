import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Place } from '../../types';
import { Lock, GitMerge } from 'lucide-react';

interface PlaceNodeData {
  place: Place;
  isSelected?: boolean;
  linkedCharacterCount?: number;
}

// Keyword-based illustrated landmark generator (Tower, Forest, Ruins, Port, Mountain, Default)
function getLandmarkType(place: Place): 'tower' | 'forest' | 'ruins' | 'port' | 'mountain' | 'landmark' {
  const text = (place.name + ' ' + place.description).toLowerCase();
  if (/(tower|spire|citadel|fortress|castle|keep|bastion|obelisk|zenith|palace)/i.test(text)) {
    return 'tower';
  }
  if (/(forest|wood|grove|tree|jungle|arboretum|thicket|swamp|marsh|brambles)/i.test(text)) {
    return 'forest';
  }
  if (/(ruin|temple|colonnade|monument|tomb|crypt|sanctuary|altar|arch|shrine|scriptorium)/i.test(text)) {
    return 'ruins';
  }
  if (/(port|sea|ocean|bay|harbor|island|coast|river|sunken|water|channel|beacon|lighthouse|reef)/i.test(text)) {
    return 'port';
  }
  if (/(mountain|peak|cliff|crag|valley|canyon|cave|cavern|ridge|abyss|hollow|mine)/i.test(text)) {
    return 'mountain';
  }
  return 'landmark';
}

const LandmarkIllustration: React.FC<{ type: string; color: string; isSelected?: boolean }> = ({
  type,
  color,
  isSelected,
}) => {
  const ink = isSelected ? '#a2562b' : '#3c2e22';

  if (type === 'tower') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
        {/* Stone Watchtower illustration */}
        <polygon points="12,32 24,32 22,12 14,12" fill="#ead9b8" stroke={ink} strokeWidth="1.5" />
        <rect x="11" y="9" width="14" height="4" fill="#fbf4e4" stroke={ink} strokeWidth="1.5" />
        {/* Battlements */}
        <line x1="11" y1="7" x2="11" y2="9" stroke={ink} strokeWidth="1.5" />
        <line x1="15" y1="7" x2="15" y2="9" stroke={ink} strokeWidth="1.5" />
        <line x1="21" y1="7" x2="21" y2="9" stroke={ink} strokeWidth="1.5" />
        <line x1="25" y1="7" x2="25" y2="9" stroke={ink} strokeWidth="1.5" />
        {/* Arrow slit & door */}
        <line x1="18" y1="16" x2="18" y2="21" stroke={ink} strokeWidth="1.5" />
        <path d="M16 32 C16 27 20 27 20 32 Z" fill="#3c2e22" />
      </svg>
    );
  }

  if (type === 'forest') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
        {/* Group of hand-inked pine / oak trees */}
        <polygon points="18,6 10,18 26,18" fill="#e2ede3" stroke={ink} strokeWidth="1.5" />
        <polygon points="18,12 8,26 28,26" fill="#d2e3d4" stroke={ink} strokeWidth="1.5" />
        <rect x="16" y="26" width="4" height="6" fill="#755a40" stroke={ink} strokeWidth="1" />
        {/* Companion tree */}
        <polygon points="28,15 22,25 34,25" fill="#e2ede3" stroke={ink} strokeWidth="1.2" opacity="0.8" />
        <rect x="27" y="25" width="2" height="5" fill="#755a40" />
      </svg>
    );
  }

  if (type === 'ruins') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
        {/* Ancient Colonnade / Broken Arch */}
        <line x1="6" y1="32" x2="30" y2="32" stroke={ink} strokeWidth="2" />
        <rect x="9" y="14" width="4" height="18" fill="#fbf4e4" stroke={ink} strokeWidth="1.5" />
        <rect x="23" y="18" width="4" height="14" fill="#fbf4e4" stroke={ink} strokeWidth="1.5" />
        {/* Broken pediment */}
        <polygon points="6,14 18,8 24,14" fill="#ead9b8" stroke={ink} strokeWidth="1.5" />
        {/* Scattered rubble */}
        <rect x="16" y="28" width="4" height="3" fill="#ead9b8" stroke={ink} strokeWidth="1" />
        <rect x="28" y="29" width="3" height="3" fill="#ead9b8" stroke={ink} strokeWidth="1" />
      </svg>
    );
  }

  if (type === 'port') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
        {/* Lighthouse / Nautical Anchor beacon */}
        <path d="M14 32 L16 10 L20 10 L22 32 Z" fill="#fbf4e4" stroke={ink} strokeWidth="1.5" />
        <rect x="14" y="8" width="8" height="4" fill="#ead9b8" stroke={ink} strokeWidth="1.5" />
        <polygon points="18,3 15,8 21,8" fill="#a2562b" stroke={ink} strokeWidth="1" />
        {/* Waves below */}
        <path d="M6 31 Q10 29 14 31 T22 31 T30 31" fill="none" stroke="#4f7a8a" strokeWidth="1.5" />
        <path d="M4 34 Q8 32 12 34 T20 34 T28 34" fill="none" stroke="#4f7a8a" strokeWidth="1.5" />
      </svg>
    );
  }

  if (type === 'mountain') {
    return (
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
        {/* Majestic craggy mountain peaks */}
        <polygon points="18,8 6,32 30,32" fill="#ead9b8" stroke={ink} strokeWidth="1.5" />
        {/* Ridge line */}
        <path d="M18 8 Q19 18 16 32" stroke={ink} strokeWidth="1.2" fill="none" />
        <polygon points="18,8 18,16 14,19 18,22 16,32 6,32" fill="#d8c59f" opacity="0.6" />
        {/* Minor peak */}
        <polygon points="28,16 22,32 34,32" fill="#fbf4e4" stroke={ink} strokeWidth="1.2" />
      </svg>
    );
  }

  // Default Landmark Compass Pin
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="shrink-0">
      <circle cx="18" cy="18" r="14" fill="#fbf4e4" stroke={ink} strokeWidth="1.5" />
      <polygon points="18,7 21,18 18,16 15,18" fill="#a2562b" />
      <polygon points="18,29 21,18 18,20 15,18" fill="#3c2e22" opacity="0.6" />
      <circle cx="18" cy="18" r="2.5" fill="#fbf4e4" stroke={ink} strokeWidth="1" />
    </svg>
  );
};

export const PlaceNode: React.FC<{ data: PlaceNodeData; selected?: boolean }> = ({
  data,
  selected,
}) => {
  const { place, linkedCharacterCount = 0 } = data;
  const isHighlighted = selected || data.isSelected;

  const landmarkType = getLandmarkType(place);

  // Wax seal color for bridge or source
  const sealColor = place.sourceColor || '#a2562b';

  return (
    <div
      className={`group relative min-w-[210px] max-w-[260px] rounded-2xl p-4 transition-all duration-300 cursor-pointer ${
        isHighlighted
          ? 'bg-[#fbf4e4] border-2 border-[#a2562b] shadow-[0_8px_25px_rgba(162,86,43,0.22)]'
          : 'bg-[#fbf5e6] hover:bg-[#fbf4e4] border-2 border-[#826a4c] shadow-[0_4px_14px_rgba(43,33,24,0.12)]'
      }`}
    >
      {/* 4 Cardinal Handles for dashed inked paths */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-[#5a4632] !border-2 !border-[#fbf4e4] opacity-50 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-[#5a4632] !border-2 !border-[#fbf4e4] opacity-50 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !bg-[#5a4632] !border-2 !border-[#fbf4e4] opacity-50 group-hover:opacity-100 transition-opacity"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !bg-[#5a4632] !border-2 !border-[#fbf4e4] opacity-50 group-hover:opacity-100 transition-opacity"
      />

      {/* Decorative Cartographic Corner Ticks */}
      <div className="absolute top-1 left-1.5 text-[9px] select-none font-notes text-[#8a7355]">
        +
      </div>
      <div className="absolute top-1 right-1.5 text-[9px] select-none font-notes text-[#8a7355]">
        +
      </div>

      {/* Node Header: Illustrated Landmark + Tag Info */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <LandmarkIllustration
            type={landmarkType}
            color={sealColor}
            isSelected={isHighlighted}
          />
          <div>
            <div className="text-[9px] font-notes text-[#78634d] uppercase tracking-wider">
              {place.isBridge ? 'Bridge' : landmarkType}
            </div>
            <div className="text-[10px] font-notes text-[#8a7355]">#{place.id}</div>
          </div>
        </div>

        {/* Lock or Wax-Seal Origin Marker */}
        <div className="flex items-center gap-1.5">
          {place.locked && (
            <span
              title="Locked (preserved across regeneration)"
              className="inline-flex items-center text-[#a2562b] bg-[#ead9b8] p-1 rounded border border-[#ab9676]"
            >
              <Lock size={10} />
            </span>
          )}

          {/* Stamped Wax-Seal Marker for Source or Bridge */}
          {(place.sourceTag || place.isBridge) && (
            <div
              title={place.isBridge ? 'Convergence Bridge' : `Source: ${place.sourceTag}`}
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs"
              style={{
                backgroundColor: place.isBridge ? '#a2562b' : sealColor,
                border: '1.5px solid #3c2e22',
              }}
            >
              {place.isBridge ? <GitMerge size={10} /> : (place.sourceTag || 'S')[0].toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Ribbon Banner Label for Place Name */}
      <div className="relative mb-2">
        <div className="ribbon-label px-2.5 py-1 rounded-md border border-[#826a4c] bg-[#ead9b8] flex items-center justify-between">
          <h4 className="font-heading text-base text-[#2b2118] font-bold leading-tight truncate">
            {place.name}
          </h4>
        </div>
      </div>

      {/* Short Lore Snippet */}
      <p className="text-xs text-[#5a4632] line-clamp-2 leading-relaxed mb-3 font-body">
        {place.description}
      </p>

      {/* Footer Badges */}
      <div className="pt-2 border-t border-[#d8c5a2] flex items-center justify-between text-[11px] text-[#78634d] font-notes">
        <span>{place.connects_to.length} trails</span>

        {linkedCharacterCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-[#ead9b8] border border-[#c4b08c] text-[#2b2118] text-[10px] font-medium">
            {linkedCharacterCount} {linkedCharacterCount === 1 ? 'figure' : 'figures'}
          </span>
        )}
      </div>
    </div>
  );
};
