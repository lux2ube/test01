
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, User, FileText } from "lucide-react";

export default function ContactPage() {
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
                    <p className="text-muted-foreground">support@cashback-companion.com</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><Phone className="w-5 h-5"/></div>
                <div>
                    <h3 className="font-semibold">الهاتف</h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-md text-primary"><MapPin className="w-5 h-5"/></div>
                <div>
                    <h3 className="font-semibold">المكتب</h3>
                    <p className="text-muted-foreground">123 شارع الفوركس، جناح 100<br/>مدينة التداول، TC 54321</p>
                </div>
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
