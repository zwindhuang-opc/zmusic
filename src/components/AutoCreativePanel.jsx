/**
 * AutoCreativePanel — Real-time display of the AI's creative thinking process
 *
 * Shows during AUTO mode: for each song iteration, displays
 *   • theme & inspiration (why this theme was chosen)
 *   • style philosophy (instruments, mood, color)
 *   • lyrics snippet
 *   • musical parameters (BPM, key) with reasoning
 *   • the exact command sent to the platform API
 *
 * This makes the AI's "creative process" transparent to the user,
 * not just a black box that spits out songs.
 */
import React, { useEffect, useRef } from 'react';
import { Brain, X, Sparkles, Music2 } from 'lucide-react';

export default function AutoCreativePanel({
  open,
  thoughts = [],
  autoRunning = false,
  autoCount = 0,
  engineName = 'AI',
  onClose,
}) {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom when new thoughts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thoughts.length]);

  if (!open) return null;

  const latest = thoughts[thoughts.length - 1];

  return (
    <div className="fixed left-6 top-20 bottom-24 w-[420px] max-w-[calc(100vw-3rem)] z-40 flex flex-col bg-[#0a0a14]/95 backdrop-blur-md border border-violet-500/30 rounded-2xl shadow-2xl shadow-violet-900/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center ${autoRunning ? 'animate-pulse' : ''}`}>
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              {engineName} 创作思维
              {autoRunning && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ● LIVE
                </span>
              )}
            </div>
            <div className="text-[10px] text-gray-400">
              已创作 {autoCount} 首 · {thoughts.length} 条思考记录
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="收起面板"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* Thought stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {thoughts.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Sparkles className="w-8 h-8 text-violet-400/50 mb-2" />
            <p className="text-xs text-gray-500">
              {autoRunning
                ? '正在构思第一首歌的创作思路...'
                : 'AUTO 模式启动后，这里会实时显示 AI 如何思考每一首歌的主题、歌词、风格与参数选择。'}
            </p>
          </div>
        )}

        {thoughts.map((thought, idx) => (
          <div
            key={idx}
            className={`rounded-xl border p-3 transition-all ${
              idx === thoughts.length - 1
                ? 'border-violet-500/40 bg-violet-500/5 shadow-lg shadow-violet-500/10'
                : 'border-white/5 bg-white/[0.02]'
            }`}
          >
            {/* Iteration header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Music2 className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-xs font-bold text-violet-300">
                  第 {thought.iteration} 首 · {thought.title}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">{thought.timestamp}</span>
            </div>

            {/* Thought sections */}
            <div className="space-y-2">
              {thought.sections.map((section, sIdx) => (
                <div key={sIdx} className="text-[11px]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{section.icon}</span>
                    <span className="font-semibold text-gray-300">{section.label}</span>
                    {section.title && (
                      <span className="text-gray-400">· {section.title}</span>
                    )}
                  </div>
                  {section.lines.map((line, lIdx) => (
                    <div
                      key={lIdx}
                      className="ml-5 text-gray-400 leading-relaxed whitespace-pre-wrap"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer hint */}
      {autoRunning && latest && (
        <div className="px-4 py-2 border-t border-violet-500/20 bg-violet-500/5">
          <div className="flex items-center gap-2 text-[10px] text-violet-300/70">
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            正在将「{latest.title}」发送给 {engineName} 生成...
          </div>
        </div>
      )}
    </div>
  );
}
