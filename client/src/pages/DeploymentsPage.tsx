import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Globe, CheckCircle, AlertCircle, Clock, Loader2, ExternalLink,
  RefreshCw, Trash2, MoreVertical, Activity, TrendingUp, Zap,
  Server, Shield, GitBranch, Eye, Copy, Download
} from 'lucide-react';

const deployments = [
  { id: 1, name: 'متجر الإلكترونيات', url: 'electronics-store.dev-agent.app', status: 'نشط', statusColor: '#22C55E', branch: 'main', time: 'منذ ساعتين', uptime: '99.9%', requests: '1.2k/يوم', region: 'الشرق الأوسط' },
  { id: 2, name: 'بورتفوليو شخصي', url: 'portfolio.dev-agent.app', status: 'نشط', statusColor: '#22C55E', branch: 'main', time: 'أمس', uptime: '100%', requests: '340/يوم', region: 'أوروبا' },
  { id: 3, name: 'موقع المطعم', url: 'restaurant.dev-agent.app', status: 'قيد النشر', statusColor: '#F59E0B', branch: 'develop', time: 'منذ 5 دقائق', uptime: '-', requests: '-', region: 'الشرق الأوسط' },
  { id: 4, name: 'موقع شركة ناشئة', url: 'startup.dev-agent.app', status: 'نشط', statusColor: '#22C55E', branch: 'main', time: 'منذ أسبوع', uptime: '99.7%', requests: '2.8k/يوم', region: 'أمريكا' },
  { id: 5, name: 'لوحة تحكم إدارية', url: 'admin.dev-agent.app', status: 'متوقف', statusColor: '#EF4444', branch: 'feature/auth', time: 'منذ 3 أيام', uptime: '0%', requests: '0/يوم', region: '-' },
];

const stats = [
  { icon: Globe, label: 'إجمالي النشر', value: '5', color: '#3B82F6', glow: 'rgba(59,130,246,0.3)' },
  { icon: CheckCircle, label: 'نشط', value: '3', color: '#22C55E', glow: 'rgba(34,197,94,0.3)' },
  { icon: Activity, label: 'متوسط وقت التشغيل', value: '99.6%', color: '#7C3AED', glow: 'rgba(124,58,237,0.3)' },
  { icon: TrendingUp, label: 'الطلبات اليوم', value: '4.3k', color: '#F59E0B', glow: 'rgba(245,158,11,0.3)' },
];

export default function DeploymentsPage() {
  const [openMenu, setOpenMenu] = useState<number | null>(null);

  const statusIcon = (status: string) => {
    if (status === 'نشط') return <CheckCircle className="w-3.5 h-3.5" />;
    if (status === 'قيد النشر') return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  return (
    <DashboardLayout title="النشر" subtitle="إدارة نشر مشاريعك على الإنترنت">
      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -3 }}
              className="p-5 rounded-2xl"
              style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${s.color}15`, boxShadow: `0 0 15px ${s.glow}` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              <div className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>{s.value}</div>
              <div className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Deployments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#13131D', border: '1px solid #23233A' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#23233A' }}>
            <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>عمليات النشر</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs" style={{ color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span>جميع الأنظمة تعمل</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(35,35,58,0.5)' }}>
                  {['المشروع', 'الرابط', 'الحالة', 'الفرع', 'وقت التشغيل', 'الطلبات', 'المنطقة', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-right text-xs font-semibold" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgba(35,35,58,0.5)' }}>
                {deployments.map((d, i) => (
                  <motion.tr
                    key={d.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="transition-all"
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                          <Globe className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{d.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono" style={{ color: '#B6B6C6', direction: 'ltr', textAlign: 'left' }}>{d.url}</span>
                        <button className="p-1 rounded" style={{ color: '#6B6B80' }}>
                          <Copy className="w-3 h-3" />
                        </button>
                        <button className="p-1 rounded" style={{ color: '#6B6B80' }}>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1.5 text-xs font-semibold w-fit px-2.5 py-1 rounded-full" style={{ background: `${d.statusColor}15`, color: d.statusColor, fontFamily: 'Cairo, sans-serif' }}>
                        {statusIcon(d.status)}
                        <span>{d.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        <GitBranch className="w-3.5 h-3.5" style={{ color: '#6B6B80' }} />
                        <span className="text-xs font-mono" style={{ color: '#B6B6C6', direction: 'ltr' }}>{d.branch}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm font-semibold" style={{ color: d.uptime === '100%' ? '#22C55E' : d.uptime === '-' ? '#6B6B80' : '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{d.uptime}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{d.requests}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>{d.region}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Infrastructure Info */}
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Server, title: 'البنية التحتية', desc: 'خوادم موزعة عالمياً مع CDN لأسرع تحميل', color: '#3B82F6' },
            { icon: Shield, title: 'الأمان', desc: 'شهادة SSL مجانية وحماية DDoS تلقائية', color: '#22C55E' },
            { icon: Zap, title: 'الأداء', desc: 'تحسين تلقائي للصور والكود مع ذاكرة تخزين مؤقت', color: '#F59E0B' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-5 rounded-2xl"
              style={{ background: '#13131D', border: '1px solid #23233A' }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${item.color}15` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h3 className="font-bold text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>{item.title}</h3>
              <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
