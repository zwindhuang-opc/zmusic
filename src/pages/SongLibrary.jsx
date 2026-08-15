import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
  Music2, FolderOpen, Search, SlidersHorizontal, Star, Play, Pause,
  Plus, Download, Trash2, Copy, Wand2, Upload, Heart, Clock, Headphones,
  Sparkles, Cloud, X, Check, ChevronDown, ChevronUp, MoreHorizontal,
  Share2, Settings, Package, FileJson, Disc3, AlertCircle, Filter,
} from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { useGeneration } from '../stores/generationStore.jsx';
import { useSongLibrary } from '../stores/songLibraryStore.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

let PersistentAudioPlayer = null;
try {
  const m = require('../components/PersistentAudioPlayer.jsx');
  PersistentAudioPlayer = m.default || m;
} catch (e) {
  PersistentAudioPlayer = null;
}

const ENGINE_META = {
  muse: { label: 'Muse AI', color: 'from-blue-500 to-cyan-600', icon: <Sparkles className="w-3.5 h-3.5" /> },
  suno: { label: 'Suno AI', color: 'from-emerald-500 to-teal-600', icon: <Cloud className="w-3.5 h-3.5" /> },
  melo: { label: 'Melo AI', color: 'from-amber-500 to-orange-600', icon: <Headphones className="w-3.5 h-3.5" /> },
  mv: { label: 'MV', color: 'from-violet-500 to-fuchsia-700', icon: <Disc3 className="w-3.5 h-3.5" /> },
  unknown: { label: 'Unknown', color: 'from-gray-500 to-gray-700', icon: <Music2 className="w-3.5 h-3.5" /> },
};

const ALBUM_COVER_PRESETS = [
  { color: 'from-violet-500 to-pink-500', emoji: '🎵', label: '紫粉' },
  { color: 'from-blue-500 to-cyan-500', emoji: '🌊', label: '蓝青' },
  { color: 'from-emerald-500 to-teal-500', emoji: '🌿', label: '翠绿' },
  { color: 'from-amber-500 to-orange-500', emoji: '🔥', label: '暖橙' },
  { color: 'from-rose-500 to-red-500', emoji: '❤️', label: '玫红' },
  { color: 'from-indigo-500 to-purple-600', emoji: '✨', label: '靛紫' },
  { color: 'from-sky-400 to-blue-600', emoji: '☁️', label: '天蓝' },
  { color: 'from-fuchsia-500 to-purple-600', emoji: '🎨', label: '洋紫' },
];

function fmtDur(sec) {
  if (!sec || isNaN(sec) || sec <= 0) return '--:--';
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function fmtDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`;
    if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} 天前`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch (e) { return ''; }
}

