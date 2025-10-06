
"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { useToast } from "@/hooks/use-toast";
import { getPendingVerifications, updateVerificationStatus, approveKycWithData } from "./actions";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PendingVerification } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";
import { DocumentViewer } from "@/components/admin/manage-verifications/DocumentViewer";
import { KycReviewForm } from "@/components/admin/manage-verifications/KycReviewForm";

const rejectReasonSchema = z.object({
    reason: z.string().min(10, "سبب الرفض مطلوب."),
});
type RejectReasonForm = z.infer<typeof rejectReasonSchema>;

function RejectDialog({ type, userId, onSuccess, isOpen, onOpenChange }: { type: 'kyc' | 'address' | 'phone', userId: string, onSuccess: () => void; isOpen: boolean; onOpenChange: (open: boolean) => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<RejectReasonForm>({
        resolver: zodResolver(rejectReasonSchema),
        defaultValues: { reason: "" },
    });

    const onSubmit = async (values: RejectReasonForm) => {
        setIsSubmitting(true);
        const result = await updateVerificationStatus(userId, type, 'Rejected', values.reason);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            onSuccess();
            onOpenChange(false);
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    return (
         <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>رفض طلب التحقق</DialogTitle>
                </DialogHeader>
                <Form {...form}><form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="reason"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>سبب الرفض</FormLabel>
                                <FormControl><Textarea placeholder="أدخل سببًا واضحًا للرفض..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="secondary">إلغاء</Button></DialogClose>
                        <Button type="submit" variant="destructive" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            تأكيد الرفض
                        </Button>
                    </DialogFooter>
                </form></Form>
            </DialogContent>
        </Dialog>
    );
}

type DocumentRequest = PendingVerification & { type: 'KYC' | 'Address' };

export default function ManageVerificationsPage() {
    const [requests, setRequests] = useState<PendingVerification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const [dialogState, setDialogState] = useState<{ isOpen: boolean; data: { userId: string, type: 'kyc' | 'address' | 'phone' } | null }>({ isOpen: false, data: null });
    const [documentViewer, setDocumentViewer] = useState<{ isOpen: boolean; request: DocumentRequest | null }>({ isOpen: false, request: null });

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const data = await getPendingVerifications();
            setRequests(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "فشل تحميل طلبات التحقق." });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (userId: string, type: PendingVerification['type']) => {
        const result = await updateVerificationStatus(userId, type.toLowerCase() as 'kyc' | 'address' | 'phone', 'Verified');
        if (result.success) {
            toast({ title: "نجاح", description: `تمت الموافقة على طلب ${type}.` });
            fetchRequests(); // Refresh the list
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };
    
    const handleRejectRequest = (userId: string, type: PendingVerification['type']) => {
        setDialogState({ isOpen: true, data: { userId, type: type.toLowerCase() as 'kyc' | 'address' | 'phone' } });
    }

    const handleViewDocuments = (request: PendingVerification) => {
        if (request.type === 'KYC' || request.type === 'Address') {
            setDocumentViewer({ isOpen: true, request: request as DocumentRequest });
        }
    }

    const handleKycApproveWithData = async (extractedData: any) => {
        if (!documentViewer.request) return;
        const result = await approveKycWithData(documentViewer.request.userId, extractedData);
        if (result.success) {
            toast({ title: 'نجاح', description: result.message });
            setDocumentViewer({ isOpen: false, request: null });
            fetchRequests();
        } else {
            throw new Error(result.message);
        }
    };

    const handleKycReject = async (reason: string) => {
        if (!documentViewer.request) return;
        const result = await updateVerificationStatus(
            documentViewer.request.userId,
            'kyc',
            'Rejected',
            reason
        );
        if (result.success) {
            toast({ title: 'تم', description: result.message });
            setDocumentViewer({ isOpen: false, request: null });
            fetchRequests();
        } else {
            throw new Error(result.message);
        }
    };

    const columns = getColumns(handleApprove, handleRejectRequest, handleViewDocuments);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="طلبات التحقق المعلقة"
                description={`يوجد ${requests.length} طلب ينتظر المراجعة.`}
            />
            
            <DataTable columns={columns} data={requests} />
            
            {dialogState.isOpen && dialogState.data && (
                <RejectDialog 
                    isOpen={dialogState.isOpen}
                    onOpenChange={(open) => !open && setDialogState({ isOpen: false, data: null })}
                    type={dialogState.data.type}
                    userId={dialogState.data.userId}
                    onSuccess={fetchRequests}
                />
            )}

            {documentViewer.isOpen && documentViewer.request && documentViewer.request.type === 'KYC' && 'documentFrontUrl' in documentViewer.request.data && (
                <KycReviewForm
                    isOpen={documentViewer.isOpen}
                    onClose={() => setDocumentViewer({ isOpen: false, request: null })}
                    userId={documentViewer.request.userId}
                    userName={documentViewer.request.userName}
                    userEmail={documentViewer.request.userEmail}
                    documentType={documentViewer.request.data.documentType}
                    nationality={documentViewer.request.data.nationality}
                    frontUrl={documentViewer.request.data.documentFrontUrl}
                    backUrl={documentViewer.request.data.documentBackUrl}
                    selfieUrl={documentViewer.request.data.selfieUrl}
                    submittedAt={documentViewer.request.data.submittedAt}
                    onApprove={handleKycApproveWithData}
                    onReject={handleKycReject}
                />
            )}

            {documentViewer.isOpen && documentViewer.request && documentViewer.request.type === 'Address' && 'documentUrl' in documentViewer.request.data && (
                <DocumentViewer
                    isOpen={documentViewer.isOpen}
                    onClose={() => setDocumentViewer({ isOpen: false, request: null })}
                    type={documentViewer.request.type}
                    data={documentViewer.request.data}
                    userName={documentViewer.request.userName}
                    userEmail={documentViewer.request.userEmail}
                />
            )}
        </div>
    );
}
