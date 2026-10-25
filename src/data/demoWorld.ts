import { DemoWorld, World, Place, Character } from '../types';

export const DEMO_PLACES: Place[] = [
  {
    id: 'scriptorium',
    name: 'The Drowned Scriptorium',
    description:
      'Twelve thousand marble niches submerged under brackish surf. Scribes dive with copper bells to salvage tablets etched before the waters rose.',
    connects_to: ['coriolis_spire', 'third_knot'],
  },
  {
    id: 'coriolis_spire',
    name: 'The Spire of the Coriolis Watch',
    description:
      'Carved from a single monolith of fulgurite glass, housing blind astrolabe keepers who track the migration of crystalline sand leviathans.',
    connects_to: ['scriptorium', 'salt_colonnade', 'sunken_atrium'],
  },
  {
    id: 'third_knot',
    name: 'The Winding Crypt of the Third Knot',
    description:
      'A fissure where echoes from thirty-three years into the future reverberate off wet limestone cavern walls like chapel bells.',
    connects_to: ['scriptorium', 'sunken_atrium', 'whispering_basin'],
  },
  {
    id: 'salt_colonnade',
    name: 'The Great Salt Colonnade',
    description:
      'A mile-long hall of monumental Corinthian pillars encrusted with dried brine, linking the flooded vestibules with the high dunes.',
    connects_to: ['coriolis_spire', 'whispering_basin'],
  },
  {
    id: 'sunken_atrium',
    name: 'The Cistern of the Ninth Moon',
    description:
      'A deep sunken amphitheater where celestial tides gather every full lunar cycle, illuminating glowing phosphorescent moss.',
    connects_to: ['coriolis_spire', 'third_knot', 'whispering_basin'],
  },
  {
    id: 'whispering_basin',
    name: 'The Whispering Dune Basin',
    description:
      'A vast amphitheater of singing crimson sand where the desert wind speaks in forgotten dialects of lost dynasties.',
    connects_to: ['third_knot', 'salt_colonnade', 'sunken_atrium'],
  },
];

export const DEMO_CHARACTERS: Character[] = [
  {
    name: 'Brother Cassian of the Bell',
    role: 'Master Diving Scribe',
    description:
      'Descends daily into the submerged library with an oilskin slate, retrieving prophecies recorded in drowned cuneiform.',
  },
  {
    name: 'Talia al-Khatib',
    role: 'Coriolis Astrolabe Keeper',
    description:
      'A blind navigator who charts subterranean dust-currents by the resonant harmonic hum of fulgurite glass.',
  },
  {
    name: 'The Archivist of Echoes',
    role: 'Temporal Warden of the Knot',
    description:
      'Monitors acoustic reverberations in the deep fissures, cataloging words that have not yet been spoken.',
  },
  {
    name: 'Seraphim the Salt-Weaver',
    role: 'Guild Patriarch',
    description:
      'Binds fragile desert dunes into solid causeways using crystallizing brine solutions and ancient geometry.',
  },
  {
    name: 'Kaelen the Tide-Strider',
    role: 'Wanderer of the Ninth Moon',
    description:
      'Walks the perimeter of the submerged colonnades when the tides recede, bartering bottled air for preserved relics.',
  },
];

export const DEMO_WORLD: DemoWorld = {
  title: 'The Tides of Piranesi & the Dune Sea',
  subtitle: 'A convergent world born of endless marble halls, spice-storms, and forgotten languages',
  sources: [
    { title: 'Piranesi', type: 'book', year: '2020', author: 'Susanna Clarke' },
    { title: 'Dune', type: 'book', year: '1965', author: 'Frank Herbert' },
    { title: 'Dark', type: 'show', year: '2017', author: 'Baran bo Odar' },
  ],
  description:
    'A vast sunken realm where labyrinthine classical vestibules collide with endless whispering dunes. Celestial tides rush through flooded limestone corridors every ninth moon, revealing ancient mechanical navigators who speak solely in temporal paradoxes.',
  locations: [
    {
      name: 'The Drowned Scriptorium',
      region: 'The Low Terraces',
      lore: 'Twelve thousand marble niches submerged under brackish surf. Scribes dive with copper bells to salvage tablets etched before the waters rose.',
    },
    {
      name: 'The Spire of the Coriolis Watch',
      region: 'The High Dunes',
      lore: 'Carved from a single monolith of fulgurite glass, housing blind astrolabe keepers who track the migration of crystalline leviathans.',
    },
    {
      name: 'The Winding Crypt of the Third Knot',
      region: 'The Sub-Levels',
      lore: 'A fissure where echoes from thirty-three years into the future reverberate off wet cavern walls like chapel bells.',
    },
  ],
  factions: [
    {
      name: 'The Guild of Salt-Cartographers',
      crest: 'A compass rose entwined with barnacles',
      philosophy: 'No tide rises without a name; no corridor exists without a memory.',
    },
    {
      name: 'The Dune Weavers',
      crest: 'A bronze needle through a stylized sand dune',
      philosophy: 'Silence is the only medium durable enough to contain the absolute.',
    },
  ],
  artifacts: [
    {
      name: 'The Glass Astrolabe of the Ninth Chamber',
      origin: 'Forged from the lightning-struck sands of the first flooding',
      effect: 'Projects a three-dimensional map of halls that only manifest under a new moon.',
    },
    {
      name: 'The Sieve of Lost Voices',
      origin: 'Salvaged from the deep cisterns of the sunken atrium',
      effect: 'Filters desert wind to whisper forgotten passages from books that were never published.',
    },
  ],
};

export function getDemoAsFullWorld(): World {
  return {
    id: 'demo-specimen-01',
    userId: 'demo-system',
    title: DEMO_WORLD.title,
    type: 'book',
    status: 'ready',
    tone: 'A contemplative maritime labyrinth scourged by whispering spice-winds and submerged celestial colonnades.',
    themes: [
      'Labyrinthine Architecture',
      'Man vs. Ecology',
      'Temporal Paradox',
      'Forbidden Knowledge',
    ],
    blurb:
      'In the drowned marble vestibules of the outer sea, ancient cartographers chart tides that sweep through classical halls every ninth moon. Nomadic navigators read temporal paradoxes etched in fulgurite spires, preserving forgotten passages of a realm poised between memory and oblivion.',
    places: DEMO_PLACES,
    characters: DEMO_CHARACTERS,
    note: 'Inspired by the flooded marble vestibules of Piranesi, the arid grandeur of Arrakis, and the recursive time-loops of Dark.',
    genre: 'Speculative Convergence',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
