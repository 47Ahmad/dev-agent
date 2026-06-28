import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Send, Plus, Settings, Trash2, Download, Upload, Copy, RefreshCw,
  Code, BookOpen, Lightbulb, Zap, Clock, User, Bot, Menu, X,
  Save, FolderOpen, FileText, ChevronDown, AlertCircle, CheckCircle
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  projectType?: string;
  tokens?: number;
}

interface ConversationMemory {
  id: string;
  name: string;
  projectType: string;
  messages: Message[];
  context: {
    projectName?: string;
    description?: string;
    technologies?: string[];
    requirements?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  projectTypes: string[];
  usage: number;
}

const AdvancedAIWorkspace = () => {
  const [conversations, setConversations] = useState<ConversationMemory[]>([
    {
      id: '1',
      name: 'E-Commerce Platform',
      projectType: 'nextjs',
      messages: [
        {
          id: '1',
          role: 'user',
          content: 'أنا أريد بناء منصة تجارة إلكترونية متكاملة',
          timestamp: new Date(Date.now() - 3600000),
        },
        {
          id: '2',
          role: 'assistant',
          content: 'ممتاز! سأساعدك في بناء منصة تجارة إلكترونية احترافية. دعني أقترح لك البنية الأساسية:\n\n1. **Frontend**: Next.js مع TypeScript\n2. **Backend**: Node.js + Express\n3. **Database**: PostgreSQL\n4. **Payment**: Stripe Integration\n5. **Storage**: AWS S3\n\nهل تريد أن نبدأ بتصميم قاعدة البيانات؟',
          timestamp: new Date(Date.now() - 3000000),
        },
      ],
      context: {
        projectName: 'E-Commerce Platform',
        description: 'منصة تجارة إلكترونية متكاملة',
        technologies: ['Next.js', 'Node.js', 'PostgreSQL', 'Stripe'],
        requirements: ['Payment Integration', 'Product Management', 'User Authentication'],
      },
      createdAt: new Date(Date.now() - 86400000),
      updatedAt: new Date(Date.now() - 3000000),
    },
  ]);

  const [activeConversationId, setActiveConversationId] = useState('1');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPromptTemplates, setShowPromptTemplates] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const projectTypes = [
    { id: 'react', name: 'React', icon: Code, color: 'from-blue-500 to-blue-600' },
    { id: 'nextjs', name: 'Next.js', icon: Code, color: 'from-black to-gray-800' },
    { id: 'vue', name: 'Vue', icon: Code, color: 'from-green-500 to-green-600' },
    { id: 'svelte', name: 'Svelte', icon: Code, color: 'from-red-500 to-red-600' },
    { id: 'angular', name: 'Angular', icon: Code, color: 'from-red-600 to-red-700' },
    { id: 'static', name: 'Static', icon: FileText, color: 'from-yellow-500 to-yellow-600' },
    { id: 'nodejs', name: 'Node.js', icon: Code, color: 'from-green-600 to-green-700' },
    { id: 'fullstack', name: 'Full Stack', icon: Code, color: 'from-purple-500 to-purple-600' },
  ];

