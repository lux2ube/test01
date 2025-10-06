
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

const teamMembers = [
  { name: "أليس جونسون", role: "الرئيس التنفيذي والمؤسس", avatar: "https://placehold.co/100x100.png", hint: "woman portrait" },
  { name: "بوب ويليامز", role: "المدير التقني", avatar: "https://placehold.co/100x100.png", hint: "man portrait" },
  { name: "تشارلي براون", role: "كبير المطورين", avatar: "https://placehold.co/100x100.png", hint: "person portrait" },
];

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      <PageHeader
        title="عن Cashback Companion"
        description="نحن ملتزمون بمساعدة المتداولين على تعظيم أرباحهم دون أي جهد إضافي."
      />
      
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-headline text-primary">مهمتنا</h2>
            <p className="text-muted-foreground">
                مهمتنا بسيطة: إعادة الأموال إلى جيوب متداولي الفوركس. نحن نؤمن بأن كل متداول يستحق الحصول على المزيد من وسيطه. من خلال الاستفادة من شراكاتنا، نوفر طريقة سلسة لكسب استرداد نقدي على الصفقات التي تقوم بها بالفعل، مما يعزز ربحيتك دون تغيير استراتيجيتك.
            </p>
            <p className="text-muted-foreground">
                نحن ملتزمون بالشفافية والموثوقية ودعم العملاء الممتاز. تم بناء منصتنا على أحدث التقنيات لضمان تتبع استرداد النقود الخاص بك بدقة وصرفه على الفور.
            </p>
        </div>
        <div>
            <Image 
                src="https://placehold.co/600x400.png" 
                alt="فريق يعمل في المكتب" 
                width={600} 
                height={400}
                className="rounded-lg shadow-md"
                data-ai-hint="office team"
            />
        </div>
      </div>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-2xl">تعرف على الفريق</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={member.avatar} data-ai-hint={member.hint}/>
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-primary">{member.role}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
