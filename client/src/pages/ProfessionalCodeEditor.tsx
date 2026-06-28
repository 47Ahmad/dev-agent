import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  FileText, Search, Replace, Copy, Download, Save, Undo2, Redo2,
  ChevronDown, Settings, Eye, Code, Zap, AlertCircle, CheckCircle,
  X, Plus, Minus, Maximize2, Minimize2, Keyboard, Code2, Lightbulb
} from 'lucide-react';

interface CodeFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isDirty: boolean;
  isSaved: boolean;
}

interface EditorState {
  fontSize: number;
  theme: 'dark' | 'light';
  wordWrap: boolean;
  showLineNumbers: boolean;
  showMinimap: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
  showErrorHighlight: boolean;
  showCodeFolding: boolean;
}

const ProfessionalCodeEditor = () => {
  const [files, setFiles] = useState<CodeFile[]>([
    {
      id: '1',
      name: 'index.tsx',
      language: 'typescript',
      content: `import React from 'react';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <h1 className="text-4xl font-bold text-white">Welcome to Dev-Agent</h1>
    </div>
  );
}`,
      isDirty: false,
      isSaved: true,
    },
  ]);

  const [activeFileId, setActiveFileId] = useState('1');
  const [editorState, setEditorState] = useState<EditorState>({
    fontSize: 14,
    theme: 'dark',
    wordWrap: true,
    showLineNumbers: true,
    showMinimap: true,
    autoSave: true,
    autoSaveInterval: 5000,
    showErrorHighlight: true,
    showCodeFolding: true,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showReplace, setShowReplace] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const activeFile = files.find((f) => f.id === activeFileId);

  const languageExtensions: Record<string, string> = {
    'index.tsx': 'typescript',
    'App.tsx': 'typescript',
    'styles.css': 'css',
    'config.js': 'javascript',
    'next.config.js': 'javascript',
    'tailwind.config.js': 'javascript',
    'tsconfig.json': 'json',
    'package.json': 'json',
  };

  const getLanguageFromFilename = (filename: string): string => {
    return languageExtensions[filename] || 'plaintext';
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, content: newContent, isDirty: true }
          : f
      )
    );

    // Add to history
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newContent]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId
            ? { ...f, content: history[newIndex], isDirty: true }
            : f
        )
      );
      if (editorRef.current) {
        editorRef.current.value = history[newIndex];
      }
    }
  }, [historyIndex, history, activeFileId]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId
            ? { ...f, content: history[newIndex], isDirty: true }
            : f
        )
      );
      if (editorRef.current) {
        editorRef.current.value = history[newIndex];
      }
    }
  }, [historyIndex, history, activeFileId]);

  const handleSearch = useCallback(() => {
    if (!searchQuery || !activeFile) return;

    const regex = new RegExp(searchQuery, 'g');
    const matches = activeFile.content.match(regex);
    if (matches) {
      toast.success(`Found ${matches.length} matches`);
    } else {
      toast.error('No matches found');
    }
  }, [searchQuery, activeFile]);

  const handleReplace = useCallback(() => {
    if (!searchQuery || !activeFile) return;

    const newContent = activeFile.content.replace(
      new RegExp(searchQuery, 'g'),
      replaceQuery
    );

    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, content: newContent, isDirty: true }
          : f
      )
    );

    if (editorRef.current) {
      editorRef.current.value = newContent;
    }

    toast.success('Replacement complete');
  }, [searchQuery, replaceQuery, activeFile, activeFileId]);

  const handleSave = useCallback(() => {
    if (!activeFile) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === activeFileId
          ? { ...f, isDirty: false, isSaved: true }
          : f
      )
    );

    toast.success(`${activeFile.name} saved`);
  }, [activeFile, activeFileId]);

  const handleFormat = useCallback(() => {
    if (!activeFile) return;

    try {
      let formatted = activeFile.content;

      // Simple formatting
      if (activeFile.language === 'json') {
        formatted = JSON.stringify(JSON.parse(formatted), null, 2);
      } else if (activeFile.language === 'typescript' || activeFile.language === 'javascript') {
        // Basic formatting
        formatted = formatted
          .replace(/{\s*/g, '{\n  ')
          .replace(/}\s*/g, '\n}')
          .replace(/;\s*/g, ';\n');
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === activeFileId
            ? { ...f, content: formatted, isDirty: true }
            : f
        )
      );

      if (editorRef.current) {
        editorRef.current.value = formatted;
      }

      toast.success('Code formatted');
    } catch (error) {
      toast.error('Formatting failed');
    }
  }, [activeFile, activeFileId]);

  const handleAddFile = useCallback(() => {
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name: `untitled-${Date.now()}.tsx`,
      language: 'typescript',
      content: '',
      isDirty: false,
      isSaved: false,
    };

    setFiles((prev) => [...prev, newFile]);
    setActiveFileId(newFile.id);
    toast.success('New file created');
  }, []);

  const handleCloseFile = useCallback((id: string) => {
    const fileToClose = files.find((f) => f.id === id);
    if (fileToClose?.isDirty) {
      if (!confirm(`Save changes to ${fileToClose.name}?`)) {
        return;
      }
    }

    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (activeFileId === id) {
      setActiveFileId(files[0]?.id || '');
    }
  }, [files, activeFileId]);

  const handleDownload = useCallback(() => {
    if (!activeFile) return;

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(activeFile.content)}`);
    element.setAttribute('download', activeFile.name);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`${activeFile.name} downloaded`);
  }, [activeFile]);

  const handleCopy = useCallback(() => {
    if (!activeFile) return;

    navigator.clipboard.writeText(activeFile.content);
    toast.success('Code copied to clipboard');
  }, [activeFile]);

  // Auto save
  useEffect(() => {
    if (editorState.autoSave && activeFile?.isDirty) {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }

      autoSaveTimerRef.current = setInterval(() => {
        handleSave();
      }, editorState.autoSaveInterval);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [editorState.autoSave, editorState.autoSaveInterval, activeFile?.isDirty, handleSave]);

  // Initialize editor with active file content
  useEffect(() => {
    if (editorRef.current && activeFile) {
      editorRef.current.value = activeFile.content;
      setHistory([activeFile.content]);
      setHistoryIndex(0);
    }
  }, [activeFileId]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">محرر الكود المتقدم</h1>
          <p className="text-gray-400">محرر احترافي مع دعم لغات متعددة</p>
        </div>

        {/* Toolbar */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* File Operations */}
            <Button
              onClick={handleAddFile}
              className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              ملف جديد
            </Button>

            <div className="w-px h-8 bg-white/10" />

            {/* Edit Operations */}
            <Button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
              variant="outline"
              size="sm"
            >
              <Undo2 className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50"
              variant="outline"
              size="sm"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-white/10" />

            {/* Search & Replace */}
            <Button
              onClick={() => setShowSearch(!showSearch)}
              className={`border ${
                showSearch
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
              variant="outline"
              size="sm"
            >
              <Search className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setShowReplace(!showReplace)}
              className={`border ${
                showReplace
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
              variant="outline"
              size="sm"
            >
              <Replace className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-white/10" />

            {/* Format & Save */}
            <Button
              onClick={handleFormat}
              className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/30"
              variant="outline"
              size="sm"
            >
              <Zap className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleSave}
              className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
              variant="outline"
              size="sm"
            >
              <Save className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-white/10" />

            {/* File Operations */}
            <Button
              onClick={handleCopy}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
              variant="outline"
              size="sm"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              onClick={handleDownload}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-white/10 ml-auto" />

            {/* Settings */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">حجم الخط:</span>
              <Button
                onClick={() =>
                  setEditorState((prev) => ({
                    ...prev,
                    fontSize: Math.max(10, prev.fontSize - 2),
                  }))
                }
                className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 p-1"
                variant="outline"
                size="sm"
              >
                <Minus className="w-3 h-3" />
              </Button>

              <span className="text-gray-400 text-sm w-8 text-center">{editorState.fontSize}px</span>

              <Button
                onClick={() =>
                  setEditorState((prev) => ({
                    ...prev,
                    fontSize: Math.min(32, prev.fontSize + 2),
                  }))
                }
                className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 p-1"
                variant="outline"
                size="sm"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="ابحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
              />
              <Button
                onClick={handleSearch}
                className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                variant="outline"
              >
                بحث
              </Button>
            </div>
          )}

          {/* Replace Bar */}
          {showReplace && (
            <div className="mt-4 flex gap-2">
              <Input
                placeholder="ابحث عن..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
              />
              <Input
                placeholder="استبدل بـ..."
                value={replaceQuery}
                onChange={(e) => setReplaceQuery(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder-gray-500"
              />
              <Button
                onClick={handleReplace}
                className="bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
                variant="outline"
              >
                استبدل
              </Button>
            </div>
          )}
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => setActiveFileId(file.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition ${
                activeFileId === file.id
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">{file.name}</span>
              {file.isDirty && <span className="text-yellow-400 text-xs">●</span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseFile(file.id);
                }}
                className="ml-2 hover:text-red-400"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Editor */}
        <Card className="bg-white/5 border-white/10 overflow-hidden">
          <div className="flex">
            {/* Line Numbers */}
            {editorState.showLineNumbers && (
              <div className="bg-white/5 border-r border-white/10 px-4 py-4 text-gray-600 text-sm select-none">
                {activeFile?.content.split('\n').map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
            )}

            {/* Editor */}
            <div className="flex-1 relative">
              <textarea
                ref={editorRef}
                value={activeFile?.content || ''}
                onChange={handleContentChange}
                className="w-full h-96 bg-transparent text-white font-mono p-4 resize-none focus:outline-none"
                style={{ fontSize: `${editorState.fontSize}px` }}
                spellCheck="false"
              />
            </div>

            {/* Minimap */}
            {editorState.showMinimap && (
              <div className="w-16 bg-white/5 border-l border-white/10 p-2">
                <div className="w-full h-96 bg-white/10 rounded text-xs text-gray-600 p-1 overflow-hidden">
                  {activeFile?.content.split('\n').slice(0, 20).map((line, i) => (
                    <div key={i} className="text-[8px] truncate opacity-50">
                      {line.substring(0, 10)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="bg-white/5 border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span>
                {activeFile?.language.toUpperCase()} •{' '}
                {activeFile?.content.split('\n').length} lines
              </span>
              <span>{activeFile?.content.length} characters</span>
            </div>
            <div className="flex items-center gap-2">
              {activeFile?.isDirty && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                  Unsaved
                </span>
              )}
              {activeFile?.isSaved && (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Saved
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card className="bg-white/5 border-white/10 p-4 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Keyboard className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">اختصارات لوحة المفاتيح</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-400">
            <div>
              <p className="text-white font-mono">Ctrl+Z</p>
              <p>تراجع</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+Y</p>
              <p>إعادة</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+F</p>
              <p>بحث</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+H</p>
              <p>استبدال</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+S</p>
              <p>حفظ</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+L</p>
              <p>تنسيق</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+C</p>
              <p>نسخ</p>
            </div>
            <div>
              <p className="text-white font-mono">Ctrl+D</p>
              <p>تحميل</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ProfessionalCodeEditor;
