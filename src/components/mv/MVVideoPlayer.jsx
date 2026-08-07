import React from 'react';
import { Film, Music, Download, Clock, Palette, Disc3 } from 'lucide-react';

function MVVideoPlayer({
  videoUrl,
  videoBlob,
  audioUrl,
  result,
  duration,
  videoRef,
  onDownloadVideo,
  onDownloadAudio,
  t,
  colorPalette,
}) {
  return (
    <div className="gradient-border p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Film className="w-4 h-4 text-cyan-400" />
          Your MV Video
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadAudio}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs text-gray-300"
            title="Download audio only"
          >
            <Music className="w-3.5 h-3.5" />
            Audio
          </button>
          <button
            onClick={onDownloadVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 transition-colors text-xs text-white font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            Download Video
          </button>
        </div>
      </div>

      <div className="relative w-full rounded-xl overflow-hidden bg-black aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          crossOrigin="anonymous"
          className="w-full h-full object-contain"
          style={{ maxHeight: '70vh' }}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <Clock className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">Duration</div>
          <div className="text-sm font-semibold text-white">{result?.duration || duration}s</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <Palette className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">Palette</div>
          <div className="text-sm font-semibold text-white">{t(`mv.${result?.colorPalette}`) || result?.colorPalette || colorPalette}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <Film className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">Scenes</div>
          <div className="text-sm font-semibold text-white">{result?.totalScenes || 0}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
          <Disc3 className="w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400 mb-1" />
          <div className="text-[10px] text-gray-500 uppercase">Size</div>
          <div className="text-sm font-semibold text-white">
            {videoBlob ? `${(videoBlob.size / 1024 / 1024).toFixed(1)} MB` : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MVVideoPlayer;
