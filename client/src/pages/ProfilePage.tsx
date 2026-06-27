import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Star, FolderOpen, Globe, Zap, Edit, Github, Twitter, Linkedin,
  MapPin, Calendar, Award, TrendingUp, ExternalLink, ChevronRight
} from 'lucide-react';

const stats = [
  { icon: FolderOpen, label: 'المشاريع', value: '12', color: '#3B82F6' },
  { icon: Zap, label: 'عمليات التوليد', value: '248', color: '#7C3AED' },
  { icon: Globe, label: 'المنشور', value: '8', color: '#22C55E' },
  { icon: Star, label: 'التقييم', value: '4.9', color: '#F59E0B' },
];

const recentProjects = [
  { name: 'متجر الإلكترونيات', status: 'منشور', statusColor: '#22C55E', time: 'منذ ساعتين', icon: '🛍️' },
  { name: 'بورتفوليو شخصي', status: 'منشور', statusColor: '#22C55E', time: 'أمس', icon: '🎨' },
  { name: 'موقع المطعم', status: 'قيد التطوير', statusColor: '#F59E0B', time: 'منذ 5 ساعات', icon: '🍽️' },
];

const achievements = [
  { icon: '🚀', title: 'مطلق المشاريع', desc: 'أنشأت أول 10 مشاريع', color: '#3B82F6' },
  { icon: '⚡', title: 'سريع التوليد', desc: 'أكملت 100 عملية توليد', color: '#F59E0B' },
  { icon: '🌟', title: 'مستخدم مميز', desc: 'عضوية لأكثر من 6 أشهر', color: '#7C3AED' },
  { icon: '🏆', title: 'محترف الويب', desc: 'نشرت 5 مواقع ناجحة', color: '#22C55E' },
];

export default function ProfilePage() {
  const [, setLocation] = useLocation();

  return (
    <DashboardLayout title="الملف الشخصي" subtitle="إدارة معلوماتك الشخصية">
      <div className="p-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#13131D', border: '1px solid #23233A' }}
        >
          {/* Cover */}
          <div className="h-32 relative" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(124,58,237,0.2) 100%)' }}>
            <div className="absolute inset-0 grid-bg opacity-20" />
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', transform: 'translate(20%, -20%)' }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10 mb-5">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white border-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', borderColor: '#13131D', fontFamily: 'Cairo, sans-serif' }}>
                  أ
                </div>
                <div className="mb-1">
                  <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>أحمد المنصوري</h2>
                  <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>مطور ومصمم مستقل</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation('/settings')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}
              >
                <Edit className="w-4 h-4" />
                <span>تعديل الملف</span>
              </motion.button>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-5">
              {[
                { icon: MapPin, text: 'الرياض، المملكة العربية السعودية' },
                { icon: Calendar, text: 'انضم في يناير 2024' },
                { icon: Globe, text: 'ahmed.dev-agent.app', link: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                  <item.icon className="w-4 h-4" style={{ color: '#6B6B80' }} />
                  <span className={item.link ? 'text-blue-400' : ''}>{item.text}</span>
                </div>
              ))}
            </div>

            <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
              مطور ومصمم مستقل متخصص في بناء تجارب رقمية استثنائية. أستخدم Dev-Agent لتسريع عملي وتقديم مشاريع عالية الجودة لعملائي.
            </p>

            <div className="flex gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ background: '#0B0B13', border: '1px solid #23233A', color: '#B6B6C6' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3B82F6'; (e.currentTarget as HTMLElement).style.color = '#3B82F6'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#23233A'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="p-5 rounded-2xl text-center"
              style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: `${s.color}15` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>{s.value}</div>
              <div className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#13131D', border: '1px solid #23233A' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#23233A' }}>
              <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>المشاريع الأخيرة</h3>
              <button onClick={() => setLocation('/projects')} className="flex items-center gap-1 text-sm" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>
                <span>عرض الكل</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(35,35,58,0.5)' }}>
              {recentProjects.map((p, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-4 transition-all cursor-pointer"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl" style={{ background: '#0B0B13' }}>{p.icon}</div>
                    <div>
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{p.name}</p>
                      <p className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{p.time}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${p.statusColor}15`, color: p.statusColor, fontFamily: 'Cairo, sans-serif' }}>{p.status}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#13131D', border: '1px solid #23233A' }}
          >
            <div className="px-5 py-4 border-b" style={{ borderColor: '#23233A' }}>
              <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>الإنجازات</h3>
            </div>
            <div className="p-5 grid grid-cols-2 gap-3">
              {achievements.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl text-center cursor-default"
                  style={{ background: `${a.color}08`, border: `1px solid ${a.color}20`, transition: 'all 0.3s ease' }}
                >
                  <div className="text-3xl mb-2">{a.icon}</div>
                  <p className="font-bold text-white text-xs mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>{a.title}</p>
                  <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{a.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
