import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const QUICK_EXAMPLES = [
  {
    title: "متجر إلكتروني",
    description: "بناء متجر إلكتروني كامل مع نظام إدارة المنتجات والعملاء والطلبات والدفع",
    icon: "🛍️",
  },
  {
    title: "موقع مطعم",
    description: "موقع مطعم احترافي مع قائمة الطعام والحجوزات والتقييمات",
    icon: "🍽️",
  },
  {
    title: "نظام CRM",
    description: "نظام إدارة علاقات العملاء متكامل مع إدارة المبيعات والتقارير",
    icon: "📊",
  },
  {
    title: "لوحة تحكم",
    description: "لوحة تحكم تحليلية مع رسوم بيانية وإحصائيات في الوقت الفعلي",
    icon: "📈",
  },
  {
    title: "تطبيق SaaS",
    description: "منصة SaaS متقدمة مع نظام اشتراكات وإدارة فريق",
    icon: "⚙️",
  },
  {
    title: "مدونة",
    description: "مدونة احترافية مع نظام تعليقات وتصنيفات ومحرك بحث",
    icon: "📝",
  },
];

interface ProjectGenerationResult {
  projectName: string;
  description: string;
  structure: {
    folders: string[];
    components: string[];
    pages: string[];
    apis: string[];
  };
  database: {
    tables: string[];
    relationships: string[];
  };
  technologies: string[];
}

export default function ProjectBuilder() {
  const { user } = useAuth();
  const [step, setStep] = useState<"input" | "generating" | "result">("input");
  const [projectDescription, setProjectDescription] = useState("");
  const [generatedProject, setGeneratedProject] = useState<ProjectGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateProjectMutation = trpc.projectBuilder.generateProject.useMutation({
    onSuccess: (result) => {
      setGeneratedProject(result as ProjectGenerationResult);
      setStep("result");
      setError(null);
    },
    onError: (error) => {
      const errorMessage = error.message || "فشل توليد المشروع. يرجى المحاولة مرة أخرى.";
      setError(errorMessage);
      toast.error(errorMessage);
      setStep("input");
    },
  });

  const handleQuickExample = (example: typeof QUICK_EXAMPLES[0]) => {
    setProjectDescription(example.description);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!projectDescription.trim()) {
      setError("يرجى إدخال وصف للمشروع");
      return;
    }

    setError(null);
    setStep("generating");

    try {
      await generateProjectMutation.mutateAsync({
        description: projectDescription,
        language: "ar",
      });
    } catch (err) {
      console.error("Generation error:", err);
    }
  };

  const handleCreateProject = async () => {
    if (!generatedProject) return;

    try {
      // TODO: Call API to create project
      toast.success("تم إنشاء المشروع بنجاح!");
      // Redirect to projects page
      window.location.href = "/projects";
    } catch (error) {
      console.error("Create project error:", error);
      toast.error("فشل إنشاء المشروع");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">يرجى تسجيل الدخول أولاً</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4">
            <Sparkles className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">منشئ المشاريع الذكي</h1>
          <p className="text-lg text-muted-foreground">
            صف مشروعك وسيقوم الذكاء الاصطناعي بإنشاء هيكل المشروع الكامل
          </p>
        </div>

        {step === "input" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Input Section */}
            <div className="lg:col-span-2">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm">
                <h2 className="text-xl font-semibold mb-4">وصف مشروعك</h2>

                {error && (
                  <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <Textarea
                  placeholder="مثال: أريد بناء متجر إلكتروني كامل مع نظام إدارة المنتجات والعملاء والطلبات..."
                  value={projectDescription}
                  onChange={(e) => {
                    setProjectDescription(e.target.value);
                    setError(null);
                  }}
                  className="min-h-32 mb-4 bg-background/50"
                />

                <Button
                  onClick={handleGenerate}
                  disabled={!projectDescription.trim() || generateProjectMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  {generateProjectMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      توليد المشروع
                    </>
                  )}
                </Button>
              </Card>
            </div>

            {/* Quick Examples */}
            <div>
              <h3 className="text-lg font-semibold mb-4">أمثلة سريعة</h3>
              <div className="space-y-3">
                {QUICK_EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickExample(example)}
                    className="w-full p-3 text-right rounded-lg border border-border/50 bg-card/50 hover:bg-card/80 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{example.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{example.description}</p>
                      </div>
                      <span className="text-lg ml-2">{example.icon}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center justify-center min-h-96">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-4 animate-pulse">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-semibold mb-2">جاري توليد المشروع...</h3>
              <p className="text-muted-foreground">
                يقوم الذكاء الاصطناعي بتحليل متطلباتك وإنشاء هيكل المشروع
              </p>
            </div>
          </div>
        )}

        {step === "result" && generatedProject && (
          <div className="space-y-6">
            {/* Project Summary */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm">
              <h2 className="text-2xl font-bold mb-2">{generatedProject.projectName}</h2>
              <p className="text-muted-foreground mb-6">{generatedProject.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">المجلدات</p>
                  <p className="text-2xl font-bold">{generatedProject.structure.folders.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">المكونات</p>
                  <p className="text-2xl font-bold">{generatedProject.structure.components.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">الصفحات</p>
                  <p className="text-2xl font-bold">{generatedProject.structure.pages.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-2">قواعد البيانات</p>
                  <p className="text-2xl font-bold">{generatedProject.database.tables.length}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleCreateProject}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  إنشاء المشروع
                </Button>
                <Button
                  onClick={() => {
                    setStep("input");
                    setGeneratedProject(null);
                    setProjectDescription("");
                    setError(null);
                  }}
                  variant="outline"
                >
                  ابدأ من جديد
                </Button>
              </div>
            </Card>

            {/* Project Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4">هيكل المشروع</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-blue-400 mb-2">المجلدات:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedProject.structure.folders.map((folder, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                          {folder}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-400 mb-2">الصفحات:</p>
                    <div className="flex flex-wrap gap-2">
                      {generatedProject.structure.pages.map((page, idx) => (
                        <span key={idx} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">
                          {page}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-4">التقنيات المقترحة</h3>
                <div className="flex flex-wrap gap-2">
                  {generatedProject.technologies.map((tech, idx) => (
                    <span key={idx} className="px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-sm">
                      {tech}
                    </span>
                  ))}
                </div>
              </Card>
            </div>

            {/* Database Schema */}
            <Card className="p-6 border border-border/50 bg-card/50 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-4">قاعدة البيانات</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-blue-400 mb-2">الجداول:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedProject.database.tables.map((table, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm">
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-400 mb-2">العلاقات:</p>
                  <div className="flex flex-wrap gap-2">
                    {generatedProject.database.relationships.map((rel, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-sm">
                        {rel}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
