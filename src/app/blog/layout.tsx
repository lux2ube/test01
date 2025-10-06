
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Instagram } from "lucide-react";

function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex h-14 items-center justify-between">
                     <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                             <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </div>
                        <span className="font-headline text-lg hidden sm:inline-block">رفيق الكاش باك</span>
                    </Link>
                    <nav className="flex items-center gap-4">
                        <Button variant="ghost" asChild><Link href="/about">من نحن</Link></Button>
                        <Button variant="ghost" asChild><Link href="/contact">اتصل بنا</Link></Button>
                        <Button asChild><Link href="/login">تسجيل الدخول</Link></Button>
                    </nav>
                </div>
            </div>
        </header>
    );
}

function Footer() {
    return (
        <footer className="w-full border-t bg-gradient-to-br from-primary/10 via-background to-background text-foreground">
             <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center md:text-left">
                  <div className="col-span-2 md:col-span-1">
                      <Link href="/" className="flex items-center justify-center md:justify-start gap-2 font-semibold">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                          </div>
                          <span className="font-headline text-lg">رفيق الكاش باك</span>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-2">
                        اكسب كاش باك في كل مرة تتداول.
                      </p>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">روابط سريعة</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/about" className="hover:text-primary">من نحن</Link></li>
                           <li><Link href="/blog" className="hover:text-primary">المدونة</Link></li>
                          <li><Link href="/contact" className="hover:text-primary">اتصل بنا</Link></li>
                      </ul>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">الحساب</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
                          <li><Link href="/register" className="hover:text-primary">إنشاء حساب</Link></li>
                          <li><Link href="/dashboard" className="hover:text-primary">لوحة التحكم</Link></li>
                      </ul>
                  </div>
                   <div>
                      <h3 className="font-semibold mb-2 font-headline">قانوني</h3>
                       <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="#" className="hover:text-primary">سياسة الخصوصية</Link></li>
                          <li><Link href="/terms" className="hover:text-primary">شروط الخدمة</Link></li>
                      </ul>
                  </div>
                   <div>
                        <h3 className="font-semibold mb-2 font-headline">تابعنا</h3>
                        <div className="flex justify-center md:justify-start gap-4">
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></Link>
                            <Link href="#" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></Link>
                        </div>
                   </div>
              </div>
              <div className="text-center text-xs text-muted-foreground pt-8 mt-8 border-t">
                  © {new Date().getFullYear()} رفيق الكاش باك. جميع الحقوق محفوظة.
              </div>
          </div>
        </footer>
    );
}


export default function BlogPagesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    )
}
