import { useState, useRef, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2, Check } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import apiClient from '../services/api.client.js';

/**
 * AiCaptionButton — 借鉴微信朋友圈「AI 生词」的小组件。
 *
 * 放在文本输入框标签旁：点一下 → 后端给 3 条候选文案 →
 * 点任意一条即填入对应输入框，不满意点「换一批」。
 *
 * 纯前端交互 + 一个后端接口（/api/ai/captions），不消耗任何生成积分。
 *
 * @param {object} props
 * @param {'inspiration'|'lyrics'|'share'|'title'} [props.kind='inspiration'] 文案类型
 * @param {string} [props.seed] 当前输入框内容（作为上下文）
 * @param {string} [props.title] 歌曲标题（share/title 类型使用）
 * @param {string} [props.style] 当前选择的音乐风格
 * @param {(text:string)=>void} props.onApply 选中候选后的回调
 * @param {number} [props.maxLength] 目标输入框的最大长度（超出会截断）
 */
export default function AiCaptionButton({
  kind = 'inspiration',
  seed = '',
  title = '',
  style = '',
  onApply,
  maxLength,
}) {
  const { t, lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [error, setError] = useState('');
  const rootRef = useRef(null);

  /** 关闭面板；点击外部或 ESC 触发。 */
  useEffect(() => {
    if (!open) return undefined;
    const onDocDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  /**
   * 拉取候选文案。
   * @param {boolean} regenerate 是否为「换一批」
   */
  const fetchCaptions = useCallback(async (regenerate = false) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.request('/ai/captions', {
        method: 'POST',
        body: JSON.stringify({
          kind,
          seed: seed.slice(0, 300),
          title,
          style,
          lang: lang === 'en' ? 'en' : 'zh',
          count: 3,
          // 换一批时给后端一个变化因子
          nonce: regenerate ? Date.now() : undefined,
        }),
      });
      if (res.success && Array.isArray(res.captions) && res.captions.length) {
        setCaptions(res.captions);
      } else {
        setCaptions([]);
        setError(res.error || t('aiCaption.error'));
      }
    } catch (e) {
      setError(e.message || t('aiCaption.error'));
    } finally {
      setLoading(false);
    }
  }, [kind, seed, title, style, lang, t]);

  /** 首次点开时懒加载候选。 */
  const handleToggle = () => {
    if (!open && !captions.length) fetchCaptions(false);
    setOpen((v) => !v);
  };

  /** 选用某条候选，截断到目标输入框上限。 */
  const handleApply = (text) => {
    const value = maxLength ? text.slice(0, maxLength) : text;
    onApply?.(value);
    setOpen(false);
  };

  return (
    <div className="relative inline-block" ref={rootRef}>
      <button
        type="button"
        onClick={handleToggle}
        title={t('aiCaption.hint')}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium
                   bg-gradient-to-r from-fuchsia-500/20 to-purple-500/20
                   border border-fuchsia-400/40 text-fuchsia-200
                   hover:from-fuchsia-500/30 hover:to-purple-500/30 hover:text-white
                   transition-all"
      >
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        {t('aiCaption.button')}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 w-[320px] z-[120] rounded-xl border border-white/15
                     bg-[#12121c]/95 backdrop-blur-xl shadow-2xl shadow-black/50 p-2.5 space-y-2"
        >
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-gray-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-fuchsia-400" />
              {t('aiCaption.title')}
            </span>
            <button
              type="button"
              onClick={() => fetchCaptions(true)}
              disabled={loading}
              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              {t('aiCaption.regenerate')}
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              {t('aiCaption.loading')}
            </div>
          )}

          {!loading && error && (
            <div className="px-1 py-3 text-[11px] text-red-300">{error}</div>
          )}

          {!loading && !error && captions.length === 0 && (
            <div className="px-1 py-3 text-[11px] text-gray-500">{t('aiCaption.empty')}</div>
          )}

          {!loading && !error && captions.map((text, i) => (
            <button
              type="button"
              key={`${i}-${text.slice(0, 12)}`}
              onClick={() => handleApply(text)}
              className="group w-full text-left rounded-lg border border-white/10 bg-white/[0.03]
                         hover:border-fuchsia-400/50 hover:bg-fuchsia-500/10 px-2.5 py-2
                         transition-all"
            >
              <div className="text-[11.5px] leading-relaxed text-gray-200 whitespace-pre-line">
                {text}
              </div>
              <div className="mt-1 flex items-center gap-1 text-[10px] text-fuchsia-300 opacity-0 group-hover:opacity-100 transition-opacity">
                <Check className="w-3 h-3" />
                {t('aiCaption.apply')}
              </div>
            </button>
          ))}

          <p className="px-1 pt-0.5 text-[9.5px] text-gray-600">{t('aiCaption.hint')}</p>
        </div>
      )}
    </div>
  );
}
