
"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Mail, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { handleForgotPassword } from '../actions';
import { logLoginActivity } from './actions';


const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path><path fill="none" d="M0 0h48v48H0z"></path></svg>
);

const AppleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M15.22,6.15a3.33,3.33,0,0,0-2.3,1.07,3.61,3.61,0,0,0-1.12,2.44,4.24,4.24,0,0,0,.7,2.47,4.3,4.3,0,0,0,1.88,1.52,3.34,3.34,0,0,0,2.62,.19c.14-.06.28-.11.41-.18a3.34,3.34,0,0,0,1.21-1.25,4.06,4.06,0,0,0,.4-1.95,3.4,3.4,0,0,0-2.14-3.35,5.82,5.82,0,0,0-1.66-.22Zm.46,6.38a2.59,2.59,0,0,1-1.67.6,2.37,2.37,0,0,1-1.66-1.14,2.77,2.77,0,0,1-.53-1.6,2.53,2.53,0,0,1,.87-2,2.34,2.34,0,0,1,1.54-.64c.2,0,.39,0,.58,0a2.66,2.66,0,0,1,2.10,1.23,2.94,2.94,0,0,1,.26,1.49A2.46,2.46,0,0,1,15.68,12.53ZM12,24A12,12,0,1,0,0,12,12,12,0,0,0,12,24Zm-1.5-18.73a4.2,4.2,0,0,1,3.29-1.84,4,4,0,0,1,1.69.34,4.22,4.22,0,0,0-1.39-1.07,4.52,4.52,0,0,0-2.82-.49,4.45,4.45,0,0,0-3.4,2.1,4.42,4.42,0,0,0-1.35,3.22,4.2,4.2,0,0,0,1.35,3.25,4.51,4.51,0,0,0,5.83.21,4.18,4.18,0,0,0,1.4-1.17,4.23,4.23,0,0,1-3.32,1.86,4.07,4.07,0,0,1-1.7-.35,4.45,4.45,0,0,1-2.43-3A4.52,4.52,0,0,1,10.5,5.27Z"/></svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLoginSuccess = async (userId: string) => {
    // Log login activity
    await logLoginActivity(userId);

    // Fetch user profile to check role
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Show success message
    toast({
      title: "Success",
      description: "Logged in successfully. Redirecting...",
    });

    // Use window.location.href for full page redirect (ensures session is picked up)
    if (profile?.role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('Authentication failed');
      }

      // Log activity
      await logLoginActivity(data.user.id);

      // Get user role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      const redirectUrl = profile?.role === 'admin' ? '/admin/dashboard' : '/dashboard';

      toast({
        title: "Success",
        description: "Logged in successfully. Redirecting...",
      });

      // Wait for cookies to be set, then redirect
      await new Promise(resolve => setTimeout(resolve, 100));
      window.location.href = redirectUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Incorrect email or password.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setIsSocialLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "An error occurred during sign-in.",
      });
      setIsSocialLoading(false);
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
        toast({ variant: "destructive", title: "Error", description: "Please enter your email address." });
        return;
    }
    setIsResettingPassword(true);
    const result = await handleForgotPassword(resetEmail);
    if (result.success) {
        toast({
            title: "Check your email",
            description: "A password reset link has been sent to your email address.",
        });
        setIsResetDialogOpen(false);
    } else {
        toast({
            variant: "destructive",
            title: "Error",
            description: result.error,
        });
    }
    setIsResettingPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-[400px] w-full mx-auto space-y-4">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold font-headline">تسجيل الدخول</h1>
            <p className="text-muted-foreground">الوصول إلى حسابك.</p>
        </div>
        <Card>
            <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={() => handleSocialLogin('google')} disabled={isSocialLoading || isLoading}>
                        {isSocialLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon /> Google</>}
                    </Button>
                    <Button variant="outline" onClick={() => handleSocialLogin('apple')} disabled={isSocialLoading || isLoading}>
                       {isSocialLoading ? <Loader2 className="animate-spin" /> : <><AppleIcon /> Apple</>}
                    </Button>
                </div>

                <div className="my-4 flex items-center">
                    <div className="flex-grow border-t border-muted"></div>
                    <span className="mx-4 text-xs uppercase text-muted-foreground">أو</span>
                    <div className="flex-grow border-t border-muted"></div>
                </div>

                <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="email" 
                                type="email" 
                                placeholder="m@example.com" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading || isSocialLoading}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="password">كلمة المرور</Label>
                             <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" variant="link" className="p-0 h-auto text-xs text-primary">
                                        نسيت كلمة المرور؟
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>إعادة تعيين كلمة المرور</DialogTitle>
                                        <DialogDescription>
                                            أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور الخاصة بك.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handlePasswordReset}>
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input id="reset-email" type="email" placeholder="m@example.com" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="pl-10" />
                                            </div>
                                        </div>
                                        <DialogFooter className="mt-4">
                                            <Button type="submit" disabled={isResettingPassword}>
                                                {isResettingPassword ? <Loader2 className="animate-spin" /> : "إرسال رابط إعادة التعيين"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                         <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                id="password" 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading || isSocialLoading}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading || isSocialLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "تسجيل الدخول بالبريد الإلكتروني"}
                    </Button>
                </form>
            </CardContent>
        </Card>
        <div className="text-center text-sm">
            ليس لديك حساب؟{' '}
            <Link href="/register" className="underline text-primary">
                إنشاء حساب
            </Link>
        </div>
      </div>
    </div>
  );
}
