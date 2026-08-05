import React, { useState } from 'react';
import { MessageCircle, ChevronUp, ChevronDown, Bot, Sparkles, Zap, Music, Send, X } from 'lucide-react';
import { useTranslation } from '../i18n/useTranslation.js';
import { UnicornAgent } from '../agents/unicorn-agent.js';

const AI_AGENTS = [
  { id: 'suno', icon: Music, color: 'from-emerald-500 to-teal-500' },
  { id: 'muse', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { id: 'fsm', icon: Bot, color: 'from-violet-500 to-purple-500' },
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
          responseContent = `已为您生成网络层架构音乐:\n\n${networkResult.result.fullText.substring(0, 300)}...`;
          break;
        default:
          responseContent = t('chat.default_response');
      }
    } catch (error) {
      responseContent = `处理您的请求时出现错误: ${error.message}`;
    }

    setMessages(prev => [...prev, { id: Date.now() + 1, type: 'bot', content: responseContent, agent: selectedAgent }]);
    setIsTyping(false);
  };

  const extractTheme = (text) => {
    const themeKeywords = {
      love: ['爱', '爱情', '恋爱', '深情', '温柔', '浪漫', '思念', '眷恋'],
      loneliness: ['孤独', '寂寞', '独行', '寂寥', '独处'],
      sadness: ['悲伤', '难过', '痛苦', '心碎', '惆怅'],
      dreams: ['梦想', '希望', '未来', '追逐', '理想'],
      nature: ['自然', '山水', '月光', '星辰', '风雨'],
      tango: ['探戈', '华尔兹', '舞蹈'],
      friendship: ['友情', '朋友', '知己']
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
      tango: ['探戈'],
      pop: ['流行', '通俗'],
      rock: ['摇滚'],
      chinese_classical: ['古典', '古风'],
      ancient_modern: ['古今', '融合'],
      electronic: ['电子', '电音']
    };
    for (const [style, keywords] of Object.entries(styleKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return style;
      }
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
        className="fixed bottom-24 right-6 md:bottom-8 w-14 h-14 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 hover:scale-110 transition-transform z-50"
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