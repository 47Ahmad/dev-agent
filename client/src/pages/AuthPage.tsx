import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  Code2, Eye, EyeOff, Mail, Lock, User, ArrowLeft,
  Github, Chrome, Check, Sparkles, Shield, Zap
} from 'lucide-react';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setLocation('/dashboard');
    }, 1500);
  };

  const features = [
    { icon: Sparkles, text: 'توليد مواقع بالذكاء الاصطناعي' },
    { icon: Zap, text: 'معاينة حية فورية' },
    { icon: Shield, text: 'أمان وخصوصية تامة' },
  ];

  return (
    <div className="min-h-screen flex" style={{ background: '#050508', direction: 'rtl' }}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden" style={{ background: '#0B0B13', borderLeft: '1px solid #23233A' }}>
        {/* Background Effects */}
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute top-1/3 right-1/2 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', filter: 'blur(40px)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', boxShadow: '0 4px 20px rgba(59,130,246,0.3)' }}>
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>Dev-Agent</span>
        </div>

        {/* Main Content */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl font-black text-white mb-4 leading-tight" style={{ fontFamily: 'Cairo, sans-serif' }}>
              ابنِ موقعك المثالي
              <br />
              <span style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                بالذكاء الاصطناعي
              </span>
            </h1>
            <p className="text-lg mb-8" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
              منصة احترافية لبناء مواقع الويب باستخدام أحدث تقنيات الذكاء الاصطناعي
            </p>
            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
                    <f.icon className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom Testimonial */}
        <div className="relative p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm mb-3 leading-relaxed" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
            "Dev-Agent غيّر طريقة عملي بالكامل. الآن أستطيع تسليم مشاريع في ساعات بدلاً من أيام."
          </p>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>أ</div>
            <div>
              <p className="text-sm font-semibold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>أحمد المنصوري</p>
              <p className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>مطور مستقل</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }}>
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>Dev-Agent</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {mode === 'login' ? 'أهلاً بعودتك' : mode === 'register' ? 'إنشاء حساب جديد' : 'استعادة كلمة المرور'}
            </h2>
            <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
              {mode === 'login' ? 'سجّل دخولك للمتابعة' : mode === 'register' ? 'ابدأ رحلتك مع الذكاء الاصطناعي' : 'أدخل بريدك الإلكتروني لاستعادة كلمة المرور'}
            </p>
          </div>

          {/* Social Auth */}
          {mode !== 'forgot' && (
            <div className="flex gap-3 mb-6">
              {[
                { icon: Github, label: 'GitHub' },
                { icon: Chrome, label: 'Google' },
              ].map((provider, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: '#13131D', border: '1px solid #23233A', color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#23233A'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                >
                  <provider.icon className="w-4 h-4" />
                  <span>{provider.label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: '#23233A' }} />
              <span className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>أو</span>
              <div className="flex-1 h-px" style={{ background: '#23233A' }} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>الاسم الكامل</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="أحمد المنصوري"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#13131D', border: '1px solid #23233A', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif', paddingLeft: '3rem', direction: 'rtl', textAlign: 'right' }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = '#3B82F6'}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = '#23233A'}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6B80' }} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ahmed@example.com"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: '#13131D', border: '1px solid #23233A', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif', paddingLeft: '3rem', direction: 'ltr', textAlign: 'right' }}
                  onFocus={e => (e.target as HTMLElement).style.borderColor = '#3B82F6'}
                  onBlur={e => (e.target as HTMLElement).style.borderColor = '#23233A'}
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6B80' }} />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-semibold" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>كلمة المرور</label>
                  {mode === 'login' && (
                    <button type="button" onClick={() => setMode('forgot')} className="text-xs" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>نسيت كلمة المرور؟</button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#13131D', border: '1px solid #23233A', color: '#FFFFFF', paddingLeft: '3rem', paddingRight: '3rem' }}
                    onFocus={e => (e.target as HTMLElement).style.borderColor = '#3B82F6'}
                    onBlur={e => (e.target as HTMLElement).style.borderColor = '#23233A'}
                  />
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#6B6B80' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B80' }}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                  <Check className="w-3 h-3" style={{ color: '#3B82F6' }} />
                </div>
                <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                  أوافق على <span style={{ color: '#3B82F6' }}>شروط الاستخدام</span> و<span style={{ color: '#3B82F6' }}>سياسة الخصوصية</span>
                </p>
              </div>
            )}

            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white transition-all"
              style={{ background: loading ? 'rgba(59,130,246,0.5)' : 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: loading ? 'none' : '0 8px 25px rgba(59,130,246,0.3)' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري التحميل...</span>
                </div>
              ) : (
                mode === 'login' ? 'تسجيل الدخول' : mode === 'register' ? 'إنشاء الحساب' : 'إرسال رابط الاستعادة'
              )}
            </motion.button>
          </form>

          {/* Switch Mode */}
          <div className="text-center mt-6">
            {mode === 'login' && (
              <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                ليس لديك حساب؟{' '}
                <button onClick={() => setMode('register')} className="font-bold" style={{ color: '#3B82F6' }}>إنشاء حساب</button>
              </p>
            )}
            {mode === 'register' && (
              <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                لديك حساب بالفعل؟{' '}
                <button onClick={() => setMode('login')} className="font-bold" style={{ color: '#3B82F6' }}>تسجيل الدخول</button>
              </p>
            )}
            {mode === 'forgot' && (
              <button onClick={() => setMode('login')} className="flex items-center gap-2 mx-auto text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                <ArrowLeft className="w-4 h-4" />
                <span>العودة لتسجيل الدخول</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
