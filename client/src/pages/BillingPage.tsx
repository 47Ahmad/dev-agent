import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import { CreditCard, Check, Zap, Crown, Download, Calendar, TrendingUp, AlertCircle, ChevronRight, Star, Shield } from 'lucide-react';

const plans = [
  {
    name: 'مجاني', price: '0', period: 'شهرياً', color: '#6B6B80',
    features: ['3 مشاريع نشطة', '10 عمليات توليد/شهر', 'معاينة حية', 'تاريخ الإصدارات (7 أيام)'],
    current: false,
  },
  {
    name: 'احترافي', price: '19', period: 'شهرياً', color: '#3B82F6',
    features: ['مشاريع غير محدودة', '100 عملية توليد/شهر', 'معاينة متقدمة', 'تاريخ إصدارات كامل', 'تنزيل الكود', 'دعم أولوية'],
    current: true,
  },
  {
    name: 'فريق', price: '49', period: 'شهرياً', color: '#7C3AED',
    features: ['كل ميزات الاحترافي', 'توليد غير محدود', 'مساحات عمل متعددة', 'إدارة الفريق', 'API للمطورين', 'دعم مخصص 24/7'],
    current: false,
  },
];

const invoices = [
  { id: 'INV-001', date: '1 يناير 2025', amount: '$19.00', status: 'مدفوع', statusColor: '#22C55E' },
  { id: 'INV-002', date: '1 ديسمبر 2024', amount: '$19.00', status: 'مدفوع', statusColor: '#22C55E' },
  { id: 'INV-003', date: '1 نوفمبر 2024', amount: '$19.00', status: 'مدفوع', statusColor: '#22C55E' },
  { id: 'INV-004', date: '1 أكتوبر 2024', amount: '$19.00', status: 'مدفوع', statusColor: '#22C55E' },
];

export default function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <DashboardLayout title="الفواتير والاشتراك" subtitle="إدارة خطتك وطرق الدفع">
      <div className="p-6 space-y-6">
        {/* Current Plan Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(124,58,237,0.1) 100%)', border: '1px solid rgba(59,130,246,0.3)' }}
        >
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5" style={{ color: '#F59E0B' }} />
                <span className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>الخطة الاحترافية</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>نشطة</span>
              </div>
              <p className="text-sm mb-3" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>تجديد تلقائي في 1 فبراير 2025 • $19.00/شهر</p>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-lg font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>87/100</div>
                  <div className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>عمليات التوليد</div>
                </div>
                <div className="h-8 w-px" style={{ background: '#23233A' }} />
                <div className="text-center">
                  <div className="text-lg font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>12/∞</div>
                  <div className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>المشاريع</div>
                </div>
              </div>
              {/* Usage Bar */}
              <div className="mt-3 w-48">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#23233A' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '87%' }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #3B82F6, #7C3AED)' }}
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid #23233A', color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                إلغاء الاشتراك
              </button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
              >
                ترقية الخطة
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: '#13131D', border: '1px solid #23233A' }}>
            {[{ id: 'monthly', label: 'شهري' }, { id: 'yearly', label: 'سنوي (وفر 20%)' }].map(opt => (
              <button key={opt.id} onClick={() => setBillingCycle(opt.id as any)}
                className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: billingCycle === opt.id ? 'rgba(59,130,246,0.15)' : 'transparent',
                  color: billingCycle === opt.id ? '#3B82F6' : '#B6B6C6',
                  border: billingCycle === opt.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
                  fontFamily: 'Cairo, sans-serif',
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl relative"
              style={{
                background: plan.current ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(124,58,237,0.08))' : '#13131D',
                border: plan.current ? '1px solid rgba(59,130,246,0.4)' : '1px solid #23233A',
                transition: 'all 0.3s ease',
              }}
            >
              {plan.current && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>
                  خطتك الحالية
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: 'Cairo, sans-serif' }}>{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-4xl font-black text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>${billingCycle === 'yearly' ? Math.round(parseInt(plan.price) * 0.8) : plan.price}</span>
                <span className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>/{plan.period}</span>
              </div>
              <ul className="space-y-2.5 mb-6">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${plan.color}20` }}>
                      <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                    </div>
                    <span className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: plan.current ? 'rgba(59,130,246,0.1)' : plan.color === '#6B6B80' ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg, ${plan.color}, ${plan.color}99)`,
                  color: plan.current ? '#3B82F6' : '#FFFFFF',
                  border: plan.current ? '1px solid rgba(59,130,246,0.3)' : 'none',
                  fontFamily: 'Cairo, sans-serif',
                  cursor: plan.current ? 'default' : 'pointer',
                }}
              >
                {plan.current ? 'خطتك الحالية' : 'الترقية إلى هذه الخطة'}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Payment Method */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#13131D', border: '1px solid #23233A' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#23233A' }}>
            <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>طريقة الدفع</h3>
            <button className="text-sm font-semibold" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>تغيير</button>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-12 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a1a6e, #3b82f6)' }}>
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>Visa •••• •••• •••• 4242</p>
              <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>تنتهي في 12/2027</p>
            </div>
            <div className="mr-auto flex items-center gap-1.5 text-xs" style={{ color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>
              <Shield className="w-3.5 h-3.5" />
              <span>محمية</span>
            </div>
          </div>
        </motion.div>

        {/* Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: '#13131D', border: '1px solid #23233A' }}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#23233A' }}>
            <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>سجل الفواتير</h3>
          </div>
          <div className="divide-y" style={{ borderColor: 'rgba(35,35,58,0.5)' }}>
            {invoices.map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-4 transition-all"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <Calendar className="w-4 h-4" style={{ color: '#3B82F6' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{inv.id}</p>
                    <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{inv.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif', direction: 'ltr' }}>{inv.amount}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: `${inv.statusColor}15`, color: inv.statusColor, fontFamily: 'Cairo, sans-serif' }}>{inv.status}</span>
                  <button className="p-1.5 rounded-lg transition-all" style={{ color: '#6B6B80' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B6B80'; }}>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
