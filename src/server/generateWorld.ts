import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase applet configuration
let firebaseConfig: {
  projectId: string;
  firestoreDatabaseId: string;
  apiKey: string;
} | null = null;

try {
  const candidatePaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, '../../firebase-applet-config.json'),
    path.resolve(__dirname, '../firebase-applet-config.json'),
  ];
  for (const configPath of candidatePaths) {
    if (fs.existsSync(configPath)) {
      firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      break;
    }
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json in generateWorld:', e);
}

import { FIXED_20_THEMES, type FixedTheme } from '../constants/themes';
export { FIXED_20_THEMES, type FixedTheme };

// Color palette for converged source rings (no purple/violet)
export const SOURCE_COLORS = [
  '#d4af37', // Antique Gold
  '#2dd4bf', // Teal-Green
  '#e05353', // Crimson / Hot Coral
  '#60a5fa', // Steel Blue
  '#86efac', // Sage Green
  '#fb923c', // Warm Amber Bronze
];

// Zod schemas with strict size limits
export const PlaceSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(800),
  connects_to: z.array(z.string().min(1).max(64)).max(10),
  locked: z.boolean().optional(),
  sourceTag: z.string().max(100).optional(),
  sourceColor: z.string().max(30).optional(),
  isBridge: z.boolean().optional(),
  bridgeSources: z.array(z.string().max(100)).max(5).optional(),
});

export const CharacterSchema = z.object({
  id: z.string().max(64).optional(),
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  description: z.string().min(1).max(800),
  place_id: z.string().min(1).max(64).optional(),
  locked: z.boolean().optional(),
});

export const CanonContradictionSchema = z.object({
  id: z.string().min(1).max(64),
  itemsInvolved: z.array(z.string().min(1).max(120)).max(10),
  conflictDescription: z.string().min(1).max(800),
  suggestedFix: z.string().min(1).max(800),
});

export const CanonCheckResponseSchema = z.object({
  contradictions: z.array(CanonContradictionSchema),
});

export const GeneratedWorldLoreSchema = z.object({
  tone: z.string().min(1).max(300),
  themes: z
    .array(z.enum(FIXED_20_THEMES))
    .min(3, 'At least 3 themes required')
    .max(6, 'At most 6 themes allowed'),
  blurb: z
    .string()
    .min(1)
    .max(1200)
    .refine(
      (val) => {
        const wordCount = val.trim().split(/\s+/).filter(Boolean).length;
        return wordCount <= 60;
      },
      { message: 'Blurb must be at most 60 words' }
    ),
  places: z
    .array(PlaceSchema)
    .min(5, 'At least 5 places required')
    .max(16, 'At most 16 places allowed'),
  characters: z
    .array(CharacterSchema)
    .min(4, 'At least 4 characters required')
    .max(8, 'At most 8 characters allowed'),
  storyHooks: z.array(z.string().min(1).max(400)).max(5).optional(),
});

export type GeneratedWorldLore = z.infer<typeof GeneratedWorldLoreSchema>;

// Input size limit schemas for endpoints
export const GenerateWorldInputSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(['book', 'show', 'setting', 'blend']),
  note: z.string().max(2000).optional(),
  sources: z.array(z.string().max(100)).max(5).optional(),
  userId: z.string().min(1).max(128),
  worldId: z.string().max(128).optional(),
  lockedPlaces: z.array(PlaceSchema).max(20).optional(),
  lockedCharacters: z.array(CharacterSchema).max(15).optional(),
});

export const RegeneratePlaceInputSchema = z.object({
  worldTitle: z.string().min(1).max(200),
  tone: z.string().max(300).optional().default(''),
  themes: z.array(z.string().max(50)).max(10).optional().default([]),
  placeToReplace: PlaceSchema,
  otherPlaces: z.array(PlaceSchema).max(20).optional().default([]),
  characters: z.array(CharacterSchema).max(15).optional().default([]),
});