export default function SongLibrary({ onNavigate }) {
  const { lang } = useTranslation();
  const isZh = lang === 'zh';
  const { songs, albums, createAlbum, updateAlbum, deleteAlbum, addSongToAlbum, removeSongFromAlbum, toggleFavorite, deleteSong, incrementPlayCount, exportLibrary, migrateFromHistory, showToast } = useSongLibrary();
  const { history, copyToClipboard, setPendingData } = useGeneration();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [openAlbumId, setOpenAlbumId] = useState(null);
  const [showCreateAlbum, setShowCreateAlbum] = useState(false);
  const [addAlbumForSongId, setAddAlbumForSongId] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [migrateDone, setMigrateDone] = useState(false);

  const [newAlbum, setNewAlbum] = useState({
    title: '',
    description: '',
    cover_color: 'from-violet-500 to-pink-500',
    cover_emoji: '🎵',
    tags: [],
    is_public: false,
  });

  useEffect(() => {
    if (!migrateDone && songs.length === 0) {
      const r = migrateFromHistory(history);
      if (r && r.migrated > 0) {
        showToast?.(isZh ? `已从历史记录导入 ${r.migrated} 首歌曲` : `Imported ${r.migrated} songs from history`, 'success');
      }
      setMigrateDone(true);
    }
  }, [songs.length, migrateDone]);

  const tabs = [
    { id: 'all', label: isZh ? '全部' : 'All', icon: <Music2 className="w-3.5 h-3.5" /> },
    { id: 'muse', label: 'Muse', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'suno', label: 'Suno', icon: <Cloud className="w-3.5 h-3.5" /> },
    { id: 'melo', label: 'Melo', icon: <Headphones className="w-3.5 h-3.5" /> },
    { id: 'mv', label: 'MV', icon: <Disc3 className="w-3.5 h-3.5" /> },
    { id: 'favorites', label: isZh ? '收藏' : 'Favorites', icon: <Heart className="w-3.5 h-3.5" /> },
    { id: 'albums', label: isZh ? '歌集' : 'Albums', icon: <FolderOpen className="w-3.5 h-3.5" /> },
  ];

  const filteredSongs = useMemo(() => {
    let list = [...songs];
    if (activeTab === 'favorites') list = list.filter(s => s.favorite);
    else if (activeTab === 'albums') list = [];
    else if (activeTab !== 'all') list = list.filter(s => s.engine === activeTab);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.style || '').toLowerCase().includes(q) ||
        (s.theme || '').toLowerCase().includes(q) ||
        (s.lyrics || '').toLowerCase().includes(q) ||
        (s.engine || '').toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case 'engine': list.sort((a, b) => (a.engine || '').localeCompare(b.engine || '')); break;
      case 'favorite': list.sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite)); break;
      case 'duration': list.sort((a, b) => Number(b.duration || 0) - Number(a.duration || 0)); break;
      case 'date':
      default: list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }
    return list;
  }, [songs, activeTab, searchQuery, sortBy]);

  const openAlbum = albums.find(a => a.id === openAlbumId);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredSongs.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredSongs.map(s => s.id)));
  };

  const handlePlay = (song) => {
    if (!song.audio_url) {
      showToast?.(isZh ? '该歌曲没有音频文件' : 'No audio available for this song', 'error');
      return;
    }
    incrementPlayCount(song.id);
    setPlayingId(playingId === song.id ? null : song.id);
  };

  const handleRemix = (song) => {
    setPendingData({
      lyrics: song.lyrics || '',
      title: song.title || '',
      style: song.style || '',
      theme: song.theme || '',
      bpm: song.bpm || undefined,
      duration: song.duration || undefined,
      engine: song.engine,
      sourceSongId: song.id,
      audioUrl: song.audio_url,
    });
    onNavigate?.('RemixStudio');
  };

  const handlePublish = (song) => {
    setPendingData({
      lyrics: song.lyrics || '',
      title: song.title || '',
      style: song.style || '',
      theme: song.theme || '',
      bpm: song.bpm || undefined,
      engine: song.engine,
      audioUrl: song.audio_url,
      coverUrl: song.cover_data,
      songId: song.id,
    });
    onNavigate?.('PublishStudio');
  };

  const handleExportJson = () => {
    const data = exportLibrary();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zmusic-library-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast?.(isZh ? '已导出 JSON 备份' : 'JSON backup exported', 'success');
  };

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) {
      showToast?.(isZh ? '请先选择要导出的歌曲' : 'Select songs first', 'error');
      return;
    }
    const selectedSongs = songs.filter(s => selectedIds.has(s.id));
    try {
      const JSZip = await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm');
      const zip = new JSZip.default();
      for (const s of selectedSongs) {
        const safeName = (s.title || 'song').replace(/[^\w\u4e00-\u9fa5-]/g, '_').slice(0, 40) + `_${s.id.slice(-4)}`;
        if (s.audio_url) {
          try {
            const r = await fetch(s.audio_url);
            const ab = await r.arrayBuffer();
            zip.file(`${safeName}.mp3`, ab);
          } catch (_) {}
        }
        const meta = {
          id: s.id,
          title: s.title,
          engine: s.engine,
          style: s.style,
          theme: s.theme,
          bpm: s.bpm,
          duration: s.duration,
          language: s.language,
          created_at: s.created_at,
          favorite: s.favorite,
          play_count: s.play_count,
          publishing_status: s.publishing_status,
        };
        zip.file(`${safeName}.metadata.json`, JSON.stringify(meta, null, 2));
        if (s.lyrics) zip.file(`${safeName}.lyrics.txt`, s.lyrics);
      }
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zmusic-bundle-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      showToast?.(isZh ? `已打包 ${selectedSongs.length} 首` : `Bundled ${selectedSongs.length} songs`, 'success');
    } catch (e) {
      showToast?.(isZh ? '打包失败：' + e.message : 'Bundle failed: ' + e.message, 'error');
    }
  };

  const handleCreateAlbum = () => {
    if (!newAlbum.title.trim()) {
      showToast?.(isZh ? '请输入歌集标题' : 'Please enter album title', 'error');
      return;
    }
    const created = createAlbum({ ...newAlbum, title: newAlbum.title.trim(), description: newAlbum.description.trim() });
    setShowCreateAlbum(false);
    setNewAlbum({ title: '', description: '', cover_color: 'from-violet-500 to-pink-500', cover_emoji: '🎵', tags: [], is_public: false });
    if (addAlbumForSongId && created) {
      addSongToAlbum(created.id, addAlbumForSongId);
      setAddAlbumForSongId(null);
      showToast?.(isZh ? '已添加到新歌集' : 'Added to new album', 'success');
    } else {
      showToast?.(isZh ? '歌集已创建' : 'Album created', 'success');
    }
  };

  const selectedAlbum = albums.find(a => a.id === openAlbumId);
  const albumSongs = selectedAlbum
    ? (selectedAlbum.song_ids || []).map(id => songs.find(s => s.id === id)).filter(Boolean)
    : [];

  const emptyState = songs.length === 0 && !migrateDone;
  const filteredEmpty = filteredSongs.length === 0 && activeTab !== 'albums';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      <div className="gradient-border p-4 md:p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 flex items-center justify-center shadow-xl shadow-fuchsia-500/30">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isZh ? '我的音乐库' : 'Song Library'}
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {isZh
                  ? `共 ${songs.length} 首歌曲 · ${albums.length} 个歌集`
                  : `${songs.length} songs · ${albums.length} albums`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreateAlbum(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 shadow-lg shadow-violet-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              {isZh ? '新建歌集' : 'New Album'}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setOpenAlbumId(null); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id
                ? 'bg-gradient-to-r from-fuchsia-500/20 to-violet-500/20 border border-fuchsia-500/40 text-fuchsia-200'
                : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'favorites' && songs.filter(s => s.favorite).length > 0 && (
                <span className="px-1 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px]">
                  {songs.filter(s => s.favorite).length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isZh ? '搜索标题、风格、歌词...' : 'Search title, style, lyrics...'}
              className="w-full bg-black/30 border border-white/10 focus:border-fuchsia-500/40 focus:outline-none rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-gray-600"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => document.getElementById('sortMenu')?.classList.toggle('hidden')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {sortBy === 'date' && (isZh ? '按时间' : 'By Date')}
              {sortBy === 'engine' && (isZh ? '按引擎' : 'By Engine')}
              {sortBy === 'favorite' && (isZh ? '按收藏' : 'By Favorite')}
              {sortBy === 'duration' && (isZh ? '按时长' : 'By Duration')}
              <ChevronDown className="w-3 h-3" />
            </button>
            <div id="sortMenu" className="hidden absolute right-0 top-full mt-1 z-30 min-w-[140px] rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl overflow-hidden py-1">
              {[
                { id: 'date', zh: '按创建时间', en: 'Created At' },
                { id: 'engine', zh: '按引擎', en: 'Engine' },
                { id: 'favorite', zh: '按收藏优先', en: 'Favorites First' },
                { id: 'duration', zh: '按时长', en: 'Duration' },
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => { setSortBy(opt.id); document.getElementById('sortMenu')?.classList.add('hidden'); }}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${sortBy === opt.id ? 'bg-fuchsia-500/20 text-fuchsia-200' : 'text-gray-300 hover:bg-white/5'}`}
                >
                  {isZh ? opt.zh : opt.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab !== 'albums' && (
          <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/5 via-violet-500/5 to-pink-500/5 border border-fuchsia-500/10 p-3 mb-5 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Filter className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>{isZh
                ? `显示 ${filteredSongs.length} / ${songs.length} 首`
                : `Showing ${filteredSongs.length} / ${songs.length} songs`}
              </span>
              {selectedIds.size > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
                  {selectedIds.size} {isZh ? '选中' : 'selected'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {filteredSongs.length > 0 && (
                <button
                  onClick={toggleSelectAll}
                  className="text-[11px] px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                >
                  {selectedIds.size === filteredSongs.length ? (isZh ? '取消全选' : 'Deselect All') : (isZh ? '全选' : 'Select All')}
                </button>
              )}
              <button
                onClick={handleExportSelected}
                disabled={selectedIds.size === 0}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-300 border border-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Package className="w-3 h-3" />
                {isZh ? '导出 ZIP' : 'Export ZIP'}
              </button>
              <button
                onClick={handleExportJson}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 text-violet-300 border border-violet-500/30"
              >
                <FileJson className="w-3 h-3" />
                {isZh ? '备份 JSON' : 'Backup JSON'}
              </button>
            </div>
          </div>
        )}

        {(activeTab === 'all' || activeTab === 'albums') && albums.length > 0 && !openAlbumId && (
          <div className="mb-6">
            <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-fuchsia-400" />
              {isZh ? '📁 我的歌集' : '📁 My Albums'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {albums.map(al => {
                const count = (al.song_ids || []).length;
                return (
                  <button
                    key={al.id}
                    onClick={() => setOpenAlbumId(al.id)}
                    className="text-left group relative rounded-xl border border-white/10 overflow-hidden hover:border-fuchsia-500/40 transition-all hover:shadow-lg hover:shadow-fuchsia-500/10"
                  >
                    <div className={`aspect-square bg-gradient-to-br ${al.cover_color} flex items-center justify-center relative`}>
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[11px] text-white font-semibold px-2 py-1 rounded-lg bg-black/40 backdrop-blur-sm">
                          {isZh ? '打开' : 'Open'}
                        </span>
                      </div>
                      <span className="text-5xl drop-shadow-lg">{al.cover_emoji || '🎵'}</span>
                      {al.is_public && (
                        <span className="absolute top-2 right-2 text-[9px] px-1 py-0.5 rounded bg-white/20 text-white backdrop-blur-sm">
                          {isZh ? '公开' : 'Public'}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 bg-[#0a0a14]/60">
                      <div className="text-[13px] font-semibold text-white truncate">{al.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <Music2 className="w-2.5 h-2.5" />
                        {count} {isZh ? '首' : 'tracks'}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => setShowCreateAlbum(true)}
                className="aspect-auto rounded-xl border-2 border-dashed border-white/10 hover:border-fuchsia-500/40 text-gray-500 hover:text-fuchsia-300 transition-all flex flex-col items-center justify-center p-4 min-h-[120px]"
              >
                <Plus className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{isZh ? '新建歌集' : 'New Album'}</span>
              </button>
            </div>
          </div>
        )}

        {openAlbum && (
          <div className="mb-6 rounded-xl bg-gradient-to-br from-violet-500/8 via-fuchsia-500/5 to-pink-500/8 border border-violet-500/20 p-4">
            <div className="flex items-start gap-4 mb-4">
              <div className={`w-20 h-20 md:w-24 md:h-24 rounded-xl bg-gradient-to-br ${openAlbum.cover_color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                <span className="text-4xl md:text-5xl">{openAlbum.cover_emoji}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white truncate">{openAlbum.title}</h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {openAlbum.share_token && (
                      <button
                        onClick={() => {
                          copyToClipboard(`${window.location.origin}/#album=${openAlbum.share_token}`);
                          showToast?.(isZh ? '分享链接已复制' : 'Share link copied', 'success');
                        }}
                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                        title={isZh ? '复制分享链接' : 'Copy share link'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(isZh ? '确定删除此歌集？歌曲本身不会被删除' : 'Delete this album? Songs themselves will not be deleted')) {
                          deleteAlbum(openAlbum.id);
                          setOpenAlbumId(null);
                          showToast?.(isZh ? '歌集已删除' : 'Album deleted', 'info');
                        }
                      }}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setOpenAlbumId(null)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {openAlbum.description && (
                  <p className="text-[11px] text-gray-400 mb-2">{openAlbum.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">
                    <Music2 className="w-2.5 h-2.5 inline mr-0.5" />
                    {albumSongs.length} {isZh ? '首歌曲' : 'songs'}
                  </span>
                  {(openAlbum.tags || []).map(tg => (
                    <span key={tg} className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300">#{tg}</span>
                  ))}
                  {openAlbum.is_public && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">{isZh ? '公开' : 'Public'}</span>
                  )}
                </div>
              </div>
            </div>
            {albumSongs.length === 0 ? (
              <div className="rounded-lg bg-white/[0.02] border border-dashed border-white/10 p-6 text-center text-xs text-gray-500">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <div>{isZh ? '歌集还空着，到下方歌曲列表点击「添加到歌集」吧' : 'Album is empty — add songs from the list below'}</div>
              </div>
            ) : (
              <SongList
                songs={albumSongs}
                playingId={playingId}
                selectedIds={selectedIds}
                onPlay={handlePlay}
                onToggleFav={toggleFavorite}
                onSelect={toggleSelect}
                onCopy={async (s) => copyToClipboard(s.title || '')}
                onDelete={(s) => {
                  if (confirm(isZh ? '从歌集移除？' : 'Remove from album?')) {
                    removeSongFromAlbum(openAlbum.id, s.id);
                    showToast?.(isZh ? '已从歌集移除' : 'Removed from album', 'info');
                  }
                }}
                onRemix={handleRemix}
                onPublish={handlePublish}
                onAddToAlbum={(sid) => setAddAlbumForSongId(sid)}
                albums={albums}
                addSongToAlbum={addSongToAlbum}
                showToast={showToast}
                isZh={isZh}
                inAlbum={openAlbum.id}
                removeSongFromAlbum={removeSongFromAlbum}
              />
            )}
          </div>
        )}

        {activeTab !== 'albums' && (
          emptyState || filteredEmpty ? (
            <div className="rounded-xl bg-white/[0.02] border border-dashed border-white/10 p-10 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 flex items-center justify-center">
                <Music2 className="w-10 h-10 text-fuchsia-400 opacity-70" />
              </div>
              <div className="text-base font-bold text-white mb-1">
                {songs.length === 0 ? (isZh ? '还没有歌曲' : 'No songs yet') : (isZh ? '没有匹配的结果' : 'No matches found')}
              </div>
              <p className="text-xs text-gray-500 mb-4 max-w-md mx-auto">
                {songs.length === 0
                  ? (isZh ? '在 Muse / Suno / Melo 页面生成音乐，或开启 AUTO 模式批量创作，作品会自动收录到这里' : 'Generate music on Muse / Suno / Melo or run AUTO mode — songs appear here automatically')
                  : (isZh ? '尝试更改搜索词、筛选条件或切换标签页' : 'Try adjusting search, filters, or switch tabs')}
              </p>
              {songs.length === 0 && (
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <button onClick={() => onNavigate?.('MusePage')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-blue-500 to-cyan-500">
                    <Sparkles className="w-3 h-3 inline mr-1" />{isZh ? '去 Muse 创作' : 'Go Create on Muse'}
                  </button>
                  <button onClick={() => onNavigate?.('SunoPage')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500">
                    <Cloud className="w-3 h-3 inline mr-1" />{isZh ? '去 Suno 创作' : 'Go Create on Suno'}
                  </button>
                  <button onClick={() => onNavigate?.('MeloPage')} className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500">
                    <Headphones className="w-3 h-3 inline mr-1" />{isZh ? '去 Melo 创作' : 'Go Create on Melo'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <SongList
              songs={filteredSongs}
              playingId={playingId}
              selectedIds={selectedIds}
              onPlay={handlePlay}
              onToggleFav={toggleFavorite}
              onSelect={toggleSelect}
              onCopy={async (s) => copyToClipboard(s.title || '')}
              onDelete={(s) => {
                if (confirm(isZh ? '确定删除此歌曲？此操作不可撤销。' : 'Delete this song? Cannot be undone.')) {
                  deleteSong(s.id);
                  showToast?.(isZh ? '已删除' : 'Deleted', 'info');
                }
              }}
              onRemix={handleRemix}
              onPublish={handlePublish}
              onAddToAlbum={(sid) => setAddAlbumForSongId(sid)}
              albums={albums}
              addSongToAlbum={addSongToAlbum}
              showToast={showToast}
              isZh={isZh}
            />
          )
        )}
      </div>

      {addAlbumForSongId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl gradient-border p-5 animate-fade-in bg-[#0a0a14]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">
                {isZh ? '添加到歌集' : 'Add to Album'}
              </h3>
              <button onClick={() => setAddAlbumForSongId(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>
            {albums.length === 0 ? (
              <div className="text-center py-6">
                <FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                <p className="text-xs text-gray-500 mb-3">{isZh ? '还没有歌集，先创建一个吧' : 'No albums yet — create one first'}</p>
                <button onClick={() => { setShowCreateAlbum(true); }} className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  <Plus className="w-3 h-3 inline mr-1" />{isZh ? '新建歌集' : 'Create Album'}
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {albums.map(al => {
                  const hasIt = (al.song_ids || []).includes(addAlbumForSongId);
                  return (
                    <button
                      key={al.id}
                      onClick={() => {
                        if (hasIt) {
                          removeSongFromAlbum(al.id, addAlbumForSongId);
                          showToast?.(isZh ? '已从歌集移除' : 'Removed', 'info');
                        } else {
                          addSongToAlbum(al.id, addAlbumForSongId);
                          showToast?.(isZh ? '已添加到歌集' : 'Added to album', 'success');
                        }
                        setAddAlbumForSongId(null);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all ${hasIt ? 'bg-fuchsia-500/10 border-fuchsia-500/40' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06]'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${al.cover_color} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-xl">{al.cover_emoji}</span>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold text-white truncate">{al.title}</div>
                        <div className="text-[10.5px] text-gray-500">
                          {(al.song_ids || []).length} {isZh ? '首歌曲' : 'songs'}
                        </div>
                      </div>
                      {hasIt ? (
                        <Check className="w-4 h-4 text-fuchsia-400" />
                      ) : (
                        <Plus className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setShowCreateAlbum(true); }}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-white/10 hover:border-fuchsia-500/40 text-gray-500 hover:text-fuchsia-300 flex items-center justify-center gap-1.5 text-xs font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />{isZh ? '新建歌集' : 'New Album'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCreateAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl gradient-border p-5 animate-fade-in bg-[#0a0a14] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 flex items-center justify-center text-white">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {isZh ? '新建歌集' : 'Create New Album'}
                </h3>
              </div>
              <button onClick={() => setShowCreateAlbum(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isZh ? '标题 *' : 'Title *'}
                </label>
                <input
                  value={newAlbum.title}
                  onChange={e => setNewAlbum(p => ({ ...p, title: e.target.value }))}
                  placeholder={isZh ? '给歌集起个名字，如：我的夏日回忆' : 'Name your album, e.g. Summer Vibes'}
                  className="w-full bg-black/30 border border-white/10 focus:border-fuchsia-500/50 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  {isZh ? '描述' : 'Description'}
                </label>
                <textarea
                  value={newAlbum.description}
                  onChange={e => setNewAlbum(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder={isZh ? '简介、主题、创作灵感...' : 'About this collection...'}
                  className="w-full bg-black/30 border border-white/10 focus:border-fuchsia-500/50 focus:outline-none rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  {isZh ? '封面风格' : 'Cover Style'}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ALBUM_COVER_PRESETS.map(pr => (
                    <button
                      key={pr.color}
                      onClick={() => setNewAlbum(p => ({ ...p, cover_color: pr.color, cover_emoji: pr.emoji }))}
                      className={`relative aspect-square rounded-xl bg-gradient-to-br ${pr.color} flex items-center justify-center transition-all ${newAlbum.cover_color === pr.color ? 'ring-2 ring-white/60 scale-[1.02]' : 'hover:scale-[1.02]'}`}
                    >
                      <span className="text-2xl drop-shadow">{pr.emoji}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Settings className="w-3 h-3 text-fuchsia-400" />
                    {isZh ? '公开可见' : 'Public'}
                  </div>
                  <div className="text-[10.5px] text-gray-500 mt-0.5">
                    {isZh ? '允许通过链接分享此歌集' : 'Allow share-link access'}
                  </div>
                </div>
                <button
                  onClick={() => setNewAlbum(p => ({ ...p, is_public: !p.is_public }))}
                  className={`relative w-11 h-6 rounded-full transition-all ${newAlbum.is_public ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500' : 'bg-white/10'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${newAlbum.is_public ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setShowCreateAlbum(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm text-gray-300"
              >
                {isZh ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateAlbum}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-400 hover:to-pink-500 shadow-lg shadow-fuchsia-500/30 flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                {isZh ? '创建' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {PersistentAudioPlayer && (
        <Suspense fallback={null}>
          <PersistentAudioPlayer />
        </Suspense>
      )}
    </div>
  );
}

function SongList({
  songs, playingId, selectedIds, onPlay, onToggleFav, onSelect,
  onCopy, onDelete, onRemix, onPublish, onAddToAlbum,
  albums, addSongToAlbum, showToast, isZh, inAlbum, removeSongFromAlbum,
}) {
  const [menuOpen, setMenuOpen] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-song-menu]')) setMenuOpen(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="space-y-2">
      {songs.map(song => {
        const engine = ENGINE_META[song.engine] || ENGINE_META.unknown;
        const isPlaying = playingId === song.id;
        const isSelected = selectedIds.has(song.id);
        return (
          <div
            key={song.id}
            className={`rounded-xl border transition-all ${isSelected
              ? 'bg-violet-500/10 border-violet-500/40'
              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
              }`}
          >
            <div className="flex items-center gap-2 md:gap-3 p-2.5 md:p-3">
              <button
                onClick={() => onSelect?.(song.id)}
                className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${isSelected ? 'bg-violet-500 border-violet-400' : 'border-white/20 hover:border-white/40'}`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>

              <button
                onClick={() => onPlay(song)}
                disabled={!song.audio_url}
                className={`w-10 h-10 md:w-11 md:h-11 rounded-lg flex-shrink-0 flex items-center justify-center transition-all ${song.cover_data
                  ? 'bg-cover bg-center'
                  : `bg-gradient-to-br ${engine.color}`
                  } ${song.audio_url ? 'hover:scale-[1.03] cursor-pointer shadow-md' : 'opacity-60 cursor-not-allowed'}`}
                style={song.cover_data ? { backgroundImage: `url(${song.cover_data})` } : undefined}
                title={isZh ? '播放' : 'Play'}
              >
                {song.audio_url && (
                  <div className={`w-full h-full rounded-lg bg-black/40 flex items-center justify-center backdrop-blur-[1px] ${isPlaying ? 'bg-black/60' : ''}`}>
                    {isPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
                  </div>
                )}
                {!song.audio_url && <AlertCircle className="w-4 h-4 text-white/60" />}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5 min-w-0">
                  <div className="text-[13px] md:text-sm font-semibold text-white truncate min-w-0">
                    {song.title || (isZh ? '未命名' : 'Untitled')}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap text-[10px] md:text-[11px]">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gradient-to-r ${engine.color} bg-opacity-10 text-white/90 font-medium`}>
                    {engine.icon}
                    {engine.label}
                  </span>
                  {song.style && <span className="text-pink-300/80 truncate max-w-[150px]">🎨 {song.style}</span>}
                  {song.bpm && <span className="font-mono text-gray-400">♩ {song.bpm}</span>}
                  <span className="font-mono text-gray-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />{fmtDur(song.duration)}
                  </span>
                  <span className="text-gray-600 flex items-center gap-1">
                    {fmtDate(song.created_at)}
                  </span>
                  {song.play_count > 0 && (
                    <span className="text-gray-600">▶ {song.play_count}</span>
                  )}
                </div>
                {isPlaying && song.audio_url && (
                  <audio controls autoPlay className="w-full h-6 mt-1.5" src={song.audio_url} onPause={() => onPlay(song)} />
                )}
              </div>

              <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0">
                <button
                  onClick={() => onToggleFav(song.id)}
                  className={`p-1.5 md:p-2 rounded-lg transition-colors ${song.favorite ? 'text-pink-400 bg-pink-500/10' : 'text-gray-500 hover:text-pink-400 hover:bg-pink-500/5'}`}
                  title={isZh ? '收藏' : 'Favorite'}
                >
                  <Star className={`w-3.5 h-3.5 md:w-4 md:h-4 ${song.favorite ? 'fill-pink-400' : ''}`} />
                </button>

                <button
                  onClick={() => onAddToAlbum(song.id)}
                  className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:text-fuchsia-400 hover:bg-fuchsia-500/5 transition-colors hidden sm:inline-flex"
                  title={isZh ? '添加到歌集' : 'Add to Album'}
                >
                  <FolderOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => onCopy(song)}
                  className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:text-violet-400 hover:bg-violet-500/5 transition-colors hidden md:inline-flex"
                  title={isZh ? '复制标题' : 'Copy Title'}
                >
                  <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => onRemix(song)}
                  className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:text-amber-400 hover:bg-amber-500/5 transition-colors"
                  title={isZh ? 'Remix' : 'Remix'}
                >
                  <Wand2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>

                <button
                  onClick={() => onPublish(song)}
                  className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/5 transition-colors"
                  title={isZh ? '发布' : 'Publish'}
                >
                  <Upload className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>

                <div className="relative" data-song-menu>
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === song.id ? null : song.id); }}
                    className="p-1.5 md:p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  {menuOpen === song.id && (
                    <div className="absolute right-0 top-full mt-1 z-30 min-w-[140px] rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl overflow-hidden py-1">
                      <button
                        onClick={() => { onCopy(song); setMenuOpen(null); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2 md:hidden"
                      >
                        <Copy className="w-3 h-3" />{isZh ? '复制标题' : 'Copy title'}
                      </button>
                      <button
                        onClick={() => { onAddToAlbum(song.id); setMenuOpen(null); }}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2 sm:hidden"
                      >
                        <FolderOpen className="w-3 h-3" />{isZh ? '添加到歌集' : 'Add to album'}
                      </button>
                      {inAlbum && (
                        <button
                          onClick={() => {
                            removeSongFromAlbum(inAlbum, song.id);
                            showToast?.(isZh ? '已从歌集移除' : 'Removed from album', 'info');
                            setMenuOpen(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-white/5 flex items-center gap-2"
                        >
                          <X className="w-3 h-3" />{isZh ? '从歌集移除' : 'Remove from album'}
                        </button>
                      )}
                      <div className="my-0.5 h-px bg-white/5" />
                      <button
                        onClick={() => {
                          onDelete(song);
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />{isZh ? '删除' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
