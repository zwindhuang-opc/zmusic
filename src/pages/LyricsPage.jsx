import React, { useState, useEffect } from 'react';
import { Mic, Sparkles, Loader, FileText, Cpu, Network, BookOpen, Settings as SettingsIcon } from 'lucide-react';
import api from '../services/api.client.js';

const METHODS = [
  { id: 'fsm', name: 'FSM Programming', desc: 'State machine transitions', icon: Cpu },
  { id: 'network_layer', name: 'Network Layers', desc: '4-layer composition', icon: Network },
  { id: 'muse', name: 'Muse Style', desc: 'Natural language commands', icon: BookOpen },
  { id: 'suno', name: 'Suno Style', desc: 'Structured parameters', icon: SettingsIcon }
];

function LyricsPage() {
  const [genres, setGenres] = useState([]);
  const [themes, setThemes] = useState([]);
  const [genre, setGenre] = useState('pop');
  const [theme, setTheme] = useState('love');
  const [method, setMethod] = useState('fsm');
  const [bpm, setBpm] = useState(120);
  const [subject, setSubject] = useState('我');
  const [object, setObject] = useState('你');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const data = await api.lyricsGenres();
      if (data.success) {
        setGenres(data.data.genres);
        setThemes(data.data.themes);
      }
    } catch (error) {
      console.error('Genres load failed:', error);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setResult(null);
    try {
      const params = { genre, theme, method, bpm, subject, object };
      const data = await api.agentLyrics(params);
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Lyrics Generator</h1>
            <p className="text-xs text-gray-400">Unicorn Agent with FSM, Network Layers, and Muse commands</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Generation Method</label>
            <div className="space-y-2">
              {METHODS.map(m => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                      method === m.id
                        ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30'
                        : 'bg-white/5 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-violet-400" />
                    <div>
                      <div className="text-xs font-medium text-white">{m.name}</div>
                      <div className="text-[10px] text-gray-400">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Genre</label>
            <div className="grid grid-cols-2 gap-2">
              {genres.map(g => (
                <button
                  key={g}
                  onClick={() => setGenre(g)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    genre === g
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Theme</label>
            <div className="grid grid-cols-2 gap-2">
              {themes.map(t => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    theme === t
                      ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="gradient-border p-5">
            <label className="text-xs font-medium text-gray-300 mb-3 block">Parameters</label>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Object</label>
                <input
                  type="text"
                  value={object}
                  onChange={(e) => setObject(e.target.value)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                  className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Lyrics
              </>
            )}
          </button>
        </div>

        <div className="col-span-2 gradient-border p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-pink-400" />
            Generated Content
          </h3>
          {!result && !isGenerating && (
            <div className="text-center py-20 text-gray-500">
              <Mic className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <div className="text-sm">Click "Generate Lyrics" to start</div>
            </div>
          )}
          {isGenerating && (
            <div className="text-center py-20">
              <Loader className="w-10 h-10 mx-auto mb-4 text-violet-400 animate-spin" />
              <div className="text-sm text-gray-400">Creating lyrics with {METHODS.find(m => m.id === method)?.name}...</div>
            </div>
          )}
          {result && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-violet-500/5 border border-violet-500/20">
                <div className="text-[10px] text-violet-300 uppercase tracking-wider mb-1">Method</div>
                <div className="text-sm text-white font-medium">{result.method?.toUpperCase()}</div>
              </div>

              {result.command && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Generated Command</div>
                  <pre className="text-xs text-pink-300 font-mono whitespace-pre-wrap break-words">{result.command}</pre>
                </div>
              )}

              {result.execution?.data && (
                <div className="p-4 rounded-lg bg-white/5 border border-white/5 max-h-96 overflow-y-auto">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Lyrics Output</div>
                  <pre className="text-sm text-white whitespace-pre-wrap font-sans leading-relaxed">{result.execution.data}</pre>
                </div>
              )}

              {result.stats && (
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(result.stats).map(([key, value]) => (
                    <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/5 text-center">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{key}</div>
                      <div className="text-sm text-white font-semibold mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LyricsPage;
