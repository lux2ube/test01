'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/hooks/useAuthContext';
import { Loader2, Mail, CheckCircle2, ArrowRight, RefreshCw } from 'lucide-react';
import { sendVerificationEmail } from '../actions';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuthContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  const nextUrl = searchParams.get('next');
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      toast({
        title: 'تم التحقق بنجاح!',
        description: 'تم تأكيد بريدك الإلكتروني بنجاح.',
      });
      const redirectTo = nextUrl || '/dashboard';
      setTimeout(() => router.push(redirectTo), 2000);
    }
  }, [success, nextUrl, router, toast]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?next=/verify-email');
    }
  }, [authLoading, user, router]);

  const handleSendVerification = async () => {
    if (!user?.email) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'لا يوجد بريد إلكتروني مرتبط بحسابك.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendVerificationEmail();
      
      if (result.success) {
        setEmailSent(true);
        setCountdown(60);
        toast({
          title: 'تم الإرسال!',
          description: 'تم إرسال رابط التحقق إلى بريدك الإلكتروني.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: result.error || 'فشل إرسال رابط التحقق.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع. حاول مرة أخرى.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (success === 'true') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">تم التحقق بنجاح!</CardTitle>
            <CardDescription>
              تم تأكيد بريدك الإلكتروني. جاري إعادة التوجيه...
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isEmailVerified = (user as any)?.email_confirmed_at || (user?.profile as any)?.email_verified;

  if (isEmailVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">البريد الإلكتروني مؤكد</CardTitle>
            <CardDescription>
              بريدك الإلكتروني مؤكد بالفعل.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard">
                الذهاب إلى لوحة التحكم
                <ArrowRight className="mr-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">تأكيد البريد الإلكتروني</CardTitle>
          <CardDescription>
            {emailSent 
              ? 'تم إرسال رابط التحقق! تحقق من بريدك الإلكتروني.'
              : 'أرسل رابط تحقق إلى بريدك الإلكتروني لتأكيد حسابك.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-1">سيتم إرسال الرابط إلى:</p>
            <p className="font-medium">{user?.email}</p>
          </div>

          {emailSent && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">تم إرسال الرابط!</p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    تحقق من صندوق الوارد أو مجلد البريد المزعج. الرابط صالح لمدة ساعة واحدة.
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSendVerification}
            disabled={isLoading || countdown > 0}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                جاري الإرسال...
              </>
            ) : countdown > 0 ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                إعادة الإرسال بعد {countdown} ثانية
              </>
            ) : emailSent ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                إعادة إرسال الرابط
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                إرسال رابط التحقق
              </>
            )}
          </Button>

          <div className="text-center">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-primary">
              تخطي الآن
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
