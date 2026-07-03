import React, { useState, useEffect } from 'react';
import { Video, Sparkles, Loader, Film, Play, Clock, Palette } from 'lucide-react';
import api from '../services/api.client.js';

function MVPage() {
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState('pop');
  const [duration, setDuration] = useState(180);
  const [style, setStyle] = useState('modern');
  const [colorPalette, setColorPalette] = useState('purple_gradient');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const data = await api.mvGenres();
      if (data.success) {
        setGenres(data.data);
      }
    } catch (error) {
      console.error('Genres load failed:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const data = await api.generateMV({ genre, duration, style, colorPalette });
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="gradient-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MV Video Generator</h1>
            <p className="text-xs text-gray-400">Professional music video templates and timeline</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">MV Genre</label>
            <div className="space-y-2">
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-all text-left ${
                    genre === g
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Duration (seconds)</label>
            <input
              type="range"
              min="60"
              max="600"
              step="30"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full accent-violet-500"
            />
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>60s</span>
              <span className="text-violet-300 font-semibold">{duration}s</span>
              <span>600s</span>
            </div>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Style</label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="modern">Modern</option>
              <option value="cinematic">Cinematic</option>
              <option value="artistic">Artistic</option>
              <option value="minimalist">Minimalist</option>
            </select>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Color Palette</label>
            <select
              value={colorPalette}
              onChange={(e) => setColorPalette(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
            >
              <option value="purple_pink_gradient">Purple Pink Gradient</option>
              <option value="red_black_contrast">Red Black Contrast</option>
              <option value="gold_red_jade">Gold Red Jade</option>
              <option value="neon_cyber">Neon Cyber</option>
              <option value="urban_gold">Urban Gold</option>
              <option value="soft_pastel">Soft Pastel</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating MV...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate MV Timeline
              </>
            )}
          </button>
        </div>

        <div className="col-span-2 gradient-border p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Film className="w-4 h-4 text-cyan-400" />
            MV Timeline
          </h3>
          {!result && !isGenerating && (
            <div className="text-center py-20 text-gray-500">
              <Video className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <div className="text-sm">Click "Generate MV Timeline" to start</div>
            </div>
          )}
          {isGenerating && (
            <div className="text-center py-20">
              <Loader className="w-10 h-10 mx-auto mb-4 text-cyan-400 animate-spin" />
              <div className="text-sm text-gray-400">Creating MV timeline...</div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Clock className="w-3.5 h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">Duration</div>
                  <div className="text-sm font-semibold text-white">{result.duration}s</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Palette className="w-3.5 h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">Palette</div>
                  <div className="text-sm font-semibold text-white">{result.colorPalette}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Film className="w-3.5 h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">Scenes</div>
                  <div className="text-sm font-semibold text-white">{result.totalScenes}</div>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <Sparkles className="w-3.5 h-3.5 text-gray-400 mb-1" />
                  <div className="text-[10px] text-gray-500 uppercase">Effects</div>
                  <div className="text-sm font-semibold text-white">{result.effects?.length || 0}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Scene Timeline</h4>
                <div className="space-y-2">
                  {result.timeline?.map((scene, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-xs font-bold text-white">
                        {scene.sceneId}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white capitalize">{scene.scene}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          {scene.startTime}s - {scene.endTime}s ({scene.duration}s)
                        </div>
                      </div>
                      <div className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {scene.transition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Effects</h4>
                <div className="flex flex-wrap gap-2">
                  {result.effects?.map((effect, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                      {effect}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MVPage;
