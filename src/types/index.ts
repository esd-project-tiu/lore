export type MediaType = 'book' | 'show' | 'setting' | 'blend';
export type MoodType = 'cozy' | 'melancholy' | 'epic' | 'eerie' | 'hopeful' | 'chaotic';

export interface Place {
  id: string;
  name: string;
  description: string;
  connects_to: string[];
  locked?: boolean;
  sourceTag?: string; // Origin title or genre (e.g. "Dune" or "Bloodborne")
  sourceColor?: string; // Visual ring accent color
  isBridge?: boolean; // True if it synthesizes two merged worlds
  bridgeSources?: string[]; // The pair of sources it links
}

export interface Character {
  id?: string;
  name: string;
  role: string;
  description: string;
  place_id?: string;
  locked?: boolean;
}

export interface CanonContradiction {
  id: string;
  itemsInvolved: string[]; // names or ids of places/characters
  conflictDescription: string;
  suggestedFix: string;
}

export interface GeneratedWorldLore {
  tone: string;
  themes: string[];
  blurb: string;
  places: Place[];
  characters: Character[];
  storyHooks?: string[]; // 5 campaign story hooks for tabletop GMs & writers
}

export interface World {
  id: string;
  userId: string;
  title: string;
  type: MediaType;
  creator?: string;
  note?: string;
  genre?: string;
  status: 'saved' | 'draft' | 'exploring' | 'ready';
  tone?: string;
  themes?: string[];
  blurb?: string;
  places?: Place[];
  characters?: Character[];
  storyHooks?: string[];
  sources?: string[]; // If blending 2-3 sources/genres
  generationType?: 'setting' | 'blend' | 'single';
  isPublic?: boolean; // For read-only sharing
  createdAt: string;
  updatedAt: string;
}

export interface CatalogItem {
  id: string;
  title: string;
  type: 'book' | 'show';
  creator: string;
  year: string;
  mood: MoodType;
  themes: string[];
  themeVector: number[]; // 20-length vector
  blurb: string;
}

export interface RankedRecommendation {
  item: CatalogItem;
  similarity: number;
  score: number;
  sharedThemes: string[];
  matchingMood: boolean;
  whyThisFits: string;
}

export interface DemoWorld {
  title: string;
  subtitle: string;
  sources: { title: string; type: 'book' | 'show'; year: string; author: string }[];
  description: string;
  locations: { name: string; region: string; lore: string }[];
  factions: { name: string; crest: string; philosophy: string }[];
  artifacts: { name: string; origin: string; effect: string }[];
}
