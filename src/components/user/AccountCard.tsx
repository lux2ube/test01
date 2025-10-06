
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { TradingAccount } from "@/types"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert"
import { XCircle, ChevronRight, Briefcase } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccountCardProps {
    account: TradingAccount;
}

export function AccountCard({ account }: AccountCardProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
            <Briefcase className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-grow">
          <p className="font-semibold">{account.broker}</p>
          <p className="text-sm text-muted-foreground">{account.accountNumber}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <Badge variant={getStatusVariant(account.status)}>{account.status}</Badge>
           <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
