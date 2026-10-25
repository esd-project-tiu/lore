import { World, CatalogItem, RankedRecommendation, MoodType } from '../types';
import { CATALOG_ITEMS, buildThemeVector } from '../data/catalogData';
import { FIXED_20_THEMES } from '../constants/themes';

// Cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;
  return dotProduct / denominator;
}

// Compute the user's averaged theme vector across all their saved worlds
export function computeUserAveragedVector(userWorlds: World[]): {
  vector: number[];
  userThemes: Set<string>;
  worldCount: number;
} {
  const worldsWithThemes = userWorlds.filter(
    (w) => w.themes && Array.isArray(w.themes) && w.themes.length > 0
  );

  const userThemes = new Set<string>();

  // If the user has not generated themes yet, supply default convergence themes
  if (worldsWithThemes.length === 0) {
    const defaultThemes = [
      'Labyrinthine Architecture',
      'Man vs. Ecology',
      'Temporal Paradox',
      'Forbidden Knowledge',
    ];
    defaultThemes.forEach((t) => userThemes.add(t));
    return {
      vector: buildThemeVector(defaultThemes),
      userThemes,
      worldCount: 0,
    };
  }

  // Accumulate theme occurrences
  const rawSum = new Array(20).fill(0);

  worldsWithThemes.forEach((world) => {
    world.themes?.forEach((t) => {
      userThemes.add(t);
      const idx = FIXED_20_THEMES.indexOf(t as any);
      if (idx !== -1) {
        rawSum[idx] += 1.0;
      }
    });
  });

  // Average
  const count = worldsWithThemes.length;
  const averaged = rawSum.map((v) => v / count);

  // Normalize to unit vector
  const magnitude = Math.sqrt(averaged.reduce((sum, val) => sum + val * val, 0));
  const vector =
    magnitude > 0
      ? averaged.map((val) => Number((val / magnitude).toFixed(4)))
      : buildThemeVector(Array.from(userThemes));

  return { vector, userThemes, worldCount: count };
}

// Generate the "Why this fits" line built from shared themes
export function generateWhyThisFits(
  sharedThemes: string[],
  matchingMood: boolean,
  mood: MoodType
): string {
  const moodCapitalized = mood.charAt(0).toUpperCase() + mood.slice(1);

  if (sharedThemes.length >= 3) {
    return `Echoes your affinity for ${sharedThemes[0]}, ${sharedThemes[1]}, and ${sharedThemes[2]}${
      matchingMood ? ` in a resonant ${moodCapitalized} atmosphere` : ''
    }.`;
  }

  if (sharedThemes.length === 2) {
    return `Shares ${sharedThemes[0]} and ${sharedThemes[1]} from your personal lore tapestry${
      matchingMood ? `, elevated by a matching ${moodCapitalized} mood` : ''
    }.`;
  }

  if (sharedThemes.length === 1) {
    return `Directly mirrors your focus on ${sharedThemes[0]}${
      matchingMood ? `, enveloped in a harmonious ${moodCapitalized} disposition` : ''
    }.`;
  }

  return `Complements your mythology with an atmospheric ${moodCapitalized} worldbuilding style.`;
}

// Rank the 60 catalog items against the user's averaged theme vector
export function rankCatalogForUser(
  userWorlds: World[],
  preferredMood?: MoodType,
  limit = 6
): {
  recommendations: RankedRecommendation[];
  userAveragedThemes: string[];
  userAveragedVector: number[];
} {
  const { vector: userVector, userThemes } = computeUserAveragedVector(userWorlds);

  // Set of existing titles to exclude already saved titles
  const existingTitles = new Set(userWorlds.map((w) => w.title.toLowerCase().trim()));

  const scored: RankedRecommendation[] = CATALOG_ITEMS.map((item) => {
    // 1. Cosine similarity
    const similarity = cosineSimilarity(userVector, item.themeVector);

    // 2. Identify shared themes
    const shared = item.themes.filter((t) => userThemes.has(t));

    // 3. Small boost for matching mood (e.g. +0.12)
    const matchingMood = Boolean(preferredMood && item.mood === preferredMood);
    const moodBoost = matchingMood ? 0.12 : 0;
    const score = similarity + moodBoost;

    const whyThisFits = generateWhyThisFits(shared, matchingMood, item.mood);

    return {
      item,
      similarity: Number(similarity.toFixed(4)),
      score: Number(score.toFixed(4)),
      sharedThemes: shared,
      matchingMood,
      whyThisFits,
    };
  });

  // Filter out works the user already has saved in their world list
  const uncataloged = scored.filter(
    (rec) => !existingTitles.has(rec.item.title.toLowerCase().trim())
  );

  // Rank by boosted score descending
  uncataloged.sort((a, b) => b.score - a.score);

  return {
    recommendations: uncataloged.slice(0, limit),
    userAveragedThemes: Array.from(userThemes),
    userAveragedVector: userVector,
  };
}
