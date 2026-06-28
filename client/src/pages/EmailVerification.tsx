import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle2, Clock } from 'lucide-react';

export default function EmailVerification() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [, navigate] = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      toast.error('يرجى إدخال الكود الكامل');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would call an API endpoint to verify the email
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsVerified(true);
      toast.success('تم التحقق من البريد الإلكتروني بنجاح');
    } catch (error) {
      toast.error('الكود غير صحيح، يرجى المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Dev-Agent
          </h1>
          <p className="text-gray-400">التحقق من البريد الإلكتروني</p>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-xl bg-background/40 border border-white/10 shadow-2xl">
          <div className="p-8">
            {!isVerified ? (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2 text-center">تحقق من بريدك الإلكتروني</h2>
                <p className="text-gray-400 text-sm mb-6 text-center">
                  أدخل الكود المكون من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Code Input */}
                  <div className="flex gap-2 justify-center">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        id={`code-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className="w-12 h-12 text-center text-2xl font-bold bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition"
                        disabled={isLoading}
                      />
                    ))}
                  </div>

                  {/* Timer */}
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>
                      ينتهي الكود في: <span className="text-white font-semibold">{formatTime(timeLeft)}</span>
                    </span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading || code.join('').length !== 6}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      'التحقق'
                    )}
                  </Button>
                </form>

                {/* Resend Code */}
                <div className="text-center mt-6">
                  <p className="text-gray-400 text-sm">
                    لم تستقبل الكود؟{' '}
                    <button
                      onClick={() => toast.success('تم إرسال الكود مرة أخرى')}
                      className="text-purple-400 hover:text-purple-300 font-semibold"
                    >
                      أعد الإرسال
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Success State */}
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-400" />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">تم التحقق بنجاح!</h2>
                    <p className="text-gray-400 text-sm">
                      تم التحقق من بريدك الإلكتروني بنجاح، يمكنك الآن الوصول إلى جميع الميزات
                    </p>
                  </div>

                  <Button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                  >
                    الذهاب إلى لوحة التحكم
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
