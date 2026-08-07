import React from 'react';
import { Film, Copy } from 'lucide-react';

function MVTimelinePreview({ result, onCopy, t }) {
    return (
        <div className="gradient-border p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Film className="w-4 h-4 text-cyan-400" />
                    {t('mv.mv_timeline')}
                </h3>
                <button
                    onClick={() => onCopy(JSON.stringify(result, null, 2))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
                    title={t('common.copy')}
                >
                    <Copy className="w-3 h-3" />
                    {t('common.copy')}
                </button>
            </div>

            <div className="space-y-3 md:space-y-4">
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('mv.scene_timeline')}</h4>
                    <div className="space-y-2">
                        {result.timeline?.map((scene, i) => (
                            <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                <div className="w-10 h-10 md:w-8 md:h-8 rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center text-sm md:text-xs font-bold text-white">
                                    {scene.sceneId}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-white">{t(`mv.scene_${scene.scene}`) || scene.scene}</div>
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
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('mv.effects_label')}</h4>
                    <div className="flex flex-wrap gap-2">
                        {result.effects?.map((effect, i) => (
                            <span key={i} className="text-xs px-2 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                                {t(`effects.${effect}`) || effect}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MVTimelinePreview;
