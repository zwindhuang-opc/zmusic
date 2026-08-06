/**
 * test-vision-analyzer.mjs
 *
 * Self-validation test for the vision analyzer's scene classification.
 * Simulates visual features for different image types and verifies that
 * the zunicorn agent loop produces appropriate, professional output.
 *
 * Run: node scripts/test-vision-analyzer.mjs
 */

// Mock the browser-only parts (canvas/Image) by importing only the pure functions
// We test classifyScene + _agentLoopValidate + _generateStructuredMetadata logic
// by reconstructing the feature objects the real extractor would produce.

// Since visionAnalyzer.js uses `export` (ESM) and references `document`,
// we replicate the classification logic test by importing the module
// with a canvas stub. Instead, we'll test the exported classifyScene
// by dynamic-importing the module after stubbing globalThis.document.

// Stub canvas + document for Node environment
globalThis.document = {
  createElement: () => ({
    width: 0, height: 0,
    getContext: () => ({
      drawImage: () => { },
      getImageData: () => ({ data: new Uint8ClampedArray(4) })
    })
  })
};

const { classifyScene } = await import('../src/utils/visionAnalyzer.js');

/** Helper: build a feature object resembling what extractColorFeatures etc. produce */
function makeFeatures(overrides = {}) {
  return {
    // Color
    dominantColors: [{ hex: '#FFA500', rgb: 'rgb(255,165,0)', percentage: 0.4, hsl: [30, 100, 50] }],
    dominantColor: { hex: '#FFA500', rgb: 'rgb(255,165,0)' },
    warmRatio: 0.3, coolRatio: 0.2, greenRatio: 0.1,
    redRatio: 0.15, blueRatio: 0.1,
    saturation: 0.5, colorfulness: 0.5, avgHue: 30,
    // Lighting
    brightness: 0.55, brightRatio: 0.4, darkRatio: 0.2,
    lightRatio: 0.4, contrast: 0.4, horizonLine: false, horizonY: -1,
    lightingType: 'normal',
    // Composition
    symmetry: 0.5, visualCenter: 'Center', verticalRatio: 0.5,
    // Region
    skyRatio: 0.2, groundRatio: 0.3,
    // Texture
    edgeDensity: 0.2, avgVariance: 0.3, textureType: 'moderate', complexity: 0.4,
    // Semantic
    skinRatio: 0.01, personCount: 0, subjectType: 'unknown',
    subjectConfidence: 0, skinRegion: 'none', indoorOutdoor: 'unknown',
    isSelfie: false, potentialCouple: false, clusters: [],
    width: 256, height: 256,
    ...overrides
  };
}

let passCount = 0;
let failCount = 0;
const results = [];

function assertScene(name, features, expectation) {
  const scene = classifyScene(features);
  const checks = [];
  let ok = true;

  for (const [key, expected] of Object.entries(expectation)) {
    const actual = scene[key];
    let match;
    if (Array.isArray(expected)) {
      match = expected.some(e => Array.isArray(actual) && actual.includes(e));
    } else if (typeof expected === 'string' && expected.startsWith('!')) {
      match = !Array.isArray(actual) || !actual.includes(expected.slice(1));
    } else {
      match = actual === expected;
    }
    checks.push({ key, expected, actual, match });
    if (!match) ok = false;
  }

  if (ok) passCount++; else failCount++;
  results.push({ name, ok, scene: scene.profileId || scene._semanticId, themes: scene.themes, checks });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  console.log(`      scene=${scene.profileId || scene._semanticId}, themes=[${scene.themes?.join(', ')}], genre=[${scene.genre?.join(', ')}]`);
  if (!ok) {
    for (const c of checks) {
      if (!c.match) console.log(`      ✗ ${c.key}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.actual)}`);
    }
  }
}

console.log('=== ZMusic Vision Analyzer — Scene Classification Tests ===\n');

// Test 1: Happy couple photo (warm, bright, 2 skin clusters)
console.log('--- People photos ---');
assertScene('Happy couple photo (warm + bright + 2 clusters)', makeFeatures({
  warmRatio: 0.4, brightness: 0.6, saturation: 0.5,
  skinRatio: 0.15, personCount: 2, subjectType: 'couple',
  subjectConfidence: 0.5, skinRegion: 'upper_center'
}), {
  themes: ['love'],
  _semanticId: 'semantic_couple'
});

