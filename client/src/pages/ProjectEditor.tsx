import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Folder,
  Play,
  Save,
  Settings,
  Terminal,
  Eye,
  Code,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { AICommandPanel } from "@/components/AICommandPanel";
import { SmartDiffPreview } from "@/components/SmartDiffPreview";
import { AutoDebuggerPanel } from "@/components/AutoDebuggerPanel";

interface ProjectFile {
  id: string;
  name: string;
  path: string;
  content: string;
  type: "file" | "folder";
  language?: string;
}

interface ProjectEditorProps {
  params?: { id: string };
}

export default function ProjectEditor({ params }: ProjectEditorProps) {
  const projectId = params?.id;
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("explorer");
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [buildStatus, setBuildStatus] = useState<"idle" | "building" | "success" | "error">("idle");
  const [buildProgress, setBuildProgress] = useState(0);
  const [terminal, setTerminal] = useState<string[]>([
    "[INFO] Project initialized",
    "[INFO] Ready to build",
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // AI Execution State
  const [showDiffPreview, setShowDiffPreview] = useState(false);
  const [diffData, setDiffData] = useState<any>(null);
  const [showDebugger, setShowDebugger] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  // Load project files
  const { data: projectFiles, isLoading: isLoadingFiles } = trpc.projectFiles.getProjectFiles.useQuery(
    { projectId: projectId || "" },
    { enabled: !!projectId && !!user }
  );

  useEffect(() => {
    if (projectFiles) {
      setFiles(projectFiles as ProjectFile[]);
      setIsLoading(false);
      if (projectFiles.length > 0) {
        setSelectedFile(projectFiles[0] as ProjectFile);
      }
    }
  }, [projectFiles]);

  const saveFileMutation = trpc.projectFiles.saveFile.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الملف بنجاح!");
      setIsSaving(false);
    },
    onError: (error) => {
      toast.error(error.message || "فشل حفظ الملف");
      setIsSaving(false);
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">يرجى تسجيل الدخول أولاً</p>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">معرف المشروع غير صحيح</p>
      </div>
    );
  }

  const handleBuild = async () => {
    setBuildStatus("building");
    setBuildProgress(0);
    setTerminal((prev) => [...prev, "[INFO] Starting build process..."]);

    // Simulate build progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setBuildProgress(i);
      setTerminal((prev) => [...prev, `[INFO] Build progress: ${i}%`]);
    }

    setBuildStatus("success");
    setTerminal((prev) => [...prev, "[SUCCESS] Build completed successfully!"]);
  };

  const handleSaveFile = async () => {
    if (!selectedFile || !projectId) return;

    setIsSaving(true);
    await saveFileMutation.mutateAsync({
      projectId,
      filePath: selectedFile.path,
      content: selectedFile.content,
      language: selectedFile.language,
    });
  };

  const handleCommandExecuted = (result: any) => {
    if (result.filesChanged || result.newFiles || result.deletedFiles) {
      setDiffData(result);
      setShowDiffPreview(true);
      setActiveTab("ai");
    }
    setTerminal((prev) => [
      ...prev,
      `[AI] ${result.message}`,
      ...(result.logs || []),
    ]);
  };

  const handleShowDebug = (debug: any) => {
    setDebugData(debug);
    setShowDebugger(true);
    setActiveTab("ai");
  };

  const handleApplyDiff = async () => {
    if (!diffData) return;
    toast.success("تم تطبيق التغييرات!");
    setShowDiffPreview(false);
    // Reload files
    setActiveTab("explorer");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex flex-col">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-xl font-bold">محرر المشاريع الذكي</h1>
              <p className="text-sm text-muted-foreground">{projectId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleBuild}
              disabled={buildStatus === "building" || isLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {buildStatus === "building" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري البناء...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  بناء المشروع
                </>
              )}
            </Button>
            <Button
              onClick={handleSaveFile}
              disabled={!selectedFile || isSaving || isLoading}
              variant="outline"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  حفظ
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Project Explorer */}
        <div className="lg:col-span-1">
          <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm h-full flex flex-col">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-4 h-4 text-blue-400" />
              مستكشف المشروع
            </h3>
            {isLoading || isLoadingFiles ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
              </div>
            ) : files.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm">
                <p>لا توجد ملفات</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`w-full text-right p-2 rounded-lg transition-colors ${
                      selectedFile?.id === file.id
                        ? "bg-blue-500/20 border border-blue-500/30"
                        : "hover:bg-background/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {file.type === "folder" ? (
                        <Folder className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      )}
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Editor & Preview */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-5 bg-card/50 border border-border/50">
              <TabsTrigger value="explorer" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                <span className="hidden sm:inline">محرر</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">معاينة</span>
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                <span className="hidden sm:inline">طرفية</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">السجل</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>

            {/* Code Editor Tab */}
            <TabsContent value="explorer" className="mt-4">
              <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm">
                {isLoading ? (
                  <div className="flex items-center justify-center min-h-96">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                  </div>
                ) : selectedFile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        اسم الملف
                      </label>
                      <Input
                        value={selectedFile.name}
                        onChange={(e) =>
                          setSelectedFile({ ...selectedFile, name: e.target.value })
                        }
                        className="mt-1 bg-background/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        محتوى الملف
                      </label>
                      <Textarea
                        value={selectedFile.content}
                        onChange={(e) =>
                          setSelectedFile({ ...selectedFile, content: e.target.value })
                        }
                        className="mt-1 min-h-96 bg-background/50 font-mono text-sm"
                        placeholder="اكتب الكود هنا..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center min-h-96 text-muted-foreground">
                    <p>اختر ملفاً لتحريره</p>
                  </div>
                )}
              </Card>
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="mt-4">
              <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm min-h-96">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>معاينة المشروع</p>
                    <p className="text-sm mt-2">اضغط على "بناء المشروع" لعرض المعاينة</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Terminal Tab */}
            <TabsContent value="terminal" className="mt-4">
              <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="bg-background/50 rounded-lg p-4 min-h-96 font-mono text-sm space-y-1 overflow-y-auto">
                  {terminal.map((line, idx) => (
                    <div key={idx} className="text-green-400">
                      {line}
                    </div>
                  ))}
                  {buildStatus === "building" && (
                    <div className="mt-4">
                      <div className="w-full bg-background rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${buildProgress}%` }}
                        />
                      </div>
                      <p className="text-muted-foreground text-xs mt-2">{buildProgress}%</p>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-4">
              <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm">
                <div className="space-y-4">
                  {buildStatus === "success" && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-400">تم بناء المشروع بنجاح</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleString("ar-SA")}
                        </p>
                      </div>
                    </div>
                  )}
                  {buildStatus === "error" && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-400">فشل البناء</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleString("ar-SA")}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-400">تم إنشاء المشروع</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date().toLocaleString("ar-SA")}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* AI Tab */}
            <TabsContent value="ai" className="mt-4 space-y-4">
              {/* AI Command Panel */}
              <AICommandPanel
                projectId={projectId}
                onCommandExecuted={handleCommandExecuted}
                onShowDebug={handleShowDebug}
              />

              {/* Smart Diff Preview */}
              {showDiffPreview && diffData && (
                <SmartDiffPreview
                  filesChanged={diffData.filesChanged}
                  newFiles={diffData.newFiles}
                  deletedFiles={diffData.deletedFiles}
                  onApply={handleApplyDiff}
                  onReject={() => setShowDiffPreview(false)}
                />
              )}

              {/* Auto Debugger Panel */}
              {showDebugger && debugData && (
                <AutoDebuggerPanel
                  errors={debugData.errors}
                  onDismiss={() => setShowDebugger(false)}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
