import { useState } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import {
  User, Bell, Shield, Palette, Globe, Key, Trash2, Save,
  Eye, EyeOff, Check, ChevronRight, Moon, Sun, Monitor,
  Smartphone, Mail, MessageSquare, Zap, Lock, AlertTriangle
} from 'lucide-react';

const tabs = [
  { id: 'general', label: 'عام', icon: User },
  { id: 'notifications', label: 'الإشعارات', icon: Bell },
  { id: 'security', label: 'الأمان', icon: Shield },
  { id: 'appearance', label: 'المظهر', icon: Palette },
  { id: 'api', label: 'API', icon: Key },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('ar');
  const [notifications, setNotifications] = useState({
    email: true, push: true, sms: false, marketing: false,
    projectComplete: true, newVersion: true, billing: true,
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: () => void }) => (
    <button onClick={onChange} className="relative w-11 h-6 rounded-full transition-all flex-shrink-0" style={{ background: value ? 'linear-gradient(135deg, #3B82F6, #7C3AED)' : '#23233A' }}>
      <motion.div animate={{ x: value ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full bg-white" />
    </button>
  );

  const InputField = ({ label, placeholder, type = 'text', defaultValue = '' }: any) => (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
        style={{ background: '#0B0B13', border: '1px solid #23233A', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif', direction: 'rtl', textAlign: 'right' }}
        onFocus={e => (e.target as HTMLElement).style.borderColor = '#3B82F6'}
        onBlur={e => (e.target as HTMLElement).style.borderColor = '#23233A'}
      />
    </div>
  );

  return (
    <DashboardLayout title="الإعدادات" subtitle="تخصيص حسابك وتفضيلاتك">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Tabs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:w-56 flex-shrink-0"
          >
            <div className="rounded-2xl overflow-hidden" style={{ background: '#13131D', border: '1px solid #23233A' }}>
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-all relative"
                  style={{
                    background: activeTab === tab.id ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: activeTab === tab.id ? '#3B82F6' : '#B6B6C6',
                    borderRight: activeTab === tab.id ? '2px solid #3B82F6' : '2px solid transparent',
                    fontFamily: 'Cairo, sans-serif',
                  }}
                  onMouseEnter={e => { if (activeTab !== tab.id) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.color = '#FFFFFF'; } }}
                  onMouseLeave={e => { if (activeTab !== tab.id) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B6B6C6'; } }}
                >
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 space-y-5"
          >
            {/* General Tab */}
            {activeTab === 'general' && (
              <>
                <div className="rounded-2xl p-6" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                  <h3 className="font-bold text-white mb-5" style={{ fontFamily: 'Cairo, sans-serif' }}>المعلومات الشخصية</h3>
                  <div className="flex items-center gap-5 mb-6">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-white flex-shrink-0" style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}>أ</div>
                    <div>
                      <button className="px-4 py-2 rounded-xl text-sm font-semibold mb-2 block" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>تغيير الصورة</button>
                      <p className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>PNG, JPG حتى 2MB</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField label="الاسم الأول" placeholder="أحمد" defaultValue="أحمد" />
                    <InputField label="اسم العائلة" placeholder="المنصوري" defaultValue="المنصوري" />
                    <InputField label="البريد الإلكتروني" placeholder="ahmed@example.com" defaultValue="ahmed@example.com" />
                    <InputField label="رقم الهاتف" placeholder="+966 5x xxx xxxx" />
                  </div>
                </div>
                <div className="rounded-2xl p-6" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                  <h3 className="font-bold text-white mb-5" style={{ fontFamily: 'Cairo, sans-serif' }}>اللغة والمنطقة</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>اللغة</label>
                      <select className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#0B0B13', border: '1px solid #23233A', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif' }}>
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>المنطقة الزمنية</label>
                      <select className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: '#0B0B13', border: '1px solid #23233A', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif' }}>
                        <option>Asia/Riyadh (GMT+3)</option>
                        <option>Asia/Dubai (GMT+4)</option>
                        <option>Africa/Cairo (GMT+2)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: '#23233A' }}>
                  <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>إعدادات الإشعارات</h3>
                </div>
                <div className="divide-y" style={{ borderColor: 'rgba(35,35,58,0.5)' }}>
                  {[
                    { key: 'email', icon: Mail, label: 'إشعارات البريد الإلكتروني', desc: 'استقبل الإشعارات عبر البريد' },
                    { key: 'push', icon: Bell, label: 'إشعارات المتصفح', desc: 'إشعارات فورية في المتصفح' },
                    { key: 'sms', icon: Smartphone, label: 'إشعارات SMS', desc: 'رسائل نصية للأحداث المهمة' },
                    { key: 'projectComplete', icon: Check, label: 'اكتمال المشروع', desc: 'عند اكتمال توليد المشروع' },
                    { key: 'newVersion', icon: Zap, label: 'إصدار جديد', desc: 'عند توفر تحديثات جديدة' },
                    { key: 'billing', icon: MessageSquare, label: 'إشعارات الفواتير', desc: 'تذكيرات الدفع والفواتير' },
                    { key: 'marketing', icon: Mail, label: 'رسائل تسويقية', desc: 'عروض وأخبار المنصة' },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                          <item.icon className="w-4 h-4" style={{ color: '#3B82F6' }} />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{item.label}</p>
                          <p className="text-xs" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{item.desc}</p>
                        </div>
                      </div>
                      <Toggle value={(notifications as any)[item.key]} onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <>
                <div className="rounded-2xl p-6" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                  <h3 className="font-bold text-white mb-5" style={{ fontFamily: 'Cairo, sans-serif' }}>تغيير كلمة المرور</h3>
                  <div className="space-y-4">
                    {['كلمة المرور الحالية', 'كلمة المرور الجديدة', 'تأكيد كلمة المرور الجديدة'].map((label, i) => (
                      <div key={i}>
                        <label className="block text-sm font-semibold mb-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{label}</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={{ background: '#0B0B13', border: '1px solid #23233A', color: '#FFFFFF', fontFamily: 'Cairo, sans-serif', paddingLeft: '3rem' }}
                            onFocus={e => (e.target as HTMLElement).style.borderColor = '#3B82F6'}
                            onBlur={e => (e.target as HTMLElement).style.borderColor = '#23233A'}
                          />
                          <button onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B6B80' }}>
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl p-6" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>المصادقة الثنائية (2FA)</h3>
                      <p className="text-sm mt-1" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>أضف طبقة حماية إضافية لحسابك</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontFamily: 'Cairo, sans-serif' }}>غير مفعّل</span>
                  </div>
                  <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>
                    <Shield className="w-4 h-4" />
                    <span>تفعيل المصادقة الثنائية</span>
                  </button>
                </div>
                <div className="rounded-2xl p-6" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5" style={{ color: '#EF4444' }} />
                    <h3 className="font-bold" style={{ color: '#EF4444', fontFamily: 'Cairo, sans-serif' }}>منطقة الخطر</h3>
                  </div>
                  <p className="text-sm mb-4" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>حذف الحساب نهائياً مع جميع البيانات والمشاريع. لا يمكن التراجع عن هذا الإجراء.</p>
                  <button className="px-5 py-2.5 rounded-xl text-sm font-bold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontFamily: 'Cairo, sans-serif' }}>
                    حذف الحساب نهائياً
                  </button>
                </div>
              </>
            )}

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
              <div className="rounded-2xl p-6" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                <h3 className="font-bold text-white mb-5" style={{ fontFamily: 'Cairo, sans-serif' }}>المظهر والألوان</h3>
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>السمة</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dark', icon: Moon, label: 'داكن' },
                      { id: 'light', icon: Sun, label: 'فاتح' },
                      { id: 'system', icon: Monitor, label: 'النظام' },
                    ].map(opt => (
                      <button key={opt.id} onClick={() => setTheme(opt.id)}
                        className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all"
                        style={{
                          background: theme === opt.id ? 'rgba(59,130,246,0.15)' : '#0B0B13',
                          border: `1px solid ${theme === opt.id ? 'rgba(59,130,246,0.4)' : '#23233A'}`,
                          color: theme === opt.id ? '#3B82F6' : '#B6B6C6',
                        }}>
                        <opt.icon className="w-5 h-5" />
                        <span className="text-sm font-semibold" style={{ fontFamily: 'Cairo, sans-serif' }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-3" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>لون التمييز</label>
                  <div className="flex gap-3">
                    {['#3B82F6', '#7C3AED', '#22C55E', '#F59E0B', '#EC4899', '#06B6D4'].map(color => (
                      <button key={color} className="w-8 h-8 rounded-full transition-all" style={{ background: color, boxShadow: color === '#3B82F6' ? `0 0 0 2px #050508, 0 0 0 4px ${color}` : 'none' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* API Tab */}
            {activeTab === 'api' && (
              <div className="rounded-2xl overflow-hidden" style={{ background: '#13131D', border: '1px solid #23233A' }}>
                <div className="px-6 py-4 border-b" style={{ borderColor: '#23233A' }}>
                  <h3 className="font-bold text-white" style={{ fontFamily: 'Cairo, sans-serif' }}>مفاتيح API</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 rounded-xl" style={{ background: '#0B0B13', border: '1px solid #23233A' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>المفتاح الرئيسي</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(34,197,94,0.1)', color: '#22C55E', fontFamily: 'Cairo, sans-serif' }}>نشط</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs p-2 rounded-lg" style={{ background: '#050508', color: '#B6B6C6', fontFamily: 'JetBrains Mono, monospace', direction: 'ltr', textAlign: 'left' }}>
                        da_sk_••••••••••••••••••••••••••••••••
                      </code>
                      <button className="p-2 rounded-lg" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>
                    <Key className="w-4 h-4" />
                    <span>إنشاء مفتاح جديد</span>
                  </button>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: saved ? 'rgba(34,197,94,0.8)' : 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(59,130,246,0.3)', transition: 'all 0.3s ease' }}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{saved ? 'تم الحفظ!' : 'حفظ التغييرات'}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
