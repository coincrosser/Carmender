import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  message: string;
  role: 'user' | 'assistant';
  created_at: string;
}

interface AIChatProps {
  onClose: () => void;
}

export function AIChat({ onClose }: AIChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(50);

    if (!error && data) {
      setMessages(data);
      if (data.length === 0) {
        await sendInitialGreeting();
      }
    }
    setInitializing(false);
  };

  const sendInitialGreeting = async () => {
    if (!user) return;

    const greeting = "Hello! I'm your personal financial assistant. I'm here to help you manage your bills, track your goals, and make smart financial decisions. Let's start with a quick check-in. How are you doing today?";

    const { error } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        message: greeting,
        role: 'assistant'
      });

    if (!error) {
      await loadChatHistory();
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const { error: userError } = await supabase
      .from('chat_history')
      .insert({
        user_id: user.id,
        message: userMessage,
        role: 'user'
      });

    if (userError) {
      setLoading(false);
      return;
    }

    await loadChatHistory();

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();

      if (data.error) {
        const errorMsg = data.error.includes('GEMINI_API_KEY')
          ? 'AI not configured yet. Please add your Gemini API key in Supabase secrets.'
          : `Error: ${data.error}`;

        const { error: assistantError } = await supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            message: errorMsg,
            role: 'assistant'
          });

        if (!assistantError) {
          await loadChatHistory();
        }
      } else if (data.reply) {
        const { error: assistantError } = await supabase
          .from('chat_history')
          .insert({
            user_id: user.id,
            message: data.reply,
            role: 'assistant'
          });

        if (!assistantError) {
          await loadChatHistory();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const { error: assistantError } = await supabase
        .from('chat_history')
        .insert({
          user_id: user.id,
          message: 'Sorry, I encountered an error. Please try again.',
          role: 'assistant'
        });

      if (!assistantError) {
        await loadChatHistory();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (initializing) {
    return (
      <div className="fixed inset-0 bg-growth-theme flex items-center justify-center z-50">
        <div className="growth-gradient-layer" />
        <div className="ethereal-wisps" />
        <div className="bloom-flower" />
        <div className="bloom-glow" />
        <div className="text-center content-layer">
          <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white font-medium">Initializing your assistant...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-growth-theme flex flex-col z-50">
      <div className="growth-gradient-layer" />
      <div className="ethereal-wisps" />
      <div className="bloom-flower" />
      <div className="bloom-glow" />
      <div className="glass-card-dark shadow-lg border-b border-white/10 content-layer">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="btn-growth p-2 rounded-lg shadow-md">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold gradient-text-bloom">C-rmender AI</h2>
              <p className="text-xs text-white/70">Your growth companion</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto content-layer">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-lg ${
                  message.role === 'user'
                    ? 'btn-growth text-white'
                    : 'glass-card text-slate-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.message}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-white/70' : 'text-slate-500'
                  }`}
                >
                  {new Date(message.created_at).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="glass-card text-slate-900 shadow-lg p-4 rounded-2xl">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="glass-card-dark border-t border-white/10 shadow-lg content-layer">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-3 rounded-xl border border-white/20 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:bg-white/5 bg-white/10 text-white placeholder-white/50"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="btn-growth text-white p-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