export const CheckCanonInputSchema = z.object({
  worldTitle: z.string().min(1).max(200),
  tone: z.string().max(300).optional(),
  themes: z.array(z.string().max(50)).max(10).optional(),
  places: z.array(PlaceSchema).min(1).max(20),
  characters: z.array(CharacterSchema).max(15).optional().default([]),
  notes: z.string().max(2000).optional(),
});

export interface GenerateWorldInput {
  title: string;
  type: 'book' | 'show' | 'setting' | 'blend';
  note?: string;
  sources?: string[];
  userId: string;
  worldId?: string;
  lockedPlaces?: z.infer<typeof PlaceSchema>[];
  lockedCharacters?: z.infer<typeof CharacterSchema>[];
}

// In-memory server cache & daily rate limiter
interface CacheEntry {
  data: GeneratedWorldLore;
  createdAt: string;
  sourceNormalizedTitle: string;
}

const serverMemoryCache = new Map<string, CacheEntry>();

// In-memory fallback daily generation tracking: Map<userId, { date: string, count: number }>
const dailyGenerationsMap = new Map<string, { date: string; count: number }>();

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);
}

// Cache key explicitly incorporates title, type, sources, and the note
export function buildGenerationCacheKey(
  title: string,
  type: string,
  note?: string,
  sources?: string[]
): string {
  const normTitle = normalizeTitle(title);
  const normNote = note && note.trim() ? normalizeTitle(note.trim()).slice(0, 80) : 'no_note';
  const normSources = Array.isArray(sources) && sources.length > 0
    ? sources.map(normalizeTitle).filter(Boolean).sort().join('_')
    : 'single';
  return `${type}_${normSources}_${normTitle}_note_${normNote}`.slice(0, 220);
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

export interface UsageRecord {
  worldCount: number;
  generationCount: number;
  dailyGenerationsCount: number;
  lastGenerationDate: string;
}

// Read usage document from Firestore usage/{userId}
export async function getFirestoreUsage(
  userId: string,
  idToken?: string
): Promise<UsageRecord | null> {
  if (!firebaseConfig || !idToken) return null;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/usage/${userId}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (res.status === 404) {
      return {
        worldCount: 0,
        generationCount: 0,
        dailyGenerationsCount: 0,
        lastGenerationDate: '',
      };
    }
    if (!res.ok) return null;
    const doc = await res.json();
    const fields = doc.fields || {};
    return {
      worldCount: fields.worldCount?.integerValue ? parseInt(fields.worldCount.integerValue, 10) : 0,
      generationCount: fields.generationCount?.integerValue ? parseInt(fields.generationCount.integerValue, 10) : 0,
      dailyGenerationsCount: fields.dailyGenerationsCount?.integerValue ? parseInt(fields.dailyGenerationsCount.integerValue, 10) : 0,
      lastGenerationDate: fields.lastGenerationDate?.stringValue || '',
    };
  } catch (err) {
    console.warn('Failed to read Firestore usage:', err);
    return null;
  }
}

