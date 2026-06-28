import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Plus, Search, Trash2, Edit2, Copy, MoreVertical, Tag, Clock,
  Code, Eye, Settings, Filter, SortAsc, ChevronDown, Star, Archive
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  type: 'react' | 'nextjs' | 'vue' | 'svelte' | 'angular' | 'static' | 'nodejs' | 'fullstack';
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  isFavorite: boolean;
  status: 'active' | 'archived';
  version: number;
}

const ProjectManager = () => {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'E-Commerce Platform',
      description: 'متجر إلكتروني متكامل مع نظام الدفع',
      type: 'nextjs',
      tags: ['ecommerce', 'payment', 'stripe'],
      createdAt: new Date('2026-06-01'),
      updatedAt: new Date('2026-06-25'),
      isFavorite: true,
      status: 'active',
      version: 3,
    },
    {
      id: '2',
      name: 'Dashboard Analytics',
      description: 'لوحة تحكم تحليلية مع رسوم بيانية',
      type: 'react',
      tags: ['analytics', 'dashboard', 'charts'],
      createdAt: new Date('2026-05-15'),
      updatedAt: new Date('2026-06-20'),
      isFavorite: false,
      status: 'active',
      version: 2,
    },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'favorites'>('recent');
  const [showFilters, setShowFilters] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    projects.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((tag) => p.tags.includes(tag));

      const matchesStatus = p.status === 'active';

      return matchesSearch && matchesTags && matchesStatus;
    });

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'favorites') {
      filtered.sort((a, b) => (b.isFavorite ? 1 : -1));
    } else {
      filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    return filtered;
  }, [projects, searchTerm, selectedTags, sortBy]);

  const handleCreateProject = (name: string, description: string, type: Project['type']) => {
    const newProject: Project = {
      id: Date.now().toString(),
      name,
      description,
      type,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isFavorite: false,
      status: 'active',
      version: 1,
    };
    setProjects([...projects, newProject]);
    setShowNewProjectForm(false);
    toast.success('تم إنشاء المشروع بنجاح');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter((p) => p.id !== id));
    toast.success('تم حذف المشروع');
  };

  const handleDuplicateProject = (project: Project) => {
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (نسخة)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    };
    setProjects([...projects, newProject]);
    toast.success('تم نسخ المشروع بنجاح');
  };

  const handleToggleFavorite = (id: string) => {
    setProjects(
      projects.map((p) =>
        p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
      )
    );
  };

  const typeLabels: Record<Project['type'], string> = {
    react: 'React',
    nextjs: 'Next.js',
    vue: 'Vue',
    svelte: 'Svelte',
    angular: 'Angular',
    static: 'Static',
    nodejs: 'Node.js',
    fullstack: 'Full Stack',
  };

  const typeColors: Record<Project['type'], string> = {
    react: 'from-blue-500 to-blue-600',
    nextjs: 'from-black to-gray-800',
    vue: 'from-green-500 to-green-600',
    svelte: 'from-red-500 to-red-600',
    angular: 'from-red-600 to-red-700',
    static: 'from-yellow-500 to-yellow-600',
    nodejs: 'from-green-600 to-green-700',
    fullstack: 'from-purple-500 to-purple-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">إدارة المشاريع</h1>
            <p className="text-gray-400">
              {filteredProjects.length} من {projects.length} مشاريع
            </p>
          </div>
          <Button
            onClick={() => setShowNewProjectForm(true)}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 ml-2" />
            مشروع جديد
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
            <Input
              placeholder="ابحث عن مشروع..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <Filter className="w-4 h-4 ml-2" />
            تصفية
          </Button>
          <Button
            onClick={() => setSortBy(sortBy === 'recent' ? 'name' : 'recent')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            <SortAsc className="w-4 h-4 ml-2" />
            ترتيب
          </Button>
        </div>

        {/* Tags Filter */}
        {showFilters && (
          <Card className="backdrop-blur-xl bg-white/5 border border-white/10 p-4">
            <p className="text-white font-semibold mb-3">الوسوم</p>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() =>
                    setSelectedTags(
                      selectedTags.includes(tag)
                        ? selectedTags.filter((t) => t !== tag)
                        : [...selectedTags, tag]
                    )
                  }
                  className={`px-3 py-1 rounded-full text-sm transition ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-500 text-white'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20'
                  }`}
                >
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </button>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${typeColors[project.type]} flex items-center justify-center`}>
                  <Code className="w-5 h-5 text-white" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => handleToggleFavorite(project.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        project.isFavorite
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => handleDuplicateProject(project)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                  >
                    <Copy className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-white mb-2">{project.name}</h3>
              <p className="text-gray-400 text-sm mb-4">{project.description}</p>

              {/* Type Badge */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-300">
                  {typeLabels[project.type]}
                </span>
              </div>

              {/* Tags */}
              {project.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {project.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-300"
                    >
                      {tag}
                    </span>
                  ))}
                  {project.tags.length > 3 && (
                    <span className="px-2 py-1 rounded text-xs bg-white/10 text-gray-300">
                      +{project.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {project.updatedAt.toLocaleDateString('ar-SA')}
                </div>
                <div className="flex items-center gap-2">
                  <span>v{project.version}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <Button
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                  onClick={() => toast.info('فتح المحرر...')}
                >
                  <Edit2 className="w-3 h-3 ml-1" />
                  تحرير
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 text-white hover:bg-white/10 text-sm"
                  onClick={() => toast.info('فتح المعاينة...')}
                >
                  <Eye className="w-3 h-3 ml-1" />
                  معاينة
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="col-span-full backdrop-blur-xl bg-white/5 border border-white/10 p-12 text-center">
            <Code className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">لا توجد مشاريع</h3>
            <p className="text-gray-400 mb-6">ابدأ بإنشاء مشروع جديد الآن</p>
            <Button
              onClick={() => setShowNewProjectForm(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            >
              <Plus className="w-4 h-4 ml-2" />
              إنشاء مشروع
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ProjectManager;