  const promptTemplates: PromptTemplate[] = [
    {
      id: '1',
      name: 'Database Schema Design',
      category: 'Database',
      template: 'أنا أريد تصميم قاعدة بيانات لـ {projectName}. المتطلبات: {requirements}. الرجاء اقتراح schema مع العلاقات.',
      projectTypes: ['nextjs', 'nodejs', 'fullstack'],
      usage: 45,
    },
    {
      id: '2',
      name: 'API Design',
      category: 'Backend',
      template: 'أنا أريد تصميم APIs لـ {projectName}. الميزات المطلوبة: {features}. الرجاء اقتراح endpoints مع request/response format.',
      projectTypes: ['nodejs', 'nextjs', 'fullstack'],
      usage: 38,
    },
    {
      id: '3',
      name: 'Component Structure',
      category: 'Frontend',
      template: 'أنا أريد بناء مكونات لـ {projectName}. الصفحات: {pages}. الرجاء اقتراح component hierarchy.',
      projectTypes: ['react', 'nextjs', 'vue', 'svelte', 'angular'],
      usage: 52,
    },
    {
      id: '4',
      name: 'State Management',
      category: 'Frontend',
      template: 'أنا أريد إدارة الحالة في {projectName}. الحالات المطلوبة: {states}. هل تنصح بـ Redux أم Context API أم Zustand؟',
      projectTypes: ['react', 'nextjs', 'vue'],
      usage: 31,
    },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || !activeConversation) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      projectType: activeConversation.projectType,
    };

    setConversations(
      conversations.map((c) =>
        c.id === activeConversationId
          ? { ...c, messages: [...c.messages, userMessage], updatedAt: new Date() }
          : c
      )
    );

    setInputMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `تم استقبال رسالتك: "${inputMessage}"\n\nسأقوم بتحليل طلبك وتقديم الحل الأمثل لمشروع ${activeConversation.projectType}.`,
        timestamp: new Date(),
        tokens: Math.floor(Math.random() * 500) + 100,
      };

      setConversations(
        conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date() }
            : c
        )
      );

      setIsLoading(false);
      scrollToBottom();
    }, 1500);
  }, [inputMessage, activeConversation, activeConversationId, conversations]);

  const handleNewConversation = () => {
    const newConversation: ConversationMemory = {
      id: Date.now().toString(),
      name: 'محادثة جديدة',
      projectType: 'react',
      messages: [],
      context: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setConversations([...conversations, newConversation]);
    setActiveConversationId(newConversation.id);
    toast.success('تم إنشاء محادثة جديدة');
  };

  const handleDeleteConversation = (id: string) => {
    if (conversations.length === 1) {
      toast.error('يجب أن تحتفظ بمحادثة واحدة على الأقل');
      return;
    }
    setConversations(conversations.filter((c) => c.id !== id));
    if (activeConversationId === id) {
      setActiveConversationId(conversations[0]?.id || '');
    }
    toast.success('تم حذف المحادثة');
  };

  const handleExportConversation = () => {
    if (!activeConversation) return;
    const json = JSON.stringify(activeConversation, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeConversation.name}.json`;
    a.click();
    toast.success('تم تصدير المحادثة');
  };

  const handleApplyTemplate = (template: PromptTemplate) => {
    if (!activeConversation) return;
    let message = template.template;
    message = message.replace('{projectName}', activeConversation.context.projectName || 'المشروع');
    message = message.replace('{requirements}', activeConversation.context.requirements?.join(', ') || '');
    message = message.replace('{features}', 'Feature 1, Feature 2');
    message = message.replace('{pages}', 'Home, Dashboard, Settings');
    message = message.replace('{states}', 'User, Projects, Settings');
    setInputMessage(message);
  };

  const totalTokens = activeConversation?.messages.reduce((sum, m) => sum + (m.tokens || 0), 0) || 0;
  const messageCount = activeConversation?.messages.length || 0;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-gradient-to-b from-background to-background/80 border-r border-white/10 flex flex-col overflow-hidden`}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <Button
            onClick={handleNewConversation}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <Plus className="w-4 h-4 ml-2" />
            محادثة جديدة
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`p-3 rounded-lg cursor-pointer transition group ${
                activeConversationId === conv.id
                  ? 'bg-purple-500/20 border border-purple-500/50'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm truncate">{conv.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{conv.messages.length} رسالة</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition p-1 hover:bg-red-500/20 rounded"
                >
                  <Trash2 className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Project Types */}
        <div className="p-4 border-t border-white/10">
          <p className="text-white font-semibold text-sm mb-3">أنواع المشاريع</p>
          <div className="grid grid-cols-2 gap-2">
            {projectTypes.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.id}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-center"
                >
                  <Icon className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                  <p className="text-white text-xs font-medium">{type.name}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gradient-to-r from-background to-background/80 border-b border-white/10 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              {showSidebar ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
            <div>
              <h2 className="text-white font-bold">{activeConversation?.name}</h2>
              <p className="text-gray-400 text-sm">{activeConversation?.projectType}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowPromptTemplates(!showPromptTemplates)}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Lightbulb className="w-4 h-4 ml-2" />
              قوالب
            </Button>
            <Button
              onClick={handleExportConversation}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Prompt Templates Panel */}
        {showPromptTemplates && (
          <div className="bg-white/5 border-b border-white/10 p-4 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {promptTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleApplyTemplate(template)}
                  className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition text-left"
                >
                  <p className="text-white font-medium text-sm">{template.name}</p>
                  <p className="text-gray-400 text-xs mt-1">{template.category}</p>
                  <p className="text-purple-400 text-xs mt-2">استخدم {template.usage} مرة</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeConversation?.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-2xl p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500/20 border border-blue-500/50 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {message.role === 'assistant' && <Bot className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />}
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{message.timestamp.toLocaleTimeString('ar-SA')}</span>
                      {message.tokens && <span>{message.tokens} tokens</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Context Info */}
        {activeConversation?.context && (
          <div className="bg-white/5 border-t border-white/10 p-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-gray-400 text-xs">الرسائل</p>
                <p className="text-white font-bold">{messageCount}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">الرموز</p>
                <p className="text-white font-bold">{totalTokens}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">النوع</p>
                <p className="text-white font-bold text-sm">{activeConversation.projectType}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">آخر تحديث</p>
                <p className="text-white font-bold text-sm">{activeConversation.updatedAt.toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="bg-gradient-to-t from-background to-background/80 border-t border-white/10 p-4">
          <div className="flex gap-3">
            <div className="flex-1 flex gap-2">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="اكتب رسالتك هنا... (Shift+Enter للسطر الجديد)"
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 resize-none"
                rows={3}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAIWorkspace;
