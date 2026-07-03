import React, { useState } from 'react';
import { Music, Play, Sparkles, Loader, Download, Wand2, Cpu, Zap } from 'lucide-react';
import api from '../services/api.client.js';

const STYLES = ['pop', 'rock', 'electronic', 'hip_hop', 'ballad', 'chinese_traditional', 'jazz', 'classical', 'rnb', 'country'];
const AGENT_METHODS = [
  { id: 'fsm', name: 'FSM Programming', desc: 'State machine' },
  { id: 'network_layer', name: 'Network Layers', desc: '4-layer composition' },
  { id: 'muse', name: 'Muse Style', desc: 'Natural language' },
  { id: 'suno', name: 'Suno Style', desc: 'Structured params' }
];

function MusicPage() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('pop');
  const [duration, setDuration] = useState(60);
  const [bpm, setBpm] = useState(120);
  const [method, setMethod] = useState('fsm');
  const [theme, setTheme] = useState('love');
  const [provider, setProvider] = useState('suno_ai');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a music prompt');
      return;
    }
    setIsGenerating(true);
    setError('');
    setResult(null);
    try {
      const params = {
        prompt,
        style,
        duration,
        bpm,
        method,
        theme,
        provider,
        autoGenerateLyrics: true
      };
      const data = await api.generateMusicAgent(params);
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'Generation failed');
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="gradient-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Music Generation</h1>
            <p className="text-xs text-gray-400">Powered by Suno AI + Muse AI with Unicorn Agent</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-2 block">Music Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your music: genre, mood, story, theme..."
              className="w-full h-24 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/50 resize-none"
            />
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Music Style</label>
            <div className="grid grid-cols-5 gap-2">
              {STYLES.map(s => (
                <button
                  key={s}
                  onClick={() => setStyle(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    style === s
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="gradient-border p-4">
              <label className="text-xs font-medium text-gray-300 mb-2 block">Duration (s)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
                min="10"
                max="300"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="gradient-border p-4">
              <label className="text-xs font-medium text-gray-300 mb-2 block">BPM</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                min="60"
                max="200"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="gradient-border p-4">
              <label className="text-xs font-medium text-gray-300 mb-2 block">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
              >
                <option value="love">Love</option>
                <option value="friendship">Friendship</option>
                <option value="success">Success</option>
                <option value="dreams">Dreams</option>
                <option value="nature">Nature</option>
                <option value="life">Life</option>
              </select>
            </div>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">AI Agent Method</label>
            <div className="grid grid-cols-2 gap-2">
              {AGENT_METHODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`p-3 rounded-lg text-left transition-all ${
                    method === m.id
                      ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                      : 'bg-white/5 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="text-sm font-medium text-white">{m.name}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating Music...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Music with {AGENT_METHODS.find(m => m.id === method)?.name}
              </>
            )}
          </button>
        </div>

        <div className="gradient-border p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Wand2 className="w-4 h-4 text-pink-400" />
            Generation Result
          </h3>
          {!result && !isGenerating && (
            <div className="text-center py-12 text-gray-500">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <div className="text-xs">No music generated yet</div>
            </div>
          )}
          {isGenerating && (
            <div className="text-center py-12">
              <Loader className="w-8 h-8 mx-auto mb-3 text-violet-400 animate-spin" />
              <div className="text-xs text-gray-400">Creating your music...</div>
            </div>
          )}
          {result && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Task ID</div>
                <div className="text-xs font-mono text-violet-300">{result.taskId}</div>
              </div>
              {result.providers && Object.entries(result.providers).map(([name, data]) => (
                <div key={name} className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white uppercase">{name} AI</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      data.success ? 'bg-emerald-500/10 text-emerald-300' : 'bg-amber-500/10 text-amber-300'
                    }`}>
                      {data.success ? 'OK' : 'ERROR'}
                    </span>
                  </div>
                  {data.error && <div className="text-[10px] text-rose-300">{data.error}</div>}
                  {data.taskId && <div className="text-[10px] text-gray-400 font-mono">{data.taskId}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MusicPage;
