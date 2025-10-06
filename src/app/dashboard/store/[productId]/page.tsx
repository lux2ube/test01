
"use client";

import { useState, useEffect } from "react";
import { useParams, notFound, useRouter } from 'next/navigation';
import Image from "next/image";
import React from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/types";
import { Loader2, ArrowLeft, ShoppingCart, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PurchaseForm } from "@/components/user/PurchaseForm";

function ProductPageSkeleton() {
    return (
        <div className="w-full animate-pulse">
            <div className="h-[50vh] bg-slate-900/10 flex items-center justify-center">
                 <Skeleton className="h-48 w-48 rounded-lg bg-slate-200" />
            </div>
            <div className="container mx-auto px-4 py-8 space-y-6 max-w-2xl">
                 <Skeleton className="h-6 w-1/4" />
                 <Skeleton className="h-10 w-3/4" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-full" />
                 <Skeleton className="h-4 w-5/6" />
            </div>
        </div>
    )
}

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    
    useEffect(() => {
        const fetchProduct = async () => {
            if (!productId) return;
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();
                
                if (error || !data) {
                    notFound();
                } else {
                    setProduct({
                        id: data.id,
                        name: data.name,
                        description: data.description,
                        price: data.price,
                        imageUrl: data.image_url,
                        categoryId: data.category_id,
                        categoryName: data.category_name,
                        stock: data.stock,
                    } as Product);
                }
            } catch (error) {
                console.error("Error fetching product:", error);
                notFound();
            } finally {
                setIsLoading(false);
            }
        };
        fetchProduct();
    }, [productId]);

    if (isLoading) {
        return <ProductPageSkeleton />;
    }

    if (!product) {
        notFound();
    }

    return (
        <>
            <div className="bg-slate-900 text-white">
                <div className="relative">
                     <div 
                        className="absolute inset-0 bg-cover bg-center opacity-10"
                        style={{ backgroundImage: `url(${product.imageUrl})`}}
                    ></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent"></div>

                    <div className="relative container mx-auto px-4 pt-16 pb-8 text-center">
                         <Button variant="ghost" onClick={() => router.back()} className="absolute top-4 right-4 z-20 bg-black/20 hover:bg-black/40 text-white h-auto p-2 rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                            {product.categoryName}
                        </Badge>
                         <h1 className="text-3xl font-bold font-headline mt-2 text-shadow-lg shadow-black/50">{product.name}</h1>
                    </div>
                </div>

                <div className="bg-background text-foreground rounded-t-3xl pb-28 relative z-10">
                    <div className="container mx-auto p-6 max-w-2xl space-y-6 text-right">
                        
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">السعر باستخدام رصيد الكاش باك</p>
                                    <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
                                </div>
                                 <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                                    <h2 className="text-base font-semibold text-foreground flex items-center justify-end gap-2">الوصف <Info className="h-5 w-5 text-primary"/></h2>
                                    <p>{product.description}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div>
                             <Button 
                                size="lg" 
                                className="w-full h-12 text-base shadow-lg" 
                                disabled={product.stock <= 0}
                                onClick={() => setIsFormOpen(true)}
                            >
                                <ShoppingCart className="ml-2 h-5 w-5" />
                                {product.stock > 0 ? 'شراء الآن' : 'نفدت الكمية'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            {isFormOpen && (
                <PurchaseForm
                    product={product}
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                />
            )}
        </>
    );
}
