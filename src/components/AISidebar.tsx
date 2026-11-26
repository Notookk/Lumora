import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, Check, Copy, Eraser, Sparkles, Square, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { streamGemini } from '../lib/gemini';
import { useLumoraStore } from '../store/useLumoraStore';
import type { ChatMessage } from '../types/lumora';
import { IconButton } from './Controls';

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const extractText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return '';
};

function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);
  const code = extractText(children).replace(/\n$/, '');
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="code-block">
      <button type="button" onClick={() => void copy()}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}</button>
      <pre>{children}</pre>
    </div>
  );
}

const suggestions = ['Explain a concept simply', 'Help me plan my day', 'Draft a concise email'];

export default function AISidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const settings = useLumoraStore((state) => state.settings);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 120);
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const send = useCallback(async (preset?: string) => {
    const content = (preset ?? input).trim();
    if (!content || sending) return;
    if (!settings.geminiKey.trim()) {
      setError('Add your Gemini API key in Settings → APIs & AI.');
      return;
    }

    const userMessage: ChatMessage = { id: createId(), role: 'user', content };
    const assistantId = createId();
    const history = [...messages, userMessage];
    setMessages([...history, { id: assistantId, role: 'assistant', content: '', pending: true }]);
    setInput('');
    setError('');
    setSending(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamGemini(settings.geminiKey.trim(), history, controller.signal, (chunk) => {
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: message.content + chunk, pending: true } : message));
      });
      setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, pending: false } : message));
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setMessages((current) => current.filter((message) => message.id !== assistantId || message.content));
        return;
      }
      const message = caught instanceof Error ? caught.message : 'The AI request failed.';
      setError(message);
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: message, pending: false, error: true } : item));
    } finally {
      setSending(false);
    }
  }, [input, messages, sending, settings.geminiKey]);

  if (!settings.aiEnabled) return null;

  return (
    <>
      {open && <button type="button" className="ai-backdrop" aria-label="Close AI sidebar" onClick={onClose} />}
      <aside className={`ai-sidebar glass-panel ${open ? 'is-open' : ''}`} aria-label="Gemini AI sidebar" aria-hidden={!open}>
        <header className="ai-header">
          <div className="ai-title"><span><Sparkles size={16} /></span><div><strong>Lumora AI</strong><small>Gemini 2.5 Flash</small></div></div>
          <div>
            <IconButton label="Clear chat" onClick={() => { abortRef.current?.abort(); setMessages([]); setError(''); setSending(false); }}><Eraser size={15} /></IconButton>
            <IconButton label="Close AI sidebar" onClick={onClose}><X size={17} /></IconButton>
          </div>
        </header>
        <div className="ai-messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="ai-empty">
              <span className="ai-empty-icon"><Sparkles size={24} strokeWidth={1.3} /></span>
              <h3>A little clarity,<br />right where you are.</h3>
              <p>Ask a question, shape an idea, or turn a blank tab into a starting point.</p>
              <div>{suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => void send(suggestion)}>{suggestion}<ArrowUp size={13} /></button>)}</div>
            </div>
          ) : messages.map((message) => (
            <div key={message.id} className={`chat-message role-${message.role} ${message.error ? 'is-error' : ''}`}>
              <span className="message-role">{message.role === 'assistant' ? <Sparkles size={13} /> : 'You'}</span>
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: ({ children }) => <CodeBlock>{children}</CodeBlock>, a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer">{children}</a> }}>{message.content}</ReactMarkdown>
              ) : <span className="thinking-dots"><i /><i /><i /></span>}
            </div>
          ))}
        </div>
        {error && <div className="ai-error" role="alert">{error}</div>}
        <form className="ai-composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
          <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Ask Lumora anything…" rows={2} />
          <div><span>Enter to send · Shift + Enter for a new line</span>{sending ? <button type="button" className="ai-send" aria-label="Stop response" onClick={() => abortRef.current?.abort()}><Square size={13} fill="currentColor" /></button> : <button type="submit" className="ai-send" aria-label="Send message" disabled={!input.trim()}><ArrowUp size={17} /></button>}</div>
        </form>
        <footer className="ai-footer">Your key and chat stay in this browser session.</footer>
      </aside>
    </>
  );
}