// Update usage document in Firestore usage/{userId}
export async function writeFirestoreUsage(
  userId: string,
  idToken: string,
  fields: UsageRecord
): Promise<boolean> {
  if (!firebaseConfig) return false;
  try {
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/${firebaseConfig.firestoreDatabaseId}/documents/usage/${userId}`;
    const now = new Date().toISOString();
    const body = {
      fields: {
        userId: { stringValue: userId },
        worldCount: { integerValue: String(fields.worldCount) },
        generationCount: { integerValue: String(fields.generationCount) },
        dailyGenerationsCount: { integerValue: String(fields.dailyGenerationsCount) },
        lastGenerationDate: { stringValue: fields.lastGenerationDate },
        lastActive: { stringValue: now },
        updatedAt: { stringValue: now },
      },
    };
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch (err) {
    console.warn('Failed to write Firestore usage:', err);
    return false;
  }
}

// Check rate limit status (stored in Firestore usage/{userId} so it survives server restarts)
export async function checkRateLimit(
  userId: string,
  idToken?: string
): Promise<{ allowed: boolean; remaining: number }> {
  const today = getTodayString();
  if (idToken) {
    const usage = await getFirestoreUsage(userId, idToken);
    if (usage) {
      const isToday = usage.lastGenerationDate === today;
      const count = isToday ? usage.dailyGenerationsCount : 0;
      const remaining = Math.max(0, 10 - count);
      return { allowed: count < 10, remaining };
    }
  }

  // Memory fallback if Firestore is unreachable or token omitted
  const userRecord = dailyGenerationsMap.get(userId);
  if (!userRecord || userRecord.date !== today) {
    return { allowed: true, remaining: 10 };
  }

  const remaining = Math.max(0, 10 - userRecord.count);
  return { allowed: userRecord.count < 10, remaining };
}

// Increment rate limit usage across Firestore usage/{userId}
export async function incrementRateLimit(
  userId: string,
  idToken?: string
): Promise<number> {
  const today = getTodayString();
  let dailyCount = 1;
  let worldCount = 0;
  let generationCount = 1;

  if (idToken) {
    const usage = await getFirestoreUsage(userId, idToken);
    if (usage) {
      worldCount = usage.worldCount;
      generationCount = usage.generationCount + 1;
      const isToday = usage.lastGenerationDate === today;
      dailyCount = isToday ? usage.dailyGenerationsCount + 1 : 1;
    }
    await writeFirestoreUsage(userId, idToken, {
      worldCount,
      generationCount,
      dailyGenerationsCount: dailyCount,
      lastGenerationDate: today,
    });
  }

  dailyGenerationsMap.set(userId, { date: today, count: dailyCount });
  return Math.max(0, 10 - dailyCount);
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

/**
 * Normalization helper before strict validation
 */
function normalizeParsedLore(data: any): any {
  if (!data || typeof data !== 'object') return data;

  // 1. Sanitize blurb to <= 60 words
  if (typeof data.blurb === 'string') {
    const words = data.blurb.trim().split(/\s+/).filter(Boolean);
    if (words.length > 60) {
      data.blurb = words.slice(0, 58).join(' ') + '...';
    }
  }

  // 2. Filter & guarantee 3-6 themes from FIXED_20_THEMES
  if (Array.isArray(data.themes)) {
    const validThemes = data.themes.filter((t: any) =>
      FIXED_20_THEMES.includes(t as FixedTheme)
    );
    if (validThemes.length >= 3) {
      data.themes = validThemes.slice(0, 6);
    } else {
      const set = new Set<FixedTheme>(validThemes);
      for (const ft of FIXED_20_THEMES) {
        set.add(ft);
        if (set.size >= 4) break;
      }
      data.themes = Array.from(set);
    }
  }

  // 3. Ensure place IDs and characters linked to place_id
  if (Array.isArray(data.places) && data.places.length > 0) {
    const placeIds = data.places.map((p: any) => String(p.id));
    if (Array.isArray(data.characters)) {
      data.characters = data.characters.map((char: any, idx: number) => {
        const currentPlaceId = char.place_id ? String(char.place_id) : '';
        const validPlaceId = placeIds.includes(currentPlaceId)
          ? currentPlaceId
          : placeIds[idx % placeIds.length];
        return {
          ...char,
          place_id: validPlaceId,
        };
      });
    }
  }

  // 4. Ensure 5 story hooks exist
  if (!Array.isArray(data.storyHooks) || data.storyHooks.length < 3) {
    data.storyHooks = [
      'An ancient boundary gate opens unexpectedly between the outer provinces.',
      'A missing relic is rumored to be buried beneath the deepest province.',
      'Two opposing factions dispatch envoys to negotiate a tense border treaty.',
      'A quiet celestial omen foretells the awakening of a long-dormant presence.',
      'A wandering cartographer arrives carrying a map showing provinces that do not yet exist.',
    ];
  } else if (data.storyHooks.length > 5) {
    data.storyHooks = data.storyHooks.slice(0, 5);
  }

  return data;
}

/**
 * Main generateWorld server implementation
 * Repositioned for writers & tabletop game masters:
 * - Supports setting descriptions, single titles, and blending 2-3 titles or genres
 * - Generates 2-3 original bridge places per pair with color rings and source tags
 * - Preserves locked places/characters if provided
 */
export async function generateWorld(
  input: GenerateWorldInput,
  idToken?: string
): Promise<{
  data: GeneratedWorldLore;
  cached: boolean;
  remainingGenerations: number;
  normalizedTitle: string;
}> {
  const title = input.title.trim().slice(0, 200);
  if (!title) {
    throw new Error('Title or setting prompt is required.');
  }

  const type = input.type || 'setting';
  const note = input.note ? input.note.trim().slice(0, 2000) : '';
  const sources = Array.isArray(input.sources)
    ? input.sources.map((s) => s.trim().slice(0, 100)).filter(Boolean).slice(0, 3)
    : [];
  const userId = input.userId?.trim();

  if (!userId) {
    throw new Error('User authentication is required to generate world lore.');
  }

  const isBlending = sources.length >= 2 || type === 'blend';
  const cacheKey = buildGenerationCacheKey(title, type, note, sources);

  // Check cache only if no locked items exist
  const hasLockedItems =
    (input.lockedPlaces && input.lockedPlaces.length > 0) ||
    (input.lockedCharacters && input.lockedCharacters.length > 0);

  if (!hasLockedItems) {
    const memoryHit = serverMemoryCache.get(cacheKey);
    if (memoryHit) {
      const rate = await checkRateLimit(userId, idToken);
      return {
        data: memoryHit.data,
        cached: true,
        remainingGenerations: rate.remaining,
        normalizedTitle: cacheKey,
      };
    }
  }

  // Rate limiting check via Firestore usage/{userId}
  const rateLimit = await checkRateLimit(userId, idToken);
  if (!rateLimit.allowed) {
    const error: any = new Error(
      'Daily generation limit reached. You can generate up to 10 worlds per day on the free tier.'
    );
    error.statusCode = 429;
    throw error;
  }

  const ai = getGeminiClient();
  const themesPromptList = FIXED_20_THEMES.map((t) => `"${t}"`).join(', ');

  const systemInstruction = `You are an elite worldbuilding director, cartographer, and narrative architect for novelists, screenwriters, and tabletop RPG Game Masters (GMs).
Your purpose is to synthesize completely ORIGINAL, evocative fictional settings, realms, and lore.

CRITICAL LAWS:
1. NEVER reproduce copyrighted dialogue, verbatim text, or trademarked proper nouns from existing franchises. All lore, place names, and figures must be fresh, original creations inspired by the specified aesthetics, themes, and tones.
2. Return ONLY a single raw JSON object matching the requested schema. No markdown formatting, backticks, or conversational preamble.
3. "tone": A 1-2 sentence atmospheric description of the world's emotional and aesthetic pulse (under 300 characters).
4. "themes": Choose between 3 and 6 themes STRICTLY from this exact list of 20 allowed themes:
   [${themesPromptList}]
5. "blurb": An evocative summary of this world's genesis, conflict, or daily reality. MUST BE 60 WORDS OR FEWER.
6. "places": An array of interconnected locations:
   - "id": A unique alphanumeric snake_case ID (e.g. "sanctuary_of_salt", "iron_bastion")
   - "name": Evocative, original place name
   - "description": 2-3 sentences explaining its topography, ecology, sensory atmosphere, and secrets for a GM or writer
   - "connects_to": Array of other place IDs from this list it connects to, borders, or trades with
   - "sourceTag": If blending sources/genres, label which source/genre inspired this place, or "Convergence Bridge" if it connects two disparate sources.
   - "isBridge": Boolean. Set to true for bridge places that connect two disparate blended sources.
   - "bridgeSources": If isBridge is true, an array of the two source names being bridged.
7. "characters": 4 to 6 archetypal figures, faction leaders, or lorekeepers:
   - "name": Original name
   - "role": Title or station in the realm
   - "description": 2-3 sentences detailing their agenda, relic, secret flaw, or moral dilemma
   - "place_id": The exact "id" of the place where they are stationed or linked
8. "storyHooks": Exactly 5 compelling campaign story hooks, inciting incidents, or mystery seeds ready for a GM or writer.`;

  let userPrompt = '';
  if (isBlending) {
    const sourceList = sources.length > 0 ? sources : ['Source Alpha', 'Source Beta'];
    userPrompt = `BLENDED WORLDBUILDING (Convergence mode):
Sources / Genres being blended: ${sourceList.map((s) => `"${s}"`).join(' + ')}
World Title / Concept: "${title}"
${note ? `Specific Creative Vision: "${note}"` : 'Blend their themes, architectural styles, technologies, and atmospheres into a unified fictional tapestry.'}

CONVERGENCE REQUIREMENTS:
- Provide 2-3 places directly rooted in each source (${sourceList.join(', ')}).
- CRITICAL: Generate 2 to 3 original "bridge" places for each pair of sources that synthesize their clashing aesthetics (e.g. where eldritch rituals power neon circuitry, or ancient desert monks guard forgotten star-charts). Mark these places with "isBridge": true, "sourceTag": "Convergence Bridge", and list the "bridgeSources".
- Connect bridge places with routes to places in each respective source so the realm forms an interconnected web.
- Provide 4-6 characters and 5 gripping story hooks highlighting the friction and wonder of this merged realm.`;
  } else {
    userPrompt = `WORLDBUILDING DIRECTIVE:
Setting Title / Prompt: "${title}"
Medium / Style: ${type}
${note ? `Creator's Vision & Setting Notes: "${note}"` : 'Synthesize a deep, immersive setting with rich local folklore and evocative geography.'}

Create 5-8 interconnected places, 4-6 archetypal figures, and 5 campaign story hooks.`;
  }

  // Include locked items instruction if any exist
  if (input.lockedPlaces && input.lockedPlaces.length > 0) {
    userPrompt += `\n\nPRESERVED PLACES (Keep these intact with same ID and name, weave all other places around them):\n${JSON.stringify(input.lockedPlaces)}`;
  }
  if (input.lockedCharacters && input.lockedCharacters.length > 0) {
    userPrompt += `\n\nPRESERVED CHARACTERS (Keep these intact, weave others around them):\n${JSON.stringify(input.lockedCharacters)}`;
  }

  async function callGemini(correction?: string): Promise<string> {
    const fullPrompt = correction ? `${userPrompt}\n\nCORRECTION: ${correction}` : userPrompt;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });
    return response.text?.trim() || '';
  }

  let rawJson = '';
  let parsedData: any = null;
  let validationResult: any = null;

  try {
    rawJson = await callGemini();
    parsedData = JSON.parse(rawJson);
    parsedData = normalizeParsedLore(parsedData);
    validationResult = GeneratedWorldLoreSchema.safeParse(parsedData);
  } catch (err: any) {
    console.warn('Initial parse error:', err?.message);
    validationResult = { success: false, error: err };
  }

  // Retry once if invalid
  if (!validationResult.success) {
    console.log('Gemini output invalid. Retrying once with corrective prompt...');
    const errText = validationResult.error?.message || 'Schema validation failure';
    try {
      rawJson = await callGemini(
        `Previous response failed: ${errText}. Return strictly valid JSON with 3-6 themes, <=60 word blurb, 5-16 places with id, name, description, connects_to, and 4-6 characters with name, role, description, place_id.`
      );
      parsedData = JSON.parse(rawJson);
      parsedData = normalizeParsedLore(parsedData);
      validationResult = GeneratedWorldLoreSchema.safeParse(parsedData);
    } catch (retryErr: any) {
      throw new Error(`Failed to generate world lore: ${retryErr?.message || 'Invalid JSON format'}`);
    }
  }

  if (!validationResult.success) {
    throw new Error(
      `World validation error: ${validationResult.error?.errors?.[0]?.message || 'Schema mismatch'}`
    );
  }

  const generatedLore: GeneratedWorldLore = validationResult.data;

  // Assign distinct source colors to places for convergence visual rings
  if (isBlending && generatedLore.places) {
    const sourceMap = new Map<string, string>();
    sources.forEach((src, idx) => {
      sourceMap.set(src.toLowerCase(), SOURCE_COLORS[idx % SOURCE_COLORS.length]);
    });

    generatedLore.places = generatedLore.places.map((place) => {
      if (place.isBridge) {
        return {
          ...place,
          sourceTag: place.sourceTag || 'Convergence Bridge',
          sourceColor: '#d4af37', // Antique Gold ring for Bridge places
        };
      }
      const tag = place.sourceTag?.toLowerCase() || '';
      const matchedColor = sourceMap.get(tag) || SOURCE_COLORS[0];
      return {
        ...place,
        sourceColor: place.sourceColor || matchedColor,
      };
    });
  }

  // Increment rate limit in Firestore usage/{userId}
  const remainingGenerations = await incrementRateLimit(userId, idToken);

  // Cache in memory indexed by cacheKey (which includes note)
  serverMemoryCache.set(cacheKey, {
    data: generatedLore,
    createdAt: new Date().toISOString(),
    sourceNormalizedTitle: cacheKey,
  });

  return {
    data: generatedLore,
    cached: false,
    remainingGenerations,
    normalizedTitle: cacheKey,
  };
}

/**
 * Regenerate a single unlocked place in an existing world
 */
export async function regenerateSinglePlace(
  worldContext: {
    worldTitle: string;
    tone: string;
    themes: string[];
    placeToReplace: z.infer<typeof PlaceSchema>;
    otherPlaces: z.infer<typeof PlaceSchema>[];
    characters: z.infer<typeof CharacterSchema>[];
    userId: string;
  },
  idToken?: string
): Promise<z.infer<typeof PlaceSchema>> {
  // Validate input size limits
  const validatedInput = RegeneratePlaceInputSchema.parse({
    worldTitle: worldContext.worldTitle,
    tone: worldContext.tone,
    themes: worldContext.themes,
    placeToReplace: worldContext.placeToReplace,
    otherPlaces: worldContext.otherPlaces,
    characters: worldContext.characters,
  });

  const rateLimit = await checkRateLimit(worldContext.userId, idToken);
  if (!rateLimit.allowed) {
    const err: any = new Error(
      'Daily generation limit reached. You can generate up to 10 worlds per day on the free tier.'
    );
    err.statusCode = 429;
    throw err;
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are a master worldbuilder and cartographer for tabletop GMs and writers.
Your task is to generate ONE new, original fictional place that seamlessly replaces a specific location in an existing world.
Do NOT reproduce copyrighted names or lore.
Return ONLY a single raw JSON object matching:
{
  "id": string (preserve the same id or use a clean alphanumeric snake_case ID),
  "name": string (evocative, original place name),
  "description": string (2-3 sentences on topography, ecology, sensory atmosphere, and secrets),
  "connects_to": array of strings (must connect to 1-3 places from the other places in the realm)
}`;

  const userPrompt = `World: "${validatedInput.worldTitle}"
Tone: "${validatedInput.tone}"
Themes: ${validatedInput.themes.join(', ')}
Location to replace: "${validatedInput.placeToReplace.name}" (#${validatedInput.placeToReplace.id})
Existing other places in realm:
${validatedInput.otherPlaces.map((p) => `- ${p.name} (id: ${p.id}): ${p.description.slice(0, 100)}...`).join('\n')}

Generate a compelling, original replacement place for "${validatedInput.placeToReplace.id}" that weaves seamlessly into this world.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: userPrompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.8,
    },
  });

  const rawJson = response.text?.trim() || '';
  const parsed = JSON.parse(rawJson);

  // Validate with PlaceSchema
  const validated = PlaceSchema.parse({
    id: validatedInput.placeToReplace.id,
    name: parsed.name || 'Unnamed Province',
    description: parsed.description || 'An enigmatic province on the frontier of the realm.',
    connects_to:
      Array.isArray(parsed.connects_to) && parsed.connects_to.length > 0
        ? parsed.connects_to.filter((id: string) =>
            validatedInput.otherPlaces.some((op) => op.id === id)
          )
        : validatedInput.placeToReplace.connects_to,
    locked: false,
    sourceTag: validatedInput.placeToReplace.sourceTag,
    sourceColor: validatedInput.placeToReplace.sourceColor,
    isBridge: validatedInput.placeToReplace.isBridge,
  });

  // Count against daily rate limit
  await incrementRateLimit(worldContext.userId, idToken);

  return validated;
}

/**
 * Continuity check ("Check canon")
 * Analyzes world places, characters, and user edits for contradictions
 * Returns structured JSON with itemsInvolved, conflictDescription, and suggestedFix
 */
export async function checkCanonContradictions(
  context: {
    worldTitle: string;
    tone?: string;
    themes?: string[];
    places: z.infer<typeof PlaceSchema>[];
    characters: z.infer<typeof CharacterSchema>[];
    notes?: string;
    userId: string;
  },
  idToken?: string
): Promise<{ contradictions: z.infer<typeof CanonContradictionSchema>[] }> {
  // Validate input size limits
  const validatedContext = CheckCanonInputSchema.parse({
    worldTitle: context.worldTitle,
    tone: context.tone,
    themes: context.themes,
    places: context.places,
    characters: context.characters,
    notes: context.notes,
  });

  const rateLimit = await checkRateLimit(context.userId, idToken);
  if (!rateLimit.allowed) {
    const err: any = new Error(
      'Daily generation limit reached. You can generate up to 10 worlds per day on the free tier.'
    );
    err.statusCode = 429;
    throw err;
  }

  const ai = getGeminiClient();

  const systemInstruction = `You are a legendary tabletop Continuity Director, Editor, and Lore Arbiter.
Your task is to scrutinize a worldbuilder's fictional universe for internal narrative contradictions, logistical impossibilities, thematic clashes, broken connections, or character paradoxes.

Return ONLY a single raw JSON object matching this schema:
{
  "contradictions": [
    {
      "id": "conflict_1",
      "itemsInvolved": ["Place or Character Name A", "Place or Character Name B"],
      "conflictDescription": "A concise, 1-2 sentence explanation of the logical or thematic friction.",
      "suggestedFix": "A clean, evocative editorial fix that the writer or GM can apply immediately to resolve the contradiction."
    }
  ]
}

If the world is completely consistent or only has very minor subjective nuances, you may return between 1 and 3 subtle, fascinating continuity tensions with constructive fixes, or an empty array if flawless. Never exceed 4 contradictions.`;

  const worldSummary = {
    title: validatedContext.worldTitle,
    tone: validatedContext.tone || '',
    themes: validatedContext.themes || [],
    places: validatedContext.places.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      connects_to: p.connects_to,
      source: p.sourceTag,
    })),
    characters: validatedContext.characters.map((c) => ({
      name: c.name,
      role: c.role,
      description: c.description,
      stationed_at_place_id: c.place_id,
    })),
    userNotes: validatedContext.notes || '',
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: `Analyze this fictional world for canon continuity and contradictions:\n${JSON.stringify(worldSummary, null, 2)}`,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.6,
    },
  });

  const rawJson = response.text?.trim() || '{"contradictions":[]}';
  let parsed: any;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    parsed = { contradictions: [] };
  }

  const validated = CanonCheckResponseSchema.safeParse(parsed);
  if (!validated.success) {
    console.warn('Canon check schema parse fallback:', validated.error);
    return { contradictions: [] };
  }

  // Count against daily rate limit
  await incrementRateLimit(context.userId, idToken);

  return validated.data;
}
