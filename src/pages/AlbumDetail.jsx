import React, { useMemo, useState } from 'react';
import {
  FolderOpen, Music2, Share2, Trash2, ArrowLeft, Download,
  Play, Heart, Clock, Copy, Wand2, Upload, MoreHorizontal,
  Check, X, Settings,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useSongLibrary } from '../stores/songLibraryStore.jsx';
import { useGeneration } from '../stores/generationStore.jsx';

function fmtDur(sec) {
  if (!sec || isNaN(sec) || sec <= 0) return '--:--';
  const s = Math.round(sec);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
}

export default function AlbumDetail({ onNavigate, params }) {
  const { lang } = useTranslation();
  const isZh = lang === 'zh';
  const { albums, songs, updateAlbum, deleteAlbum, removeSongFromAlbum, toggleFavorite, incrementPlayCount, showToast } = useSongLibrary();
  const { copyToClipboard, setPendingData } = useGeneration();

  const albumId = params?.albumId;
  const album = useMemo(() => albums.find(a => a.id === albumId), [albums, albumId]);
  const albumSongs = useMemo(() => {
    if (!album) return [];
    return (album.song_ids || []).map(id => songs.find(s => s.id === id)).filter(Boolean);
  }, [album, songs]);

  const [playingId, setPlayingId] = useState(null);

  if (!album) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="gradient-border rounded-2xl p-10 text-center">
          <FolderOpen className="w-16 h-16 mx-auto mb-3 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">
            {isZh ? '歌集不存在' : 'Album not found'}
          </h2>
          <button
            onClick={() => onNavigate?.('SongLibrary')}
            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500"
          >
            <ArrowLeft className="w-3.5 h-3.5 inline mr-1" />
            {isZh ? '返回音乐库' : 'Back to Library'}
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = albumSongs.reduce((a, s) => a + Number(s.duration || 0), 0);

  const handlePlay = (s) => {
    if (!s.audio_url) {
      showToast?.(isZh ? '无音频' : 'No audio', 'error');
      return;
    }
    incrementPlayCount(s.id);
    setPlayingId(playingId === s.id ? null : s.id);
  };

  const shareAlbum = () => {
    const link = `${window.location.origin}/#album=${album.share_token || album.id}`;
    copyToClipboard(link);
    showToast?.(isZh ? '分享链接已复制到剪贴板' : 'Share link copied', 'success');
  };

  const handleRemix = (s) => {
    setPendingData({
      lyrics: s.lyrics || '',
      title: s.title || '',
      style: s.style || '',
      theme: s.theme || '',
      bpm: s.bpm,
      engine: s.engine,
      audioUrl: s.audio_url,
      sourceSongId: s.id,
    });
    onNavigate?.('RemixStudio');
  };

  const handlePublish = (s) => {
    setPendingData({
      title: s.title || '',
      lyrics: s.lyrics || '',
      style: s.style || '',
      theme: s.theme || '',
      audioUrl: s.audio_url,
      coverUrl: s.cover_data,
      songId: s.id,
    });
    onNavigate?.('PublishStudio');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <button
        onClick={() => onNavigate?.('SongLibrary')}
        className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        {isZh ? '返回音乐库' : 'Back to Library'}
      </button>

      <div className="gradient-border p-6 md:p-8 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start gap-6 md:gap-8 mb-6">
          <div className={`w-36 h-36 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br ${album.cover_color} flex items-center justify-center shadow-2xl flex-shrink-0`}>
            <span className="text-6xl md:text-7xl drop-shadow-xl">{album.cover_emoji || '🎵'}</span>
          </div>

          <div className="flex-1 min-w-0 w-full">
            <div className="text-xs font-semibold text-fuchsia-400 mb-2 uppercase tracking-wider">
              {isZh ? '歌集' : 'Album'}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 break-words">
              {album.title}
            </h1>
            {album.description && (
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{album.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-5">
              <span className="inline-flex items-center gap-1">
                <Music2 className="w-3.5 h-3.5" />
                {albumSongs.length} {isZh ? '首歌曲' : 'tracks'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {fmtDur(totalDuration)}
              </span>
              {album.is_public && (
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {isZh ? '公开' : 'Public'}
                </span>
              )}
              {(album.tags || []).map(tg => (
                <span key={tg} className="px-2 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300">
                  #{tg}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 shadow-lg shadow-fuchsia-500/30">
                <Play className="w-4 h-4" />
                {isZh ? '播放全部' : 'Play All'}
              </button>
              <button
                onClick={shareAlbum}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-200 bg-white/5 border border-white/10 hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 text-violet-400" />
                {isZh ? '分享' : 'Share'}
              </button>
              <button
                onClick={() => {
                  if (confirm(isZh ? '删除此歌集？歌曲将保留在音乐库中。' : 'Delete this album? Songs remain in library.')) {
                    deleteAlbum(album.id);
                    showToast?.(isZh ? '歌集已删除' : 'Album deleted', 'info');
                    setTimeout(() => onNavigate?.('SongLibrary'), 400);
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-300 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30"
              >
                <Trash2 className="w-4 h-4" />
                {isZh ? '删除歌集' : 'Delete Album'}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 pt-5">
          <div className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
            {isZh ? '曲目列表' : 'Tracklist'} · {albumSongs.length}
          </div>

          {albumSongs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <Music2 className="w-10 h-10 mx-auto mb-2 text-gray-600" />
              <p className="text-sm text-gray-400">
                {isZh ? '歌集还没有歌曲，到音乐库添加吧' : 'Album is empty — add songs from Library'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {albumSongs.map((s, idx) => {
                const isPlaying = playingId === s.id;
                return (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="w-7 text-xs font-mono text-gray-500 text-center flex-shrink-0">
                      {isPlaying ? <Play className="w-3.5 h-3.5 text-fuchsia-400 mx-auto" /> : (idx + 1).toString().padStart(2, '0')}
                    </div>
                    <button
                      onClick={() => handlePlay(s)}
                      disabled={!s.audio_url}
                      className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/50 to-fuchsia-500/50 flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
                    >
                      {isPlaying
                        ? <Play className="w-4 h-4 text-white" />
                        : <Play className="w-4 h-4 text-white ml-0.5" />
                      }
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-white truncate">
                        {s.title || (isZh ? '未命名' : 'Untitled')}
                      </div>
                      <div className="text-[10.5px] text-gray-500 flex items-center gap-2 flex-wrap">
                        <span className="capitalize">{s.engine}</span>
                        {s.style && <span className="text-pink-300/70 truncate max-w-[180px]">{s.style}</span>}
                        <span className="font-mono">{fmtDur(s.duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleFavorite(s.id)}
                        className={`p-1.5 rounded-lg ${s.favorite ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/5'}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${s.favorite ? 'fill-pink-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleRemix(s)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/5"
                        title={isZh ? 'Remix' : 'Remix'}
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePublish(s)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/5"
                        title={isZh ? '发布' : 'Publish'}
                      >
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          removeSongFromAlbum(album.id, s.id);
                          showToast?.(isZh ? '已从歌集移除' : 'Removed from album', 'info');
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/5"
                        title={isZh ? '移除' : 'Remove'}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-[10.5px] font-mono text-gray-600 w-12 text-right flex-shrink-0 hidden md:block">
                      {fmtDur(s.duration)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
