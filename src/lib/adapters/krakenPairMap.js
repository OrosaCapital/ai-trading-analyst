// Simple Kraken pair mapping helper
// Provides normalization from common user symbols to Kraken pair identifiers.

import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, 'kraken_pairs_cache.json');

// Local known fallbacks
const KNOWN = {
  BTCUSD: 'XBTUSD',
  BTC: 'XBT',
  ETHUSD: 'ETHUSD',
};

let pairMap = null;

async function fetchKrakenPairs({ force = false } = {}) {
  if (!force && pairMap) return pairMap;
  // Try cache first
  try {
    if (!force && fs.existsSync(CACHE_FILE)) {
      const raw = await fs.promises.readFile(CACHE_FILE, 'utf8');
      const cached = JSON.parse(raw);
      // If cache already contains baseIndex, return quickly
      if (cached && cached.__baseIndex) {
        pairMap = cached;
        return pairMap;
      }
      // otherwise fall through to fetch fresh data so we can build baseIndex
    }
  } catch (err) {
    // ignore cache errors
  }

  const url = 'https://api.kraken.com/0/public/AssetPairs';
  const res = await fetch(url, { timeout: 10000 });
  const json = await res.json();
  const data = json.result || {};

  const map = {};
  const baseIndex = {};
  for (const [pair, info] of Object.entries(data)) {
    // canonical pair (e.g., XBTUSD)
    map[pair] = pair;
    // also expose alt forms: BASE + QUOTE like BTCUSD, BTC/USD, etc.
    const base = (info.base || '').replace(/^X|^Z/, '');
    const quote = (info.quote || '').replace(/^X|^Z/, '');
    const compact = `${base}${quote}`.toUpperCase();
    map[compact] = pair;
    map[`${base}/${quote}`.toUpperCase()] = pair;
    map[`${base}_${quote}`.toUpperCase()] = pair;
    map[`${base}-${quote}`.toUpperCase()] = pair;
    // also support lower/upper variants
    map[`${base}${quote}`.toLowerCase()] = pair;
    // index by base for base-only lookups
    if (base) {
      const b = base.toUpperCase();
      baseIndex[b] = baseIndex[b] || [];
      baseIndex[b].push({ pair, base: b, quote: quote.toUpperCase(), compact });
    }
  }

  // merge known fallbacks
  for (const [k, v] of Object.entries(KNOWN)) map[k] = v;

  pairMap = map;

  // attach baseIndex for lookup convenience
  pairMap.__baseIndex = baseIndex;

  // write cache (best-effort)
  try {
    await fs.promises.writeFile(CACHE_FILE, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    // ignore
  }

  return pairMap;
}

async function normalizeForKraken(input) {
  if (!input) return input;
  const s = input.replace(/[-_/ ]/g, '').toUpperCase();
  // quick known lookup
  if (KNOWN[s]) return KNOWN[s];

  const map = await fetchKrakenPairs();
  if (map[s]) return map[s];

  // try more variants
  const variants = [s.toUpperCase(), s.replace(/^X|^Z/, ''), s.replace(/[^A-Z0-9]/g, '')];
  for (const v of variants) if (map[v]) return map[v];

  // If user provided only a base like 'XRP', try to pick the best quote
  // Use baseIndex created during fetchKrakenPairs
  try {
    const base = s.toUpperCase();
    const baseIndex = map.__baseIndex || {};
    if (baseIndex[base] && baseIndex[base].length) {
      // prefer quotes in this order
      const prefer = ['USD', 'USDT', 'EUR', 'XBT', 'USDC'];
      for (const p of prefer) {
        const found = baseIndex[base].find(x => x.quote === p);
        if (found) return found.pair;
      }
      // fallback: return the first available pair for that base
      return baseIndex[base][0].pair;
    }
  } catch (err) {
    // ignore
  }

  // fallback to original input
  return s;
}

export { normalizeForKraken, fetchKrakenPairs, KNOWN };
