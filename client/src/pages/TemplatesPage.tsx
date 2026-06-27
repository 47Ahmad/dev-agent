import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import { Search, Star, Eye, Zap, Filter, ChevronDown, Sparkles, Tag } from 'lucide-react';

const templates = [
  { id: 1, name: 'متجر إلكتروني متكامل', category: 'تجارة', icon: '🛍️', desc: 'متجر احترافي مع سلة تسوق ونظام دفع وإدارة منتجات', color: '#3B82F6', rating: 4.9, uses: 1240, featured: true, tags: ['React', 'Stripe', 'متجاوب'] },
  { id: 2, name: 'موقع شركة ناشئة', category: 'أعمال', icon: '🚀', desc: 'موقع تعريفي احترافي لشركة ناشئة مع صفحة هبوط وأسعار', color: '#7C3AED', rating: 4.8, uses: 980, featured: true, tags: ['Landing Page', 'تسويق'] },
  { id: 3, name: 'مدونة احترافية', category: 'محتوى', icon: '✍️', desc: 'مدونة متكاملة مع نظام تصنيف وبحث وتعليقات', color: '#22C55E', rating: 4.7, uses: 756, featured: false, tags: ['مدونة', 'SEO'] },
  { id: 4, name: 'بورتفوليو مصمم', category: 'إبداع', icon: '🎨', desc: 'موقع شخصي لعرض الأعمال الإبداعية والتصميمية', color: '#F59E0B', rating: 4.9, uses: 1100, featured: true, tags: ['بورتفوليو', 'أنيميشن'] },
  { id: 5, name: 'موقع مطعم', category: 'خدمات', icon: '🍽️', desc: 'موقع مطعم مع قائمة طعام وحجز طاولات وموقع', color: '#EC4899', rating: 4.6, uses: 620, featured: false, tags: ['مطعم', 'حجز'] },
  { id: 6, name: 'لوحة تحكم SaaS', category: 'تطبيق', icon: '📊', desc: 'لوحة تحكم متكاملة لتطبيق SaaS مع إحصائيات ورسوم بيانية', color: '#06B6D4', rating: 4.8, uses: 890, featured: true, tags: ['Dashboard', 'Charts'] },
  { id: 7, name: 'صفحة هبوط تسويقية', category: 'تسويق', icon: '📣', desc: 'صفحة هبوط عالية التحويل مع CTA وشهادات وأسعار', color: '#8B5CF6', rating: 4.7, uses: 1450, featured: false, tags: ['Landing', 'CRO'] },
  { id: 8, name: 'موقع عقارات', category: 'خدمات', icon: '🏠', desc: 'موقع عقارات مع بحث متقدم وعرض خرائط وتفاصيل عقارات', color: '#10B981', rating: 4.5, uses: 430, featured: false, tags: ['عقارات', 'خرائط'] },
  { id: 9, name: 'منصة تعليمية', category: 'تعليم', icon: '📚', desc: 'منصة تعليمية مع دورات وفيديوهات وتتبع التقدم', color: '#F97316', rating: 4.8, uses: 780, featured: true, tags: ['تعليم', 'LMS'] },
];

const categories = ['الكل', 'تجارة', 'أعمال', 'محتوى', 'إبداع', 'خدمات', 'تطبيق', 'تسويق', 'تعليم'];

export default function TemplatesPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const filtered = templates.filter(t => {
    const matchSearch = t.name.includes(search) || t.desc.includes(search);
    const matchCat = activeCategory === 'الكل' || t.category === activeCategory;
    const matchFeatured = !showFeaturedOnly || t.featured;
    return matchSearch && matchCat && matchFeatured;
  });

  return (
    <DashboardLayout title="القوالب" subtitle="اختر قالباً جاهزاً وخصّصه بالذكاء الاصطناعي">
      <div className="p-6 space-y-6">
        {/* Featured Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(124,58,237,0.12) 100%)', border: '1px solid rgba(59,130,246,0.25)' }}
        >
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: '#3B82F6' }} />
                <span className="text-sm font-semibold" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>قوالب مميزة</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Cairo, sans-serif' }}>ابدأ من قالب جاهز</h2>
              <p className="text-sm" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>أكثر من {templates.length} قالب احترافي جاهز للتخصيص بالذكاء الاصطناعي</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
              style={{ background: showFeaturedOnly ? 'rgba(59,130,246,0.3)' : 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
            >
              <Star className="w-4 h-4" />
              <span>{showFeaturedOnly ? 'عرض الكل' : 'المميزة فقط'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl flex-1" style={{ background: '#13131D', border: '1px solid #23233A' }}>
            <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#6B6B80' }} />
            <input
              type="text"
              placeholder="بحث في القوالب..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none text-right"
              style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all"
              style={{
                background: activeCategory === cat ? 'rgba(59,130,246,0.15)' : '#13131D',
                border: `1px solid ${activeCategory === cat ? 'rgba(59,130,246,0.3)' : '#23233A'}`,
                color: activeCategory === cat ? '#3B82F6' : '#B6B6C6',
                fontFamily: 'Cairo, sans-serif',
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              onMouseEnter={() => setHovered(t.id)}
              onMouseLeave={() => setHovered(null)}
              className="rounded-2xl overflow-hidden cursor-pointer group"
              style={{ background: '#13131D', border: `1px solid ${hovered === t.id ? `${t.color}40` : '#23233A'}`, transition: 'all 0.3s ease', transform: hovered === t.id ? 'translateY(-4px)' : 'translateY(0)' }}
            >
              {/* Preview Area */}
              <div className="h-40 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${t.color}08, ${t.color}15)` }}>
                <div className="text-6xl">{t.icon}</div>
                {t.featured && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)', fontFamily: 'Cairo, sans-serif' }}>
                    <Star className="w-3 h-3 fill-yellow-400" />
                    <span>مميز</span>
                  </div>
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white"
                    style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif' }}
                    onClick={() => setLocation('/dashboard')}>
                    <Zap className="w-4 h-4" />
                    <span>استخدم</span>
                  </motion.button>
                  <button className="p-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}>
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{t.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 mr-2" style={{ background: `${t.color}15`, color: t.color, fontFamily: 'Cairo, sans-serif' }}>{t.category}</span>
                </div>
                <p className="text-xs mb-3 leading-relaxed" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{t.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold" style={{ color: '#F59E0B', fontFamily: 'Cairo, sans-serif' }}>{t.rating}</span>
                  </div>
                  <span className="text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{t.uses.toLocaleString('ar')} استخدام</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.tags.map((tag, j) => (
                    <span key={j} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#23233A', color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
