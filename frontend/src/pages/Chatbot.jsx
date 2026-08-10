import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineSend, MdOutlineSmartToy, MdOutlinePerson } from 'react-icons/md';
import api from '../services/api';
import Card from '../components/UI/Card';

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api
      .get('/ai/history', { params: { type: 'chatbot' } })
      .then(({ data }) =>
        setMessages(data.data.map((m) => ({ role: m.role, text: m.message })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const { data } = await api.post('/ai/chatbot', { message: text });
      setMessages((m) => [...m, { role: 'assistant', text: data.data.reply }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'The assistant is unavailable right now');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="font-display text-2xl font-semibold">AI Medical Assistant</h1>
        <p className="text-sm text-ink-800/70 dark:text-ink-50/70">Ask about medical FAQs, diet, exercise, or medicine reminders.</p>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="text-center text-sm text-ink-800/50 dark:text-ink-50/50 mt-10">
              Say hello — ask "What should I eat for better sleep?" or "Remind me how to take antibiotics safely."
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-ink-800 text-white' : 'bg-brand-600 text-white'}`}>
                {m.role === 'user' ? <MdOutlinePerson /> : <MdOutlineSmartToy />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-ink-900 text-white' : 'bg-brand-50 text-ink-900 dark:bg-white/5 dark:text-white'}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white"><MdOutlineSmartToy /></div>
              <div className="rounded-2xl bg-brand-50 px-4 py-2.5 text-sm dark:bg-white/5">
                <span className="animate-pulse">Thinking…</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-ink-100 p-3 dark:border-white/10">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-xl border border-ink-100 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:border-white/10 dark:bg-ink-800/50"
          />
          <button type="submit" disabled={loading} className="rounded-xl bg-brand-600 p-3 text-white hover:bg-brand-700 disabled:opacity-50">
            <MdOutlineSend />
          </button>
        </form>
      </Card>
    </div>
  );
}
