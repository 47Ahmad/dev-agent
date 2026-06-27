import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Code2, Eye, Rocket, Shield, Zap, Globe, Sparkles, ArrowLeft,
  Check, Star, ChevronDown, Play, Users, TrendingUp, Award,
  Layers, Terminal, Cpu, Wand2, Layout, Palette, Download,
  MessageSquare, Clock, Lock, BarChart3, Menu, X, Github,
  Twitter, Linkedin, Mail, ExternalLink, ChevronRight
} from 'lucide-react';

// ===== FLOATING PARTICLE =====
function FloatingParticle({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size, background: color, filter: 'blur(1px)' }}
      animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

// ===== ANIMATED COUNTER =====
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString('ar')}{suffix}</span>;
}

// ===== SECTION WRAPPER =====
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  const particles = [
    { x: 10, y: 20, size: 4, delay: 0, color: 'rgba(59,130,246,0.6)' },
    { x: 85, y: 15, size: 6, delay: 1, color: 'rgba(124,58,237,0.5)' },
    { x: 25, y: 70, size: 3, delay: 2, color: 'rgba(59,130,246,0.4)' },
    { x: 70, y: 60, size: 5, delay: 0.5, color: 'rgba(124,58,237,0.6)' },
    { x: 50, y: 85, size: 4, delay: 1.5, color: 'rgba(34,197,94,0.4)' },
    { x: 90, y: 80, size: 3, delay: 2.5, color: 'rgba(59,130,246,0.5)' },
    { x: 5, y: 50, size: 5, delay: 3, color: 'rgba(245,158,11,0.3)' },
    { x: 60, y: 10, size: 4, delay: 0.8, color: 'rgba(59,130,246,0.4)' },
  ];

  const features = [
    { icon: Wand2, title: 'توليد بالذكاء الاصطناعي', desc: 'صف موقعك بالعربية وسيولّد الذكاء الاصطناعي كوداً احترافياً في ثوانٍ معدودة.', color: '#3B82F6', glow: 'rgba(59,130,246,0.3)' },
    { icon: Eye, title: 'معاينة حية فورية', desc: 'شاهد موقعك يتشكّل أمام عينيك في الوقت الفعلي دون مغادرة المنصة.', color: '#7C3AED', glow: 'rgba(124,58,237,0.3)' },
    { icon: Clock, title: 'تاريخ الإصدارات', desc: 'كل تعديل يُحفظ تلقائياً. استرجع أي نسخة سابقة بنقرة واحدة.', color: '#22C55E', glow: 'rgba(34,197,94,0.3)' },
    { icon: Lock, title: 'أمان وخصوصية تامة', desc: 'بياناتك محمية بعزل متعدد المستأجرين وتشفير كامل من الطرف إلى الطرف.', color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
    { icon: Download, title: 'كود نظيف قابل للتنزيل', desc: 'الكود المُولَّد نظيف ومنظّم وقابل للتعديل، يمكنك تنزيله واستخدامه في أي مكان.', color: '#06B6D4', glow: 'rgba(6,182,212,0.3)' },
    { icon: Layers, title: 'مساحات عمل متعددة', desc: 'نظّم مشاريعك في مساحات عمل منفصلة مع عزل تام للبيانات وصلاحيات مخصصة.', color: '#EC4899', glow: 'rgba(236,72,153,0.3)' },
  ];

  const stats = [
    { value: 10000, suffix: '+', label: 'موقع مُولَّد', icon: Globe },
    { value: 5000, suffix: '+', label: 'مستخدم نشط', icon: Users },
    { value: 99, suffix: '.9%', label: 'وقت التشغيل', icon: TrendingUp },
    { value: 4.9, suffix: '/5', label: 'تقييم المستخدمين', icon: Star },
  ];

  const steps = [
    { num: '01', title: 'صف مشروعك', desc: 'اكتب وصفاً لموقعك باللغة العربية بشكل طبيعي كما تتحدث.', icon: MessageSquare },
    { num: '02', title: 'الذكاء الاصطناعي يبني', desc: 'يقوم الذكاء الاصطناعي بتوليد الكود الكامل تلقائياً في ثوانٍ.', icon: Cpu },
    { num: '03', title: 'عاين وعدّل', desc: 'شاهد النتيجة فوراً وعدّل حتى تصل إلى ما تريد بالضبط.', icon: Eye },
    { num: '04', title: 'انشر ووزّع', desc: 'انشر موقعك بنقرة واحدة أو نزّل الكود واستخدمه أينما تشاء.', icon: Rocket },
  ];

  const templates = [
    { name: 'متجر إلكتروني', category: 'تجارة', color: '#3B82F6', icon: '🛍️' },
    { name: 'موقع شركة', category: 'أعمال', color: '#7C3AED', icon: '🏢' },
    { name: 'مدونة احترافية', category: 'محتوى', color: '#22C55E', icon: '✍️' },
    { name: 'بورتفوليو', category: 'إبداع', color: '#F59E0B', icon: '🎨' },
    { name: 'صفحة هبوط', category: 'تسويق', color: '#EC4899', icon: '🚀' },
    { name: 'لوحة تحكم', category: 'تطبيق', color: '#06B6D4', icon: '📊' },
  ];

  const pricing = [
    {
      name: 'مجاني', price: '0', period: 'شهرياً', desc: 'للبدء والاستكشاف',
      features: ['3 مشاريع نشطة', '10 عمليات توليد/شهر', 'معاينة حية', 'تاريخ الإصدارات (7 أيام)', 'دعم عبر البريد'],
      cta: 'ابدأ مجاناً', featured: false, badge: null,
    },
    {
      name: 'احترافي', price: '19', period: 'شهرياً', desc: 'للمبدعين والمستقلين',
      features: ['مشاريع غير محدودة', '100 عملية توليد/شهر', 'معاينة متقدمة', 'تاريخ إصدارات كامل', 'تنزيل الكود', 'دعم أولوية'],
      cta: 'ابدأ التجربة المجانية', featured: true, badge: 'الأكثر شيوعاً',
    },
    {
      name: 'فريق', price: '49', period: 'شهرياً', desc: 'للفرق والشركات',
      features: ['كل ميزات الاحترافي', 'توليد غير محدود', 'مساحات عمل متعددة', 'إدارة الفريق', 'API للمطورين', 'دعم مخصص 24/7'],
      cta: 'تواصل معنا', featured: false, badge: null,
    },
  ];

  const testimonials = [
    { name: 'أحمد المنصوري', role: 'مطور مستقل', avatar: 'أ', text: 'Dev-Agent غيّر طريقة عملي بالكامل. الآن أستطيع تسليم مشاريع في ساعات بدلاً من أيام.', rating: 5 },
    { name: 'سارة العتيبي', role: 'مصممة UI/UX', avatar: 'س', text: 'الجودة التي يولّدها الذكاء الاصطناعي مذهلة. الكود نظيف وقابل للتعديل بسهولة.', rating: 5 },
    { name: 'محمد الزهراني', role: 'مؤسس شركة ناشئة', avatar: 'م', text: 'وفّرنا أكثر من 80% من تكاليف التطوير الأولية باستخدام Dev-Agent لبناء MVP.', rating: 5 },
  ];

  const navLinks = [
    { label: 'المميزات', href: '#features' },
    { label: 'كيف يعمل', href: '#how-it-works' },
    { label: 'القوالب', href: '#templates' },
    { label: 'الأسعار', href: '#pricing' },
  ];

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#050508', direction: 'rtl' }}>
      {/* ===== NAVBAR ===== */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 right-0 left-0 z-50"
        style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(35,35,58,0.6)' }}
      >
        <div className="container mx-auto px-6 h-16 flex items-center justify-between max-w-7xl">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }}>
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>Dev-Agent</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = '#FFFFFF'; (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = '#B6B6C6'; (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setLocation('/dashboard')}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
              onMouseEnter={e => (e.target as HTMLElement).style.color = '#FFFFFF'}
              onMouseLeave={e => (e.target as HTMLElement).style.color = '#B6B6C6'}
            >
              تسجيل الدخول
            </button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation('/dashboard')}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
            >
              ابدأ مجاناً
            </motion.button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden p-2 rounded-lg"
            style={{ color: '#B6B6C6' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t px-6 py-4 space-y-2"
            style={{ background: 'rgba(11,11,19,0.98)', borderColor: '#23233A' }}
          >
            {navLinks.map(link => (
              <button
                key={link.href}
                onClick={() => scrollToSection(link.href)}
                className="block w-full text-right px-4 py-3 rounded-lg text-sm font-medium"
                style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={() => setLocation('/dashboard')} className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>
                ابدأ مجاناً
              </button>
            </div>
          </motion.div>
        )}
      </motion.nav>

      {/* ===== HERO SECTION ===== */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 grid-bg opacity-30" />

        {/* Floating Particles */}
        {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 container mx-auto px-6 max-w-6xl text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>مدعوم بأحدث نماذج الذكاء الاصطناعي</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight"
            style={{ fontFamily: 'Cairo, sans-serif', letterSpacing: '-0.02em' }}
          >
            <span className="text-white">ابنِ موقعك</span>
            <br />
            <span style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 50%, #EC4899 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              بالذكاء الاصطناعي
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed"
            style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
          >
            صف موقعك بالعربية، وسيبنيه الذكاء الاصطناعي في ثوانٍ.
            <br />
            <span className="text-white font-semibold">بدون كود. بدون تعقيد. بدون حدود.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59,130,246,0.4)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation('/dashboard')}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 8px 30px rgba(59,130,246,0.35)' }}
            >
              <Rocket className="w-5 h-5" />
              <span>ابدأ مجاناً الآن</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, background: 'rgba(255,255,255,0.08)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl text-lg font-semibold"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif' }}
            >
              <Play className="w-5 h-5" style={{ color: '#3B82F6' }} />
              <span>شاهد العرض التوضيحي</span>
            </motion.button>
          </motion.div>

          {/* Hero Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative mx-auto max-w-5xl"
          >
            {/* Browser Frame */}
            <div className="rounded-2xl overflow-hidden" style={{ background: '#13131D', border: '1px solid #23233A', boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(59,130,246,0.1)' }}>
              {/* Browser Bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b" style={{ background: '#0B0B13', borderColor: '#23233A' }}>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-80" />
                  <div className="w-3 h-3 rounded-full bg-green-500 opacity-80" />
                </div>
                <div className="flex-1 mx-4 px-4 py-1.5 rounded-lg text-xs" style={{ background: '#13131D', color: '#6B6B80', fontFamily: 'Inter, monospace', direction: 'ltr', textAlign: 'left' }}>
                  https://dev-agent.ai/dashboard
                </div>
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: '#23233A' }} />
                  <div className="w-4 h-4 rounded" style={{ background: '#23233A' }} />
                </div>
              </div>

              {/* Dashboard Preview Content */}
              <div className="p-6" style={{ background: '#050508', minHeight: '320px' }}>
                <div className="flex gap-4 h-full">
                  {/* Sidebar Preview */}
                  <div className="w-48 flex-shrink-0 rounded-xl p-3 space-y-2" style={{ background: '#0B0B13', border: '1px solid #23233A' }}>
                    <div className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)' }}>
                      <div className="w-4 h-4 rounded" style={{ background: '#3B82F6' }} />
                      <div className="h-3 rounded flex-1" style={{ background: '#3B82F6', opacity: 0.7 }} />
                    </div>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg">
                        <div className="w-4 h-4 rounded" style={{ background: '#23233A' }} />
                        <div className="h-3 rounded flex-1" style={{ background: '#23233A' }} />
                      </div>
                    ))}
                  </div>

                  {/* Main Content Preview */}
                  <div className="flex-1 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { color: '#3B82F6', label: '12 مشروع' },
                        { color: '#22C55E', label: '98% نجاح' },
                        { color: '#7C3AED', label: '2.4k توليد' },
                      ].map((s, i) => (
                        <div key={i} className="rounded-xl p-3" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                          <div className="w-6 h-6 rounded-lg mb-2" style={{ background: `${s.color}20` }}>
                            <div className="w-3 h-3 rounded m-1.5" style={{ background: s.color }} />
                          </div>
                          <div className="h-5 rounded mb-1" style={{ background: s.color, width: '60%', opacity: 0.9 }} />
                          <div className="h-2.5 rounded" style={{ background: '#23233A', width: '80%' }} />
                        </div>
                      ))}
                    </div>

                    {/* AI Chat Preview */}
                    <div className="rounded-xl p-4 space-y-3" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }} />
                        <div className="h-3 rounded w-24" style={{ background: '#23233A' }} />
                        <div className="mr-auto w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                        <div className="h-2.5 rounded mb-2" style={{ background: 'rgba(59,130,246,0.4)', width: '85%' }} />
                        <div className="h-2.5 rounded" style={{ background: 'rgba(59,130,246,0.3)', width: '60%' }} />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 h-9 rounded-xl" style={{ background: '#0B0B13', border: '1px solid #23233A' }} />
                        <div className="w-9 h-9 rounded-xl" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glow under browser */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-20 pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(59,130,246,0.2) 0%, transparent 70%)', filter: 'blur(20px)' }} />
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          style={{ color: '#6B6B80' }}
        >
          <span className="text-xs" style={{ fontFamily: 'Cairo, sans-serif' }}>اكتشف المزيد</span>
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* ===== STATS SECTION ===== */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #050508 0%, #0B0B13 50%, #050508 100%)' }} />
        <div className="relative container mx-auto px-6 max-w-6xl">
          <Section>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center p-6 rounded-2xl"
                  style={{ background: '#13131D', border: '1px solid #23233A' }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <stat.icon className="w-6 h-6" style={{ color: '#3B82F6' }} />
                  </div>
                  <div className="text-3xl md:text-4xl font-black mb-2" style={{ fontFamily: 'Cairo, sans-serif', background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </Section>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <Section>
            <div className="text-center mb-16">
              <div className="section-label mx-auto mb-6">
                <Sparkles className="w-4 h-4" />
                <span>المميزات</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                كل ما تحتاجه في
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> منصة واحدة</span>
              </h2>
              <p className="text-xl max-w-2xl mx-auto" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                أدوات متكاملة مدعومة بالذكاء الاصطناعي لبناء مواقع احترافية بسرعة قياسية
              </p>
            </div>
          </Section>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, borderColor: `${f.color}60` }}
                className="p-6 rounded-2xl cursor-default group"
                style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.color}15`, boxShadow: `0 0 20px ${f.glow}` }}>
                  <f.icon className="w-6 h-6" style={{ color: f.color }} />
                </div>
                <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: '#0B0B13' }} />
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative container mx-auto px-6 max-w-6xl">
          <Section>
            <div className="text-center mb-16">
              <div className="section-label mx-auto mb-6">
                <Zap className="w-4 h-4" />
                <span>كيف يعمل</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                أربع خطوات بسيطة
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> لموقعك الاحترافي</span>
              </h2>
            </div>
          </Section>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-16 right-[12.5%] left-[12.5%] h-px" style={{ background: 'linear-gradient(90deg, transparent, #3B82F6, #7C3AED, transparent)' }} />

            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center relative"
              >
                {/* Step Number */}
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', boxShadow: '0 8px 30px rgba(59,130,246,0.35)' }}>
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold mb-3" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif', letterSpacing: '0.1em' }}>{step.num}</div>
                <h3 className="text-lg font-bold text-white mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TEMPLATES SECTION ===== */}
      <section id="templates" className="py-24 relative">
        <div className="container mx-auto px-6 max-w-6xl">
          <Section>
            <div className="text-center mb-16">
              <div className="section-label mx-auto mb-6">
                <Layout className="w-4 h-4" />
                <span>القوالب</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                ابدأ من
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> قالب جاهز</span>
              </h2>
              <p className="text-xl max-w-2xl mx-auto" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                عشرات القوالب الاحترافية المصممة لمختلف الأغراض، جاهزة للتخصيص
              </p>
            </div>
          </Section>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {templates.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, borderColor: `${t.color}50` }}
                className="p-6 rounded-2xl cursor-pointer group"
                style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
              >
                <div className="text-4xl mb-4">{t.icon}</div>
                <div className="text-xs font-semibold mb-2 px-2 py-1 rounded-full inline-block" style={{ background: `${t.color}15`, color: t.color, fontFamily: 'Cairo, sans-serif' }}>
                  {t.category}
                </div>
                <h3 className="text-base font-bold text-white mt-2" style={{ fontFamily: 'Cairo, sans-serif' }}>{t.name}</h3>
                <div className="mt-4 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: t.color, fontFamily: 'Cairo, sans-serif' }}>
                  <span>استخدم هذا القالب</span>
                  <ChevronRight className="w-3 h-3" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <motion.button
              whileHover={{ scale: 1.03 }}
              onClick={() => setLocation('/dashboard')}
              className="px-8 py-3 rounded-xl font-semibold"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}
            >
              عرض جميع القوالب
            </motion.button>
          </div>
        </div>
      </section>

      {/* ===== PRICING SECTION ===== */}
      <section id="pricing" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: '#0B0B13' }} />
        <div className="relative container mx-auto px-6 max-w-6xl">
          <Section>
            <div className="text-center mb-16">
              <div className="section-label mx-auto mb-6">
                <BarChart3 className="w-4 h-4" />
                <span>الأسعار</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                أسعار
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> شفافة وعادلة</span>
              </h2>
              <p className="text-xl max-w-2xl mx-auto" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                ابدأ مجاناً وطوّر خطتك عند الحاجة. لا رسوم خفية.
              </p>
            </div>
          </Section>

          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className={`p-8 rounded-2xl relative ${plan.featured ? 'pricing-featured' : ''}`}
                style={{ background: plan.featured ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(124,58,237,0.08))' : '#13131D', border: plan.featured ? '1px solid rgba(59,130,246,0.5)' : '1px solid #23233A', transition: 'all 0.3s ease' }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>{plan.name}</h3>
                  <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{plan.desc}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>${plan.price}</span>
                    <span className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: plan.featured ? 'rgba(59,130,246,0.2)' : 'rgba(34,197,94,0.15)' }}>
                        <Check className="w-3 h-3" style={{ color: plan.featured ? '#3B82F6' : '#22C55E' }} />
                      </div>
                      <span className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation('/dashboard')}
                  className="w-full py-3 rounded-xl font-bold text-sm"
                  style={{
                    background: plan.featured ? 'linear-gradient(135deg, #3B82F6, #7C3AED)' : 'rgba(255,255,255,0.05)',
                    color: plan.featured ? '#FFFFFF' : '#B6B6C6',
                    border: plan.featured ? 'none' : '1px solid #23233A',
                    fontFamily: 'Cairo, sans-serif',
                    boxShadow: plan.featured ? '0 8px 25px rgba(59,130,246,0.3)' : 'none',
                  }}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-24 relative">
        <div className="container mx-auto px-6 max-w-4xl">
          <Section>
            <div className="text-center mb-16">
              <div className="section-label mx-auto mb-6">
                <Star className="w-4 h-4" />
                <span>آراء العملاء</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
                ماذا يقول
                <span style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}> مستخدمونا</span>
              </h2>
            </div>
          </Section>

          <div className="relative">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: activeTestimonial === i ? 1 : 0, scale: activeTestimonial === i ? 1 : 0.95, display: activeTestimonial === i ? 'block' : 'none' }}
                transition={{ duration: 0.5 }}
                className="p-8 rounded-2xl text-center"
                style={{ background: '#13131D', border: '1px solid #23233A' }}
              >
                <div className="flex justify-center mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-xl leading-relaxed mb-8 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>"{t.text}"</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>
                    {t.avatar}
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>{t.name}</div>
                    <div className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className="w-2 h-2 rounded-full transition-all"
                  style={{ background: activeTestimonial === i ? '#3B82F6' : '#23233A', width: activeTestimonial === i ? '24px' : '8px' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(124,58,237,0.08) 100%)' }} />
        <div className="absolute inset-0" style={{ border: '1px solid rgba(59,130,246,0.1)', margin: '2rem', borderRadius: '2rem' }} />
        <div className="relative container mx-auto px-6 max-w-4xl text-center">
          <Section>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-8" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', boxShadow: '0 0 40px rgba(59,130,246,0.4)' }}>
              <Rocket className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black mb-6 text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>
              جاهز للبدء؟
            </h2>
            <p className="text-xl mb-10" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
              انضم إلى آلاف المطورين والمصممين الذين يبنون مواقعهم بالذكاء الاصطناعي
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(59,130,246,0.4)' }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation('/dashboard')}
                className="flex items-center gap-3 px-10 py-4 rounded-2xl text-lg font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 8px 30px rgba(59,130,246,0.35)' }}
              >
                <Sparkles className="w-5 h-5" />
                <span>ابدأ مجاناً الآن</span>
              </motion.button>
            </div>
            <p className="mt-6 text-sm" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>
              لا يتطلب بطاقة ائتمانية • مجاناً للأبد على الخطة الأساسية
            </p>
          </Section>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-16 relative" style={{ borderTop: '1px solid #23233A', background: '#0B0B13' }}>
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }}>
                  <Code2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>Dev-Agent</span>
              </div>
              <p className="text-sm leading-relaxed mb-6" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                منصة بناء المواقع بالذكاء الاصطناعي. ابنِ موقعك الاحترافي في ثوانٍ.
              </p>
              <div className="flex gap-3">
                {[Github, Twitter, Linkedin].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-lg flex items-center justify-center transition-all" style={{ background: '#13131D', border: '1px solid #23233A', color: '#B6B6C6' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6'; (e.currentTarget as HTMLElement).style.color = '#3B82F6'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#23233A'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}>
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              { title: 'المنتج', links: ['المميزات', 'القوالب', 'الأسعار', 'خارطة الطريق'] },
              { title: 'الشركة', links: ['من نحن', 'المدونة', 'الوظائف', 'اتصل بنا'] },
              { title: 'الدعم', links: ['التوثيق', 'مركز المساعدة', 'المجتمع', 'الحالة'] },
            ].map((col, i) => (
              <div key={i}>
                <h4 className="font-bold text-white mb-4" style={{ fontFamily: 'Cairo, sans-serif' }}>{col.title}</h4>
                <ul className="space-y-3">
                  {col.links.map((link, j) => (
                    <li key={j}>
                      <button className="text-sm transition-colors" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
                        onMouseEnter={e => (e.target as HTMLElement).style.color = '#FFFFFF'}
                        onMouseLeave={e => (e.target as HTMLElement).style.color = '#B6B6C6'}>
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="divider" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4">
            <p className="text-sm" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>
              © 2024 Dev-Agent. جميع الحقوق محفوظة.
            </p>
            <div className="flex gap-6">
              {['سياسة الخصوصية', 'شروط الاستخدام', 'سياسة الكوكيز'].map((link, i) => (
                <button key={i} className="text-sm transition-colors" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#B6B6C6'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = '#6B6B80'}>
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
