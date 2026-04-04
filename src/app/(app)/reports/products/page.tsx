
"use client";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Progress } from "@/components/ui/progress";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order, OrderItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/datepicker";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { subDays } from "date-fns";

function ProductsReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
      <Card>
        <CardHeader><Skeleton className="h-6 w-72" /></CardHeader>
        <CardContent className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </CardContent>
      </Card>
    </div>
  )
}

export default function ProductsReportPage() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  
  // Default to last 7 days
  const [fromDate, setFromDate] = React.useState<Date | undefined>(
    subDays(new Date(), 7)
  );
  const [toDate, setToDate] = React.useState<Date | undefined>(
    new Date()
  );

  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const productsSummary = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = toDate.getTime();
    
    const productMap = new Map<string, { name: string; count: number; totalWeight: number }>();
    
    const filtered = allOrders.filter(order => {
        if (!order.createdAt || order.status === 'ملغي') return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });

    filtered.forEach(order => {
        const items: OrderItem[] = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
        if (items.length === 0) return;

        items.forEach((item) => {
            if (!item.productName) return;
            const existing = productMap.get(item.productName) || { name: item.productName, count: 0, totalWeight: 0 };
            existing.count += (Number(item.quantity) || 0);
            existing.totalWeight += (Number(item.weight) || 0) * (Number(item.quantity) || 0);
            productMap.set(item.productName, existing);
        });
    });
    
    return Array.from(productMap.values());
  }, [allOrders, fromDate, toDate]);

  const productsSortedByQty = React.useMemo(() => {
    const sales = [...productsSummary].sort((a, b) => b.count - a.count);
    const totalSoldCount = sales.reduce((acc, item) => acc + item.count, 0);
    return sales.map(item => ({
        ...item, 
        percentage: totalSoldCount > 0 ? (item.count / totalSoldCount) * 100 : 0 
    }));
  }, [productsSummary]);

  const topQtyChartData = React.useMemo(() => {
      return productsSortedByQty.slice(0, 10).map(p => ({ 
          name: p.name, 
          value: p.count 
      }));
  }, [productsSortedByQty]);
  
  const topWeightChartData = React.useMemo(() => {
    return [...productsSummary]
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .slice(0, 10)
        .map(p => ({ 
            name: p.name, 
            value: Number(p.totalWeight.toFixed(2)) 
        }));
  }, [productsSummary]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 md:p-0">
        <PageHeader title={language === 'ar' ? 'تقرير المنتجات' : 'Products Report'} />
        <ProductsReportSkeleton />
      </div>
    )
  }

  const fromDateString = fromDate ? fromDate.toISOString() : '';
  const toDateString = toDate ? toDate.toISOString() : '';

  return (
    <div className="space-y-8 p-4 md:p-0">
      <PageHeader title={language === 'ar' ? 'تقرير المنتجات' : 'Products Report'} />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        </div>
        <div className="flex-1 w-full">
          <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'المنتجات الأكثر مبيعاً (حسب الكمية)' : 'Top Products (by Qty)'}</CardTitle>
            </CardHeader>
            <CardContent>
                <StaffPerformanceChart 
                    data={topQtyChartData} 
                    barLabel={language === 'ar' ? 'الكمية' : 'Quantity'}
                    layout="horizontal"
                />
            </CardContent>
        </Card>
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'المنتجات الأكثر مبيعاً (حسب الوزن)' : 'Top Products (by Weight)'}</CardTitle>
            </CardHeader>
            <CardContent>
                <StaffPerformanceChart 
                    data={topWeightChartData} 
                    barLabel={language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}
                    formatter={(val) => `${val} kg`}
                    layout="horizontal"
                />
            </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'تقرير مبيعات جميع المنتجات' : 'All Products Sales'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'انقر على اسم المنتج لعرض التفاصيل.' : 'Click on product name for details.'}</CardDescription>
          </CardHeader>
          <CardContent>
          {isMobile ? (
              <div className="space-y-4">
                {productsSortedByQty.map((product) => {
                  const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                  return (
                      <Link href={href} key={product.name} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-primary break-words flex-1 text-start">{product.name}</p>
                              <div className="text-end shrink-0 ms-4">
                                  <p className="font-bold">{product.count}</p>
                                  <p className="text-xs text-muted-foreground">{product.totalWeight.toFixed(2)} kg</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <Progress value={product.percentage} className="h-1.5" />
                              <span className="text-[10px] text-muted-foreground">{product.percentage.toFixed(1)}%</span>
                          </div>
                      </Link>
                  )
                })}
              </div>
          ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="text-start">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'الوزن الإجمالي' : 'Total Weight'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'النسبة' : '%'}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {productsSortedByQty.map((product) => {
                        const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                        return (
                            <TableRow key={product.name}>
                                <TableCell className="font-medium max-w-[300px] text-start">
                                    <Link href={href} className="hover:underline text-primary break-words">
                                        {product.name}
                                    </Link>
                                </TableCell>
                                <TableCell className="text-end font-bold">{product.count}</TableCell>
                                <TableCell className="text-end">{product.totalWeight.toFixed(2)} kg</TableCell>
                                <TableCell className="text-end">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-[10px] text-muted-foreground w-10">{product.percentage.toFixed(1)}%</span>
                                        <Progress value={product.percentage} className="h-1.5 w-20" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                    </TableBody>
                </Table>
              </div>
          )}
          {productsSortedByQty.length === 0 && !isLoading && (
              <div className="py-20 text-center text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات مبيعات في الفترة المختارة.' : 'No sales data for the selected range.'}
              </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
