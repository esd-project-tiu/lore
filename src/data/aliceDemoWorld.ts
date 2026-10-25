import { World, Place, Character } from '../types';

export const ALICE_PLACES: Place[] = [
  {
    id: 'warren_descent',
    name: 'The Vertical Scriptorium of the Warren',
    description:
      'A bottomless cylindrical shaft lined with mahogany bookcases, hanging maps, and pendulum clocks that tick in reverse as wanderers float gently downward.',
    connects_to: ['diminishing_vestibule', 'mycelial_clearing'],
  },
  {
    id: 'diminishing_vestibule',
    name: 'The Hall of Diminishing Doors',
    description:
      'A low-ceilinged marble hall illuminated by suspended crystals, where golden keys unlock microscopic portals concealed behind embroidered crimson curtains.',
    connects_to: ['warren_descent', 'tea_colonnade', 'painted_labyrinth'],
  },
  {
    id: 'mycelial_clearing',
    name: 'The Blue Mushroom Knoll',
    description:
      'A three-fathom-wide indigo fungi shelf shrouded in dense aromatic vapor rings that alter the physical mass and scale of anyone who eats from its rim.',
    connects_to: ['warren_descent', 'painted_labyrinth', 'court_of_verdicts'],
  },
  {
    id: 'tea_colonnade',
    name: 'The Colonnade of Perpetual Six',
    description:
      'An unending tablecloth under weeping cedar boughs where tea is eternally poured because time has stopped in protest at the stroke of six.',
    connects_to: ['diminishing_vestibule', 'painted_labyrinth', 'court_of_verdicts'],
  },
  {
    id: 'painted_labyrinth',
    name: 'The Labyrinth of Painted Briars',
    description:
      'Concentric geometric rose hedges where deck-hand artisans frantically brush scarlet lacquer onto white petals under the sovereign penalty of decapitation.',
    connects_to: ['mycelial_clearing', 'tea_colonnade', 'court_of_verdicts'],
  },
  {
    id: 'court_of_verdicts',
    name: 'The Monolithic Court of Verdicts',
    description:
      'A towering amphitheater of animated card guards where irreversible sentences are handed down prior to trial in accordance with inverted dream-jurisprudence.',
    connects_to: ['mycelial_clearing', 'tea_colonnade', 'painted_labyrinth'],
  },
];

export const ALICE_CHARACTERS: Character[] = [
  {
    name: 'The White Herald',
    role: 'Clockwork Chamberlain',
    description:
      'Steps backward while uncoiling an engraved pocket-watch parchment, announcing contradictory sovereign commands across the vertical shaft.',
    place_id: 'warren_descent',
  },
  {
    name: 'The Hookah Metaphysician',
    role: 'Mycelial Oracle',
    description:
      'Exhales formal syllogisms in glowing cerulean vapor rings, demanding to know the true shifting identity of travelers who enter the knoll.',
    place_id: 'mycelial_clearing',
  },
  {
    name: 'The March Milliner',
    role: 'Chronomancer of the Sixth Hour',
    description:
      'Trapped in an unyielding tea hour, endlessly coating watch balances with salted butter and proposing riddles whose solutions do not exist.',
    place_id: 'tea_colonnade',
  },
  {
    name: 'The Grinning Sentry',
    role: 'Apparition of the Crossways',
    description:
      'Fades gently into cedar fog until only a crescent smile remains, directing wanderers along paths that lead only to where they did not intend to go.',
    place_id: 'painted_labyrinth',
  },
  {
    name: 'The Sovereign of Crimson',
    role: 'Arbiter of Sentence-First',
    description:
      'Presides over flamingo tournaments and card battalions, maintaining imperial authority through instantaneous verdicts before evidence is heard.',
    place_id: 'court_of_verdicts',
  },
];

export const ALICE_DEMO_WORLD: World = {
  id: 'alice-in-wonderland-demo',
  userId: 'public-demo',
  title: "Alice's Adventures in Wonderland",
  type: 'book',
  creator: 'Lewis Carroll',
  status: 'ready',
  tone: 'Mathematical, playfully absurd, and steeped in dream-logic bureaucracy and Victorian surrealism.',
  themes: [
    'Divine Absurdity',
    'Fractured Realities',
    'Labyrinthine Architecture',
    'Bureaucratic Horror',
  ],
  blurb:
    "A subterranean labyrinth of warped spatial geometry and non-linear tea ceremonies where time stands locked at six o'clock. Scribes and monarchical courts rule through arbitrary mathematical paradoxes, challenging wanderers to unravel inverted linguistic laws before fading into the grin of vanishing sentinels.",
  places: ALICE_PLACES,
  characters: ALICE_CHARACTERS,
  note: 'A sacred classic of mathematical wit, nonsensical legalisms, and upside-down worlds that question the very nature of adult rationality.',
  genre: 'Victorian Dream-Logic & Absurdism',
  createdAt: '1865-11-26T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
};
