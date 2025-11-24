"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/PageHeader";
import { updateOrderStatus, getAllOrders } from "./actions";
import type { Order } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { DataTable } from "@/components/data-table/data-table";
import { getColumns } from "./columns";
import { Loader2 } from "lucide-react";


export default function ManageOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const data = await getAllOrders();
            setOrders(data);
        } catch (error) {
            toast({ variant: "destructive", title: "خطأ", description: "تعذر جلب الطلبات." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusUpdate = async (orderId: string, status: Order['status']) => {
        const result = await updateOrderStatus(orderId, status);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            fetchOrders(); // Refetch to show updated status
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
    };
    
    const columns = getColumns(handleStatusUpdate);

    if (isLoading) {
        return <div className="container mx-auto flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="إدارة الطلبات"
                description="عرض وتحديث طلبات متجر المستخدمين."
            />
            <DataTable 
                columns={columns} 
                data={orders}
                searchableColumns={[
                    { id: 'userName', title: 'العميل' },
                    { id: 'productName', title: 'المنتج' },
                ]}
                filterableColumns={[
                    {
                      id: 'status',
                      title: 'الحالة',
                      options: [
                        { value: 'Processing', label: 'قيد المعالجة' },
                        { value: 'Confirmed', label: 'مؤكد' },
                        { value: 'Cancelled', label: 'ملغي' },
                      ],
                    },
                ]}
            />
        </div>
    );
}
