// @ts-ignore: module may not be available during type checking
import { Ratelimit } from '@upstash/ratelimit';
// @ts-ignore: module may not be available during type checking
import { Redis } from '@upstash/redis';

const hasRedis =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

// --- Fallback en memoria cuando Redis no está configurado ---
const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

function inMemoryLimit(identifier: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const record = inMemoryStore.get(identifier);
  if (!record || now > record.resetAt) {
    inMemoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: maxRequests, remaining: maxRequests - 1, reset: now + windowMs };
  }
  record.count++;
  return {
    success: record.count <= maxRequests,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    reset: record.resetAt,
  };
}

// --- Rate limiters (solo se instancian si Redis está disponible) ---
export const aiAnalysisRateLimit = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(1, '10 s'),
      analytics: true,
      prefix: 'insighthire:ai:analysis',
    })
  : null;

export const aiChatRateLimit = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      analytics: true,
      prefix: 'insighthire:ai:chat',
    })
  : null;

export const embeddingRateLimit = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'insighthire:ai:embeddings',
    })
  : null;

export const uploadRateLimit = hasRedis
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      analytics: true,
      prefix: 'insighthire:upload',
    })
  : null;

// Mapa de config para el fallback: qué límite y ventana aplica a cada prefix
const fallbackConfig: Record<string, { max: number; windowMs: number }> = {
  'insighthire:ai:analysis': { max: 1,  windowMs: 10_000 },
  'insighthire:ai:chat':     { max: 10, windowMs: 60_000 },
  'insighthire:ai:embeddings':{ max: 5, windowMs: 60_000 },
  'insighthire:upload':      { max: 5,  windowMs: 60_000 },
};

export async function applyRateLimit(
  limiter: typeof aiAnalysisRateLimit,
  identifier: string,
  request: Request
) {
  let success: boolean;
  let limit: number;
  let remaining: number;
  let reset: number;

  if (limiter) {
    // Redis disponible — comportamiento original
    ({ success, limit, remaining, reset } = await limiter.limit(identifier));
  } else {
    // Fallback en memoria
    console.warn('[RateLimit] Redis no configurado, usando fallback en memoria.');
    // Detectamos el config por el identifier (prefix:identifier)
    const prefix = Object.keys(fallbackConfig).find(p =>
      identifier.startsWith(p)
    ) ?? 'insighthire:ai:analysis';
    const cfg = fallbackConfig[prefix];
    ({ success, limit, remaining, reset } = inMemoryLimit(identifier, cfg.max, cfg.windowMs));
  }

  if (!success) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Has excedido el límite de peticiones. Por favor, espera un momento.',
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}