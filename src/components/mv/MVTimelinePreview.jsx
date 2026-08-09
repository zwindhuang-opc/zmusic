import React from 'react';
import { Film, Copy } from 'lucide-react';

/**
 * MVTimelinePreview - Renders the generated MV scene timeline and effects.
 *
 * Props:
 *   result  - {timeline: [{sceneId, scene, startTime, endTime, duration, transition}], effects: []}
 *   onCopy  - Callback to copy the timeline JSON
 *   t       - i18n translation function
 */
function MVTimelinePreview({ result, onCopy, t }) {
    if (!result) return null;
    const safeT = t || ((k) => k);

    const timeline = result.timeline || [];
    const effects = result.effects || [];

    return (
        <div className="mt-6 p-4 md:p-6 bg-white/80 rounded-xl border border-blue-200/60 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Film className="w-4 h-4 text-blue-500" />
                    {safeT('mv.timeline_section')}
                </h3>
                <button
                    onClick={() => onCopy && onCopy(JSON.stringify(result, null, 2))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/70 border border-blue-200/60 hover:bg-blue-50 transition-colors text-xs text-slate-600"
                >
                    <Copy className="w-3 h-3" />
                    {safeT('mv.copy_timeline')}
                </button>
            </div>

            <div className="space-y-3 md:space-y-4">
                {timeline.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            {safeT('mv.timeline_scene')}
                        </h4>
                        <div className="space-y-2">
                            {timeline.map((scene, i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/70 border border-blue-200/60 flex items-center gap-3">
                                    <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-sm md:text-xs font-bold text-white flex-shrink-0">
                                        {scene.sceneId || i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-medium text-slate-800 truncate">{scene.scene || `Scene ${i + 1}`}</div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                            {scene.startTime}s - {scene.endTime}s ({scene.duration}s)
                                        </div>
                                    </div>
                                    {scene.transition && (
                                        <div className="text-[10px] px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200/60 flex-shrink-0">
                                            {scene.transition}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {effects.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            {safeT('mv.timeline_effects')}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {effects.map((effect, i) => (
                                <span key={i} className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-200/60">
                                    {effect}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MVTimelinePreview;
