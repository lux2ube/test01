
'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Mail, Lock, KeyRound, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { handleRegisterUser } from '../actions';
import { createClient } from '@/lib/supabase/client';

function PasswordStrength({ password }: { password: string }) {
    const hasMinLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (!password) return null;

    const Requirement = ({ met, text }: { met: boolean; text: string }) => (
        <p className={`flex items-center gap-2 transition-colors ${met ? 'text-green-600' : 'text-muted-foreground'}`}>
            <CheckCircle2 className={`h-4 w-4 transition-transform ${met ? 'scale-100' : 'scale-0'}`} />
            <span className={met ? 'font-semibold' : ''}>{text}</span>
        </p>
    );

    return (
        <div className="text-xs space-y-1 p-2 bg-muted/50 rounded-md">
            <Requirement met={hasMinLength} text="6 أحرف على الأقل" />
            <Requirement met={hasLetter} text="يحتوي على حرف واحد على الأقل" />
            <Requirement met={hasNumber} text="يحتوي على رقم واحد على الأقل" />
        </div>
    );
}


const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M16.75 13.96c.25.58.11 1.25-.37 1.62l-1.43.93c-.23.16-.54.2-.8.09c-.66-.27-1.39-.68-2.09-1.22c-.75-.58-1.38-1.29-1.89-2.07c-.16-.25-.13-.59.08-.81l.93-1.43c.37-.48 1.04-.62 1.62-.37l1.93.83c.58.25.86.9.61 1.48l-.53 1.21zM12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10c.39 0 .78-.04 1.15-.09l3.85 1.19l-1.19-3.85A9.9 9.9 0 0 0 22 12a10 10 0 0 0-10-10z"></path></svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M22 12A10 10 0 0 0 12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10c.39 0 .78-.04 1.15-.09l3.85 1.19l-1.19-3.85A9.9 9.9 0 0 0 22 12m-9.01-1.13l-4.22 1.61c-.5.19-.51.52-.03.7l1.75.54l.54 1.75c.18.48.51.47.7.03l1.61-4.22c.19-.5-.04-.84-.55-.61M14.26 14l-2.61-2.61l.96-.97l3.62 3.63l-.97.95z"></path></svg>
);

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const nextUrl = searchParams.get('next');

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
        setReferralCode(refCode);
    }
  }, [searchParams]);

  const isValidRedirectUrl = (url: string | null): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url, window.location.origin);
      return parsed.origin === window.location.origin && url.startsWith('/');
    } catch {
      return url.startsWith('/') && !url.startsWith('//');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ variant: "destructive", title: "خطأ", description: "يجب أن تتكون كلمة المرور من 6 أحرف على الأقل." });
      return;
    }
    setIsLoading(true);

    const result = await handleRegisterUser({
        name,
        email,
        password,
        referralCode,
    });

    if (result.success) {
        toast({ title: "نجاح!", description: "تم إنشاء الحساب بنجاح. يتم تسجيل الدخول..." });
        try {
            // Use our custom login endpoint
            const loginResponse = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include', // CRITICAL: Allow cookies to be set
                body: JSON.stringify({ email, password }),
            });

            const loginData = await loginResponse.json();

            if (!loginResponse.ok || !loginData.success) {
                throw new Error(loginData.error || 'Login failed');
            }

            await new Promise(resolve => setTimeout(resolve, 200));
            
            let redirectUrl = `/phone-verification?userId=${result.userId}`;
            if (nextUrl && isValidRedirectUrl(nextUrl)) {
              redirectUrl += `&next=${encodeURIComponent(nextUrl)}`;
            }
            window.location.href = redirectUrl;
        } catch (loginError) {
            toast({ variant: 'destructive', title: "فشل تسجيل الدخول التلقائي", description: "يرجى تسجيل الدخول يدويًا." });
            window.location.href = '/login';
        }
    } else {
        toast({ variant: 'destructive', title: "فشل التسجيل", description: result.error });
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-[400px] w-full mx-auto space-y-4">
        <Link href="/" className="flex justify-center items-center gap-2 font-semibold mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
            </div>
        </Link>
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold font-headline">إنشاء حساب جديد</h1>
        <p className="text-sm text-muted-foreground">انضم إلينا وابدأ في الكسب.</p>
      </div>
      <div className="p-6 border bg-card rounded-lg shadow-sm">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">الاسم الكامل</Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="name" type="text" placeholder="أدخل اسمك الكامل" required value={name} onChange={(e) => setName(e.target.value)} className="pr-10"/>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" placeholder="أدخل بريدك الإلكتروني" required value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10"/>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10"/>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="referral-code">كود الإحالة (اختياري)</Label>
            <div className="relative">
              <KeyRound className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="referral-code" type="text" placeholder="أدخل كود الدعوة (إن وجد)" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="pr-10"/>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" /> : "إنشاء حساب"}
          </Button>
        </form>
      </div>
      <div className="text-center text-sm">
        لديك حساب بالفعل؟{' '}
        <Link href={nextUrl ? `/login?next=${encodeURIComponent(nextUrl)}` : "/login"} className="underline text-primary">
          تسجيل الدخول
        </Link>
      </div>
       <div className="pt-4 text-center text-xs text-muted-foreground">
        <p>بحاجة الى مساعدة؟ تواصل معنا</p>
        <div className="flex justify-center gap-4 mt-2">
            <Link href="#" className="hover:text-primary"><WhatsAppIcon /></Link>
            <Link href="#" className="hover:text-primary"><TelegramIcon /></Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Suspense fallback={<div className="h-screen w-screen flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
                <RegisterForm />
            </Suspense>
        </div>
    );
}
