import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Star, Download, ShoppingBag, Sparkles, Tag, Filter, TrendingUp, Clock, Award } from 'lucide-react';

const items = [
  { id: 1, name: 'مكوّن Hero متحرك', type: 'مكوّن', icon: '✨', price: 'مجاني', desc: 'قسم Hero احترافي مع خلفية متحركة وتأثيرات جزيئات', color: '#3B82F6', rating: 4.9, downloads: 3200, author: 'فريق Dev-Agent', badge: 'مميز' },
  { id: 2, name: 'لوحة تحكم Analytics', type: 'قالب', icon: '📊', price: '$19', desc: 'لوحة تحكم متكاملة مع رسوم بيانية وإحصائيات تفاعلية', color: '#7C3AED', rating: 4.8, downloads: 1850, author: 'Ahmad Dev', badge: null },
  { id: 3, name: 'نظام مصادقة كامل', type: 'مكوّن', icon: '🔐', price: '$9', desc: 'نظام تسجيل دخول وتسجيل مع OAuth وإدارة جلسات', color: '#22C55E', rating: 4.7, downloads: 2100, author: 'Sara UI', badge: 'جديد' },
  { id: 4, name: 'متجر إلكتروني Pro', type: 'قالب', icon: '🛒', price: '$29', desc: 'متجر متكامل مع Stripe وإدارة مخزون وتتبع طلبات', color: '#F59E0B', rating: 4.9, downloads: 980, author: 'Commerce Team', badge: 'مميز' },
  { id: 5, name: 'مكوّن Pricing Table', type: 'مكوّن', icon: '💎', price: 'مجاني', desc: 'جدول أسعار احترافي مع مقارنة خطط وتبديل سنوي/شهري', color: '#EC4899', rating: 4.6, downloads: 4500, author: 'UI Craft', badge: null },
  { id: 6, name: 'نظام إشعارات', type: 'مكوّن', icon: '🔔', price: '$5', desc: 'نظام إشعارات متكامل مع Toast وBadge وDropdown', color: '#06B6D4', rating: 4.7, downloads: 1600, author: 'Notify Pro', badge: null },
];

const types = ['الكل', 'مكوّن', 'قالب', 'إضافة'];
const sortOptions = ['الأكثر تحميلاً', 'الأعلى تقييماً', 'الأحدث', 'السعر'];

export default function MarketplacePage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('الكل');
  const [sortBy, setSortBy] = useState('الأكثر تحميلاً');

  const filtered = items.filter(item => {
    const matchSearch = item.name.includes(search) || item.desc.includes(search);
    const matchType = activeType === 'الكل' || item.type === activeType;
    return matchSearch && matchType;
  });

  return (
    <DashboardLayout title="المتجر" subtitle="مكوّنات وقوالب جاهزة من المجتمع">
      <div className="p-6 space-y-6">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0B0B13 0%, #13131D 100%)', border: '1px solid #23233A' }}
        >
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }} />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag className="w-5 h-5" style={{ color: '#7C3AED' }} />
                <span className="text-sm font-semibold" style={{ color: '#7C3AED', fontFamily: 'Cairo, sans-serif' }}>متجر المجتمع</span>
              </div>
              <h2 className="text-3xl font-black text-white mb-3" style={{ fontFamily: 'Cairo, sans-serif' }}>اكتشف مكوّنات وقوالب رائعة</h2>
              <p className="text-sm max-w-lg" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
                آلاف المكوّنات والقوالب الجاهزة من المطورين والمصممين حول العالم
              </p>
              <div className="flex items-center gap-6 mt-4">
                {[
                  { icon: TrendingUp, label: '+500 مكوّن', color: '#3B82F6' },
                  { icon: Award, label: 'مراجعة يدوية', color: '#22C55E' },
                  { icon: Download, label: '50k+ تحميل', color: '#7C3AED' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                    <span className="text-xs font-semibold" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(124,58,237,0.3)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span>انشر مكوّنك</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1" style={{ background: '#13131D', border: '1px solid #23233A' }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#6B6B80' }} />
            <input
              type="text"
              placeholder="بحث في المتجر..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-right"
              style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
            />
          </div>
          <div className="flex gap-2">
            {types.map(type => (
              <button key={type} onClick={() => setActiveType(type)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap"
                style={{
                  background: activeType === type ? 'rgba(124,58,237,0.15)' : '#13131D',
                  border: `1px solid ${activeType === type ? 'rgba(124,58,237,0.3)' : '#23233A'}`,
                  color: activeType === type ? '#7C3AED' : '#B6B6C6',
                  fontFamily: 'Cairo, sans-serif',
                }}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, borderColor: `${item.color}40` }}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
            >
              <div className="h-36 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${item.color}08, ${item.color}15)` }}>
                <div className="text-5xl">{item.icon}</div>
                {item.badge && (
                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-bold" style={{
                    background: item.badge === 'مميز' ? 'rgba(245,158,11,0.2)' : 'rgba(34,197,94,0.2)',
                    color: item.badge === 'مميز' ? '#F59E0B' : '#22C55E',
                    border: `1px solid ${item.badge === 'مميز' ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                    fontFamily: 'Cairo, sans-serif',
                  }}>
                    {item.badge}
                  </div>
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: item.price === 'مجاني' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)', color: item.price === 'مجاني' ? '#22C55E' : '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>
                  {item.price}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{item.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full mr-2 flex-shrink-0" style={{ background: `${item.color}15`, color: item.color, fontFamily: 'Cairo, sans-serif' }}>{item.type}</span>
                </div>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{item.desc}</p>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold" style={{ color: '#F59E0B', fontFamily: 'Cairo, sans-serif' }}>{item.rating}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>
                    <Download className="w-3 h-3" />
                    <span>{item.downloads.toLocaleString('ar')}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>بواسطة {item.author}</span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}99)`, fontFamily: 'Cairo, sans-serif' }}
                  >
                    <Download className="w-3 h-3" />
                    <span>{item.price === 'مجاني' ? 'تنزيل' : 'شراء'}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
