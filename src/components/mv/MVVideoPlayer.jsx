import React from 'react';
import { Film, Music, Download, Clock, Palette, Disc3, Copy, Share2 } from 'lucide-react';

/**
 * MVVideoPlayer - Renders the generated MV video with metadata cards.
 *
 * Props (MV-facing contract):
 *   result            - Generation result object {videoUrl, videoBlob, audioUrl, duration, colorPalette, totalScenes, lyrics, title, ...}
 *   videoUrl          - Explicit video URL override (falls back to result.videoUrl)
 *   videoBlob         - Explicit video Blob override (falls back to result.videoBlob)
 *   audioUrl          - Explicit audio URL override (falls back to result.audioUrl)
 *   duration          - Fallback duration in seconds
 *   colorPalette      - Fallback palette key
 *   onDownloadVideo   - Callback to download the video file
 *   onDownloadAudio   - Callback to download the audio track only
 *   onCopyText        - Callback to copy lyrics text
 *   onShare           - Callback to share the result
 *   t                 - i18n translation function
 */
function MVVideoPlayer({
  result,
  videoUrl,
  videoBlob,
  audioUrl,
  duration,
  colorPalette,
  onDownloadVideo,
  onDownloadAudio,
  onCopyText,
  onShare,
  t,
}) {
  const safeT = t || ((k) => k);
  const vUrl = videoUrl || result?.videoUrl;
  const vBlob = videoBlob || result?.videoBlob;
  const aUrl = audioUrl || result?.audioUrl;
  const dur = result?.duration || duration;
  const palette = result?.colorPalette || colorPalette;
  const scenes = result?.totalScenes || result?.timeline?.length || 0;

  return (
    <div className="mt-6 p-4 md:p-6 glass rounded-xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Film className="w-4 h-4 text-sky-400" />
          {safeT('mv.video_title')}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {onCopyText && result?.lyrics && (
            <button
              onClick={() => onCopyText(result.lyrics)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-xs text-gray-300"
              title={safeT('mv.copy_lyrics')}
            >
              <Copy className="w-3.5 h-3.5" />
              {safeT('mv.copy_lyrics')}
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-xs text-gray-300"
              title={safeT('mv.share')}
            >
              <Share2 className="w-3.5 h-3.5" />
              {safeT('mv.share')}
            </button>
          )}
          <button
            onClick={onDownloadAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-xs text-gray-300"
            title={safeT('mv.download_audio_title')}
          >
            <Music className="w-3.5 h-3.5" />
            {safeT('mv.download_audio')}
          </button>
          <button
            onClick={onDownloadVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-90 transition-colors text-xs text-white font-medium shadow-sm shadow-sky-500/30"
          >
            <Download className="w-3.5 h-3.5" />
            {safeT('mv.download_video')}
          </button>
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video shadow-md">
        <video
          src={vUrl}
          controls
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
          style={{ maxHeight: '70vh' }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Clock className="w-4 h-4 md:w-3.5 md:h-3.5 text-sky-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">{safeT('mv.duration_label')}</div>
          <div className="text-sm font-semibold text-white">{dur ? `${dur}s` : '-'}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Palette className="w-4 h-4 md:w-3.5 md:h-3.5 text-sky-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">{safeT('mv.palette_label')}</div>
          <div className="text-sm font-semibold text-white truncate">
            {safeT(`mv.${palette}`) || palette || '-'}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Film className="w-4 h-4 md:w-3.5 md:h-3.5 text-sky-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">{safeT('mv.scenes_label')}</div>
          <div className="text-sm font-semibold text-white">{scenes}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <Disc3 className="w-4 h-4 md:w-3.5 md:h-3.5 text-sky-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">{safeT('mv.size_label')}</div>
          <div className="text-sm font-semibold text-white">
            {vBlob ? `${(vBlob.size / 1024 / 1024).toFixed(1)} MB` : (aUrl ? 'Stream' : '-')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MVVideoPlayer;
