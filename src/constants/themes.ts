// 20 Fixed Canonical Themes for Lore
export const FIXED_20_THEMES = [
  'Cosmic Isolation',
  'Forbidden Knowledge',
  'Decay of Empires',
  'Man vs. Ecology',
  'Memory & Amnesia',
  'Temporal Paradox',
  'Divine Absurdity',
  'Bureaucratic Horror',
  'Technological Reverence',
  'Ancient Cataclysm',
  'Ritual & Duty',
  'Rebellion & Subversion',
  'Sacred Geometry',
  'The Sublime Unknown',
  'Fading Magic',
  'Symbiosis & Mutation',
  'Labyrinthine Architecture',
  'Lost Lineages',
  'The Price of Immortality',
  'Fractured Realities',
] as const;

export type FixedTheme = (typeof FIXED_20_THEMES)[number];
