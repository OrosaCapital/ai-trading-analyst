import presets from '../src/lib/presets.js';

console.log('Loaded presets:', presets ? Object.keys(presets.indicators).length + ' indicators' : 'none');
console.log('1m preset overlays:', presets?.timeframePresets?.['1m']?.overlays || []);
console.log('15m preset subpanels:', presets?.timeframePresets?.['15m']?.subpanels || []);
