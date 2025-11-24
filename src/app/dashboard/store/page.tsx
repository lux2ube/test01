
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { getProducts, getCategories, getOrders } from '@/app/actions';
import type { Product, ProductCategory, Order } from '@/types';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/hooks/useAuthContext';
import { format } from 'date-fns';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

function ProductCard({ product }: { product: Product }) {
    return (
        <Card className="flex flex-col overflow-hidden group border-2 border-transparent hover:border-primary transition-all duration-300 hover:shadow-lg">
            <Link href={`/dashboard/store/${product.id}`} className="flex flex-col h-full">
                <div className="aspect-square relative w-full overflow-hidden">
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        data-ai-hint="product image"
                    />
                     <div className="absolute top-2 right-2">
                        <Badge variant="default" className="text-sm shadow-lg bg-gradient-to-r from-primary to-accent text-primary-foreground">
                            ${product.price.toFixed(2)}
                        </Badge>
                    </div>
                </div>
                <div className="p-3 flex-grow flex flex-col text-right">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-grow group-hover:text-primary transition-colors">{product.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{product.categoryName}</p>
                </div>
                <CardFooter className="p-3 pt-0">
                     <Button asChild size="sm" className="w-full text-xs h-8">
                        <div>شراء الآن</div>
                    </Button>
                </CardFooter>
            </Link>
        </Card>
    )
}

function StoreSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="aspect-square w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-9 w-full rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    )
}

function MyOrdersList() {
    const { user } = useAuthContext();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const userOrders = await getOrders();
                setOrders(userOrders);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if(user) {
            fetchOrders();
        }
    }, [user]);

    const getStatusVariant = (status: Order['status']) => {
        switch (status) {
            case 'Processing': return 'secondary';
            case 'Confirmed': return 'default';
            case 'Cancelled': return 'destructive';
            default: return 'outline';
        }
    }

    const getStatusText = (status: Order['status']) => {
        switch (status) {
            case 'Processing': return 'قيد المعالجة';
            case 'Confirmed': return 'مؤكد';
            case 'Cancelled': return 'ملغي';
            default: return status;
        }
    };


    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.length > 0 ? (
                orders.map(order => (
                    <Card key={order.id}>
                        <CardHeader className="p-4 text-right">
                            <div className="flex justify-between items-center">
                                <Badge variant={getStatusVariant(order.status)}>{getStatusText(order.status)}</Badge>
                                <CardTitle className="text-sm">طلب رقم: ...{order.id.slice(0, 8)}</CardTitle>
                            </div>
                            <CardDescription className="text-xs">
                                {format(order.createdAt, 'PPp')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <div className="flex items-center gap-4 text-right">
                                <p className="font-semibold text-base mr-auto">${order.price.toFixed(2)}</p>
                                <div className="flex-grow">
                                    <p className="font-semibold text-sm">{order.productName}</p>
                                    <p className="text-xs text-muted-foreground">الكمية: 1</p>
                                </div>
                                <Image 
                                    src={order.productImage} 
                                    alt={order.productName} 
                                    width={48} 
                                    height={48}
                                    className="rounded-md border aspect-square object-contain bg-white"
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))
            ) : (
                <Card>
                    <CardContent className="p-10 text-center">
                        <p className="text-muted-foreground text-sm">لم تقم بأي طلبات بعد.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function StorePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [productsData, categoriesData] = await Promise.all([
                    getProducts(),
                    getCategories()
                ]);
                setProducts(productsData.filter(p => p.stock > 0)); // Only show items in stock
                setCategories(categoriesData);
            } catch (error) {
                console.error("Failed to fetch store data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const productsByCategory = useMemo(() => {
        return categories.map(category => ({
            ...category,
            products: products.filter(p => p.categoryId === category.id)
        })).filter(category => category.products.length > 0); // Only show categories with products
    }, [products, categories]);

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-6">
                <StoreSkeleton />
            </div>
        )
    }

    const renderGrid = (items: Product[]) => (
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" dir="rtl">
             {items.length > 0 ? (
                items.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))
             ) : (
                <p className="col-span-full text-center text-muted-foreground py-10">لا توجد منتجات في هذه الفئة بعد.</p>
             )}
        </div>
    );

    return (
        <div className="bg-muted/30 flex-1">
            <div className="container mx-auto px-4 py-6 space-y-6">
                 <Tabs defaultValue="store" className="w-full">
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-right">
                           <PageHeader title="المتجر" description="استثمر مكافئاتك في تطوير مهاراتك" />
                        </div>
                        <TabsList>
                            <TabsTrigger value="store">المتجر</TabsTrigger>
                            <TabsTrigger value="orders">طلباتي</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <TabsContent value="store" className="space-y-6">
                         <Tabs defaultValue="all" className="w-full">
                            <div className="w-full flex justify-end">
                                <ScrollArea className="w-auto max-w-full whitespace-nowrap rounded-md pb-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <TabsList className="p-1 h-auto">
                                            {categories.map(cat => (
                                                <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                                            ))}
                                            <TabsTrigger value="all">كل المنتجات</TabsTrigger>
                                        </TabsList>
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                            <TabsContent value="all" className="mt-2">
                                {renderGrid(products)}
                            </TabsContent>
                            {productsByCategory.map(category => (
                                <TabsContent key={category.id} value={category.id} className="mt-2">
                                {renderGrid(category.products)}
                                </TabsContent>
                            ))}
                        </Tabs>
                    </TabsContent>
                     <TabsContent value="orders">
                        <MyOrdersList />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
