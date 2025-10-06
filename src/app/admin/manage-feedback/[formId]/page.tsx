
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Star, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getFeedbackFormById, getFeedbackResponses } from "../actions";
import type { FeedbackForm, EnrichedFeedbackResponse } from "@/types";
import { format } from "date-fns";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";

export default function FeedbackResponsesPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const formId = params.formId as string;

    const [form, setForm] = useState<FeedbackForm | null>(null);
    const [responses, setResponses] = useState<EnrichedFeedbackResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!formId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [formData, responsesData] = await Promise.all([
                    getFeedbackFormById(formId),
                    getFeedbackResponses(formId),
                ]);

                if (!formData) {
                    toast({ variant: 'destructive', title: "خطأ", description: "لم يتم العثور على نموذج الملاحظات." });
                    return notFound();
                }

                setForm(formData);
                setResponses(responsesData);
            } catch (error) {
                console.error("Error fetching feedback data:", error);
                toast({ variant: 'destructive', title: "خطأ", description: "فشل تحميل بيانات الملاحظات." });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [formId, toast]);
    
    const columns = form ? getColumns(form.questions) : [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    if (!form) {
        return notFound();
    }

    return (
        <div className="container mx-auto space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="h-auto p-0 text-sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                العودة إلى النماذج
            </Button>
            <PageHeader
                title={`استجابات لـ: ${form.title}`}
                description={form.description}
            />

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الاستجابات</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{form.responseCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">الحالة</CardTitle>
                         <span className={`px-2 py-1 rounded-full text-xs ${form.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{form.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                    </CardHeader>
                     <CardContent>
                        <div className="text-2xl font-bold capitalize">{form.status}</div>
                    </CardContent>
                </Card>
            </div>
            
            <DataTable columns={columns} data={responses} />
        </div>
    );
}
