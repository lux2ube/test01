
"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { sendAdminNotification, getAdminNotifications } from "../actions";
import { getUsers } from "../users/actions";
import { Loader2, Send, Users, FileText, Search } from "lucide-react";
import type { AdminNotification, UserProfile } from "@/types";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  message: z.string().min(10, "يجب أن تكون الرسالة 10 أحرف على الأقل."),
  target: z.enum(['all', 'specific']),
  userIds: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ManageNotificationsPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [history, setHistory] = useState<AdminNotification[]>([]);
    const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        getAdminNotifications().then(setHistory);
        getUsers().then(setAllUsers);
    }, []);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            message: "",
            target: 'all',
            userIds: [],
        },
    });
    
    const targetType = form.watch('target');

    const searchResults = useMemo(() => {
        if (!searchQuery) return [];
        const lowerCaseQuery = searchQuery.toLowerCase();
        const selectedIds = new Set(selectedUsers.map(u => u.id));
        return allUsers.filter(user => 
            !selectedIds.has(user.id) && (
            user.name.toLowerCase().includes(lowerCaseQuery) ||
            user.email.toLowerCase().includes(lowerCaseQuery) ||
            String(user.clientId).includes(lowerCaseQuery)
        ));
    }, [searchQuery, allUsers, selectedUsers]);

    const handleSelectUser = (user: UserProfile) => {
        setSelectedUsers(prev => [...prev, user]);
        form.setValue('userIds', [...(form.getValues('userIds') || []), user.id]);
        setSearchQuery('');
    };

    const handleDeselectUser = (user: UserProfile) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        form.setValue('userIds', (form.getValues('userIds') || []).filter(id => id !== user.id));
    };

    const onSubmit = async (data: FormData) => {
        if (data.target === 'specific' && (!data.userIds || data.userIds.length === 0)) {
            toast({ variant: "destructive", title: "خطأ", description: "الرجاء اختيار مستخدم واحد على الأقل." });
            return;
        }

        setIsLoading(true);
        const result = await sendAdminNotification(data.message, data.target, data.userIds || []);
        if (result.success) {
            toast({ title: "نجاح", description: result.message });
            form.reset();
            setSelectedUsers([]);
            getAdminNotifications().then(setHistory);
        } else {
            toast({ variant: "destructive", title: "خطأ", description: result.message });
        }
        setIsLoading(false);
    };

    return (
        <div className="container mx-auto space-y-6">
            <PageHeader
                title="إدارة الإشعارات"
                description="إرسال إشعارات لجميع المستخدمين أو لمستخدمين محددين."
            />
            <div className="grid md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>إرسال إشعار جديد</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="message" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>محتوى الإشعار</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <FileText className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                                    <Textarea placeholder="رسالتك هنا..." {...field} className="pr-10" />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <FormField control={form.control} name="target" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>إرسال إلى</FormLabel>
                                            <FormControl>
                                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="all" id="all" /></FormControl><Label htmlFor="all" className="font-normal">كل المستخدمين</Label></FormItem>
                                                    <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="specific" id="specific" /></FormControl><Label htmlFor="specific" className="font-normal">مستخدمون محددون</Label></FormItem>
                                                </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    {targetType === 'specific' && (
                                        <div className="space-y-2">
                                            <Label>المستخدمون المستهدفون</Label>
                                            <div className="relative">
                                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="بحث بالاسم، البريد، أو ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10" />
                                            </div>
                                            {searchQuery && searchResults.length > 0 && (
                                                <div className="max-h-40 overflow-y-auto border rounded-md">
                                                    {searchResults.map(user => (
                                                        <button key={user.id} type="button" onClick={() => handleSelectUser(user)} className="w-full text-right p-2 text-sm hover:bg-muted">
                                                            {user.name} ({user.email})
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                {selectedUsers.map(user => (
                                                    <Badge key={user.id} variant="secondary" className="mr-2">
                                                        {user.name}
                                                        <button type="button" onClick={() => handleDeselectUser(user)} className="mr-1 rounded-full bg-muted-foreground/20 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground h-4 w-4 flex items-center justify-center">×</button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button type="submit" disabled={isLoading} className="w-full">
                                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Send className="mr-2 h-4 w-4" /> إرسال الإشعار
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>سجل الإشعارات</CardTitle>
                        </CardHeader>
                        <CardContent>
                           {history.length > 0 ? (
                                <div className="space-y-4">
                                    {history.map(notif => (
                                        <div key={notif.id} className="p-3 border rounded-md">
                                            <p className="text-sm">{notif.message}</p>
                                            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                                                <span>{format(notif.createdAt, 'PPp')}</span>
                                                <Badge variant="outline" className="capitalize">
                                                    <Users className="h-3 w-3 ml-1" />
                                                    {notif.target === 'all' ? 'كل المستخدمين' : `${notif.userIds.length} مستخدم`}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                           ) : (
                                <p className="text-center text-muted-foreground py-10">لم يتم إرسال أي إشعارات بعد.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
