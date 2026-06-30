import React, { useMemo, useState } from 'react';
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import api from '../services/api';

const welcomeMessage = {
  role: 'model',
  text: 'Xin chào! Mình là trợ lý AI KindnessMap. Bạn cần hướng dẫn đăng việc tốt, xem bản đồ, dùng tài khoản demo hay quản trị bài viết không?',
};

export const FloatingChatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const apiHistory = useMemo(
    () => messages.filter((msg) => msg !== welcomeMessage).map((msg) => ({ role: msg.role, text: msg.text })),
    [messages]
  );

  const sendMessage = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);

    try {
      const res = await api.post('/chatbot', {
        message: text,
        history: apiHistory,
      });
      const replyText = res.data.warning === 'GEMINI_QUOTA_EXCEEDED'
        ? `${res.data.reply}\n\nLưu ý: Gemini API đang hết quota/free tier, đây là câu trả lời dự phòng của hệ thống.`
        : res.data.reply;
      setMessages((prev) => [...prev, { role: 'model', text: replyText }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text: error.response?.data?.message || 'Mình chưa kết nối được Gemini. Bạn kiểm tra GEMINI_API_KEY trên Render nhé.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-50 pointer-events-none">
      {open && (
        <div className="pointer-events-auto mb-4 w-[calc(100vw-2rem)] max-w-sm overflow-hidden rounded-[28px] border border-emerald-400/25 bg-white/95 shadow-2xl shadow-slate-950/20 backdrop-blur-xl dark:border-emerald-400/20 dark:bg-slate-950/95 animate-fade-in">
          <div className="bg-gradient-to-r from-brand-green to-brand-teal p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm">KindnessBot Gemini</h3>
                <p className="text-[11px] text-emerald-50">Trợ lý AI cho Bản Đồ Việc Tốt</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Đóng chatbot"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-80 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-slate-50/80 dark:bg-slate-900/80">
            {messages.map((msg, index) => (
              <div key={`${msg.role}-${index}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-green text-white rounded-br-md'
                      : 'bg-white text-slate-700 border border-slate-200 rounded-bl-md dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-green" /> Gemini đang trả lời...
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Hỏi KindnessBot..."
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 rounded-2xl bg-brand-green text-white disabled:opacity-50 hover:scale-105 active:scale-95 transition-all"
              title="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setOpen((prev) => !prev)}
        className="pointer-events-auto w-16 h-16 rounded-[24px] bg-gradient-to-tr from-brand-green via-brand-teal to-emerald-400 text-white shadow-2xl shadow-brand-green/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group relative"
        title="Mở chatbot Gemini"
      >
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 border-2 border-white dark:border-slate-950 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </span>
        {open ? <X className="w-7 h-7" /> : <MessageCircle className="w-7 h-7 group-hover:rotate-6 transition-transform" />}
      </button>
    </div>
  );
};
