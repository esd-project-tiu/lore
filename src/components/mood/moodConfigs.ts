export type MoodType = 'cozy' | 'melancholy' | 'epic' | 'eerie' | 'hopeful' | 'chaotic';

export interface MoodConfig {
  id: MoodType;
  label: string;
  tagline: string;
  palette: {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    bgStyle: string;
    cardBg: string;
    border: string;
    glow: string;
    text: string;
    textMuted: string;
    paperWash: string;
  };
  iconName: string;
}

export const MOODS: Record<MoodType, MoodConfig> = {
  cozy: {
    id: 'cozy',
    label: 'Cozy',
    tagline: 'Warm sepia ink, candlelight vignette, autumn hearth-glow, and crackling parchment.',
    palette: {
      name: 'Sepia & Candlelight',
      primary: '#a2562b',
      secondary: '#c88647',
      accent: '#fbf4e4',
      bgStyle:
        'radial-gradient(ellipse at 50% 10%, rgba(244, 219, 172, 0.6) 0%, #f3e7cf 65%, #e6d3af 100%)',
      cardBg: '#ead9b8',
      border: '#c2ab82',
      glow: '0 4px 18px rgba(162, 86, 43, 0.12)',
      text: '#2b2118',
      textMuted: '#5a4632',
      paperWash: 'rgba(200, 134, 71, 0.14)',
    },
    iconName: 'Flame',
  },
  eerie: {
    id: 'eerie',
    label: 'Eerie',
    tagline: 'Grey-green fog wash, cold dampened ink, lichen-draped stone, and quiet shadows.',
    palette: {
      name: 'Grey-Green Lichen',
      primary: '#43685e',
      secondary: '#2e4c44',
      accent: '#eaf3f0',
      bgStyle:
        'radial-gradient(ellipse at 50% 10%, rgba(210, 228, 222, 0.6) 0%, #ebdfca 65%, #d8ccb3 100%)',
      cardBg: '#e2dad0',
      border: '#aebdb7',
      glow: '0 4px 18px rgba(67, 104, 94, 0.12)',
      text: '#1e2b26',
      textMuted: '#4b5e56',
      paperWash: 'rgba(67, 104, 94, 0.12)',
    },
    iconName: 'Ghost',
  },
  epic: {
    id: 'epic',
    label: 'Epic',
    tagline: 'Crimson wax-seal ochre, antique bronze banner tones, and triumphant battle maps.',
    palette: {
      name: 'Banner Crimson & Bronze',
      primary: '#9c2f2f',
      secondary: '#915b28',
      accent: '#fbf3ed',
      bgStyle:
        'radial-gradient(ellipse at 50% 10%, rgba(245, 218, 212, 0.5) 0%, #f3e5ce 65%, #e4ceb1 100%)',
      cardBg: '#ebdcd2',
      border: '#cbb4a6',
      glow: '0 4px 18px rgba(156, 47, 47, 0.12)',
      text: '#2f1919',
      textMuted: '#634444',
      paperWash: 'rgba(156, 47, 47, 0.12)',
    },
    iconName: 'Crown',
  },
  melancholy: {
    id: 'melancholy',
    label: 'Melancholy',
    tagline: 'Sea blue-grey watercolor wash, fine rain streaks on paper, and quiet solitary shores.',
    palette: {
      name: 'Sea Blue-Grey Wash',
      primary: '#4f7a8a',
      secondary: '#36535e',
      accent: '#eef4f7',
      bgStyle:
        'radial-gradient(ellipse at 50% 10%, rgba(215, 231, 237, 0.6) 0%, #ebe0cd 65%, #d6cbb8 100%)',
      cardBg: '#dde5e8',
      border: '#b1c4cb',
      glow: '0 4px 18px rgba(79, 122, 138, 0.12)',
      text: '#1a282e',
      textMuted: '#445b63',
      paperWash: 'rgba(79, 122, 138, 0.14)',
    },
    iconName: 'CloudRain',
  },
  hopeful: {
    id: 'hopeful',
    label: 'Hopeful',
    tagline: 'Pale sage wash, dawn sunlight warmth, blooming wild clover, and clear skies.',
    palette: {
      name: 'Sage & Dawn Light',
      primary: '#4a6b4f',
      secondary: '#7a9e70',
      accent: '#f4f8f4',
      bgStyle:
        'radial-gradient(ellipse at 50% 10%, rgba(225, 240, 226, 0.6) 0%, #f2e9d4 65%, #dfd3ba 100%)',
      cardBg: '#e1eade',
      border: '#b8cbb5',
      glow: '0 4px 18px rgba(74, 107, 79, 0.12)',
      text: '#202b21',
      textMuted: '#4d5c4e',
      paperWash: 'rgba(74, 107, 79, 0.12)',
    },
    iconName: 'SunMedium',
  },
  chaotic: {
    id: 'chaotic',
    label: 'Chaotic',
    tagline: 'Scratchy dry-brush ink, copperplate smudges, torn paper edges, and primal turbulence.',
    palette: {
      name: 'Torn Ink & Coral Ochre',
      primary: '#b3473b',
      secondary: '#8a3328',
      accent: '#fbf0ed',
      bgStyle:
        'radial-gradient(ellipse at 50% 10%, rgba(247, 222, 217, 0.55) 0%, #f4e6d1 65%, #e4ceb2 100%)',
      cardBg: '#eddcd4',
      border: '#ceb7ac',
      glow: '0 4px 18px rgba(179, 71, 59, 0.12)',
      text: '#311d19',
      textMuted: '#66433c',
      paperWash: 'rgba(179, 71, 59, 0.14)',
    },
    iconName: 'Zap',
  },
};
