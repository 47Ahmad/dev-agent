import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Zap,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Wrench,
  History,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface AICommandPanelProps {
  projectId: string;
  onCommandExecuted?: (result: any) => void;
  onShowDiff?: (diff: any) => void;
  onShowDebug?: (debug: any) => void;
}

export function AICommandPanel({
  projectId,
  onCommandExecuted,
  onShowDiff,
  onShowDebug,
}: AICommandPanelProps) {
  const [command, setCommand] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const executeCommandMutation = trpc.aiExecution.executeCommand.useMutation({
    onSuccess: (result) => {
      setIsExecuting(false);
      if (result.success) {
        toast.success("تم تنفيذ الأمر بنجاح!");
        setExecutionHistory((prev) => [
          { command, result, timestamp: new Date() },
          ...prev.slice(0, 9),
        ]);
        setCommand("");
        onCommandExecuted?.(result);
      } else {
        toast.error(result.message || "فشل تنفيذ الأمر");
      }
    },
    onError: (error) => {
      setIsExecuting(false);
      toast.error(error.message || "خطأ في تنفيذ الأمر");
    },
  });

  const debugProjectMutation = trpc.aiExecution.debugProject.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("تم فحص المشروع بنجاح!");
        onShowDebug?.(result);
      } else {
        toast.error("فشل الفحص");
      }
    },
    onError: (error) => {
      toast.error(error.message || "خطأ في الفحص");
    },
  });

  const handleExecuteCommand = async () => {
    if (!command.trim()) {
      toast.error("يرجى إدخال أمر");
      return;
    }

    setIsExecuting(true);
    await executeCommandMutation.mutateAsync({
      projectId,
      command: command.trim(),
    });
  };

  const handleDebugProject = async () => {
    await debugProjectMutation.mutateAsync({ projectId });
  };

  const handleQuickCommand = (quickCommand: string) => {
    setCommand(quickCommand);
  };

  const quickCommands = [
    "أضف مكون جديد",
    "عدّل الصفحة الحالية",
    "أصلح الأخطاء",
    "حسّن التصميم",
    "أنشئ ميزة جديدة",
  ];

  return (
    <div className="space-y-4">
      {/* Command Input */}
      <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="font-semibold">لوحة أوامر AI</h3>
          </div>

          <Textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="اكتب أمراً للذكاء الاصطناعي... (مثال: أضف زر تسجيل الدخول)"
            className="min-h-24 bg-background/50 resize-none"
            disabled={isExecuting}
          />

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleExecuteCommand}
              disabled={isExecuting || !command.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  جاري التنفيذ...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  تنفيذ
                </>
              )}
            </Button>

            <Button
              onClick={handleDebugProject}
              disabled={isExecuting}
              variant="outline"
              className="border-orange-500/30 hover:bg-orange-500/10"
            >
              <Wrench className="w-4 h-4 mr-2" />
              فحص المشروع
            </Button>

            <Button
              onClick={() => setShowHistory(!showHistory)}
              variant="outline"
              className="border-gray-500/30 hover:bg-gray-500/10"
            >
              <History className="w-4 h-4 mr-2" />
              السجل ({executionHistory.length})
            </Button>
          </div>

          {/* Quick Commands */}
          <div className="pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground mb-2">أوامر سريعة:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickCommands.map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => handleQuickCommand(cmd)}
                  className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors text-right"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Execution History */}
      {showHistory && executionHistory.length > 0 && (
        <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm max-h-64 overflow-y-auto">
          <h4 className="font-semibold mb-3 text-sm">سجل التنفيذ</h4>
          <div className="space-y-2">
            {executionHistory.map((item, idx) => (
              <div
                key={idx}
                className="p-2 rounded-lg bg-background/50 border border-border/30 text-xs space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-muted-foreground flex-1">{item.command}</p>
                  {item.result.success ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-muted-foreground">
                  {new Date(item.timestamp).toLocaleTimeString("ar-SA")}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
