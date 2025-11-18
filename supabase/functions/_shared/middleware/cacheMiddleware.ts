// Legacy export
export const withCache = (fn: Function, ttl: number) => async (...args: any[]) => fn(...args);

interface CachedData {
  data: any;
  timestamp: number;
}

export async function getCachedData(
  supabaseClient: any,
  key: string,
  maxAgeSeconds: number = 60
): Promise<CachedData | null> {
  const { log } = await import('../monitoring/logger.ts');

  try {
    const expiresAfter = new Date(Date.now() - maxAgeSeconds * 1000).toISOString();

    const { data, error } = await supabaseClient
      .from('market_data_cache')
      .select('data, created_at')
      .eq('data_type', key)
      .gte('created_at', expiresAfter)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      log('warn', 'Cache read error', { key, error: error.message });
      return null;
    }

    if (!data) {
      log('debug', 'Cache miss', { key });
      return null;
    }

    log('debug', 'Cache hit', { key, age: Date.now() - new Date(data.created_at).getTime() });

    return {
      data: data.data,
      timestamp: new Date(data.created_at).getTime(),
    };
  } catch (error) {
    log('error', 'Cache read exception', {
      key,
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return null;
  }
}

export async function setCachedData(
  supabaseClient: any,
  key: string,
  data: any,
  ttlSeconds: number = 60
): Promise<void> {
  const { log } = await import('../monitoring/logger.ts');

  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await supabaseClient
      .from('market_data_cache')
      .upsert({
        data_type: key,
        symbol: key.split('_')[2] || 'unknown',
        data: data,
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'data_type,symbol',
      });

    if (error) {
      log('warn', 'Cache write error', { key, error: error.message });
    } else {
      log('debug', 'Cache write success', { key, ttl: ttlSeconds });
    }
  } catch (error) {
    log('error', 'Cache write exception', {
      key,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

export async function invalidateCache(
  supabaseClient: any,
  key: string
): Promise<void> {
  const { log } = await import('../monitoring/logger.ts');

  try {
    const { error } = await supabaseClient
      .from('market_data_cache')
      .delete()
      .eq('data_type', key);

    if (error) {
      log('warn', 'Cache invalidation error', { key, error: error.message });
    } else {
      log('debug', 'Cache invalidated', { key });
    }
  } catch (error) {
    log('error', 'Cache invalidation exception', {
      key,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}
