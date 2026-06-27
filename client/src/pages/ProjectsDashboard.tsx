import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus, Search, Filter, Grid3X3, List, FolderOpen, Globe,
  Clock, MoreVertical, Star, Trash2, Edit, Eye, Download,
  Copy, ExternalLink, Zap, ChevronDown, SortAsc, Tag,
  CheckCircle, AlertCircle, Loader2, Archive, Share2
} from 'lucide-react';

const projects = [
  { id: 1, name: 'متجر الإلكترونيات', desc: 'متجر إلكتروني متكامل مع نظام دفع وإدارة مخزون', status: 'منشور', statusColor: '#22C55E', category: 'تجارة', time: 'منذ ساعتين', versions: 8, starred: true, thumbnail: '🛍️' },
  { id: 2, name: 'موقع المطعم', desc: 'موقع احترافي لمطعم مع قائمة طعام وحجز طاولات', status: 'قيد التطوير', statusColor: '#F59E0B', category: 'خدمات', time: 'منذ 5 ساعات', versions: 3, starred: false, thumbnail: '🍽️' },
  { id: 3, name: 'بورتفوليو شخصي', desc: 'موقع شخصي لعرض الأعمال والمهارات المهنية', status: 'منشور', statusColor: '#22C55E', category: 'شخصي', time: 'أمس', versions: 12, starred: true, thumbnail: '🎨' },
  { id: 4, name: 'لوحة تحكم إدارية', desc: 'لوحة تحكم متكاملة لإدارة البيانات والمستخدمين', status: 'مسودة', statusColor: '#6B6B80', category: 'تطبيق', time: 'منذ 3 أيام', versions: 2, starred: false, thumbnail: '📊' },
  { id: 5, name: 'موقع شركة ناشئة', desc: 'موقع تعريفي احترافي لشركة ناشئة في مجال التقنية', status: 'منشور', statusColor: '#22C55E', category: 'أعمال', time: 'منذ أسبوع', versions: 6, starred: false, thumbnail: '🚀' },
  { id: 6, name: 'مدونة تقنية', desc: 'مدونة متخصصة في المحتوى التقني والبرمجي', status: 'قيد التطوير', statusColor: '#F59E0B', category: 'محتوى', time: 'منذ أسبوعين', versions: 4, starred: true, thumbnail: '✍️' },
];

const categories = ['الكل', 'تجارة', 'خدمات', 'شخصي', 'تطبيق', 'أعمال', 'محتوى'];

