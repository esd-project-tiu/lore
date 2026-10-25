import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  World,
  MediaType,
  GeneratedWorldLore,
  Place,
  Character,
  CanonContradiction,
} from '../types';

export interface CreateWorldInput {
  title: string;
  type: MediaType;
  note?: string;
  genre?: string;
  sources?: string[];
  generationType?: 'setting' | 'blend' | 'single';
  lore?: GeneratedWorldLore;
}

export const worldsService = {
  // Listen to the authenticated user's worlds
  subscribeToUserWorlds(
    userId: string,
    onSuccess: (worlds: World[]) => void,
    onError: (error: Error) => void
  ) {
    const path = 'worlds';
    const q = query(collection(db, path), where('userId', '==', userId));

    return onSnapshot(
      q,
      (snapshot) => {
        const worlds: World[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            title: data.title,
            type: data.type,
            note: data.note || '',
            genre: data.genre || '',
            status: data.status || 'saved',
            tone: data.tone || undefined,
            themes: data.themes || undefined,
            blurb: data.blurb || undefined,
            places: data.places || undefined,
            characters: data.characters || undefined,
            storyHooks: data.storyHooks || undefined,
            sources: data.sources || undefined,
            generationType: data.generationType || undefined,
            isPublic: data.isPublic || false,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as World;
        });

        // Client-side sort by createdAt descending
        worlds.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        onSuccess(worlds);
      },
      (error) => {
        try {
          handleFirestoreError(error, OperationType.LIST, path);
        } catch (wrappedError: any) {
          onError(wrappedError);
        }
      }
    );
  },

  // Fetch a public world (for shared read-only links)
  // Strips the note field so it is never exposed on public worlds
  async getPublicWorld(worldId: string): Promise<World | null> {
    const path = `worlds/${worldId}`;
    try {
      const snap = await getDoc(doc(db, 'worlds', worldId));
      if (!snap.exists()) return null;
      const data = snap.data();
      const isOwner = Boolean(auth.currentUser && auth.currentUser.uid === data.userId);
      if (!data.isPublic && !isOwner) {
        return null;
      }
      return {
        id: snap.id,
        userId: data.userId,
        title: data.title,
        type: data.type,
        // Do not expose note field on public worlds (strip it unless owner is viewing)
        note: isOwner ? (data.note || '') : '',
        genre: data.genre || '',
        status: data.status || 'saved',
        tone: data.tone || undefined,
        themes: data.themes || undefined,
        blurb: data.blurb || undefined,
        places: data.places || undefined,
        characters: data.characters || undefined,
        storyHooks: data.storyHooks || undefined,
        sources: data.sources || undefined,
        generationType: data.generationType || undefined,
        isPublic: data.isPublic || false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as World;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  // Save a new setting or title
  async createWorld(userId: string, input: CreateWorldInput): Promise<string> {
    const path = 'worlds';
    const title = input.title.trim().slice(0, 200);
    if (!title) {
      throw new Error('Title or setting prompt is required');
    }

    const type: MediaType = input.type || 'setting';
    const note = input.note ? input.note.trim().slice(0, 2000) : '';
    const genre = input.genre ? input.genre.trim().slice(0, 100) : '';
    const now = new Date().toISOString();

    const worldDocRef = doc(collection(db, path));
    const worldData: Record<string, any> = {
      userId,
      title,
      type,
      status: input.lore ? 'ready' : 'saved',
      createdAt: now,
      updatedAt: now,
    };

    if (note) worldData.note = note;
    if (genre) worldData.genre = genre;
    if (input.sources && input.sources.length > 0) worldData.sources = input.sources;
    if (input.generationType) worldData.generationType = input.generationType;

    if (input.lore) {
      worldData.tone = input.lore.tone;
      worldData.themes = input.lore.themes;
      worldData.blurb = input.lore.blurb;
      worldData.places = input.lore.places;
      worldData.characters = input.lore.characters;
      if (input.lore.storyHooks) worldData.storyHooks = input.lore.storyHooks;
    }

    try {
      await setDoc(worldDocRef, worldData);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${worldDocRef.id}`);
    }

    // Update usage document
    try {
      const usagePath = 'usage';
      const usageRef = doc(db, usagePath, userId);
      const usageSnap = await getDoc(usageRef);
      const prevWorldCount = usageSnap.exists() ? usageSnap.data().worldCount || 0 : 0;
      const prevGenCount = usageSnap.exists() ? usageSnap.data().generationCount || 0 : 0;

      await setDoc(
        usageRef,
        {
          userId,
          worldCount: prevWorldCount + 1,
          generationCount: input.lore ? prevGenCount + 1 : prevGenCount,
          lastActive: now,
          updatedAt: now,
        },
        { merge: true }
      );
    } catch (usageErr) {
      console.warn('Failed to update usage count:', usageErr);
    }

    return worldDocRef.id;
  },

  // Update existing world with generated lore
  async updateWorldWithLore(
    worldId: string,
    lore: GeneratedWorldLore
  ): Promise<void> {
    const path = `worlds/${worldId}`;
    try {
      await updateDoc(doc(db, 'worlds', worldId), {
        tone: lore.tone,
        themes: lore.themes,
        blurb: lore.blurb,
        places: lore.places,
        characters: lore.characters,
        storyHooks: lore.storyHooks || [],
        status: 'ready',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Update places list (for edits, deletes, lock changes)
  async updateWorldPlaces(worldId: string, places: Place[]): Promise<void> {
    const path = `worlds/${worldId}`;
    try {
      await updateDoc(doc(db, 'worlds', worldId), {
        places,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Update characters list (for edits, deletes, lock changes)
  async updateWorldCharacters(
    worldId: string,
    characters: Character[]
  ): Promise<void> {
    const path = `worlds/${worldId}`;
    try {
      await updateDoc(doc(db, 'worlds', worldId), {
        characters,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Toggle public share status
  async setWorldPublicStatus(worldId: string, isPublic: boolean): Promise<void> {
    const path = `worlds/${worldId}`;
    try {
      await updateDoc(doc(db, 'worlds', worldId), {
        isPublic,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // Call server-side generateWorld endpoint
  async generateWorldViaServer(
    title: string,
    type: MediaType,
    note?: string,
    worldId?: string,
    sources?: string[],
    lockedPlaces?: Place[],
    lockedCharacters?: Character[]
  ): Promise<{
    data: GeneratedWorldLore;
    cached: boolean;
    remainingGenerations: number;
    normalizedTitle: string;
  }> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to generate a world.');
    }

    const idToken = await user.getIdToken();

    const response = await fetch('/api/lore/generateWorld', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        title,
        type,
        note,
        sources,
        userId: user.uid,
        worldId,
        lockedPlaces,
        lockedCharacters,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to generate world lore.');
    }

    if (worldId && result.data) {
      try {
        await this.updateWorldWithLore(worldId, result.data);
      } catch (err) {
        console.warn('Local Firestore world update notice:', err);
      }
    }

    return result;
  },

  // Regenerate a single unlocked place via Gemini server endpoint
  async regeneratePlaceViaServer(
    world: World,
    placeToReplace: Place
  ): Promise<Place> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to regenerate a place.');
    }

    const idToken = await user.getIdToken();
    const otherPlaces = (world.places || []).filter((p) => p.id !== placeToReplace.id);

    const response = await fetch('/api/lore/regeneratePlace', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        worldTitle: world.title,
        tone: world.tone,
        themes: world.themes,
        placeToReplace,
        otherPlaces,
        characters: world.characters || [],
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to regenerate place.');
    }

    return result.place;
  },

  // Check canon continuity via Gemini server endpoint
  async checkCanonViaServer(world: World): Promise<CanonContradiction[]> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('You must be signed in to check canon.');
    }

    const idToken = await user.getIdToken();

    const response = await fetch('/api/lore/checkCanon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        worldTitle: world.title,
        tone: world.tone,
        themes: world.themes,
        places: world.places || [],
        characters: world.characters || [],
        notes: world.note,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to perform canon continuity check.');
    }

    return result.contradictions || [];
  },

  // Check rate limit remaining (authenticates caller and returns caller's quota)
  async getRateLimit(
    _userId?: string
  ): Promise<{ remaining: number; allowed: boolean; limit: number }> {
    try {
      const user = auth.currentUser;
      if (!user) return { remaining: 10, allowed: true, limit: 10 };
      const idToken = await user.getIdToken();
      const res = await fetch('/api/lore/rateLimit', {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      if (!res.ok) return { remaining: 10, allowed: true, limit: 10 };
      return await res.json();
    } catch {
      return { remaining: 10, allowed: true, limit: 10 };
    }
  },

  // Delete a world
  async deleteWorld(worldId: string): Promise<void> {
    const path = `worlds/${worldId}`;
    try {
      await deleteDoc(doc(db, 'worlds', worldId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },
};
