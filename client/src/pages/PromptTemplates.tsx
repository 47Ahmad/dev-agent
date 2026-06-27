import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Copy,
  Heart,
  Share2,
  Zap,
  ShoppingCart,
  BarChart3,
  Layers,
  Sparkles,
  BookOpen,
  Users,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  prompt: string;
  tags: string[];
  uses: number;
  rating: number;
  isFavorite?: boolean;
}

const TEMPLATES: Template[] = [
  {
    id: "1",
    title: "متجر إلكتروني كامل",
    description: "بناء متجر إلكتروني متكامل مع نظام إدارة المنتجات والعملاء والطلبات",
    category: "E-commerce",
    icon: <ShoppingCart className="w-6 h-6" />,
    prompt: `أنشئ متجراً إلكترونياً متكاملاً يتضمن:
- صفحة رئيسية جذابة
- نظام إدارة المنتجات
- سلة التسوق
- نظام الدفع
- إدارة الطلبات
- لوحة تحكم المسؤول
- نظام المستخدمين`,
    tags: ["e-commerce", "react", "nodejs", "database"],
    uses: 1250,
    rating: 4.8,
  },
  {
    id: "2",
    title: "لوحة تحكم تحليلية",
    description: "لوحة تحكم متقدمة مع رسوم بيانية وإحصائيات في الوقت الفعلي",
    category: "Dashboard",
    icon: <BarChart3 className="w-6 h-6" />,
    prompt: `أنشئ لوحة تحكم تحليلية تتضمن:
- رسوم بيانية تفاعلية
- إحصائيات في الوقت الفعلي
- تقارير شاملة
- مؤشرات الأداء الرئيسية
- خرائط حرارية
- تحليل المستخدمين`,
    tags: ["dashboard", "analytics", "charts", "react"],
    uses: 980,
    rating: 4.7,
  },
  {
    id: "3",
    title: "نظام إدارة المشاريع",
    description: "منصة إدارة مشاريع متقدمة مع تتبع المهام والفريق",
    category: "Project Management",
    icon: <Layers className="w-6 h-6" />,
    prompt: `أنشئ نظام إدارة مشاريع يتضمن:
- إدارة المهام والمشاريع
- تتبع الوقت
- إدارة الفريق
- التعاون في الوقت الفعلي
- التقارير والإحصائيات
- نظام الإشعارات`,
    tags: ["project-management", "collaboration", "team"],
    uses: 750,
    rating: 4.6,
  },
  {
    id: "4",
    title: "تطبيق SaaS",
    description: "منصة SaaS متقدمة مع نظام اشتراكات وإدارة فريق",
    category: "SaaS",
    icon: <Zap className="w-6 h-6" />,
    prompt: `أنشئ تطبيق SaaS يتضمن:
- نظام الاشتراكات
- إدارة الفريق
- التعاون في الوقت الفعلي
- نظام الفواتير
- إدارة المستخدمين
- لوحة تحكم متقدمة`,
    tags: ["saas", "subscription", "billing"],
    uses: 650,
    rating: 4.9,
  },
  {
    id: "5",
    title: "موقع مطعم",
    description: "موقع مطعم احترافي مع قائمة الطعام والحجوزات والتقييمات",
    category: "Restaurant",
    icon: <ShoppingCart className="w-6 h-6" />,
    prompt: `أنشئ موقع مطعم يتضمن:
- عرض قائمة الطعام
- نظام الحجوزات
- نظام الطلبات
- تقييمات العملاء
- معلومات الاتصال
- معرض الصور`,
    tags: ["restaurant", "booking", "food"],
    uses: 520,
    rating: 4.5,
  },
  {
    id: "6",
    title: "نظام CRM",
    description: "نظام إدارة علاقات العملاء متكامل مع إدارة المبيعات",
    category: "CRM",
    icon: <Users className="w-6 h-6" />,
    prompt: `أنشئ نظام CRM يتضمن:
- إدارة جهات الاتصال
- إدارة المبيعات
- تتبع الفرص
- إدارة المشاريع
- التقارير والتحليلات
- نظام الإشعارات`,
    tags: ["crm", "sales", "customer"],
    uses: 890,
    rating: 4.7,
  },
  {
    id: "7",
    title: "مدونة احترافية",
    description: "منصة مدونة متقدمة مع نظام تعليقات وتصنيفات",
    category: "Blog",
    icon: <BookOpen className="w-6 h-6" />,
    prompt: `أنشئ منصة مدونة تتضمن:
- نظام المقالات
- نظام التعليقات
- التصنيفات والوسوم
- محرك البحث
- نظام المستخدمين
- التقييمات`,
    tags: ["blog", "content", "cms"],
    uses: 420,
    rating: 4.4,
  },
  {
    id: "8",
    title: "تطبيق تعليمي",
    description: "منصة تعليمية متقدمة مع دورات وامتحانات",
    category: "Education",
    icon: <BookOpen className="w-6 h-6" />,
    prompt: `أنشئ منصة تعليمية تتضمن:
- إدارة الدورات
- نظام الفيديوهات
- نظام الامتحانات
- تتبع التقدم
- شهادات الإنجاز
- نظام الدفع`,
    tags: ["education", "learning", "courses"],
    uses: 680,
    rating: 4.8,
  },
];

const CATEGORIES = ["الكل", "E-commerce", "Dashboard", "SaaS", "Project Management"];

export default function PromptTemplates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredTemplates = TEMPLATES.filter((template) => {
    const matchesSearch =
      template.title.includes(searchTerm) ||
      template.description.includes(searchTerm) ||
      template.tags.some((tag) => tag.includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === "الكل" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    toast.success("تم نسخ القالب!");
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]
    );
  };

  const handleUseTemplate = (template: Template) => {
    toast.success(`تم تحميل القالب: ${template.title}`);
    // TODO: Redirect to project builder with template
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">مكتبة القوالب الذكية</h1>
          <p className="text-lg text-muted-foreground">
            اختر من بين مئات القوالب الجاهزة لبدء مشروعك بسرعة
          </p>
        </div>

        {/* Search & Filter */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ابحث عن قالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-12 bg-card/50 border border-border/50"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => (
              <Button
                key={category}
                onClick={() => setSelectedCategory(category)}
                variant={selectedCategory === category ? "default" : "outline"}
                className={
                  selectedCategory === category
                    ? "bg-gradient-to-r from-blue-500 to-purple-500"
                    : ""
                }
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm hover:border-blue-500/50 transition-all group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                  {template.icon}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFavorite(template.id)}
                  className={
                    favorites.includes(template.id)
                      ? "text-red-400"
                      : "text-muted-foreground"
                  }
                >
                  <Heart
                    className="w-5 h-5"
                    fill={favorites.includes(template.id) ? "currentColor" : "none"}
                  />
                </Button>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg font-semibold mb-2">{template.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-background/50">
                <div>
                  <p className="text-xs text-muted-foreground">الاستخدامات</p>
                  <p className="font-semibold">{template.uses.toLocaleString("ar-SA")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">التقييم</p>
                  <p className="font-semibold">⭐ {template.rating}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  استخدام القالب
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopyPrompt(template.prompt)}
                  title="نسخ القالب"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  title="مشاركة القالب"
                >
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">لا توجد قوالب تطابق بحثك</p>
            <p className="text-sm text-muted-foreground mt-2">
              جرب البحث عن كلمات أخرى أو غير الفئة المحددة
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
