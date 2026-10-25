import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  generateWorld,
  regenerateSinglePlace,
  checkCanonContradictions,
  checkRateLimit,
  GenerateWorldInputSchema,
  RegeneratePlaceInputSchema,
  CheckCanonInputSchema,
} from './src/server/generateWorld';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Basic security headers
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.use(express.json({ limit: '1mb' }));

// Read Firebase config for server-side token verification
let firebaseApiKey = '';
try {
  const candidatePaths = [
    path.resolve(process.cwd(), 'firebase-applet-config.json'),
    path.resolve(__dirname, 'firebase-applet-config.json'),
  ];
  for (const configPath of candidatePaths) {
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      firebaseApiKey = cfg.apiKey || '';
      break;
    }
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config in server:', e);
}

// In-memory token verification cache (5 minutes TTL) to keep requests fast
const verifiedTokenCache = new Map<string, { uid: string; expiresAt: number }>();

async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  if (!idToken || typeof idToken !== 'string') return null;

  const cached = verifiedTokenCache.get(idToken);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.uid;
  }

  if (!firebaseApiKey) {
    console.error('Firebase apiKey is missing in server configuration');
    return null;
  }

  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!res.ok) {
      return null;
    }

    const data: any = await res.json();
    const uid = data.users?.[0]?.localId;
    if (typeof uid === 'string' && uid) {
      verifiedTokenCache.set(idToken, {
        uid,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      return uid;
    }
    return null;
  } catch (err) {
    console.error('Token verification error:', err);
    return null;
  }
}

interface AuthenticatedRequest extends express.Request {
  user?: {
    uid: string;
  };
  idToken?: string;
}

// Strict token verification middleware: rejects with 401 if missing or invalid
const requireFirebaseAuth = async (
  req: AuthenticatedRequest,
  res: express.Response,
  next: express.NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Missing or invalid Authorization Bearer token header.',
      code: 'UNAUTHORIZED',
    });
  }

  const idToken = authHeader.substring(7).trim();
  if (!idToken) {
    return res.status(401).json({
      error: 'Unauthorized: Empty token provided.',
      code: 'UNAUTHORIZED',
    });
  }

  const uid = await verifyFirebaseToken(idToken);
  if (!uid) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid or expired Firebase ID token.',
      code: 'UNAUTHORIZED',
    });
  }

  req.user = { uid };
  req.idToken = idToken;
  next();
};

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    phase: 2,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Seeded catalog collection endpoint (read-only for clients)
app.get('/api/lore/catalog', async (_req, res) => {
  try {
    const { CATALOG_ITEMS } = await import('./src/data/catalogData');
    res.json({
      total: CATALOG_ITEMS.length,
      items: CATALOG_ITEMS,
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch catalog.' });
  }
});

// Check daily rate limit status (requires valid auth token, returns caller's quota only)
app.get('/api/lore/rateLimit', requireFirebaseAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const rate = await checkRateLimit(uid, req.idToken);
    return res.json({
      allowed: rate.allowed,
      remaining: rate.remaining,
      limit: 10,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch rate limit.' });
  }
});

// Backward-compatible rate limit route requiring verified token for caller's own uid
app.get('/api/lore/rateLimit/:userId', requireFirebaseAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const uid = req.user!.uid;
    const rate = await checkRateLimit(uid, req.idToken);
    return res.json({
      allowed: rate.allowed,
      remaining: rate.remaining,
      limit: 10,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch rate limit.' });
  }
});

// Server-side generateWorld endpoint
// Token verified server-side, uid strictly from token, request body userId ignored
app.post('/api/lore/generateWorld', requireFirebaseAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const verifiedUid = req.user!.uid;
    const idToken = req.idToken;

    const {
      title,
      type,
      note,
      sources,
      worldId,
      lockedPlaces,
      lockedCharacters,
    } = req.body || {};

    // Validate inputs with size limits (ignoring any userId in body)
    const validatedInput = GenerateWorldInputSchema.parse({
      title,
      type: type || 'setting',
      note: typeof note === 'string' ? note : undefined,
      sources: Array.isArray(sources) ? sources : undefined,
      userId: verifiedUid,
      worldId: typeof worldId === 'string' ? worldId : undefined,
      lockedPlaces: Array.isArray(lockedPlaces) ? lockedPlaces : undefined,
      lockedCharacters: Array.isArray(lockedCharacters) ? lockedCharacters : undefined,
    });

    const result = await generateWorld(validatedInput, idToken);

    return res.json({
      status: 'success',
      data: result.data,
      cached: result.cached,
      remainingGenerations: result.remainingGenerations,
      normalizedTitle: result.normalizedTitle,
    });
  } catch (error: any) {
    console.error('generateWorld error:', error);
    const statusCode = error?.statusCode || (error?.name === 'ZodError' ? 400 : 500);
    return res.status(statusCode).json({
      error: error?.message || 'Failed to generate world lore.',
      code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : statusCode === 400 ? 'INVALID_INPUT' : 'GENERATION_ERROR',
    });
  }
});

