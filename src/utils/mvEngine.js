const MV_TEMPLATES = {
  pop: {
    palette: 'purple_pink_gradient',
    scenes: ['studio', 'street', 'closeup', 'crowd', 'sunset'],
    effects: ['light_leak', 'lens_flare', 'color_shift']
  },
  rock: {
    palette: 'red_black_contrast',
    scenes: ['concert', 'stage', 'crowd', 'smoke', 'lights'],
    effects: ['glitch', 'shake', 'high_contrast']
  },
  chinese_traditional: {
    palette: 'gold_red_jade',
    scenes: ['palace', 'garden', 'mountain', 'moon', 'river'],
    effects: ['ink_wash', 'calligraphy', 'fade']
  },
  electronic: {
    palette: 'neon_cyber',
    scenes: ['club', 'city_night', 'neon_street', 'vr_world', 'laser'],
    effects: ['glitch', 'chromatic', 'digital_wave']
  },
  hip_hop: {
    palette: 'urban_gold',
    scenes: ['street', 'car', 'studio', 'money', 'rooftop'],
    effects: ['grain', 'vhs', 'shake']
  },
  ballad: {
    palette: 'soft_pastel',
    scenes: ['piano', 'rain', 'window', 'candle', 'letter'],
    effects: ['soft_focus', 'bokeh', 'slow_zoom']
  },
  jazz: {
    palette: 'warm_brown_gold',
    scenes: ['bar', 'saxophone', 'whiskey', 'piano', 'city_night'],
    effects: ['bokeh', 'soft_focus', 'sepia']
  },
  classical: {
    palette: 'dark_blue_gold',
    scenes: ['concert_hall', 'orchestra', 'conductor', 'violin', 'piano'],
    effects: ['slow_zoom', 'dolly', 'soft_focus']
  },
  rnb: {
    palette: 'deep_purple_blue',
    scenes: ['studio', 'neon_lights', 'city_night', 'mirror', 'smoke'],
    effects: ['color_shift', 'bokeh', 'slow_motion']
  },
  country: {
    palette: 'warm_yellow',
    scenes: ['country_road', 'field', 'cabin', 'guitar', 'sunset'],
    effects: ['sun_flare', 'warm_tones', 'soft_focus']
  },
  love_song: {
    palette: 'pink_rose',
    scenes: ['couple', 'flower_sea', 'sunset', 'candlelight', 'love_letter'],
    effects: ['soft_focus', 'bokeh', 'warm_glow']
  },
  chinese_classical: {
    palette: 'green_landscape',
    scenes: ['bamboo_forest', 'lotus_pond', 'guqin', 'calligraphy', 'mountain_water'],
    effects: ['ink_wash', 'fade', 'slow_zoom']
  },
  concert: {
    palette: 'stage_red_blue',
    scenes: ['stage', 'fans', 'light_show', 'fireworks', 'chorus'],
    effects: ['strobe', 'light_trails', 'glow']
  },
  modern: {
    palette: 'blue_gray_cool',
    scenes: ['city_skyline', 'glass_wall', 'subway', 'elevator', 'rooftop'],
    effects: ['cold_tones', 'reflection', 'slow_motion']
  },
  cinematic: {
    palette: 'blue_orange_contrast',
    scenes: ['car_chase', 'slow_motion', 'rain_scene', 'silhouette', 'sunset'],
    effects: ['film_grain', 'anamorphic', 'lens_flare']
  },
  retro: {
    palette: 'brown_yellow_vintage',
    scenes: ['vinyl_record', 'cassette', 'neon_sign', 'vintage_tv', 'dance_hall'],
    effects: ['vhs', 'grain', 'color_bleed']
  },
  anime: {
    palette: 'pink_blue_dream',
    scenes: ['cherry_blossom', 'starry_sky', 'seaside', 'school', 'summer_festival'],
    effects: ['glow', 'sparkle', 'soft_focus']
  },
  gothic_rock: {
    palette: 'black_red_purple',
    scenes: ['castle', 'cross', 'bats', 'moon', 'fog'],
    effects: ['high_contrast', 'vignette', 'cold_tones']
  }
};

export function generateMV(params) {
  const { genre = 'pop', duration = 180 } = params;
  const template = MV_TEMPLATES[genre] || MV_TEMPLATES.pop;
  const sceneCount = template.scenes.length;
  const sceneDuration = Math.floor(duration / sceneCount);

  const timeline = template.scenes.map((scene, index) => ({
    sceneId: index + 1,
    scene,
    startTime: index * sceneDuration,
    endTime: (index + 1) * sceneDuration,
    duration: sceneDuration,
    effects: template.effects,
    transition: index === 0 ? 'fade_in' : (index === sceneCount - 1 ? 'fade_out' : 'cut')
  }));

  return {
    genre,
    duration,
    colorPalette: template.palette,
    totalScenes: sceneCount,
    timeline,
    effects: template.effects,
    generatedAt: new Date().toISOString()
  };
}

export function getMVGenres() {
  return Object.keys(MV_TEMPLATES);
}
