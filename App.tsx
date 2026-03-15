
import React, { useState, useRef, useEffect } from 'react';
import { HealthBuddyService } from './services/gemini';
import { Role, Message, GroundingSource } from './types';
import { 
  Plus, 
  Send, 
  Heart, 
  FlaskConical, 
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Activity,
  Info,
  ExternalLink,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Mock data for health tracking
const MOCK_VITALS = [
  { time: 'Mon', steps: 6400, heartRate: 72 },
  { time: 'Tue', steps: 8200, heartRate: 75 },
  { time: 'Wed', steps: 4100, heartRate: 68 },
  { time: 'Thu', steps: 7600, heartRate: 70 },
  { time: 'Fri', steps: 9800, heartRate: 74 },
  { time: 'Sat', steps: 12000, heartRate: 82 },
  { time: 'Sun', steps: 5500, heartRate: 69 },
];

const SUGGESTED_PROMPTS = [
  { label: "Symptom Check", text: "I've had a persistent headache and fatigue for 3 days. What could it be?" },
  { label: "Healthy Diet", text: "Suggest a 7-day meal plan for lowering cholesterol." },
  { label: "Sleep Quality", text: "What are some natural ways to improve my deep sleep?" },
  { label: "First Aid", text: "How should I treat a minor kitchen burn at home?" },
  { label: "Stress Management", text: "Give me 5 quick exercises to reduce anxiety at work." },
  { label: "Lab Results", text: "Can you help me understand what 'high LDL' means in blood work?" }
];

const HEALTH_TIPS = [
  "Stay hydrated! Aim for at least 8 glasses of water a day.",
  "A 10-minute walk after meals can significantly improve digestion.",
  "Blue light from screens can disrupt sleep. Try reading a book before bed.",
  "Consistent sleep schedules help regulate your body's internal clock.",
  "Don't skip breakfast! It fuels your body and brain for the day ahead."
];

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dailyTip, setDailyTip] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HealthBuddyService | null>(null);

  useEffect(() => {
    // Initialize service
    if (!serviceRef.current && process.env.API_KEY) {
      serviceRef.current = new HealthBuddyService(process.env.API_KEY);
    }
    
    // Set daily tip
    setDailyTip(HEALTH_TIPS[Math.floor(Math.random() * HEALTH_TIPS.length)]);

    // Initial greeting
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        role: Role.MODEL,
        content: "Hello! I'm your **HealthBuddy** assistant. How can I support your wellness journey today? Whether it's discussing symptoms, nutrition, or exercise, I'm here to help.",
        timestamp: new Date()
      }]);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping || !serviceRef.current) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    const modelMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: modelMessageId,
      role: Role.MODEL,
      content: '',
      timestamp: new Date(),
      isThinking: true
    }]);

    try {
      const stream = serviceRef.current.sendMessageStream(text);
      for await (const chunk of stream) {
        setMessages(prev => prev.map(m => 
          m.id === modelMessageId 
            ? { ...m, content: chunk.text, sources: chunk.sources, isThinking: false } 
            : m
        ));
      }
    } catch (err: any) {
      setError("I'm having trouble connecting to my knowledge base. Please try again.");
      setMessages(prev => prev.filter(m => m.id !== modelMessageId));
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  const resetChat = () => {
    setMessages([{
      id: Date.now().toString(),
      role: Role.MODEL,
      content: "Hello! I'm your **HealthBuddy** assistant. How can I support your wellness journey today?",
      timestamp: new Date()
    }]);
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden text-sm">
      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">HealthBuddy AI</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button 
            onClick={resetChat}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all font-semibold border border-emerald-100"
          >
            <Plus className="w-5 h-5" />
            New Assessment
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Wellness Trends</h3>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-tight">Step Count (Weekly)</p>
                <Activity className="w-3 h-3 text-emerald-500" />
              </div>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_VITALS}>
                    <defs>
                      <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSteps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-2">Key Tools</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <FlaskConical className="w-5 h-5 text-indigo-500" />
                <span className="font-semibold text-slate-700">Lab Result Guide</span>
              </div>
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group">
                <ShieldCheck className="w-5 h-5 text-blue-500" />
                <span className="font-semibold text-slate-700">Drug Interaction</span>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Daily Health Tip</h3>
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 relative overflow-hidden group">
              <Sparkles className="absolute -right-2 -top-2 w-12 h-12 text-indigo-200 opacity-50 rotate-12 group-hover:scale-110 transition-transform" />
              <p className="text-xs text-indigo-800 leading-relaxed font-medium relative z-10">
                {dailyTip}
              </p>
            </div>
          </section>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
              NOT A MEDICAL SUBSTITUTE. Call emergency services for acute issues.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative h-full">
        {/* Header */}
        <header className="glass-effect sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Symptom Checker & Support</h2>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Gemini 3.1 Pro Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resetChat} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Message List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 bg-slate-50"
        >
          <div className="max-w-3xl mx-auto space-y-8 pb-12">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.role === Role.USER ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
              >
                <div className={`flex flex-col max-w-[85%] lg:max-w-[80%] ${message.role === Role.USER ? 'items-end' : 'items-start'}`}>
                  <div className={`
                    p-4 rounded-2xl shadow-sm leading-relaxed
                    ${message.role === Role.USER 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }
                  `}>
                    {message.isThinking ? (
                      <div className="flex gap-1 py-1">
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce delay-150"></div>
                      </div>
                    ) : (
                      <div className="markdown-body prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-li:my-1">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.sources.map((source, idx) => (
                        <a 
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:border-emerald-300 hover:text-emerald-600 transition-all shadow-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {source.title.substring(0, 30)}...
                        </a>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tight">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Empty State / Suggestions */}
            {messages.length < 3 && !isTyping && (
              <div className="pt-8 border-t border-slate-200 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-2 mb-4 px-1 text-slate-500">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-xs font-bold uppercase tracking-widest">Common Health Concerns</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt.text)}
                      className="text-left p-4 bg-white border border-slate-200 rounded-2xl hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-50/50 transition-all group"
                    >
                      <span className="block text-[11px] font-bold text-emerald-600 uppercase tracking-tight mb-1">{prompt.label}</span>
                      <p className="text-slate-600 text-xs font-semibold leading-normal group-hover:text-slate-800">{prompt.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-6 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your symptoms or ask a health question..."
                className="w-full pl-6 pr-14 py-4 bg-slate-50 focus:bg-white border-2 border-transparent focus:border-emerald-500 rounded-2xl outline-none text-slate-800 transition-all shadow-sm font-semibold placeholder:text-slate-400"
                disabled={isTyping}
              />
              <button 
                type="submit"
                disabled={isTyping || !input.trim()}
                className={`
                  absolute right-2 top-2 bottom-2 w-12 flex items-center justify-center rounded-xl transition-all
                  ${isTyping || !input.trim() 
                    ? 'bg-slate-200 text-slate-400' 
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 active:scale-95'
                  }
                `}
              >
                {isTyping ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <div className="flex items-center justify-center gap-4 mt-3">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                🔒 Privacy Protected
              </p>
              <span className="text-slate-200">•</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                🏥 AI Support Only
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
