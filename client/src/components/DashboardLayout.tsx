import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderOpen, Layout, ShoppingBag, Globe,
  CreditCard, Settings, User, LogOut, Bell, Search, Menu, X,
  Code2, ChevronDown, Sparkles, Zap, HelpCircle, Moon, Sun,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'لوحة التحكم', path: '/dashboard', badge: null },
  { icon: FolderOpen, label: 'المشاريع', path: '/projects', badge: '12' },
  { icon: Layout, label: 'القوالب', path: '/templates', badge: null },
  { icon: ShoppingBag, label: 'المتجر', path: '/marketplace', badge: 'جديد' },
  { icon: Globe, label: 'النشر', path: '/deployments', badge: null },
];

const bottomItems = [
  { icon: CreditCard, label: 'الفواتير', path: '/billing' },
  { icon: Settings, label: 'الإعدادات', path: '/settings' },
  { icon: User, label: 'الملف الشخصي', path: '/profile' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const notifications = [
    { id: 1, title: 'تم إنشاء المشروع بنجاح', time: 'منذ 5 دقائق', read: false, color: '#22C55E' },
    { id: 2, title: 'تحديث جديد متاح', time: 'منذ ساعة', read: false, color: '#3B82F6' },
    { id: 3, title: 'اكتمل النشر', time: 'منذ 3 ساعات', read: true, color: '#7C3AED' },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: '#23233A' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
            <Code2 className="w-5 h-5 text-white" />
          </div>
          {(sidebarOpen || mobileSidebarOpen) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-w-0">
              <div className="font-bold text-white text-lg leading-none" style={{ fontFamily: 'Cairo, sans-serif' }}>Dev-Agent</div>
              <div className="text-xs mt-0.5" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>منصة الذكاء الاصطناعي</div>
            </motion.div>
          )}
        </div>
      </div>

      {/* AI Quick Action */}
      {(sidebarOpen || mobileSidebarOpen) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
          <button
            onClick={() => setLocation('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', boxShadow: '0 4px 15px rgba(59,130,246,0.25)', fontFamily: 'Cairo, sans-serif' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(59,130,246,0.4)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 15px rgba(59,130,246,0.25)'}
          >
            <Sparkles className="w-4 h-4 flex-shrink-0" />
            <span>مشروع جديد بالذكاء الاصطناعي</span>
          </button>
        </motion.div>
      )}

      {!sidebarOpen && !mobileSidebarOpen && (
        <div className="p-3">
          <button
            onClick={() => setLocation('/dashboard')}
            className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)' }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {(sidebarOpen || mobileSidebarOpen) && (
          <div className="text-xs font-semibold mb-3 px-2" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif', letterSpacing: '0.08em' }}>
            القائمة الرئيسية
          </div>
        )}
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <motion.button
                key={item.path}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setLocation(item.path); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all relative group"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
                  color: isActive ? '#3B82F6' : '#B6B6C6',
                  fontFamily: 'Cairo, sans-serif',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; } }}
              >
                {isActive && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full" style={{ background: '#3B82F6' }} />}
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {(sidebarOpen || mobileSidebarOpen) && (
                  <>
                    <span className="flex-1 text-right text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{
                        background: item.badge === 'جديد' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                        color: item.badge === 'جديد' ? '#22C55E' : '#3B82F6',
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Bottom Nav Items */}
        <div className="mt-6 pt-4 border-t space-y-1" style={{ borderColor: '#23233A' }}>
          {(sidebarOpen || mobileSidebarOpen) && (
            <div className="text-xs font-semibold mb-3 px-2" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif', letterSpacing: '0.08em' }}>
              الحساب
            </div>
          )}
          {bottomItems.map((item) => {
            const isActive = location === item.path;
            return (
              <motion.button
                key={item.path}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setLocation(item.path); setMobileSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                style={{
                  background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
                  color: isActive ? '#3B82F6' : '#B6B6C6',
                  fontFamily: 'Cairo, sans-serif',
                }}
                onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; } }}
                onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; } }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {(sidebarOpen || mobileSidebarOpen) && (
                  <span className="flex-1 text-right text-sm font-medium">{item.label}</span>
                )}
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t" style={{ borderColor: '#23233A' }}>
        <div className="flex items-center gap-3 p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-white text-sm" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>
            أ
          </div>
          {(sidebarOpen || mobileSidebarOpen) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate" style={{ fontFamily: 'Cairo, sans-serif' }}>أحمد المستخدم</div>
              <div className="text-xs truncate" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>الخطة الاحترافية</div>
            </motion.div>
          )}
          {(sidebarOpen || mobileSidebarOpen) && (
            <button
              onClick={() => setLocation('/')}
              className="p-1.5 rounded-lg transition-all"
              style={{ color: '#6B6B80' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#6B6B80'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#050508', direction: 'rtl' }}>
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 260 : 68 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden"
        style={{ background: '#0B0B13', borderLeft: '1px solid #23233A' }}
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 lg:hidden flex flex-col"
              style={{ background: '#0B0B13', borderLeft: '1px solid #23233A' }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b" style={{ background: 'rgba(5,5,8,0.95)', borderColor: '#23233A', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 rounded-lg transition-all"
              style={{ color: '#B6B6C6' }}
              onClick={() => setMobileSidebarOpen(true)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop Sidebar Toggle */}
            <button
              className="hidden lg:flex p-2 rounded-lg transition-all"
              style={{ color: '#B6B6C6' }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Page Title */}
            {title && (
              <div>
                <h1 className="text-lg font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>{title}</h1>
                {subtitle && <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{subtitle}</p>}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: '#13131D', border: '1px solid #23233A', width: '220px' }}>
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#6B6B80' }} />
              <input
                type="text"
                placeholder="بحث..."
                className="flex-1 bg-transparent text-sm outline-none text-right"
                style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
              />
              <kbd className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#23233A', color: '#6B6B80', fontFamily: 'Inter, monospace' }}>⌘K</kbd>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl transition-all"
                style={{ background: notifOpen ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', border: '1px solid', borderColor: notifOpen ? 'rgba(59,130,246,0.3)' : '#23233A', color: '#B6B6C6' }}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold text-white" style={{ background: '#3B82F6', fontSize: '10px' }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-12 w-80 rounded-2xl overflow-hidden z-50"
                    style={{ background: '#13131D', border: '1px solid #23233A', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                  >
                    <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#23233A' }}>
                      <span className="font-bold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>الإشعارات</span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>{unreadCount} جديد</span>
                    </div>
                    <div className="divide-y" style={{ borderColor: '#23233A' }}>
                      {notifications.map(n => (
                        <div key={n.id} className="flex items-start gap-3 p-4 transition-all cursor-pointer" style={{ background: n.read ? 'transparent' : 'rgba(59,130,246,0.03)' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(59,130,246,0.03)'}>
                          <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.read ? '#23233A' : n.color }} />
                          <div>
                            <p className="text-sm font-medium" style={{ color: n.read ? '#B6B6C6' : '#FFFFFF', fontFamily: 'Cairo, sans-serif' }}>{n.title}</p>
                            <p className="text-xs mt-1" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{n.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Avatar */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #23233A' }}
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>
                  أ
                </div>
                <ChevronDown className="w-3 h-3 hidden md:block" style={{ color: '#6B6B80' }} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-12 w-56 rounded-2xl overflow-hidden z-50"
                    style={{ background: '#13131D', border: '1px solid #23233A', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                  >
                    <div className="p-4 border-b" style={{ borderColor: '#23233A' }}>
                      <p className="font-bold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>أحمد المستخدم</p>
                      <p className="text-xs mt-0.5" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>ahmed@example.com</p>
                    </div>
                    <div className="p-2">
                      {[
                        { icon: User, label: 'الملف الشخصي', path: '/profile' },
                        { icon: Settings, label: 'الإعدادات', path: '/settings' },
                        { icon: CreditCard, label: 'الفواتير', path: '/billing' },
                      ].map(item => (
                        <button key={item.path} onClick={() => { setLocation(item.path); setUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
                          style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}>
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </button>
                      ))}
                      <div className="my-1 h-px" style={{ background: '#23233A' }} />
                      <button onClick={() => setLocation('/')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all"
                        style={{ color: '#EF4444', fontFamily: 'Cairo, sans-serif' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <LogOut className="w-4 h-4" />
                        <span>تسجيل الخروج</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: '#050508' }}>
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
