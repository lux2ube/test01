import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, User, FileText, Clock } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import Link from "next/link";

const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const TelegramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

export default function ContactPage() {
  const { contact, social, workingHours } = siteConfig;
  
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      <PageHeader
        title="اتصل بنا"
        description="يسعدنا أن نسمع منك. تواصل معنا لأي أسئلة أو ملاحظات."
      />

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-headline">ابقى على تواصل</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><Mail className="w-5 h-5"/></div>
                <div>
                    <h3 className="font-semibold">البريد الإلكتروني</h3>
                    <a href={`mailto:${contact.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {contact.email}
                    </a>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><Phone className="w-5 h-5"/></div>
                <div>
                    <h3 className="font-semibold">الهاتف</h3>
                    <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="text-muted-foreground hover:text-primary transition-colors">
                      {contact.phone}
                    </a>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><MapPin className="w-5 h-5"/></div>
                <div>
                    <h3 className="font-semibold">المكتب</h3>
                    <p className="text-muted-foreground">{contact.address}</p>
                </div>
            </div>
            <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><Clock className="w-5 h-5"/></div>
                <div>
                    <h3 className="font-semibold">ساعات العمل</h3>
                    <p className="text-muted-foreground">{workingHours.days}</p>
                    <p className="text-muted-foreground">{workingHours.hours}</p>
                    <p className="text-xs text-muted-foreground mt-1">{workingHours.timezone}</p>
                </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-3">تواصل معنا مباشرة</h3>
            <div className="flex gap-3">
              {social.whatsapp && (
                <Link 
                  href={social.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <WhatsAppIcon />
                  <span>واتساب</span>
                </Link>
              )}
              {social.telegram && (
                <Link 
                  href={social.telegram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <TelegramIcon />
                  <span>تليجرام</span>
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">أرسل رسالة</CardTitle>
            </CardHeader>
            <CardContent>
                 <form className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first-name">الاسم الأول</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="first-name" placeholder="جون" className="pl-10" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last-name">الاسم الأخير</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="last-name" placeholder="دو" className="pl-10" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" placeholder="john.doe@example.com" className="pl-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">الرسالة</Label>
                         <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Textarea id="message" placeholder="رسالتك..." className="pl-10" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full">إرسال الرسالة</Button>
                 </form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
