import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Folder, File, Plus, Trash2, Edit2, Copy, Download, Upload, Archive,
  Search, Grid, List, Eye, ChevronRight, ChevronDown, MoreVertical,
  FileText, Image, Code, Lock, Share2, Move, Zap, FolderPlus, FilePlus,
  Calendar, HardDrive, Check, X
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  modified: Date;
  isSelected: boolean;
  content?: string;
  parentId?: string;
}

interface FileManagerState {
  viewMode: 'grid' | 'list';
  sortBy: 'name' | 'date' | 'size';
  sortOrder: 'asc' | 'desc';
  showHidden: boolean;
  selectedItems: string[];
  searchQuery: string;
  currentPath: string[];
}

const FileManager = () => {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: '1',
      name: 'src',
      type: 'folder',
      size: 0,
      modified: new Date(),
      isSelected: false,
    },
    {
      id: '2',
      name: 'package.json',
      type: 'file',
      size: 2048,
      modified: new Date(),
      isSelected: false,
    },
    {
      id: '3',
      name: 'README.md',
      type: 'file',
      size: 4096,
      modified: new Date(),
      isSelected: false,
    },
    {
      id: '4',
      name: 'tsconfig.json',
      type: 'file',
      size: 1024,
      modified: new Date(),
      isSelected: false,
    },
  ]);

  const [state, setState] = useState<FileManagerState>({
    viewMode: 'grid',
    sortBy: 'name',
    sortOrder: 'asc',
    showHidden: false,
    selectedItems: [],
    searchQuery: '',
    currentPath: [],
  });

  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState('');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.md')) return <FileText className="w-5 h-5 text-blue-400" />;
    if (filename.endsWith('.json')) return <Code className="w-5 h-5 text-yellow-400" />;
    if (filename.endsWith('.tsx') || filename.endsWith('.ts')) return <Code className="w-5 h-5 text-purple-400" />;
    if (filename.endsWith('.css')) return <Code className="w-5 h-5 text-pink-400" />;
    if (filename.match(/\.(jpg|png|gif|svg)$/)) return <Image className="w-5 h-5 text-green-400" />;
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateFile = useCallback(() => {
    if (!newName.trim()) {
      toast.error('أدخل اسم الملف');
      return;
    }

    const newFile: FileItem = {
      id: Date.now().toString(),
      name: newName,
      type: 'file',
      size: 0,
      modified: new Date(),
      isSelected: false,
    };

    setFiles((prev) => [...prev, newFile]);
    setNewName('');
    setShowNewFileDialog(false);
    toast.success(`تم إنشاء الملف: ${newName}`);
  }, [newName]);

  const handleCreateFolder = useCallback(() => {
    if (!newName.trim()) {
      toast.error('أدخل اسم المجلد');
      return;
    }

    const newFolder: FileItem = {
      id: Date.now().toString(),
      name: newName,
      type: 'folder',
      size: 0,
      modified: new Date(),
      isSelected: false,
    };

    setFiles((prev) => [...prev, newFolder]);
    setNewName('');
    setShowNewFolderDialog(false);
    toast.success(`تم إنشاء المجلد: ${newName}`);
  }, [newName]);

  const handleRename = useCallback((id: string) => {
    if (!renameName.trim()) {
      toast.error('أدخل الاسم الجديد');
      return;
    }

    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, name: renameName } : f
      )
    );

    setRenameId(null);
    setRenameName('');
    toast.success('تم تغيير الاسم');
  }, [renameName]);

  const handleDelete = useCallback((id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
      setFiles((prev) => prev.filter((f) => f.id !== id));
      toast.success('تم الحذف');
    }
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    const newFile: FileItem = {
      ...file,
      id: Date.now().toString(),
      name: `${file.name} (copy)`,
    };

    setFiles((prev) => [...prev, newFile]);
    toast.success('تم نسخ الملف');
  }, [files]);

  const handleDownload = useCallback((file: FileItem) => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(file.content || '')}`);
    element.setAttribute('download', file.name);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`تم تحميل: ${file.name}`);
  }, []);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach((file) => {
      const newFile: FileItem = {
        id: Date.now().toString(),
        name: file.name,
        type: 'file',
        size: file.size,
        modified: new Date(),
        isSelected: false,
      };

      setFiles((prev) => [...prev, newFile]);
    });

    toast.success(`تم رفع ${uploadedFiles.length} ملف(ات)`);
  }, []);

  const handleCopy = useCallback((file: FileItem) => {
    navigator.clipboard.writeText(file.name);
    toast.success('تم نسخ الاسم');
  }, []);

  const handleSelectAll = useCallback(() => {
    if (state.selectedItems.length === files.length) {
      setState((prev) => ({ ...prev, selectedItems: [] }));
    } else {
      setState((prev) => ({ ...prev, selectedItems: files.map((f) => f.id) }));
    }
  }, [files, state.selectedItems]);

  const handleToggleSelect = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(id)
        ? prev.selectedItems.filter((i) => i !== id)
        : [...prev.selectedItems, id],
    }));
  }, []);

  const filteredFiles = files
    .filter((f) => f.name.toLowerCase().includes(state.searchQuery.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (state.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (state.sortBy === 'date') {
        comparison = a.modified.getTime() - b.modified.getTime();
      } else if (state.sortBy === 'size') {
        comparison = a.size - b.size;
      }

      return state.sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">مدير الملفات</h1>
          <p className="text-gray-400">إدارة ملفات المشروع والمجلدات</p>
        </div>

        {/* Toolbar */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* File Operations */}
            <Button
              onClick={() => setShowNewFileDialog(true)}
              className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
              variant="outline"
              size="sm"
            >
              <FilePlus className="w-4 h-4 mr-2" />
              ملف جديد
            </Button>

            <Button
              onClick={() => setShowNewFolderDialog(true)}
              className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
              variant="outline"
              size="sm"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              مجلد جديد
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30"
              variant="outline"
              size="sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              رفع
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleUpload}
              className="hidden"
            />

            <div className="w-px h-8 bg-white/10" />

            {/* View Options */}
            <Button
              onClick={() => setState((prev) => ({ ...prev, viewMode: 'grid' }))}
              className={`border ${
                state.viewMode === 'grid'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
              variant="outline"
              size="sm"
            >
              <Grid className="w-4 h-4" />
            </Button>

            <Button
              onClick={() => setState((prev) => ({ ...prev, viewMode: 'list' }))}
              className={`border ${
                state.viewMode === 'list'
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                  : 'bg-white/5 border-white/10 text-gray-400'
              }`}
              variant="outline"
              size="sm"
            >
              <List className="w-4 h-4" />
            </Button>

            <div className="w-px h-8 bg-white/10 ml-auto" />

            {/* Search */}
            <Input
              placeholder="ابحث..."
              value={state.searchQuery}
              onChange={(e) =>
                setState((prev) => ({ ...prev, searchQuery: e.target.value }))
              }
              className="bg-white/5 border-white/10 text-white placeholder-gray-500 w-48"
            />
          </div>

          {/* Sort Options */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">الترتيب:</span>
            <select
              value={state.sortBy}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  sortBy: e.target.value as 'name' | 'date' | 'size',
                }))
              }
              className="bg-white/5 border border-white/10 text-white rounded px-2 py-1"
            >
              <option value="name">الاسم</option>
              <option value="date">التاريخ</option>
              <option value="size">الحجم</option>
            </select>

            <Button
              onClick={() =>
                setState((prev) => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
                }))
              }
              className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 p-1"
              variant="outline"
              size="sm"
            >
              {state.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </Card>

        {/* New File Dialog */}
        {showNewFileDialog && (
          <Card className="bg-white/10 border-white/20 p-6 mb-6 fixed inset-0 m-auto w-96 h-48">
            <h3 className="text-white font-semibold mb-4">ملف جديد</h3>
            <Input
              placeholder="اسم الملف..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-gray-500 mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateFile}
                className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30"
                variant="outline"
              >
                إنشاء
              </Button>
              <Button
                onClick={() => setShowNewFileDialog(false)}
                className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                variant="outline"
              >
                إلغاء
              </Button>
            </div>
          </Card>
        )}

        {/* New Folder Dialog */}
        {showNewFolderDialog && (
          <Card className="bg-white/10 border-white/20 p-6 mb-6 fixed inset-0 m-auto w-96 h-48">
            <h3 className="text-white font-semibold mb-4">مجلد جديد</h3>
            <Input
              placeholder="اسم المجلد..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-white/5 border-white/10 text-white placeholder-gray-500 mb-4"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreateFolder}
                className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                variant="outline"
              >
                إنشاء
              </Button>
              <Button
                onClick={() => setShowNewFolderDialog(false)}
                className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30"
                variant="outline"
              >
                إلغاء
              </Button>
            </div>
          </Card>
        )}

        {/* File List */}
        {state.viewMode === 'list' ? (
          <Card className="bg-white/5 border-white/10 overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/10">
                <tr>
                  <th className="px-6 py-3 text-right">
                    <input
                      type="checkbox"
                      checked={state.selectedItems.length === files.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-right text-white">الاسم</th>
                  <th className="px-6 py-3 text-right text-gray-400">الحجم</th>
                  <th className="px-6 py-3 text-right text-gray-400">التاريخ</th>
                  <th className="px-6 py-3 text-right text-gray-400">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={state.selectedItems.includes(file.id)}
                        onChange={() => handleToggleSelect(file.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-3 flex items-center gap-2">
                      {file.type === 'folder' ? (
                        <Folder className="w-5 h-5 text-yellow-400" />
                      ) : (
                        getFileIcon(file.name)
                      )}
                      {renameId === file.id ? (
                        <Input
                          value={renameName}
                          onChange={(e) => setRenameName(e.target.value)}
                          className="bg-white/5 border-white/10 text-white w-40"
                          autoFocus
                        />
                      ) : (
                        <span className="text-white">{file.name}</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {file.type === 'folder' ? '-' : formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-3 text-gray-400">
                      {formatDate(file.modified)}
                    </td>
                    <td className="px-6 py-3 flex gap-2">
                      {renameId === file.id ? (
                        <>
                          <Button
                            onClick={() => handleRename(file.id)}
                            size="sm"
                            className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 p-1"
                            variant="outline"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => setRenameId(null)}
                            size="sm"
                            className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 p-1"
                            variant="outline"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => {
                              setRenameId(file.id);
                              setRenameName(file.name);
                            }}
                            size="sm"
                            className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 p-1"
                            variant="outline"
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button
                            onClick={() => handleDuplicate(file.id)}
                            size="sm"
                            className="bg-purple-500/20 border border-purple-500/50 text-purple-400 hover:bg-purple-500/30 p-1"
                            variant="outline"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          {file.type === 'file' && (
                            <Button
                              onClick={() => handleDownload(file)}
                              size="sm"
                              className="bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 p-1"
                              variant="outline"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            onClick={() => handleDelete(file.id)}
                            size="sm"
                            className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 p-1"
                            variant="outline"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <Card
                key={file.id}
                className="bg-white/5 border-white/10 p-4 hover:bg-white/10 cursor-pointer transition"
              >
                <div className="flex justify-center mb-3">
                  {file.type === 'folder' ? (
                    <Folder className="w-12 h-12 text-yellow-400" />
                  ) : (
                    getFileIcon(file.name)
                  )}
                </div>
                <p className="text-white text-sm font-semibold truncate text-center mb-2">
                  {file.name}
                </p>
                <p className="text-gray-400 text-xs text-center">
                  {file.type === 'folder' ? 'مجلد' : formatFileSize(file.size)}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-6 flex items-center justify-between text-sm text-gray-400 bg-white/5 border border-white/10 rounded-lg p-4">
          <span>{filteredFiles.length} ملف(ات)</span>
          <span>
            {state.selectedItems.length > 0
              ? `${state.selectedItems.length} محدد`
              : 'لا توجد عناصر محددة'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
