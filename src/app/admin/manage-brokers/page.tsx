"use client";

import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  getBrokers,
  deleteBroker,
  updateBrokerOrder,
  addBrokersBatch,
} from "./actions";
import type { Broker } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  GripVertical,
  Star,
  Upload,
  Download,
} from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

function SortableBrokerRow({ broker, onSuccess }: { broker: Broker, onSuccess: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: broker.id });
  const { toast } = useToast();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 'auto',
    opacity: isDragging ? 0.8 : 1,
  };
  
  const handleDelete = async () => {
      const result = await deleteBroker(broker.id);
      if (result.success) {
        toast({ title: 'نجاح', description: 'تم حذف الوسيط.'})
        onSuccess();
      } else {
        toast({ variant: 'destructive', title: 'خطأ', description: result.message})
      }
  }

  const brokerName = broker.basicInfo?.broker_name || broker.name;
  const riskLevel = broker.regulation?.risk_level;
  const wikifxScore = broker.reputation?.wikifx_score;


  return (
    <TableRow ref={setNodeRef} style={style} {...attributes}>
      <TableCell className="w-10">
        <div {...listeners} className="cursor-grab p-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        {broker.logoUrl ? (
          <Image
            src={broker.logoUrl}
            alt={`${brokerName} logo`}
            width={32}
            height={32}
            className="rounded-md border p-0.5 bg-white"
            data-ai-hint="logo"
          />
        ) : (
          <div className="w-8 h-8 rounded-md border bg-muted flex items-center justify-center text-xs text-muted-foreground">
            N/A
          </div>
        )}
      </TableCell>
      <TableCell className="font-medium">{brokerName}</TableCell>
      <TableCell>
        {riskLevel ? <Badge variant="outline" className="capitalize">{riskLevel}</Badge> : 'N/A'}
      </TableCell>
      <TableCell className="flex items-center gap-1">
          {wikifxScore ?? 'N/A'} <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
      </TableCell>
      <TableCell className="space-x-2 text-left">
        <Button asChild size="icon" variant="outline" className="h-8 w-8">
            <Link href={`/admin/brokers/${broker.id}`}>
                <Edit className="h-4 w-4" />
            </Link>
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="destructive" className="h-8 w-8">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف الوسيط بشكل دائم.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                متابعة
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}

export default function ManageBrokersPage() {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBrokers = async () => {
    try {
      const data = await getBrokers();
      setBrokers(data);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطأ",
        description: "فشل جلب الوسطاء.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []); 

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = brokers.findIndex((b) => b.id === active.id);
      const newIndex = brokers.findIndex((b) => b.id === over!.id);
      const newOrderBrokers = arrayMove(brokers, oldIndex, newIndex);
      setBrokers(newOrderBrokers);

      const orderedIds = newOrderBrokers.map((b) => b.id);
      const result = await updateBrokerOrder(orderedIds);
      if (result.success) {
        toast({ title: "نجاح", description: "تم تحديث ترتيب الوسطاء." });
      } else {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: result.message,
        });
        fetchBrokers();
      }
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(brokers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'brokers_export.json';

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast({ title: "نجاح", description: "تم تصدير الوسطاء." });
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error("File content is not valid text.");
        }
        const importedBrokers = JSON.parse(text);
        
        if (!Array.isArray(importedBrokers)) {
            throw new Error("Invalid format: JSON file should contain an array of brokers.");
        }
        
        const brokersToAdd = importedBrokers.map(b => {
          const { id, order, ...brokerData } = b;
          return brokerData;
        });
        
        setIsLoading(true);
        const result = await addBrokersBatch(brokersToAdd);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchBrokers();
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "فشل في تحليل ملف JSON.";
        toast({ variant: 'destructive', title: 'خطأ في الاستيراد', description: message });
      } finally {
        setIsLoading(false);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  if (isLoading && brokers.length === 0) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <PageHeader
          title="إدارة الوسطاء"
          description="إضافة أو تعديل أو إزالة الوسطاء الشركاء."
        />
        <div className="flex gap-2">
           <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              className="hidden"
              accept=".json"
            />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
            <Upload className="ml-2 h-4 w-4" /> استيراد
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="ml-2 h-4 w-4" /> تصدير
          </Button>
          <Button asChild>
            <Link href="/admin/brokers/new">
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة وسيط
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الوسطاء الحاليون</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>الشعار</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>مستوى المخاطرة</TableHead>
                    <TableHead>تقييم WikiFX</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <SortableContext
                  items={brokers}
                  strategy={verticalListSortingStrategy}
                >
                  <TableBody>
                    {brokers.map((broker) => (
                      <SortableBrokerRow key={broker.id} broker={broker} onSuccess={fetchBrokers} />
                    ))}
                  </TableBody>
                </SortableContext>
              </Table>
            </DndContext>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
