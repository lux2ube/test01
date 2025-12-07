import React from 'react';
import { PageHeader } from "@/components/shared/PageHeader";
import FinancialReportsClient from './FinancialReportsClient';

export default function FinancialReportsPage() {
  return (
    <div className="container mx-auto space-y-6">
      <PageHeader 
        title="التقارير المالية" 
        description="عرض تقارير مالية مفصلة مع فلاتر متعددة - اختر نوع السجل والفلاتر ثم اضغط تأكيد الفلتر" 
      />
      <FinancialReportsClient />
    </div>
  );
}
