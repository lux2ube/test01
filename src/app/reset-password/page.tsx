'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Lock, Loader2, CheckCircle2, ShieldCheck, AlertTriangle } from 'lucide-react';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const verified = searchParams.get('verified');
  const errorParam = searchParams.get('error');

  useEffect(() => {
    const handlePasswordReset = async () => {
      if (errorParam === 'invalid_link') {
        setIsValidToken(false);
        toast({
          variant: 'destructive',
          title: 'رابط غير صالح',
          description: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.',
        });
        setTimeout(() => router.push('/login'), 3000);
        return;
      }

      if (verified === 'true') {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ Password reset: Server-verified session found');
          setIsValidToken(true);
        } else {
          console.log('❌ Password reset: No session found after server verification');
          setIsValidToken(false);
          toast({
            variant: 'destructive',
            title: 'انتهت صلاحية الجلسة',
            description: 'يرجى طلب رابط إعادة تعيين كلمة المرور مرة أخرى.',
          });
          setTimeout(() => router.push('/login'), 3000);
        }
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const access_token = hashParams.get('access_token');
      const refresh_token = hashParams.get('refresh_token');
      const type = hashParams.get('type');

      if (access_token && type === 'recovery') {
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });

        if (error || !data.session) {
          setIsValidToken(false);
          toast({
            variant: 'destructive',
            title: 'رابط غير صالح',
            description: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.',
          });
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setIsValidToken(true);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          toast({
            variant: 'destructive',
            title: 'رابط غير صالح',
            description: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.',
          });
          setTimeout(() => router.push('/login'), 3000);
        }
      }
    };

    handlePasswordReset();
  }, [router, toast, supabase, verified, errorParam]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({
        variant: 'destructive',
        title: 'كلمة مرور ضعيفة',
        description: 'يجب أن تكون كلمة المرور على الأقل 6 أحرف.',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'كلمات المرور غير متطابقة.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      setIsSuccess(true);
      
      toast({
        title: 'تم بنجاح!',
        description: 'تم تحديث كلمة المرور بنجاح.',
      });

      await supabase.auth.signOut();
      
      setTimeout(() => router.push('/login'), 3000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message || 'فشل تحديث كلمة المرور. حاول مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">جاري التحقق من الرابط...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-2xl">رابط غير صالح</CardTitle>
            <CardDescription>
              رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية. سيتم إعادة توجيهك إلى صفحة تسجيل الدخول...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">تم تغيير كلمة المرور</CardTitle>
            <CardDescription>
              تم تحديث كلمة المرور بنجاح. سيتم إعادة توجيهك لتسجيل الدخول بكلمة المرور الجديدة...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">إعادة تعيين كلمة المرور</CardTitle>
          <CardDescription>
            أدخل كلمة المرور الجديدة لحسابك. يجب أن تكون 6 أحرف على الأقل.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="أدخل كلمة المرور الجديدة"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                يجب أن تكون 6 أحرف على الأقل
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="أكد كلمة المرور الجديدة"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="pl-10"
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  تم التحقق من هويتك بنجاح عبر البريد الإلكتروني. يمكنك الآن تعيين كلمة مرور جديدة.
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || password.length < 6 || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  تحديث كلمة المرور
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
