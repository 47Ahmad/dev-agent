import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [, navigate] = useLocation();

  const validateEmail = () => {
    if (!email) {
      setError('البريد الإلكتروني مطلوب');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('البريد الإلكتروني غير صحيح');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, this would call an API endpoint to send the reset email
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
    } catch (error) {
      toast.error('حدث خطأ أثناء إرسال البريد');
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-gray-400">استعادة كلمة المرور</p>
        </div>

        {/* Card */}
        <Card className="backdrop-blur-xl bg-background/40 border border-white/10 shadow-2xl">
          <div className="p-8">
            {!isSubmitted ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-2 text-right">هل نسيت كلمة المرور؟</h2>
                <p className="text-gray-400 text-sm mb-6 text-right">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور
                </p>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      البريد الإلكتروني
                    </Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        className="pl-4 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        disabled={isLoading}
                      />
                    </div>
                    {error && <p className="text-sm text-red-400 text-right">{error}</p>}
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition duration-200 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        إرسال رابط إعادة التعيين
                        <ArrowRight className="w-4 h-4 mr-2" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Back to Login */}
                <p className="text-center text-gray-400 text-sm mt-6">
                  تذكرت كلمة المرور؟{' '}
                  <a href="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                    العودة إلى تسجيل الدخول
                  </a>
                </p>
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
                    <h2 className="text-2xl font-bold text-white mb-2">تم الإرسال بنجاح!</h2>
                    <p className="text-gray-400 text-sm">
                      تحقق من بريدك الإلكتروني <span className="text-white font-semibold">{email}</span> للحصول على رابط إعادة تعيين كلمة المرور
                    </p>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300 text-right">
                    إذا لم تتلق البريد، تحقق من مجلد البريد العشوائي أو انتظر بضع دقائق
                  </div>

                  <Button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition duration-200"
                  >
                    العودة إلى تسجيل الدخول
                  </Button>

                  <button
                    onClick={() => {
                      setIsSubmitted(false);
                      setEmail('');
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm font-semibold"
                  >
                    جرب بريد إلكتروني آخر
                  </button>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
