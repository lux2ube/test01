"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Star } from "lucide-react"
import type { FeedbackQuestion, EnrichedFeedbackResponse } from "@/types"

export function RatingDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`}
                />
            ))}
        </div>
    );
}


export const getColumns = (questions: FeedbackQuestion[]): ColumnDef<EnrichedFeedbackResponse>[] => {
    const dynamicColumns: ColumnDef<EnrichedFeedbackResponse>[] = questions.map(q => ({
        accessorKey: `answers.${q.id}`,
        header: q.text,
        cell: ({ row }) => {
            const answer = row.original.answers[q.id];
            if (q.type === 'rating') {
                return <RatingDisplay rating={answer} />;
            }
            return <p className="text-sm text-muted-foreground max-w-xs truncate">{answer}</p>;
        },
    }));

    return [
        {
            accessorKey: "userName",
            header: "المستخدم",
            cell: info => <div className="font-medium">{info.getValue<string>()}</div>
        },
        {
            accessorKey: "submittedAt",
            header: "تاريخ الإرسال",
            cell: info => format(info.getValue<Date>(), 'PPp')
        },
        ...dynamicColumns,
    ];
};
