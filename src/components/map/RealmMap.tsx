import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Node,
  Edge,
  NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';

import { Place, Character } from '../../types';
import { PlaceNode } from './PlaceNode';
import { PlacePanel } from './PlacePanel';
import { CartographicCompass } from '../CartographicCompass';
import { Compass, Download, GitMerge } from 'lucide-react';

interface RealmMapProps {
  places: Place[];
  characters: Character[];
  worldTitle: string;
  readOnly?: boolean;
  onUpdatePlace?: (place: Place) => void;
  onDeletePlace?: (placeId: string) => void;
  onRegeneratePlace?: (place: Place) => Promise<void>;
  isRegenerating?: boolean;
}

const nodeTypes: NodeTypes = {
  placeNode: PlaceNode,
};

// Helper to determine characters linked to a place
export function getCharactersForPlace(
  place: Place,
  placeIndex: number,
  totalPlaces: number,
  characters: Character[]
): Character[] {
  if (!characters || characters.length === 0) return [];

  // 1. Direct match by explicit place_id
  const directPlaceIdMatches = characters.filter(
    (c) =>
      c.place_id &&
      (c.place_id === place.id || c.place_id.toLowerCase() === place.id.toLowerCase())
  );
  if (directPlaceIdMatches.length > 0) {
    return directPlaceIdMatches;
  }

  // 2. Next pass: match place name or id in character description or role
  const pName = place.name.toLowerCase();
  const pId = place.id.toLowerCase();

  const directMatches = characters.filter((c) => {
    const text = (c.description + ' ' + c.role + ' ' + c.name).toLowerCase();
    return text.includes(pName) || text.includes(pId);
  });

  if (directMatches.length > 0) {
    return directMatches;
  }

  // Fallback distribution
  const assigned = characters.filter((_, cIdx) => cIdx % totalPlaces === placeIndex);
  if (assigned.length > 0) return assigned;

  return [characters[placeIndex % characters.length]];
}

