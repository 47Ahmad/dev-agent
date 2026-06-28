import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Monitor, Tablet, Smartphone, RefreshCw, Settings, X, AlertCircle,
  Copy, Download, Share2, Maximize2, Minimize2, Eye, Code, Zap,
  ChevronLeft, ChevronRight, Clock, Wifi, WifiOff
} from 'lucide-react';

interface PreviewDevice {
  id: string;
  name: string;
  icon: React.ReactNode;
  width: number;
  height: number;
  userAgent: string;
}

interface PreviewState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  isOnline: boolean;
  lastRefresh: Date | null;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number;
}

const LivePreview = () => {
  const [selectedDevice, setSelectedDevice] = useState<PreviewDevice>({
    id: 'desktop',
    name: 'Desktop',
    icon: <Monitor className="w-5 h-5" />,
    width: 1280,
    height: 720,
    userAgent: 'Desktop',
  });

  const [splitScreenMode, setSplitScreenMode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>({
    isLoading: false,
    hasError: false,
    errorMessage: '',
    isOnline: true,
    lastRefresh: null,
    autoRefreshEnabled: false,
    autoRefreshInterval: 3000,
  });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const devices: PreviewDevice[] = [
    {
      id: 'desktop',
      name: 'Desktop',
      icon: <Monitor className="w-5 h-5" />,
      width: 1280,
      height: 720,
      userAgent: 'Desktop',
    },
    {
      id: 'tablet',
      name: 'Tablet',
      icon: <Tablet className="w-5 h-5" />,
      width: 768,
      height: 1024,
      userAgent: 'Tablet',
    },
    {
      id: 'mobile',
      name: 'Mobile',
      icon: <Smartphone className="w-5 h-5" />,
      width: 375,
      height: 812,
      userAgent: 'Mobile',
    },
  ];

  const sampleHTML = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dev-Agent Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Cairo', sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #e2e8f0;
      min-height: 100vh;
      padding: 20px;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      background: linear-gradient(135deg, #3b82f6, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 20px;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }
    
    .card:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-5px);
    }
    
    .card h3 {
      color: #60a5fa;
      margin-bottom: 10px;
    }
    
    .card p {
      font-size: 0.9rem;
      color: #cbd5e1;
      line-height: 1.6;
    }
    
    button {
      background: linear-gradient(135deg, #3b82f6, #a855f7);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;
      margin-top: 15px;
    }
    
    button:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
    }
    
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 30px;
    }
    
    .stat {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      padding: 15px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #60a5fa;
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 مرحباً بك في Dev-Agent Live Preview</h1>
    <p style="font-size: 1.1rem; color: #cbd5e1; margin-bottom: 20px;">
      هذه معاينة حية لمشروعك. يمكنك اختبار التصميم على أجهزة مختلفة.
    </p>
    
    <div class="stats">
      <div class="stat">
        <div class="stat-value">100%</div>
        <div class="stat-label">Responsive</div>
      </div>
      <div class="stat">
        <div class="stat-value">95</div>
        <div class="stat-label">Performance</div>
      </div>
      <div class="stat">
        <div class="stat-value">A+</div>
        <div class="stat-label">SEO Score</div>
      </div>
      <div class="stat">
        <div class="stat-value">99%</div>
        <div class="stat-label">Uptime</div>
      </div>
    </div>
    
    <div class="grid">
      <div class="card">
        <h3>📱 Responsive Design</h3>
        <p>تصميم يتكيف تلقائياً مع جميع أحجام الشاشات من الهاتف إلى سطح المكتب.</p>
        <button>اختبر الآن</button>
      </div>
      
      <div class="card">
        <h3>⚡ Performance</h3>
        <p>تحميل سريع وأداء ممتاز مع تحسينات SEO المتقدمة.</p>
        <button>عرض التفاصيل</button>
      </div>
      
      <div class="card">
        <h3>🔒 Security</h3>
        <p>حماية عالية مع تشفير SSL وحماية من الهجمات الشائعة.</p>
        <button>المزيد</button>
      </div>
      
      <div class="card">
        <h3>🌍 Localization</h3>
        <p>دعم كامل للغة العربية مع RTL وتوطين شامل.</p>
        <button>اكتشف</button>
      </div>
      
      <div class="card">
        <h3>📊 Analytics</h3>
        <p>تحليلات تفصيلية لسلوك المستخدمين والأداء.</p>
        <button>الإحصائيات</button>
      </div>
      
      <div class="card">
        <h3>🚀 Deployment</h3>
        <p>نشر سهل وسريع على منصات متعددة.</p>
        <button>انشر الآن</button>
      </div>
    </div>
  </div>
</body>
</html>`;

  const handleRefresh = useCallback(() => {
    if (iframeRef.current) {
      setPreviewState((prev) => ({ ...prev, isLoading: true }));
      
      setTimeout(() => {
        try {
          if (iframeRef.current) {
            iframeRef.current.srcdoc = sampleHTML;
            setPreviewState((prev) => ({
              ...prev,
              isLoading: false,
              hasError: false,
              lastRefresh: new Date(),
            }));
            toast.success('تم تحديث المعاينة');
          }
        } catch (error) {
          setPreviewState((prev) => ({
            ...prev,
            isLoading: false,
            hasError: true,
            errorMessage: 'فشل تحميل المعاينة',
          }));
          toast.error('خطأ في تحميل المعاينة');
        }
      }, 1000);
    }
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [selectedDevice, handleRefresh]);

  useEffect(() => {
    if (previewState.autoRefreshEnabled) {
      autoRefreshTimerRef.current = setInterval(() => {
        handleRefresh();
      }, previewState.autoRefreshInterval);
    } else {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    }

    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [previewState.autoRefreshEnabled, previewState.autoRefreshInterval, handleRefresh]);

  useEffect(() => {
    const handleOnline = () => {
      setPreviewState((prev) => ({ ...prev, isOnline: true }));
      toast.success('الاتصال استعيد');
    };

    const handleOffline = () => {
      setPreviewState((prev) => ({ ...prev, isOnline: false }));
      toast.error('فقدان الاتصال');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const PreviewFrame = ({ device }: { device: PreviewDevice }) => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg p-3">
        <div className="flex items-center gap-2">
          {device.icon}
          <span className="text-white font-medium">{device.name}</span>
          <span className="text-gray-400 text-sm">
            {device.width} × {device.height}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {previewState.isOnline ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
        </div>
      </div>

      <div
        className="relative bg-black rounded-lg overflow-hidden border border-white/10"
        style={{
          width: device.width,
          height: device.height,
          maxWidth: '100%',
        }}
      >
        {previewState.isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white text-sm">جاري التحميل...</span>
            </div>
          </div>
        )}

        {previewState.hasError && (
          <div className="absolute inset-0 bg-red-500/10 border border-red-500/50 flex items-center justify-center z-50">
            <div className="flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <span className="text-red-400 text-sm">{previewState.errorMessage}</span>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          title={`Preview - ${device.name}`}
          className="w-full h-full border-none"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">معاينة مباشرة</h1>
          <p className="text-gray-400">اختبر تصميمك على أجهزة مختلفة</p>
        </div>

        {/* Controls */}
        <Card className="bg-white/5 border-white/10 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Device Selector */}
            <div className="flex gap-2">
              {devices.map((device) => (
                <button
                  key={device.id}
                  onClick={() => setSelectedDevice(device)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    selectedDevice.id === device.id
                      ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  {device.icon}
                  {device.name}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-white/10" />

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              <Button
                onClick={handleRefresh}
                disabled={previewState.isLoading}
                className="bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30"
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 ${previewState.isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button
                onClick={() =>
                  setPreviewState((prev) => ({
                    ...prev,
                    autoRefreshEnabled: !prev.autoRefreshEnabled,
                  }))
                }
                className={`border ${
                  previewState.autoRefreshEnabled
                    ? 'bg-green-500/20 border-green-500/50 text-green-400'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
                variant="outline"
              >
                <Zap className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => setSplitScreenMode(!splitScreenMode)}
                className={`border ${
                  splitScreenMode
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                    : 'bg-white/5 border-white/10 text-gray-400'
                }`}
                variant="outline"
              >
                <Code className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                variant="outline"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Status Bar */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
            {previewState.lastRefresh && (
              <>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  آخر تحديث: {previewState.lastRefresh.toLocaleTimeString('ar-SA')}
                </span>
              </>
            )}
            {previewState.autoRefreshEnabled && (
              <span className="flex items-center gap-2 text-green-400">
                <Zap className="w-4 h-4" />
                التحديث التلقائي مفعّل
              </span>
            )}
          </div>
        </Card>

        {/* Preview Area */}
        {!splitScreenMode ? (
          <div className="flex justify-center">
            <PreviewFrame device={selectedDevice} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PreviewFrame device={selectedDevice} />
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h3 className="text-white font-semibold mb-4">معلومات المشروع</h3>
              <div className="space-y-4 text-gray-400 text-sm">
                <div>
                  <p className="text-gray-500">الجهاز</p>
                  <p className="text-white">{selectedDevice.name}</p>
                </div>
                <div>
                  <p className="text-gray-500">الدقة</p>
                  <p className="text-white">
                    {selectedDevice.width} × {selectedDevice.height}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">حالة الاتصال</p>
                  <p className={previewState.isOnline ? 'text-green-400' : 'text-red-400'}>
                    {previewState.isOnline ? 'متصل' : 'غير متصل'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">آخر تحديث</p>
                  <p className="text-white">
                    {previewState.lastRefresh
                      ? previewState.lastRefresh.toLocaleTimeString('ar-SA')
                      : 'لم يتم التحديث'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LivePreview;
