import React, { useState } from 'react';
import { MessageCircle, ChevronUp, ChevronDown, Bot, Sparkles, Zap, Music, Send, X, Headphones } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { UnicornAgent } from '../agents/unicorn-agent.js';

const AI_AGENTS = [
  { id: 'suno', icon: Music, color: 'from-teal-400 to-cyan-500' },
  { id: 'muse', icon: Sparkles, color: 'from-fuchsia-500 to-purple-600' },
  { id: 'melo', icon: Headphones, color: 'from-amber-500 to-orange-500' },
  { id: 'fsm', icon: Bot, color: 'from-violet-500 to-indigo-500' },
  { id: 'network', icon: Zap, color: 'from-pink-500 to-rose-500' },
];

const unicornAgent = new UnicornAgent();

function FloatingChatBall() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('suno');
  const [messages, setMessages] = useState([
    { id: 1, type: 'bot', content: t('chat.welcome'), agent: 'suno' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    setMessages(prev => [...prev, { id: Date.now(), type: 'user', content: input, agent: selectedAgent }]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 800));

    let responseContent = '';
    const userInput = input.trim();

    try {
      switch (selectedAgent) {
        case 'suno':
          const sunoResult = await unicornAgent.generateSunoCommand(
            extractTheme(userInput) || 'love',
            extractStyle(userInput) || 'pop',
            { duration: 180, bpm: 120, script: userInput, language: 'zh' }
          );
          responseContent = `已为您生成Suno风格音乐命令:\n\n${sunoResult.fullText.substring(0, 300)}...`;
          break;
        case 'muse':
          const museResult = await unicornAgent.generateMuseCommand(
            extractTheme(userInput) || 'love',
            extractStyle(userInput) || 'pop',
            { bpm: 120, script: userInput, language: 'zh' }
          );
          responseContent = `已为您生成Muse风格创作命令:\n\n${museResult.fullText.substring(0, 300)}...`;
          break;
        case 'fsm':
          const fsmResult = await unicornAgent.generateLyrics({
            method: 'fsm',
            theme: extractTheme(userInput) || 'love',
            style: extractStyle(userInput) || 'tango',
            bpm: 120,
            script: userInput,
            language: 'zh'
          });
          responseContent = `已为您生成FSM状态机歌词:\n\n状态数: ${fsmResult.result.states}\n转换数: ${fsmResult.result.transitions}\n\n${fsmResult.result.fullText.substring(0, 300)}...`;
          break;
        case 'network':
          const networkResult = await unicornAgent.generateLyrics({
            method: 'network_layer',
            theme: extractTheme(userInput) || 'love',
            style: extractStyle(userInput) || 'pop',
            bpm: 120,
            script: userInput,
            language: 'zh'
          });
          responseContent = t('chat.network_result', { text: networkResult.result.fullText.substring(0, 300) });
          break;
        case 'melo':
          const meloResult = unicornAgent.generateMeloCommand(
            extractTheme(userInput) || 'love',
            extractStyle(userInput) || 'pop',
            { bpm: extractBPM(userInput) || 120, script: userInput, language: 'zh' }
          );
          responseContent = t('chat.melo_result', {
            title: meloResult.title,
            genre: meloResult.styleInfo.genre,
            mood: meloResult.styleInfo.mood,
            instruments: meloResult.styleInfo.instruments,
            bpm: meloResult.bpm,
            fullText: meloResult.fullText.substring(0, 280)
          });
          break;
        default:
          responseContent = t('chat.default_response');
      }
    } catch (error) {
      responseContent = t('chat.error_response', { msg: error.message });
    }

    setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: responseContent, agent: selectedAgent }]);
    setIsTyping(false);
  };

  const extractTheme = (text) => {
    const themeKeywords = {
      love: ['爱', '爱情', '恋爱', '深情', '温柔', '浪漫', '思念', '眷恋', '心动', '告白', '甜蜜', '吻', '初恋'],
      loneliness: ['孤独', '寂寞', '独行', '寂寥', '独处', '空荡', '一个人', '冷'],
      sadness: ['悲伤', '难过', '痛苦', '心碎', '惆怅', '哭', '泪', '离别', '分手', '伤痛'],
      dreams: ['梦想', '希望', '未来', '追逐', '理想', '远方', '奋斗', '成功', '荣耀'],
      nature: ['自然', '山水', '月光', '星辰', '风雨', '海', '森林', '雨', '雪', '天空'],
      tango: ['探戈', '华尔兹', '舞蹈'],
      friendship: ['友情', '朋友', '知己', '兄弟', '闺蜜', '伙伴'],
      nostalgia: ['怀旧', '回忆', '童年', '旧时光', '往事', '当年', '小时候', '老照片'],
      healing: ['治愈', '温暖', '重生', '疗愈', '坚强', '力量', '雨后', '彩虹'],
      heartbreak: ['心碎', '失恋', '分手', '背叛', '离开', '错过'],
      freedom: ['自由', '飞翔', '远方', '公路', '冒险', '挣脱'],
      epic: ['史诗', '宏大', '战争', '英雄', '传奇', '神话', '冒险'],
      urban_life: ['都市', '城市', '深夜', '霓虹', '地铁', '加班', '凌晨'],
      travel: ['旅行', '公路', '火车', '远行', '流浪', '机场'],
      memory: ['回忆', '记忆', '忘了', '记得', '想起'],
      romance: ['浪漫', '热恋', '约会', '牵手', '拥抱'],
      triumph: ['胜利', '凯旋', '荣耀', '奖杯', '冠军'],
      companionship: ['陪伴', '相守', '一起', '到老', '岁月静好'],
      ambition: ['雄心', '野心', '奋斗', '理想', '少年'],
    };
    for (const [theme, keywords] of Object.entries(themeKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return theme;
      }
    }
    return null;
  };

  const extractStyle = (text) => {
    const styleKeywords = {
      tango: ['探戈', '华尔兹'],
      pop: ['流行', '通俗'],
      rock: ['摇滚', '金属', '朋克', '硬摇'],
      chinese_classical: ['古典', '古风', '中国风', '古琴', '古筝', '琵琶'],
      ancient_modern: ['古今', '融合'],
      electronic: ['电子', '电音', 'EDM', '合成器', 'House', 'Techno'],
      jazz: ['爵士', '萨克斯', '蓝调', 'Swing'],
      hip_hop: ['嘻哈', '说唱', 'rap', 'Trap', 'HipHop', '街头'],
      ballad: ['民谣', '抒情', '叙事'],
      country: ['乡村'],
      rnb: ['R&B', '节奏蓝调', 'rnb', 'Soul'],
      classical: ['交响乐', '古典乐', '管弦乐'],
      folk: ['民歌', '民俗'],
      ambient: ['氛围', '冥想', '新世纪', 'Ambient'],
      reggae: ['雷鬼', '海岛'],
      kpop: ['K-POP', '韩流', '韩团', 'kpop'],
      anime: ['动漫', '二次元', '动画'],
      gothic_rock: ['哥特', '暗黑'],
      romantic: ['情歌', '浪漫曲'],
      healing: ['治愈系', 'New Age'],
      heartbreaking: ['伤感情歌'],
      nostalgic: ['复古', '怀旧金曲'],
      dreamy: ['梦幻', '飘渺'],
      energetic: ['活力', '舞曲', '迪斯科'],
      epic: ['史诗', '电影配乐'],
      time_travel: ['穿越', '时空'],
      indie: ['独立', '小众'],
    };
    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
        return style;
      }
    }
    return null;
  };

  const extractBPM = (text) => {
    const bpmMatch = text.match(/[Bb][Pp][Mm]\s*[:：]?\s*(\d+)|(\d+)\s*[Bb][Pp][Mm]|(\d+)\s*拍/);
    if (bpmMatch) {
      const bpm = parseInt(bpmMatch[1] || bpmMatch[2] || bpmMatch[3], 10);
      if (bpm >= 40 && bpm <= 240) return bpm;
    }
    return null;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const currentAgent = AI_AGENTS.find(a => a.id === selectedAgent);

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed right-6 w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform z-50 ${isOpen ? 'top-64 md:top-72' : 'bottom-24 md:bottom-8'
          }`}
        title={t('chat.title')}
      >
        {isOpen ? <ChevronDown className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-40"
        >
          <div className="fixed bottom-24 right-6 md:bottom-8 w-96 max-w-[calc(100vw-2rem)] bg-[#0f0f1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentAgent?.color} flex items-center justify-center`}>
                  {currentAgent && (() => {
                    const Icon = currentAgent.icon;
                    return <Icon className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t(`chat.agents.${selectedAgent}.name`)}</div>
                  <div className="text-[10px] text-gray-500">{t(`chat.agents.${selectedAgent}.desc`)}</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="flex gap-1 p-3 border-b border-white/5 overflow-x-auto">
              {AI_AGENTS.map(agent => {
                const Icon = agent.icon;
                return (
                  <button
                    key={agent.id}
                    onClick={() => {
                      setSelectedAgent(agent.id);
                      setMessages([{ id: 1, type: 'bot', content: t('chat.welcome'), agent: agent.id }]);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all ${selectedAgent === agent.id
                      ? `bg-gradient-to-r ${agent.color} text-white`
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                  >
                    <Icon className="w-3 h-3" />
                    {t(`chat.agents.${agent.id}.name`)}
                  </button>
                );
              })}
            </div>

            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-2 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl ${msg.type === 'user'
                    ? 'bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/20'
                    : 'bg-white/5 border border-white/5'
                    }`}>
                    <div className="text-xs text-gray-400 mb-1">{msg.type === 'user' ? t('chat.you') : t(`chat.agents.${msg.agent}.name`)}</div>
                    <div className="text-sm text-white whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start gap-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-white/5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('chat.placeholder')}
                  disabled={isTyping}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-pink-500 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FloatingChatBall;