// Regenerate a single unlocked place in an existing world
// Token verified server-side, counts against daily rate limit
app.post('/api/lore/regeneratePlace', requireFirebaseAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const verifiedUid = req.user!.uid;
    const idToken = req.idToken;

    const { worldTitle, tone, themes, placeToReplace, otherPlaces, characters } = req.body || {};

    // Validate inputs with size limits (ignoring any userId in body)
    const validatedInput = RegeneratePlaceInputSchema.parse({
      worldTitle: worldTitle || 'Unnamed World',
      tone: tone || '',
      themes: Array.isArray(themes) ? themes : [],
      placeToReplace,
      otherPlaces: Array.isArray(otherPlaces) ? otherPlaces : [],
      characters: Array.isArray(characters) ? characters : [],
    });

    const regeneratedPlace = await regenerateSinglePlace(
      {
        ...validatedInput,
        userId: verifiedUid,
      },
      idToken
    );

    return res.json({
      status: 'success',
      place: regeneratedPlace,
    });
  } catch (error: any) {
    console.error('regeneratePlace error:', error);
    const statusCode = error?.statusCode || (error?.name === 'ZodError' ? 400 : 500);
    return res.status(statusCode).json({
      error: error?.message || 'Failed to regenerate place.',
      code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : statusCode === 400 ? 'INVALID_INPUT' : 'GENERATION_ERROR',
    });
  }
});

// Continuity canon check endpoint ("Check canon")
// Token verified server-side, counts against daily rate limit
app.post('/api/lore/checkCanon', requireFirebaseAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const verifiedUid = req.user!.uid;
    const idToken = req.idToken;

    const { worldTitle, tone, themes, places, characters, notes } = req.body || {};

    // Validate inputs with size limits (ignoring any userId in body)
    const validatedContext = CheckCanonInputSchema.parse({
      worldTitle: worldTitle || 'Unnamed Realm',
      tone: typeof tone === 'string' ? tone : undefined,
      themes: Array.isArray(themes) ? themes : undefined,
      places,
      characters: Array.isArray(characters) ? characters : [],
      notes: typeof notes === 'string' ? notes : undefined,
    });

    const canonResults = await checkCanonContradictions(
      {
        ...validatedContext,
        userId: verifiedUid,
      },
      idToken
    );

    return res.json({
      status: 'success',
      contradictions: canonResults.contradictions,
    });
  } catch (error: any) {
    console.error('checkCanon error:', error);
    const statusCode = error?.statusCode || (error?.name === 'ZodError' ? 400 : 500);
    return res.status(statusCode).json({
      error: error?.message || 'Failed to check canon continuity.',
      code: statusCode === 429 ? 'RATE_LIMIT_EXCEEDED' : statusCode === 400 ? 'INVALID_INPUT' : 'GENERATION_ERROR',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Lore server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
