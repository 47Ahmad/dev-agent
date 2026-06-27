import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Send, Sparkles, Code2, Eye, RefreshCw, Download, Copy,
  Play, Pause, Terminal, Globe, Zap, TrendingUp, Clock,
  FolderOpen, Star, ArrowLeft, MoreVertical, ChevronRight,
  Cpu, Activity, CheckCircle, AlertCircle, Loader2, Plus,
  Maximize2, Minimize2, RotateCcw, ExternalLink, Layout,
  MessageSquare, X, ChevronDown
} from 'lucide-react';

// ===== STAT CARD =====
function StatCard({ icon: Icon, label, value, change, color, glow }: any) {
  return (
    <motion.div
      whileHover={{ y: -3, borderColor: `${color}40` }}
      className="p-5 rounded-2xl relative overflow-hidden"
      style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, boxShadow: `0 0 15px ${glow}` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {change && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>{value}</div>
      <div className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{label}</div>
      <div className="absolute top-0 left-0 w-20 h-20 rounded-full pointer-events-none" style={{ background: `radial-gradient(circle, ${color}08 0%, transparent 70%)`, transform: 'translate(-30%, -30%)' }} />
    </motion.div>
  );
}

// ===== CHAT MESSAGE =====
function ChatMessage({ role, content, isStreaming }: { role: 'user' | 'assistant'; content: string; isStreaming?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-xs" style={{ background: role === 'assistant' ? 'linear-gradient(135deg, #3B82F6, #7C3AED)' : '#23233A', fontFamily: 'Cairo, sans-serif' }}>
        {role === 'assistant' ? <Sparkles className="w-4 h-4" /> : 'أ'}
      </div>
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${role === 'user' ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}
        style={{
          background: role === 'user' ? 'rgba(59,130,246,0.15)' : '#1A1A28',
          border: `1px solid ${role === 'user' ? 'rgba(59,130,246,0.25)' : '#23233A'}`,
          color: '#FFFFFF',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl',
          textAlign: 'right',
        }}>
        {content}
        {isStreaming && <span className="inline-block w-1.5 h-4 mr-1 rounded-sm animate-pulse" style={{ background: '#3B82F6', verticalAlign: 'middle' }} />}
      </div>
    </motion.div>
  );
}

export default function DashboardV2() {
  const [, setLocation] = useLocation();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: 'مرحباً! أنا مساعدك الذكي. صف لي الموقع الذي تريد بناءه وسأقوم بإنشائه فوراً.' },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'console'>('preview');
  const [previewContent, setPreviewContent] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = [
    { icon: FolderOpen, label: 'المشاريع النشطة', value: '12', change: '+3 هذا الشهر', color: '#3B82F6', glow: 'rgba(59,130,246,0.3)' },
    { icon: Zap, label: 'عمليات التوليد', value: '248', change: '+12 اليوم', color: '#7C3AED', glow: 'rgba(124,58,237,0.3)' },
    { icon: TrendingUp, label: 'معدل النجاح', value: '98.5%', change: null, color: '#22C55E', glow: 'rgba(34,197,94,0.3)' },
    { icon: Clock, label: 'وقت التوليد', value: '4.2ث', change: null, color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
  ];

  const recentProjects = [
    { name: 'متجر الإلكترونيات', status: 'منشور', time: 'منذ ساعتين', color: '#22C55E' },
    { name: 'موقع المطعم', status: 'قيد التطوير', time: 'منذ 5 ساعات', color: '#F59E0B' },
    { name: 'بورتفوليو شخصي', status: 'منشور', time: 'أمس', color: '#22C55E' },
    { name: 'لوحة تحكم إدارية', status: 'مسودة', time: 'منذ 3 أيام', color: '#6B6B80' },
  ];

  const quickTemplates = [
    { name: 'متجر إلكتروني', icon: '🛍️', color: '#3B82F6' },
    { name: 'موقع شركة', icon: '🏢', color: '#7C3AED' },
    { name: 'مدونة', icon: '✍️', color: '#22C55E' },
    { name: 'بورتفوليو', icon: '🎨', color: '#F59E0B' },
  ];

  const demoCode = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>موقعي الاحترافي</title>
  <style>
    body { font-family: 'Cairo', sans-serif; margin: 0; background: #050508; color: white; }
    .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; background: radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, transparent 70%); }
    h1 { font-size: 4rem; font-weight: 900; background: linear-gradient(135deg, #3B82F6, #7C3AED); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  </style>
</head>
<body>
  <section class="hero">
    <div>
      <h1>مرحباً بالعالم</h1>
      <p>موقعي الاحترافي المُولَّد بالذكاء الاصطناعي</p>
    </div>
  </section>
</body>
</html>`;

  const consoleLines = [
    { type: 'info', text: '✓ تم تهيئة مشروع جديد' },
    { type: 'success', text: '✓ تم تحليل المتطلبات' },
    { type: 'info', text: '⟳ جاري توليد HTML...' },
    { type: 'success', text: '✓ تم توليد HTML (245 سطر)' },
    { type: 'info', text: '⟳ جاري توليد CSS...' },
    { type: 'success', text: '✓ تم توليد CSS (189 سطر)' },
    { type: 'success', text: '✓ تم التحقق من الكود' },
    { type: 'success', text: '✓ الموقع جاهز للمعاينة' },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!prompt.trim() || isGenerating) return;
    const userMsg = prompt.trim();
    setPrompt('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate generation
    const interval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + Math.random() * 15;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setGenerationProgress(100);
      setIsGenerating(false);
      setPreviewContent(demoCode);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `تم إنشاء الموقع بنجاح! 🎉 لقد قمت بتوليد موقع احترافي بناءً على وصفك. يمكنك معاينته في اللوحة اليمنى، أو تنزيل الكود مباشرة.`,
      }]);
    }, 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout title="لوحة التحكم" subtitle="مرحباً بك في Dev-Agent">
      <div className="p-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <StatCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* Main Content: Chat + Preview */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* AI Chat Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#13131D', border: '1px solid #23233A', height: '560px' }}
          >
            {/* Chat Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#23233A', background: '#0F0F1A' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }}>
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="font-bold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>مساعد الذكاء الاصطناعي</div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs" style={{ color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>متصل</span>
                  </div>
                </div>
              </div>
              <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Templates */}
            <div className="px-4 py-3 border-b flex gap-2 overflow-x-auto" style={{ borderColor: '#23233A' }}>
              {quickTemplates.map((t, i) => (
                <button key={i} onClick={() => setPrompt(`أنشئ لي ${t.name} احترافي`)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                  style={{ background: `${t.color}12`, border: `1px solid ${t.color}25`, color: t.color, fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${t.color}20`}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${t.color}12`}>
                  <span>{t.icon}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => (
                <ChatMessage key={i} role={msg.role} content={msg.content} />
              ))}
              {isGenerating && (
                <div className="space-y-3">
                  <ChatMessage role="assistant" content="جاري توليد الموقع..." isStreaming />
                  {/* Progress Bar */}
                  <div className="px-11">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>جاري التوليد...</span>
                      <span className="text-xs font-bold" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>{Math.min(100, Math.round(generationProgress))}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#23233A' }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #3B82F6, #7C3AED)' }}
                        animate={{ width: `${Math.min(100, generationProgress)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t" style={{ borderColor: '#23233A' }}>
              <div className="flex gap-3 items-end">
                <div className="flex-1 rounded-xl overflow-hidden" style={{ background: '#0B0B13', border: '1px solid #23233A' }}>
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="صف موقعك بالعربية... (Enter للإرسال)"
                    rows={2}
                    className="w-full bg-transparent px-4 py-3 text-sm resize-none outline-none"
                    style={{ color: '#FFFFFF', fontFamily: 'Cairo, sans-serif', direction: 'rtl', textAlign: 'right' }}
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSend}
                  disabled={!prompt.trim() || isGenerating}
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: prompt.trim() && !isGenerating ? 'linear-gradient(135deg, #3B82F6, #7C3AED)' : '#23233A',
                    boxShadow: prompt.trim() && !isGenerating ? '0 4px 15px rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col rounded-2xl overflow-hidden"
            style={{ background: '#13131D', border: '1px solid #23233A', height: '560px' }}
          >
            {/* Preview Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#23233A', background: '#0F0F1A' }}>
              <div className="flex gap-1">
                {[
                  { id: 'preview', icon: Eye, label: 'معاينة' },
                  { id: 'code', icon: Code2, label: 'الكود' },
                  { id: 'console', icon: Terminal, label: 'السجل' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: activeTab === tab.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                      color: activeTab === tab.id ? '#3B82F6' : '#B6B6C6',
                      border: activeTab === tab.id ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                      fontFamily: 'Cairo, sans-serif',
                    }}>
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {previewContent && (
                  <>
                    <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'preview' && (
                <div className="h-full flex items-center justify-center" style={{ background: '#080810' }}>
                  {previewContent ? (
                    <iframe
                      srcDoc={previewContent}
                      className="w-full h-full border-0"
                      title="معاينة الموقع"
                    />
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <Globe className="w-8 h-8" style={{ color: '#3B82F6' }} />
                      </div>
                      <p className="font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>المعاينة ستظهر هنا</p>
                      <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>أرسل وصفاً للموقع في المحادثة لبدء التوليد</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'code' && (
                <div className="h-full overflow-auto p-4" style={{ background: '#080810', direction: 'ltr' }}>
                  {previewContent ? (
                    <pre className="text-xs leading-relaxed" style={{ color: '#B6B6C6', fontFamily: 'JetBrains Mono, Fira Code, monospace', textAlign: 'left' }}>
                      <code>{demoCode}</code>
                    </pre>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-sm" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif', direction: 'rtl' }}>لا يوجد كود بعد. ابدأ بإرسال وصف للموقع.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'console' && (
                <div className="h-full overflow-auto p-4" style={{ background: '#080810', direction: 'ltr' }}>
                  <div className="space-y-1.5">
                    {consoleLines.map((line, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-2 text-xs font-mono" style={{ textAlign: 'left' }}>
                        <span style={{ color: line.type === 'success' ? '#22C55E' : '#3B82F6' }}>{line.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Bottom Row: Recent Projects + Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{ background: '#13131D', border: '1px solid #23233A' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#23233A' }}>
              <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>المشاريع الأخيرة</h3>
              <button onClick={() => setLocation('/projects')} className="flex items-center gap-1 text-sm transition-all" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                <span>عرض الكل</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(35,35,58,0.5)' }}>
              {recentProjects.map((p, i) => (
                <motion.div key={i} whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                  className="flex items-center justify-between px-5 py-4 cursor-pointer transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                      <FolderOpen className="w-4 h-4" style={{ color: '#3B82F6' }} />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{p.time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${p.color}15`, color: p.color, fontFamily: 'Cairo, sans-serif' }}>
                    {p.status}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Stats / Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#13131D', border: '1px solid #23233A' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: '#23233A' }}>
              <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>نشاط اليوم</h3>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'عمليات التوليد', value: 12, max: 20, color: '#3B82F6' },
                { label: 'المشاريع المحدّثة', value: 5, max: 12, color: '#7C3AED' },
                { label: 'عمليات النشر', value: 3, max: 10, color: '#22C55E' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{item.label}</span>
                    <span className="text-sm font-bold" style={{ color: item.color, fontFamily: 'Cairo, sans-serif' }}>{item.value}/{item.max}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#23233A' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.value / item.max) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ background: item.color }}
                    />
                  </div>
                </div>
              ))}

              <div className="pt-4 border-t" style={{ borderColor: '#23233A' }}>
                <div className="text-xs font-semibold mb-3" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif', letterSpacing: '0.05em' }}>آخر الأنشطة</div>
                <div className="space-y-3">
                  {[
                    { text: 'تم نشر "متجر الإلكترونيات"', time: 'منذ 5 دقائق', color: '#22C55E' },
                    { text: 'تم توليد نسخة جديدة', time: 'منذ 20 دقيقة', color: '#3B82F6' },
                    { text: 'تم إنشاء مشروع جديد', time: 'منذ ساعة', color: '#7C3AED' },
                  ].map((a, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.color }} />
                      <div>
                        <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{a.text}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{a.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