export default function ProjectsDashboard() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [sortBy, setSortBy] = useState('الأحدث');
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const filtered = projects.filter(p => {
    const matchSearch = p.name.includes(search) || p.desc.includes(search);
    const matchCat = activeCategory === 'الكل' || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  const statusIcon = (status: string) => {
    if (status === 'منشور') return <CheckCircle className="w-3.5 h-3.5" />;
    if (status === 'قيد التطوير') return <Loader2 className="w-3.5 h-3.5 animate-spin" />;
    return <AlertCircle className="w-3.5 h-3.5" />;
  };

  return (
    <DashboardLayout title="المشاريع" subtitle={`${projects.length} مشروع إجمالي`}>
      <div className="p-6 space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: '#13131D', border: '1px solid #23233A', minWidth: '240px' }}>
              <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#6B6B80' }} />
              <input
                type="text"
                placeholder="بحث في المشاريع..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none text-right"
                style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}
              />
            </div>

            {/* Sort */}
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm" style={{ background: '#13131D', border: '1px solid #23233A', color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>
              <SortAsc className="w-4 h-4" />
              <span>{sortBy}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* View Toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #23233A' }}>
              {[
                { mode: 'grid', icon: Grid3X3 },
                { mode: 'list', icon: List },
              ].map(({ mode, icon: Icon }) => (
                <button key={mode} onClick={() => setViewMode(mode as any)}
                  className="p-2.5 transition-all"
                  style={{ background: viewMode === mode ? 'rgba(59,130,246,0.15)' : '#13131D', color: viewMode === mode ? '#3B82F6' : '#6B6B80' }}>
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setLocation('/dashboard')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6, #7C3AED)', fontFamily: 'Cairo, sans-serif', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}
          >
            <Plus className="w-4 h-4" />
            <span>مشروع جديد</span>
          </motion.button>
        </div>

        {/* Category Filters */}
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
              {cat === 'الكل' && <span className="mr-1.5 text-xs opacity-60">{projects.length}</span>}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ y: -4, borderColor: 'rgba(59,130,246,0.3)' }}
                className="rounded-2xl overflow-hidden cursor-pointer group"
                style={{ background: '#13131D', border: '1px solid #23233A', transition: 'all 0.3s ease' }}
              >
                {/* Thumbnail */}
                <div className="h-36 flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B0B13, #13131D)' }}>
                  <div className="text-5xl">{p.thumbnail}</div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
                    <button className="p-2 rounded-xl transition-all" style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl transition-all" style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}>
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded-xl transition-all" style={{ background: 'rgba(59,130,246,0.2)', color: '#3B82F6' }}>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  {p.starred && (
                    <div className="absolute top-3 right-3">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{p.name}</h3>
                    <div className="relative">
                      <button onClick={e => { e.stopPropagation(); setOpenMenu(openMenu === p.id ? null : p.id); }}
                        className="p-1 rounded-lg transition-all" style={{ color: '#6B6B80' }}>
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {openMenu === p.id && (
                          <motion.div initial={{ opacity: 0, scale: 0.95, y: -5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute left-0 top-8 w-44 rounded-xl overflow-hidden z-20"
                            style={{ background: '#1A1A28', border: '1px solid #23233A', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            {[
                              { icon: Edit, label: 'تعديل', color: '#B6B6C6' },
                              { icon: Copy, label: 'نسخ', color: '#B6B6C6' },
                              { icon: Download, label: 'تنزيل', color: '#B6B6C6' },
                              { icon: Share2, label: 'مشاركة', color: '#B6B6C6' },
                              { icon: Archive, label: 'أرشفة', color: '#B6B6C6' },
                              { icon: Trash2, label: 'حذف', color: '#EF4444' },
                            ].map((item, j) => (
                              <button key={j} onClick={() => setOpenMenu(null)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all"
                                style={{ color: item.color, fontFamily: 'Cairo, sans-serif' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <p className="text-xs mb-3 leading-relaxed line-clamp-2" style={{ color: '#B6B6C6', fontFamily: 'Cairo, sans-serif' }}>{p.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${p.statusColor}15`, color: p.statusColor, fontFamily: 'Cairo, sans-serif' }}>
                      {statusIcon(p.status)}
                      <span>{p.status}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>
                      <span>{p.versions} إصدار</span>
                      <span>{p.time}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* New Project Card */}
            <motion.button
              whileHover={{ y: -4, borderColor: 'rgba(59,130,246,0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setLocation('/dashboard')}
              className="rounded-2xl flex flex-col items-center justify-center gap-3 h-64 transition-all"
              style={{ background: 'rgba(59,130,246,0.03)', border: '2px dashed rgba(59,130,246,0.2)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                <Plus className="w-6 h-6" style={{ color: '#3B82F6' }} />
              </div>
              <span className="font-bold text-sm" style={{ color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>إنشاء مشروع جديد</span>
            </motion.button>
          </div>
        ) : (
          /* List View */
          <div className="rounded-2xl overflow-hidden" style={{ background: '#13131D', border: '1px solid #23233A' }}>
            <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b text-xs font-semibold" style={{ borderColor: '#23233A', color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>
              <div className="col-span-5">اسم المشروع</div>
              <div className="col-span-2 text-center">الحالة</div>
              <div className="col-span-2 text-center">الفئة</div>
              <div className="col-span-2 text-center">آخر تعديل</div>
              <div className="col-span-1" />
            </div>
            <div className="divide-y" style={{ borderColor: 'rgba(35,35,58,0.5)' }}>
              {filtered.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                  whileHover={{ background: 'rgba(255,255,255,0.02)' }}
                  className="grid grid-cols-12 gap-4 px-5 py-4 items-center cursor-pointer transition-all">
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#0B0B13' }}>{p.thumbnail}</div>
                    <div>
                      <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Cairo, sans-serif' }}>{p.name}</p>
                      <p className="text-xs truncate max-w-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{p.desc}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${p.statusColor}15`, color: p.statusColor, fontFamily: 'Cairo, sans-serif' }}>
                      {statusIcon(p.status)}<span>{p.status}</span>
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontFamily: 'Cairo, sans-serif' }}>{p.category}</span>
                  </div>
                  <div className="col-span-2 text-center text-xs" style={{ color: '#6B6B80', fontFamily: 'Cairo, sans-serif' }}>{p.time}</div>
                  <div className="col-span-1 flex justify-center">
                    <button className="p-1.5 rounded-lg" style={{ color: '#6B6B80' }}>
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
