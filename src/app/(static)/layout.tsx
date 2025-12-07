import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { siteConfig } from "@/lib/site-config";

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

function Header() {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-5xl mx-auto px-4">
                <div className="flex h-14 items-center justify-between">
                     <Link href="/" className="flex items-center gap-2 font-semibold">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                             <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                        </div>
                        <span className="font-headline text-lg hidden sm:inline-block">{siteConfig.name}</span>
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
    const { social } = siteConfig;
    
    return (
        <footer className="w-full border-t bg-gradient-to-br from-primary/10 via-background to-background text-foreground">
             <div className="max-w-5xl mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center md:text-left">
                  <div className="col-span-2 md:col-span-1">
                      <Link href="/" className="flex items-center justify-center md:justify-start gap-2 font-semibold">
                          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor"></path><path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path><path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                          </div>
                          <span className="font-headline text-lg">{siteConfig.name}</span>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-2">
                        {siteConfig.tagline}
                      </p>
                  </div>
                  <div>
                      <h3 className="font-semibold mb-2 font-headline">روابط سريعة</h3>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                          <li><Link href="/about" className="hover:text-primary">من نحن</Link></li>
                           <li><Link href="/blog" className="hover:text-primary">المدونة</Link></li>
                          <li><Link href="/contact" className="hover:text-primary">اتصل بنا</Link></li>
                          <li><Link href={siteConfig.support.helpCenter} className="hover:text-primary">مركز المساعدة</Link></li>
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
                          <li><Link href={siteConfig.support.privacyPolicy} className="hover:text-primary">سياسة الخصوصية</Link></li>
                          <li><Link href={siteConfig.support.termsOfService} className="hover:text-primary">شروط الخدمة</Link></li>
                      </ul>
                  </div>
                   <div>
                        <h3 className="font-semibold mb-2 font-headline">تابعنا</h3>
                        <div className="flex justify-center md:justify-start gap-3 flex-wrap">
                            {social.facebook && (
                                <Link href={social.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Facebook className="h-5 w-5" />
                                </Link>
                            )}
                            {social.twitter && (
                                <Link href={social.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Twitter className="h-5 w-5" />
                                </Link>
                            )}
                            {social.instagram && (
                                <Link href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Instagram className="h-5 w-5" />
                                </Link>
                            )}
                            {social.whatsapp && (
                                <Link href={social.whatsapp} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <WhatsAppIcon />
                                </Link>
                            )}
                            {social.telegram && (
                                <Link href={social.telegram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <TelegramIcon />
                                </Link>
                            )}
                            {social.youtube && (
                                <Link href={social.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Youtube className="h-5 w-5" />
                                </Link>
                            )}
                            {social.linkedin && (
                                <Link href={social.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                    <Linkedin className="h-5 w-5" />
                                </Link>
                            )}
                        </div>
                   </div>
              </div>
              <div className="text-center text-xs text-muted-foreground pt-8 mt-8 border-t">
                  © {new Date().getFullYear()} {siteConfig.name}. جميع الحقوق محفوظة.
              </div>
          </div>
        </footer>
    );
}


export default function StaticPagesLayout({
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