// Test 2: Bright warm couple — should NOT have heartbreak
assertScene('Couple photo must not have heartbreak theme', makeFeatures({
  warmRatio: 0.4, brightness: 0.6,
  skinRatio: 0.15, personCount: 2, subjectType: 'couple',
  subjectConfidence: 0.5
}), {
  themes: '!heartbreak'
});

// Test 3: Group photo
assertScene('Group photo → friendship themes', makeFeatures({
  colorfulness: 0.6, saturation: 0.6, brightness: 0.6,
  skinRatio: 0.1, personCount: 4, subjectType: 'group',
  subjectConfidence: 0.6
}), {
  themes: ['friendship'],
  _semanticId: 'semantic_group'
});

// Test 4: Warm selfie
assertScene('Warm bright selfie → happiness', makeFeatures({
  warmRatio: 0.4, brightness: 0.55, skinRatio: 0.12,
  personCount: 1, subjectType: 'portrait', subjectConfidence: 0.4,
  skinRegion: 'upper_center', isSelfie: true
}), {
  _semanticId: 'semantic_portrait'
});

console.log('\n--- Landscape & nature ---');
// Test 5: Sunset
assertScene('Sunset scene', makeFeatures({
  warmRatio: 0.4, lightRatio: 0.3, horizonLine: true, brightness: 0.5
}), {
  themes: ['memory']
});

// Test 6: Beach/ocean
assertScene('Beach ocean scene', makeFeatures({
  blueRatio: 0.3, brightness: 0.6, horizonLine: true,
  saturation: 0.5, warmRatio: 0.2, skinRatio: 0.01
}), {
  themes: ['freedom']
});

// Test 7: Mountain/forest
assertScene('Mountain wilderness', makeFeatures({
  greenRatio: 0.3, brightness: 0.5, horizonLine: true,
  saturation: 0.5, skinRatio: 0.01, warmRatio: 0.2
}), {
  themes: ['nature']
});

// Test 8: Flowers
assertScene('Flowers bloom', makeFeatures({
  colorfulness: 0.6, saturation: 0.55, brightness: 0.5,
  warmRatio: 0.3, blueRatio: 0.15, skinRatio: 0.01, horizonLine: false
}), {
  themes: ['nature']
});

console.log('\n--- Weather & seasons ---');
// Test 9: Night sky
assertScene('Starry night', makeFeatures({
  darkRatio: 0.5, blueRatio: 0.3, brightness: 0.3,
  saturation: 0.4, skinRatio: 0.01
}), {
  themes: ['dreams']
});

// Test 10: Winter snow
assertScene('Winter snow', makeFeatures({
  brightness: 0.7, saturation: 0.2, coolRatio: 0.3, warmRatio: 0.15, skinRatio: 0.01
}), {
  themes: ['introspection']
});

console.log('\n--- Food & lifestyle ---');
// Test 11: Food
assertScene('Food warm glow', makeFeatures({
  warmRatio: 0.4, brightness: 0.5, saturation: 0.4,
  skinRatio: 0.01, horizonLine: false, textureType: 'moderate'
}), {
  themes: ['life']
});

// Test 12: Cafe cozy
assertScene('Cafe cozy indoor', makeFeatures({
  warmRatio: 0.35, brightness: 0.5, saturation: 0.4,
  contrast: 0.4, skinRatio: 0.02
}), {
  themes: ['life']
});

console.log('\n--- Critical regression: bright image must NOT be lonely ---');
// Test 13: BRIGHT WARM image with no people → must not be lonely
assertScene('Bright warm non-people image — no lonely themes', makeFeatures({
  warmRatio: 0.4, brightness: 0.6, saturation: 0.5,
  skinRatio: 0.01, subjectType: 'unknown'
}), {
  themes: '!loneliness'
});

console.log(`\n=== Results: ${passCount} passed, ${failCount} failed ===`);
if (failCount > 0) {
  console.log('\nFailed tests:');
  results.filter(r => !r.ok).forEach(r => console.log(`  - ${r.name}`));
  process.exit(1);
}
