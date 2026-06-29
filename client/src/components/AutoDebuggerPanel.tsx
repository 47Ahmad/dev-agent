import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  Wrench,
  ChevronDown,
  ChevronUp,
  Loader2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface ErrorItem {
  file: string;
  line?: number;
  message: string;
  type: "error" | "warning" | "info";
  suggestion?: string;
}

interface AutoDebuggerPanelProps {
  errors?: ErrorItem[];
  isLoading?: boolean;
  onAutoFix?: () => void;
  onDismiss?: () => void;
}

export function AutoDebuggerPanel({
  errors = [],
  isLoading = false,
  onAutoFix,
  onDismiss,
}: AutoDebuggerPanelProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [fixingErrors, setFixingErrors] = useState(false);

  const toggleExpanded = (idx: number) => {
    const newSet = new Set(expandedErrors);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setExpandedErrors(newSet);
  };

  const handleAutoFix = async () => {
    setFixingErrors(true);
    try {
      await onAutoFix?.();
      toast.success("تم إصلاح الأخطاء!");
    } catch (error) {
      toast.error("فشل الإصلاح التلقائي");
    } finally {
      setFixingErrors(false);
    }
  };

  const errorCount = errors.filter((e) => e.type === "error").length;
  const warningCount = errors.filter((e) => e.type === "warning").length;
  const infoCount = errors.filter((e) => e.type === "info").length;

  if (errors.length === 0) {
    return (
      <Card className="p-4 border border-green-500/30 bg-green-500/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <div>
            <p className="font-medium text-green-400">المشروع سليم</p>
            <p className="text-sm text-muted-foreground">
              لم يتم العثور على أخطاء
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-background/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="font-semibold">فحص المشروع</h3>
              <p className="text-xs text-muted-foreground">
                تم العثور على {errors.length} مشكلة
              </p>
            </div>
          </div>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
          >
            ✕
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {errorCount > 0 && (
            <div className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-400 font-medium">{errorCount} أخطاء</p>
            </div>
          )}
          {warningCount > 0 && (
            <div className="px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-xs text-yellow-400 font-medium">
                {warningCount} تحذيرات
              </p>
            </div>
          )}
          {infoCount > 0 && (
            <div className="px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-400 font-medium">{infoCount} معلومات</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleAutoFix}
            disabled={isLoading || fixingErrors}
            size="sm"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            {fixingErrors ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                جاري الإصلاح...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 mr-1" />
                إصلاح تلقائي
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Errors List */}
      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-1 p-2">
          {errors.map((error, idx) => (
            <div
              key={idx}
              className={`rounded-lg border overflow-hidden ${
                error.type === "error"
                  ? "border-red-500/20 bg-red-500/5"
                  : error.type === "warning"
                  ? "border-yellow-500/20 bg-yellow-500/5"
                  : "border-blue-500/20 bg-blue-500/5"
              }`}
            >
              <button
                onClick={() => toggleExpanded(idx)}
                className="w-full p-3 flex items-center justify-between hover:bg-white/5 transition-colors text-right"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {expandedErrors.has(idx) ? (
                    <ChevronUp className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 flex-shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-left">
                      {error.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {error.file}
                      {error.line && `:${error.line}`}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                    error.type === "error"
                      ? "bg-red-500/20 text-red-400"
                      : error.type === "warning"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {error.type === "error"
                    ? "خطأ"
                    : error.type === "warning"
                    ? "تحذير"
                    : "معلومة"}
                </span>
              </button>

              {expandedErrors.has(idx) && error.suggestion && (
                <div className="border-t border-current/20 p-3 bg-black/20">
                  <div className="flex items-start gap-2">
                    <Wrench className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                    <div className="flex-1">
                      <p className="text-xs font-medium mb-1 text-blue-400">
                        الاقتراح:
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {error.suggestion}
                      </p>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(error.suggestion || "");
                          toast.success("تم النسخ!");
                        }}
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs mt-2"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        نسخ
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
