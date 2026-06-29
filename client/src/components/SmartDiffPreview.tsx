import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Copy,
  Download,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface FileChange {
  filePath: string;
  oldContent: string;
  newContent: string;
  diff?: string;
  reason?: string;
}

interface NewFile {
  filePath: string;
  content: string;
  reason?: string;
}

interface DeletedFile {
  filePath: string;
  reason?: string;
}

interface SmartDiffPreviewProps {
  filesChanged?: FileChange[];
  newFiles?: NewFile[];
  deletedFiles?: DeletedFile[];
  onApply?: () => void;
  onReject?: () => void;
  isLoading?: boolean;
}

export function SmartDiffPreview({
  filesChanged = [],
  newFiles = [],
  deletedFiles = [],
  onApply,
  onReject,
  isLoading = false,
}: SmartDiffPreviewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedTab, setSelectedTab] = useState<"changed" | "new" | "deleted">(
    "changed"
  );

  const toggleExpanded = (filePath: string) => {
    const newSet = new Set(expandedFiles);
    if (newSet.has(filePath)) {
      newSet.delete(filePath);
    } else {
      newSet.add(filePath);
    }
    setExpandedFiles(newSet);
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("تم النسخ!");
  };

  const renderDiffLine = (line: string, idx: number) => {
    if (line.startsWith("+") && !line.startsWith("+++")) {
      return (
        <div key={idx} className="bg-green-500/10 text-green-400 text-xs">
          <span className="inline-block w-6 text-right">+</span>
          {line.substring(1)}
        </div>
      );
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      return (
        <div key={idx} className="bg-red-500/10 text-red-400 text-xs">
          <span className="inline-block w-6 text-right">-</span>
          {line.substring(1)}
        </div>
      );
    }
    return (
      <div key={idx} className="text-muted-foreground text-xs">
        <span className="inline-block w-6 text-right"> </span>
        {line}
      </div>
    );
  };

  const totalChanges = filesChanged.length + newFiles.length + deletedFiles.length;

  if (totalChanges === 0) {
    return (
      <Card className="p-4 border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="text-center text-muted-foreground py-8">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>لا توجد تغييرات للعرض</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border/30 bg-background/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">معاينة التغييرات الذكية</h3>
            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs">
              {totalChanges} تغيير
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onReject}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="border-red-500/30 hover:bg-red-500/10"
            >
              <X className="w-4 h-4 mr-1" />
              رفض
            </Button>
            <Button
              onClick={onApply}
              disabled={isLoading}
              size="sm"
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <Check className="w-4 h-4 mr-1" />
              تطبيق
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTab("changed")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === "changed"
                ? "bg-blue-500/20 text-blue-400"
                : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            تعديل ({filesChanged.length})
          </button>
          <button
            onClick={() => setSelectedTab("new")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === "new"
                ? "bg-green-500/20 text-green-400"
                : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            جديد ({newFiles.length})
          </button>
          <button
            onClick={() => setSelectedTab("deleted")}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              selectedTab === "deleted"
                ? "bg-red-500/20 text-red-400"
                : "text-muted-foreground hover:bg-background/50"
            }`}
          >
            حذف ({deletedFiles.length})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {selectedTab === "changed" && (
          <div className="space-y-2 p-4">
            {filesChanged.map((file) => (
              <div
                key={file.filePath}
                className="rounded-lg border border-blue-500/20 bg-blue-500/5 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(file.filePath)}
                  className="w-full p-3 flex items-center justify-between hover:bg-blue-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 text-right">
                    {expandedFiles.has(file.filePath) ? (
                      <ChevronUp className="w-4 h-4 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-blue-400" />
                    )}
                    <span className="text-sm font-medium text-blue-400">
                      {file.filePath}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {file.reason}
                  </span>
                </button>

                {expandedFiles.has(file.filePath) && (
                  <div className="border-t border-blue-500/20 p-3 bg-background/50">
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={() => copyToClipboard(file.newContent)}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        نسخ
                      </Button>
                    </div>
                    <div className="bg-background rounded-lg p-2 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto border border-border/30">
                      {file.diff ? (
                        file.diff.split("\n").map((line, idx) => renderDiffLine(line, idx))
                      ) : (
                        <div className="text-muted-foreground">
                          <p className="mb-2 text-xs">المحتوى الجديد:</p>
                          <pre className="whitespace-pre-wrap break-words">
                            {file.newContent.substring(0, 500)}
                            {file.newContent.length > 500 && "..."}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTab === "new" && (
          <div className="space-y-2 p-4">
            {newFiles.map((file) => (
              <div
                key={file.filePath}
                className="rounded-lg border border-green-500/20 bg-green-500/5 overflow-hidden"
              >
                <button
                  onClick={() => toggleExpanded(file.filePath)}
                  className="w-full p-3 flex items-center justify-between hover:bg-green-500/10 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 text-right">
                    {expandedFiles.has(file.filePath) ? (
                      <ChevronUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-green-400" />
                    )}
                    <span className="text-sm font-medium text-green-400">
                      {file.filePath}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {file.reason}
                  </span>
                </button>

                {expandedFiles.has(file.filePath) && (
                  <div className="border-t border-green-500/20 p-3 bg-background/50">
                    <div className="flex gap-2 mb-2">
                      <Button
                        onClick={() => copyToClipboard(file.content)}
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        نسخ
                      </Button>
                    </div>
                    <div className="bg-background rounded-lg p-2 font-mono text-xs overflow-x-auto max-h-48 overflow-y-auto border border-border/30">
                      <pre className="whitespace-pre-wrap break-words text-green-400">
                        {file.content.substring(0, 500)}
                        {file.content.length > 500 && "..."}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedTab === "deleted" && (
          <div className="space-y-2 p-4">
            {deletedFiles.map((file) => (
              <div
                key={file.filePath}
                className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 flex items-center justify-between"
              >
                <span className="text-sm font-medium text-red-400">
                  {file.filePath}
                </span>
                <span className="text-xs text-muted-foreground">
                  {file.reason}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