export const RealmMap: React.FC<RealmMapProps> = ({
  places,
  characters,
  worldTitle,
  readOnly = false,
  onUpdatePlace,
  onDeletePlace,
  onRegeneratePlace,
  isRegenerating = false,
}) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Compute organic coordinates for nodes in a cartographic circle/ellipse
  const initialNodes: Node[] = useMemo(() => {
    if (!places || places.length === 0) return [];

    const total = places.length;
    const radiusX = Math.max(340, total * 52);
    const radiusY = Math.max(260, total * 42);
    const centerX = 450;
    const centerY = 350;

    return places.map((place, idx) => {
      // Stagger angles so layout feels hand-charted rather than mechanical
      const angle = (2 * Math.PI * idx) / total - Math.PI / 2;
      const jitterX = Math.sin(idx * 2.3) * 25;
      const jitterY = Math.cos(idx * 2.7) * 20;

      const posX = centerX + radiusX * Math.cos(angle) + jitterX;
      const posY = centerY + radiusY * Math.sin(angle) + jitterY;

      const linked = getCharactersForPlace(place, idx, total, characters);

      return {
        id: place.id,
        type: 'placeNode',
        position: { x: posX, y: posY },
        data: {
          place,
          linkedCharacterCount: linked.length,
          isSelected: selectedPlaceId === place.id,
        },
      };
    });
  }, [places, characters, selectedPlaceId]);

  // Compute edges based on connects_to (Dashed inked paths)
  const initialEdges: Edge[] = useMemo(() => {
    if (!places || places.length === 0) return [];

    const placeIdSet = new Set(places.map((p) => p.id));
    const edgesList: Edge[] = [];
    const createdEdges = new Set<string>();

    places.forEach((source) => {
      source.connects_to.forEach((targetId) => {
        if (!placeIdSet.has(targetId) || source.id === targetId) return;

        const pairKey = [source.id, targetId].sort().join('--');
        if (createdEdges.has(pairKey)) return;
        createdEdges.add(pairKey);

        const targetPlace = places.find((p) => p.id === targetId);
        const isBridgeEdge = Boolean(source.isBridge || targetPlace?.isBridge);
        const isHighlighted =
          selectedPlaceId === source.id || selectedPlaceId === targetId;

        const strokeColor = isHighlighted
          ? '#a2562b'
          : isBridgeEdge
          ? '#9c2f2f'
          : source.sourceColor || '#5a4632';

        edgesList.push({
          id: `edge_${source.id}_${targetId}`,
          source: source.id,
          target: targetId,
          type: 'default',
          animated: false,
          style: {
            stroke: strokeColor,
            strokeWidth: isHighlighted ? 2.5 : isBridgeEdge ? 2 : 1.6,
            strokeDasharray: isBridgeEdge ? '3 4' : '4 5',
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeColor,
            width: 10,
            height: 10,
          },
        });
      });
    });

    return edgesList;
  }, [places, selectedPlaceId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state whenever selection changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle clicking a place node
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedPlaceId(node.id);
  }, []);

  const selectedPlace = useMemo(() => {
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

  const selectedPlaceIndex = useMemo(() => {
    return places.findIndex((p) => p.id === selectedPlaceId);
  }, [places, selectedPlaceId]);

  const linkedCharacters = useMemo(() => {
    if (!selectedPlace) return [];
    return getCharactersForPlace(
      selectedPlace,
      selectedPlaceIndex,
      places.length,
      characters
    );
  }, [selectedPlace, selectedPlaceIndex, places.length, characters]);

  // Convergence Sources Legend
  const uniqueSources = useMemo(() => {
    const map = new Map<string, string>();
    places.forEach((p) => {
      if (p.sourceTag && !p.isBridge && p.sourceColor) {
        map.set(p.sourceTag, p.sourceColor);
      }
    });
    return Array.from(map.entries()).map(([tag, color]) => ({ tag, color }));
  }, [places]);

  const hasBridges = useMemo(() => places.some((p) => p.isBridge), [places]);

  // Export map to PNG (parchment background)
  const handleExportPng = async () => {
    if (!mapContainerRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await toPng(mapContainerRef.current, {
        cacheBust: true,
        backgroundColor: '#f3e7cf',
      });
      const link = document.createElement('a');
      link.download = `${worldTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_realm_map.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export map as PNG:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={mapContainerRef}
      className="relative w-full h-[680px] sm:h-[780px] bg-[#fbf4e4] rounded-3xl border-4 border-[#5a4632] overflow-hidden shadow-2xl transition-all paper-fold"
    >
      {/* Decorative Cartographic Inner Border */}
      <div className="absolute inset-2 sm:inset-3 pointer-events-none border border-[#826a4c] rounded-2xl z-10">
        <div className="absolute inset-1 border border-dashed border-[#a89475]/60 rounded-xl" />
      </div>

      {/* Cartographic Compass Rose in Corner */}
      <div className="absolute bottom-6 right-6 z-20 pointer-events-none opacity-40 hidden md:block">
        <CartographicCompass size={110} color="#5a4632" />
      </div>

      {/* Header Cartouche Overlay */}
      <div className="absolute top-5 left-5 z-20 flex items-center gap-3 bg-[#fbf5e6]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border-2 border-[#5a4632] shadow-sm">
        <CartographicCompass size={24} color="#5a4632" />
        <div>
          <span className="text-[10px] font-sc text-[#a2562b] uppercase tracking-wider block leading-none font-bold">
            Realm Cartography
          </span>
          <span className="text-sm font-heading text-[#2b2118] font-bold block mt-0.5">
            {worldTitle}
          </span>
        </div>
      </div>

      {/* Top Right Controls: Scale bar & Export PNG */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="btn-ink px-3 py-1.5 rounded-xl bg-[#fbf5e6] text-[11px] font-medium text-[#2b2118] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs border-2 border-[#5a4632]"
          title="Download Realm Map as PNG"
        >
          {isExporting ? (
            <div className="w-3.5 h-3.5 border-2 border-[#a2562b] border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={13} className="text-[#a2562b]" />
          )}
          <span>{isExporting ? 'Exporting...' : 'Export Map'}</span>
        </button>
      </div>

      {/* Scale Bar and Coordinates (Bottom Left) */}
      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-3 bg-[#fbf5e6]/90 px-3 py-1.5 rounded-lg border border-[#a89475] text-[10px] font-notes text-[#5a4632]">
        <div className="flex items-center gap-1.5">
          <span>0</span>
          <div className="w-14 h-1 bg-[#2b2118] relative">
            <div className="absolute left-1/2 -top-1 w-px h-3 bg-[#2b2118]" />
          </div>
          <span>40 Leagues</span>
        </div>
        <span className="text-[#a89475]">·</span>
        <span className="hidden sm:inline">45° 18' N · 12° 20' E</span>
      </div>

      {/* Origins / Wax-Seal Legend */}
      {(uniqueSources.length > 0 || hasBridges) && (
        <div className="absolute bottom-5 right-5 z-20 hidden md:flex items-center gap-3 bg-[#fbf5e6]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#a89475] text-[10px] font-notes shadow-xs">
          <span className="font-sc uppercase tracking-wider text-[#5a4632]">Origins:</span>
          {uniqueSources.map(({ tag, color }) => (
            <div key={tag} className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-full ring-1 ring-[#3c2e22]"
                style={{ backgroundColor: color }}
              />
              <span className="text-[#2b2118] font-medium">{tag}</span>
            </div>
          ))}
          {hasBridges && (
            <div className="flex items-center gap-1 text-[#a2562b] font-medium">
              <GitMerge size={11} />
              <span>Bridge Province</span>
            </div>
          )}
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background color="#d8c5a2" gap={32} size={1.5} className="opacity-60" />

        <Controls
          className="!bg-[#fbf5e6] !border-2 !border-[#5a4632] !rounded-xl overflow-hidden shadow-sm [&>button]:!bg-[#fbf5e6] [&>button]:!border-b [&>button]:!border-[#d8c5a2] [&>button]:!text-[#5a4632] [&>button:hover]:!bg-[#ead9b8]"
          showInteractive={false}
        />

        <MiniMap
          nodeColor={(n: any) => n.data?.place?.sourceColor || '#a2562b'}
          maskColor="rgba(243, 231, 207, 0.75)"
          className="!bg-[#ead9b8] !border-2 !border-[#5a4632] !rounded-xl overflow-hidden hidden md:block shadow-sm"
        />
      </ReactFlow>

      {/* Pinned Note Side Panel */}
      {selectedPlace && (
        <PlacePanel
          place={selectedPlace}
          allPlaces={places}
          linkedCharacters={linkedCharacters}
          readOnly={readOnly}
          onClose={() => setSelectedPlaceId(null)}
          onSelectConnectedPlace={(targetId) => setSelectedPlaceId(targetId)}
          onUpdatePlace={onUpdatePlace}
          onDeletePlace={(placeId) => {
            setSelectedPlaceId(null);
            onDeletePlace && onDeletePlace(placeId);
          }}
          onRegeneratePlace={onRegeneratePlace}
          isRegenerating={isRegenerating}
        />
      )}
    </div>
  );
};
