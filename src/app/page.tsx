
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle, HandCoins, LinkIcon as LucideLinkIcon, LogIn, Percent, Quote, ShieldCheck, TrendingUp, Zap, Building, Users, Globe } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { AnimatedCard } from "@/components/shared/AnimatedCard";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { siteConfig } from "@/lib/site-config";

const StatBubble = ({ icon: Icon, to, prefix, postfix, title, delay, className }: { icon: React.ElementType, to: number, prefix?: string, postfix?: string, title: string, delay: number, className?: string }) => {
    return (
        <AnimatedCard delay={delay} className="relative">
            <div className={`w-36 h-36 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center text-center p-4 shadow-lg transition-all duration-300 hover:scale-105 ${className}`}>
                <div className="p-3 bg-white/20 rounded-full mb-2">
                    <Icon className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <h3 className="font-bold font-headline text-white text-2xl md:text-3xl">
                    <AnimatedCounter to={to} prefix={prefix} postfix={postfix} />
                </h3>
                <p className="text-xs md:text-sm text-white/80">{title}</p>
            </div>
        </AnimatedCard>
    )
};

export default function Home() {
  const howItWorksSteps = [
    { title: "سجل مجاناً", description: "أنشئ حسابك في ثوانٍ.", icon: LogIn },
    { title: "اربط حساب التداول الخاص بك", description: "صل حسابك من وسطائنا الشركاء.", icon: LucideLinkIcon },
    { title: "تداول واكسب الكاش باك", description: "نتتبع صفقاتك ونضيف الرصيد إلى حسابك.", icon: HandCoins },
  ];

  const keyBenefits = [
    {
      icon: TrendingUp,
      title: "ربح أعلى لكل صفقة",
      description: "ارباح الكاشباك تقلل من تكاليف التداول الفعلية الخاصة بك.",
    },
    {
      icon: Zap,
      title: "دفعات سريعة وشفافة",
      description: "اسحب إلى البنك أو المحفظة الإلكترونية أو العملات المشفرة كل أسبوع.",
    },
    {
      icon: ShieldCheck,
      title: "وسطاء من الدرجة الأولى فقط",
      description: "اعمل مع وسطاء منظمين لتحقيق أقصى قدر من الأمان.",
    },
    {
      icon: Percent,
      title: "لا يوجد سبريد أو عمولة إضافية",
      description: "شروط التداول الخاصة بك تبقى كما هي تمامًا.",
    },
  ];
  
  const testimonials = [
    {
      quote: "يضيف رفيق الكاش باك 300-400 دولار إلى أرباحي الشهرية - بدون أي مجهود إضافي.",
      author: "خالد م."
    },
    {
      quote: "كنت متشككًا في البداية، لكن الدفعات سريعة وموثوقة. موصى به للغاية!",
      author: "سارة ع."
    },
    {
      quote: "منصة سهلة الاستخدام وفريق دعم متعاون. لقد تغيرت قواعد اللعبة بالنسبة لتداولي.",
      author: "محمد ف."
    },
    {
      quote: "الحصول على أموال إضافية مقابل ما أفعله بالفعل أمر لا يحتاج إلى تفكير. أتمنى لو كنت قد وجدته في وقت أقرب.",
      author: "فاطمة أ."
    },
    {
      quote: "أفضل برنامج ولاء للمتداولين في المنطقة. لا يمكن مقارنة أي شيء آخر به.",
      author: "يوسف ن."
    }
  ];

  const faqs = [
    { question: "كيف يمكنني ربط حسابي؟", answer: "اذهب إلى صفحة 'الوسطاء'، اختر وسيطك، واتبع التعليمات البسيطة التي تظهر على الشاشة." },
    { question: "هل الكاش باك مضمون؟", answer: "نعم! طالما أن حسابك مرتبط بشكل صحيح تحت هوية شريكنا، فإن الكاش باك مضمون." },
    { question: "متى أحصل على أموالي؟", answer: "يتم إضافة الكاش باك إلى لوحة التحكم الخاصة بك يوميًا أو أسبوعيًا. يمكنك طلب سحب في أي وقت." },
    { question: "هل يمكنني ربط حساب حالي؟", answer: "في كثير من الحالات، نعم. بعض الوسطاء يتطلبون حسابًا جديدًا. يوفر تطبيقنا تعليمات لكل وسيط." }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
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
      
      <main className="flex-grow">
        <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
            <div className="max-w-5xl mx-auto px-4 grid md:grid-cols-1 gap-8 items-center">
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-6xl font-extrabold font-headline text-primary">
                        اربح كاش باك في كل مرة تتداول فيها
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
                        بدون مخاطر، بدون رسوم، فقط كاش باك صافي. نحن ندفع لك مقابل الصفقات التي تقوم بها.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <Button asChild size="lg">
                            <Link href="/register">ابدأ مجاناً</Link>
                        </Button>
                        <Button asChild variant="secondary" size="lg">
                            <Link href="/dashboard/brokers">عرض الوسطاء</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>

        <section className="py-12 bg-background">
             <div className="max-w-5xl mx-auto px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 place-items-center">
                    <StatBubble icon={HandCoins} to={1000000} prefix="$" title="ارباح مصروفة" delay={0.1} className="bg-primary" />
                    <StatBubble icon={Users} to={10000} postfix="+" title="عملائنا" delay={0.2} className="bg-accent" />
                    <StatBubble icon={Building} to={50} postfix="+" title="بروكر موثوق" delay={0.3} className="bg-secondary-foreground" />
                    <StatBubble icon={Globe} to={30} postfix="+" title="دولة" delay={0.4} className="bg-accent/70" />
                </div>
            </div>
        </section>
        
         <section id="how-it-works" className="py-16 md:py-24 bg-muted/50">
           <div className="max-w-5xl mx-auto px-4">
                <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold font-headline">كيف يعمل</h2>
                  <p className="text-muted-foreground mt-2">عملية بسيطة من ثلاث خطوات لزيادة أرباحك.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                    {howItWorksSteps.map((step, index) => (
                      <AnimatedCard key={index} delay={index * 0.1}>
                        <Card className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-white/30 dark:border-black/30 h-full rounded-xl shadow-lg">
                            <CardHeader className="items-center">
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                                    <step.icon className="w-6 h-6"/>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <h3 className="font-semibold text-lg">{step.title}</h3>
                                <p className="text-muted-foreground">{step.description}</p>
                            </CardContent>
                        </Card>
                      </AnimatedCard>
                    ))}
                </div>
            </div>
        </section>

        <section id="key-benefits" className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/50 dark:via-emerald-900/50 dark:to-teal-900/50">
            <div className="absolute inset-0 backdrop-blur-sm"></div>
            <div className="max-w-5xl mx-auto px-4 relative">
                <div className="text-center mb-12">
                <h2 className="text-3xl font-bold font-headline">الفوائد الرئيسية</h2>
                <p className="text-muted-foreground mt-2">عرض القيمة لدينا</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {keyBenefits.map((benefit, index) => (
                    <AnimatedCard key={index} delay={index * 0.1}>
                      <Card className="text-center p-4 bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-white/30 dark:border-black/30 h-full rounded-xl shadow-lg">
                          <CardHeader className="items-center p-2">
                              <div className="p-3 bg-primary/10 rounded-full text-primary">
                                  <benefit.icon className="w-6 h-6" />
                              </div>
                          </CardHeader>
                          <CardContent className="space-y-1 p-2">
                              <h3 className="font-semibold">{benefit.title}</h3>
                              <p className="text-sm text-muted-foreground">{benefit.description}</p>
                          </CardContent>
                      </Card>
                    </AnimatedCard>
                ))}
                </div>
            </div>
        </section>
        
        <section id="social-proof" className="py-16 md:py-24 bg-muted/50">
            <div className="max-w-5xl mx-auto px-4 space-y-12">
                 <div className="text-center">
                    <h2 className="text-3xl font-bold font-headline">موثوق به من قبل الآلاف</h2>
                    <p className="text-muted-foreground mt-2">انظر ماذا يقول المتداولون عنا.</p>
                </div>
                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full"
                >
                    <CarouselContent>
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                                <div className="p-1">
                                    <AnimatedCard className="h-full">
                                      <Card className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-white/30 dark:border-black/30 h-full rounded-xl shadow-lg">
                                          <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                                              <Quote className="mx-auto h-8 w-8 text-primary/50 mb-4" />
                                              <blockquote className="italic text-lg flex-grow">
                                                  "{testimonial.quote}"
                                              </blockquote>
                                              <footer className="mt-4 font-semibold">- {testimonial.author}</footer>
                                          </CardContent>
                                      </Card>
                                    </AnimatedCard>
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="hidden md:flex" />
                    <CarouselNext className="hidden md:flex" />
                </Carousel>
            </div>
        </section>

        <section id="faq" className="py-16 md:py-24">
            <div className="max-w-3xl mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline">الأسئلة الشائعة</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-right font-semibold">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                    </AccordionContent>
                    </AccordionItem>
                ))}
                </Accordion>
            </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}
