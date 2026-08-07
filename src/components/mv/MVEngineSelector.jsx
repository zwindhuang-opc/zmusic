import React from 'react';
import { Headphones, Cloud, Zap } from 'lucide-react';

const MV_ENGINES = [
  { id: 'muse', label: 'Muse AI', icon: Headphones, desc: 'Real song + vocals (14 credits)', color: 'from-fuchsia-500 to-purple-500' },
  { id: 'suno', label: 'Suno AI', icon: Cloud, desc: 'Real song + vocals (credits)', color: 'from-sky-500 to-violet-500' },
  { id: 'procedural', label: 'Preview (Free)', icon: Zap, desc: 'Synthetic preview music, no vocals', color: 'from-gray-500 to-gray-600' },
];

function MVEngineSelector({ engine, museCredits, museAvailable, sunoAvailable, onEngineChange }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-300 mb-2 block">Music Engine</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {MV_ENGINES.map(e => {
          const isAvailable = e.id === 'muse' ? museAvailable : e.id === 'suno' ? sunoAvailable : true;
          const isInsufficient = e.id === 'muse' && museCredits !== null && museCredits < 14;
          const disabled = !isAvailable || isInsufficient;
          return (
            <button
              key={e.id}
              onClick={() => onEngineChange(e.id)}
              disabled={disabled}
              className={`p-3 rounded-xl border text-left transition-all disabled:opacity-40 disabled:cursor-not-allowed ${engine === e.id
                ? 'border-cyan-400/50 bg-gradient-to-br ' + e.color + ' text-white'
                : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <e.icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{e.label}</span>
                {e.id === 'muse' && museCredits !== null && (
                  <span className="ml-auto text-[10px] opacity-70">{museCredits}cr</span>
                )}
              </div>
              <div className="text-[10px] opacity-80">{e.desc}</div>
              {!isAvailable && (
                <div className="text-[10px] text-red-300 mt-1">Not configured</div>
              )}
              {isInsufficient && (
                <div className="text-[10px] text-yellow-300 mt-1">Need 14+ credits</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default MVEngineSelector;
