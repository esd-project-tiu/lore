import React, { useState } from 'react';
import { Place, Character } from '../../types';
import {
  X,
  MapPin,
  Link2,
  Users,
  Feather,
  Compass,
  ArrowRight,
  Lock,
  Unlock,
  Edit3,
  Trash2,
  RotateCw,
  GitMerge,
  Check,
} from 'lucide-react';

interface PlacePanelProps {
  place: Place;
  allPlaces: Place[];
  linkedCharacters: Character[];
  readOnly?: boolean;
  onClose: () => void;
  onSelectConnectedPlace: (placeId: string) => void;
  onUpdatePlace?: (updatedPlace: Place) => void;
  onDeletePlace?: (placeId: string) => void;
  onRegeneratePlace?: (place: Place) => Promise<void>;
  isRegenerating?: boolean;
}

export const PlacePanel: React.FC<PlacePanelProps> = ({
  place,
  allPlaces,
  linkedCharacters,
  readOnly = false,
  onClose,
  onSelectConnectedPlace,
  onUpdatePlace,
  onDeletePlace,
  onRegeneratePlace,
  isRegenerating = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(place.name);
  const [editDesc, setEditDesc] = useState(place.description);
  const [selectedConnections, setSelectedConnections] = useState<string[]>(place.connects_to);

  // Sync if place prop changes
  React.useEffect(() => {
    setEditName(place.name);
    setEditDesc(place.description);
    setSelectedConnections(place.connects_to);
    setIsEditing(false);
  }, [place]);

  const connectedPlaces = place.connects_to
    .map((targetId) => allPlaces.find((p) => p.id === targetId))
    .filter(Boolean) as Place[];

  const handleToggleLock = () => {
    if (readOnly || !onUpdatePlace) return;
    onUpdatePlace({
      ...place,
      locked: !place.locked,
    });
  };

  const handleSaveEdit = () => {
    if (!onUpdatePlace) return;
    onUpdatePlace({
      ...place,
      name: editName.trim() || place.name,
      description: editDesc.trim() || place.description,
      connects_to: selectedConnections,
    });
    setIsEditing(false);
  };

  const toggleConnection = (otherId: string) => {
    setSelectedConnections((prev) =>
      prev.includes(otherId) ? prev.filter((id) => id !== otherId) : [...prev, otherId]
    );
  };

  const sealColor = place.sourceColor || '#a2562b';

  return (
    <div className="absolute top-4 right-4 bottom-4 w-full sm:w-96 max-w-[calc(100vw-2rem)] z-30 flex flex-col bg-[#fbf4e4] rounded-2xl border-2 border-[#5a4632] shadow-2xl backdrop-blur-md overflow-hidden animate-ink-bleed">
      {/* Pinned Brass / Wax Seal Fastener on Top */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full wax-seal border-2 border-[#5a4632] z-40 shadow-sm flex items-center justify-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#fbf4e4]/80" />
      </div>

      {/* Scroll Header */}
      <div className="pt-6 px-5 pb-4 border-b border-[#d8c5a2] bg-[#ead9b8] shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <MapPin size={12} className="text-[#a2562b]" />
              <span className="text-[10px] font-sc uppercase tracking-widest text-[#5a4632]">
                {place.isBridge ? 'Convergence Bridge' : 'Province Folio'}
              </span>
              <span className="text-[10px] font-notes text-[#8a7355]">#{place.id}</span>

              {place.isBridge && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-sc bg-[#ead9b8] border border-[#a2562b] text-[#a2562b]">
                  <GitMerge size={9} />
                  Bridge
                </span>
              )}

              {place.sourceTag && !place.isBridge && (
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-notes font-bold"
                  style={{
                    backgroundColor: '#fbf4e4',
                    color: sealColor,
                    border: `1px solid ${sealColor}`,
                  }}
                >
                  {place.sourceTag}
                </span>
              )}
            </div>

            {!isEditing ? (
              <h3 className="font-heading text-xl sm:text-2xl text-[#2b2118] font-bold leading-snug">
                {place.name}
              </h3>
            ) : (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-2.5 py-1.5 input-parchment text-sm text-[#2b2118] font-heading font-bold"
              />
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {!readOnly && (
              <button
                onClick={handleToggleLock}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  place.locked
                    ? 'bg-[#fbf4e4] text-[#a2562b] border border-[#a2562b]'
                    : 'text-[#78634d] hover:text-[#2b2118]'
                }`}
                title={place.locked ? 'Locked (click to unlock)' : 'Unlocked (click to lock)'}
              >
                {place.locked ? <Lock size={15} /> : <Unlock size={15} />}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#5a4632] hover:text-[#2b2118] hover:bg-[#dfcdab] transition-colors cursor-pointer"
              title="Close note"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Bar (Lock, Edit, Regenerate, Delete) */}
      {!readOnly && (
        <div className="px-5 py-2 bg-[#f4e6cc] border-b border-[#d8c5a2] flex items-center justify-between gap-2 text-xs">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 text-[#5a4632] hover:text-[#a2562b] font-medium transition-colors cursor-pointer"
              >
                <Edit3 size={13} className="text-[#a2562b]" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => onRegeneratePlace && onRegeneratePlace(place)}
                disabled={place.locked || isRegenerating}
                className="inline-flex items-center gap-1.5 text-[#5a4632] hover:text-[#a2562b] font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title={
                  place.locked
                    ? 'Place is locked. Unlock to regenerate.'
                    : 'Regenerate this single place via Gemini'
                }
              >
                <RotateCw
                  size={13}
                  className={`text-[#a2562b] ${isRegenerating ? 'animate-spin' : ''}`}
                />
                <span>Regenerate Lore</span>
              </button>

              <button
                onClick={() => {
                  if (confirm(`Remove province "${place.name}" from atlas?`)) {
                    onDeletePlace && onDeletePlace(place.id);
                  }
                }}
                className="inline-flex items-center gap-1 text-[#9c2f2f] hover:text-[#6e1a1a] transition-colors cursor-pointer font-medium"
                title="Remove this province"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-[#a2562b] font-sc font-bold">Editing Province</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded bg-[#ead9b8] text-[#5a4632] hover:text-[#2b2118] text-xs cursor-pointer font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="btn-seal px-3 py-1 rounded text-xs flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Check size={12} />
                  <span>Save</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Scrollable Note Body */}
      <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
        {/* Description Section */}
        <div>
          <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Compass size={12} />
            Topography & Lore
          </div>

          {!isEditing ? (
            <div className="p-4 rounded-xl bg-[#fbf5e6] border border-[#d8c5a2] text-sm text-[#2b2118] leading-relaxed font-body">
              {place.description}
            </div>
          ) : (
            <textarea
              rows={4}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className="w-full p-3 input-parchment text-xs text-[#2b2118] leading-relaxed font-body"
            />
          )}
        </div>

        {/* Edit Connections toggle list when in editing mode */}
        {isEditing && (
          <div>
            <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link2 size={12} />
              Connect to Other Provinces
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 rounded-xl bg-[#ead9b8] border border-[#c4b08c]">
              {allPlaces
                .filter((p) => p.id !== place.id)
                .map((other) => {
                  const isConn = selectedConnections.includes(other.id);
                  return (
                    <button
                      key={other.id}
                      type="button"
                      onClick={() => toggleConnection(other.id)}
                      className={`w-full p-2 rounded-lg text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isConn
                          ? 'bg-[#fbf4e4] border border-[#a2562b] text-[#2b2118] font-semibold'
                          : 'bg-[#fbf5e6] text-[#5a4632] hover:text-[#2b2118]'
                      }`}
                    >
                      <span className="font-heading truncate">{other.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-notes ${
                          isConn ? 'bg-[#a2562b] text-white' : 'text-[#8a7355]'
                        }`}
                      >
                        {isConn ? 'Connected' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* Linked Characters Section */}
        <div>
          <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Users size={12} />
              <span>Inhabitants & Lorekeepers ({linkedCharacters.length})</span>
            </div>
            <span className="text-[10px] font-notes text-[#8a7355]">Folio Records</span>
          </div>

          {linkedCharacters.length > 0 ? (
            <div className="space-y-2.5">
              {linkedCharacters.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#fbf5e6] border border-[#d8c5a2] hover:border-[#a2562b] transition-colors"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5">
                      <Feather size={12} className="text-[#a2562b]" />
                      <h5 className="font-heading text-base text-[#2b2118] font-bold">
                        {char.name}
                      </h5>
                    </div>
                    {char.locked && (
                      <span
                        title="Character is locked"
                        className="text-[#a2562b] bg-[#ead9b8] p-0.5 rounded"
                      >
                        <Lock size={10} />
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-sc text-[#a2562b] mb-1 font-semibold">
                    {char.role}
                  </div>
                  <p className="text-xs text-[#5a4632] leading-relaxed font-body">
                    {char.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-[#fbf5e6] border border-[#d8c5a2] text-center text-[#78634d] italic font-body">
              No inhabitants recorded for this province.
            </div>
          )}
        </div>

        {/* Connected Routes Section */}
        {!isEditing && (
          <div>
            <div className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Link2 size={12} />
              Connected Trails ({connectedPlaces.length})
            </div>

            {connectedPlaces.length > 0 ? (
              <div className="space-y-2">
                {connectedPlaces.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => onSelectConnectedPlace(conn.id)}
                    className="w-full p-2.5 rounded-xl bg-[#fbf5e6] hover:bg-[#ead9b8] border border-[#d8c5a2] hover:border-[#a2562b] text-left transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="pr-2">
                      <div className="font-heading text-sm text-[#2b2118] group-hover:text-[#a2562b] transition-colors font-bold">
                        {conn.name}
                      </div>
                      <div className="text-[10px] text-[#78634d] font-notes">#{conn.id}</div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-[#a2562b] group-hover:translate-x-0.5 transition-all shrink-0"
                    />
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-[#fbf5e6] border border-[#d8c5a2] text-[#78634d] italic font-body">
                No outgoing trails recorded.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
