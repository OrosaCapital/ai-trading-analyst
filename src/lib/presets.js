import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const presetsPath = path.join(__dirname, '../config/indicator-presets.json');

function loadPresets() {
  try {
    const raw = fs.readFileSync(presetsPath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load presets:', err.message);
    return null;
  }
}

const presets = loadPresets();

export default presets;

export function getIndicator(name) {
  if (!presets || !presets.indicators) return null;
  return presets.indicators[name] || null;
}

export function getTimeframePreset(tf) {
  if (!presets || !presets.timeframePresets) return null;
  return presets.timeframePresets[tf] || null;
}
