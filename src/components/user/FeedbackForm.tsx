
"use client";

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import type { FeedbackForm, FeedbackQuestion } from '@/types';
import { useAuthContext } from '@/hooks/useAuthContext';
import { submitFeedbackResponse } from '@/app/actions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function RatingInput({ value, onChange }: { value: number, onChange: (value: number) => void }) {
    return (
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
                <Star
                    key={rating}
                    className={`h-8 w-8 cursor-pointer transition-colors ${value >= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                    onClick={() => onChange(rating)}
                />
            ))}
        </div>
    );
}

export function UserFeedbackForm({ form: activeForm }: { form: FeedbackForm | null }) {
    const { user } = useAuthContext();
    const { toast } = useToast();
    const [isOpen, setIsOpen] = useState(!!activeForm);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formSchema = z.object(
        activeForm?.questions.reduce((acc, q) => {
            acc[q.id] = z.any().refine(val => val !== undefined && val !== null && val !== '', { message: "This field is required." });
            return acc;
        }, {} as Record<string, z.ZodAny>) || {}
    );

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: activeForm?.questions.reduce((acc, q) => {
            acc[q.id] = q.type === 'rating' ? 0 : '';
            return acc;
        }, {} as Record<string, any>) || {},
    });

    if (!activeForm || !user) {
        return null;
    }

    const onSubmit = async (data: Record<string, any>) => {
        setIsSubmitting(true);
        const result = await submitFeedbackResponse(activeForm.id, data);
        if (result.success) {
            toast({ title: "تم الإرسال!", description: result.message });
            setIsOpen(false);
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: result.message });
        }
        setIsSubmitting(false);
    };

    const renderQuestion = (question: FeedbackQuestion) => {
        return (
            <Controller
                key={question.id}
                name={question.id}
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{question.text}</FormLabel>
                        <FormControl>
                            {question.type === 'text' ? (
                                <Textarea {...field} />
                            ) : question.type === 'rating' ? (
                                <RatingInput value={field.value} onChange={field.onChange} />
                            ) : question.type === 'multiple-choice' ? (
                                <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-1">
                                    {question.options?.map(opt => (
                                        <FormItem key={opt} className="flex items-center space-x-3 space-y-0">
                                            <FormControl>
                                                <RadioGroupItem value={opt} />
                                            </FormControl>
                                            <FormLabel className="font-normal">{opt}</FormLabel>
                                        </FormItem>
                                    ))}
                                </RadioGroup>
                            ) : null}
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent>
                <DialogHeader className="text-right">
                    <DialogTitle>{activeForm.title}</DialogTitle>
                    <DialogDescription>{activeForm.description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {activeForm.questions.map(renderQuestion)}
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                إرسال
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

    