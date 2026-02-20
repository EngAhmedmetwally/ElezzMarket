"use client";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Progress } from "@/components/ui/progress";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";
import type { Order } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/datepicker";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";


function ProductsReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[350px] w-full" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


export default function ProductsReportPage() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const [fromDate, setFromDate] = React.useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [toDate, setToDate] = React.useState<Date | undefined>(new Date());

  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  const filteredOrders = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    const from = fromDate.getTime();
    const to = new Date(toDate).setHours(23, 59, 59, 999);
    return allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });
  }, [allOrders, fromDate, toDate]);

  const productsSummary = React.useMemo(() => {
    const productMap = new Map<string, { name: string; count: number; totalWeight: number }>();
    
    filteredOrders.forEach(order => {
        if (order.status === 'ملغي') return;
        const items = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
        items.forEach(item => {
            if (!item.productName) return;
            const existing = productMap.get(item.productName) || { name: item.productName, count: 0, totalWeight: 0 };
            existing.count += item.quantity;
            existing.totalWeight += (item.weight || 0) * item.quantity;
            productMap.set(item.productName, existing);
        });
    });
    return Array.from(productMap.values());
  }, [filteredOrders]);

  const productsSalesByQuantity = React.useMemo(() => {
    const sales = [...productsSummary]
        .filter(p => p.count > 0)
        .sort((a, b) => b.count - a.count);
    
    const totalSoldCount = sales.reduce((acc, item) => acc + item.count, 0);

    return sales.map(item => ({
        ...item, 
        percentage: totalSoldCount > 0 ? (item.count / totalSoldCount) * 100 : 0 
    }));
  }, [productsSummary]);

  const topProductsByQuantityChartData = productsSalesByQuantity.slice(0, 10).map(p => ({ name: p.name, value: p.count })).reverse();
  
  const topProductsByWeightChartData = React.useMemo(() => {
    return [...productsSummary]
        .filter(p => p.totalWeight > 0)
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .slice(0, 10)
        .map(p => ({ name: p.name, value: p.totalWeight }))
        .reverse();
  }, [productsSummary]);

  const fromDateString = fromDate ? fromDate.toISOString() : '';
  const toDateString = toDate ? toDate.toISOString() : '';

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader title={language === 'ar' ? 'تقرير المنتجات' : 'Products Report'} />
        <ProductsReportSkeleton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير المنتجات' : 'Products Report'} />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <DatePicker date={fromDate} onDateChange={setFromDate} placeholder={language === 'ar' ? 'من تاريخ' : 'From date'} />
        <DatePicker date={toDate} onDateChange={setToDate} placeholder={language === 'ar' ? 'إلى تاريخ' : 'To date'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'المنتجات الأكثر مبيعًا (حسب الكمية)' : 'Top Selling Products (by Quantity)'}</CardTitle>
            </CardHeader>
            <CardContent>
                <StaffPerformanceChart 
                    data={topProductsByQuantityChartData} 
                    barDataKey="products_by_quantity"
                    barLabel={language === 'ar' ? 'الكمية المباعة' : 'Quantity Sold'}
                    layout="horizontal"
                />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'المنتجات الأكثر مبيعًا (حسب الوزن)' : 'Top Selling Products (by Weight)'}</CardTitle>
            </CardHeader>
            <CardContent>
                <StaffPerformanceChart 
                    data={topProductsByWeightChartData} 
                    barDataKey="products_by_weight"
                    barLabel={language === 'ar' ? 'الوزن المباع (كجم)' : 'Weight Sold (kg)'}
                    formatter={(value) => `${value.toFixed(2)} kg`}
                    layout="horizontal"
                />
            </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>{language === 'ar' ? 'تقرير مبيعات جميع المنتجات' : 'All Products Sales Report'}</CardTitle>
              <CardDescription>{language === 'ar' ? 'انقر على اسم المنتج لعرض تفاصيل الطلبات.' : 'Click on a product name to view order details.'}</CardDescription>
          </CardHeader>
          <CardContent>
          {isMobile ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {productsSalesByQuantity.map((product) => {
                      const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                      return (
                          <Link href={href} key={product.name} className="block p-4 hover:bg-muted/50" passHref>
                              <div className="flex justify-between items-center gap-4 mb-1">
                                  <p className="font-medium break-all">{product.name}</p>
                                  <div className="text-right shrink-0">
                                      <p className="font-bold">{product.count} <span className="text-xs font-normal text-muted-foreground">{language === 'ar' ? 'وحدة' : 'units'}</span></p>
                                      <p className="text-sm text-muted-foreground">{product.totalWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                  <Progress value={product.percentage} className="h-2" />
                                  <span className="text-xs text-muted-foreground">{product.percentage.toFixed(1)}%</span>
                              </div>
                          </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
          ) : (
              <Table>
                  <TableHeader>
                  <TableRow>
                      <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'الكمية المباعة' : 'Quantity Sold'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'الوزن الإجمالي (كجم)' : 'Total Weight (kg)'}</TableHead>
                      <TableHead className="text-end">{language === 'ar' ? 'نسبة المبيعات' : 'Sales Percentage'}</TableHead>
                  </TableRow>
                  </TableHeader>
                  <TableBody>
                  {productsSalesByQuantity.map((product) => {
                      const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                      return (
                          <TableRow key={product.name}>
                              <TableCell className="font-medium max-w-xs break-words">
                                  <Link href={href} className="hover:underline text-primary">
                                      {product.name}
                                  </Link>
                              </TableCell>
                              <TableCell className="text-end font-bold">{product.count}</TableCell>
                              <TableCell className="text-end">{product.totalWeight.toFixed(2)}</TableCell>
                              <TableCell className="text-end">
                                  <div className="flex items-center justify-end gap-2">
                                      <span className="text-xs text-muted-foreground w-12 text-right">{product.percentage.toFixed(1)}%</span>
                                      <Progress value={product.percentage} className="h-2 w-24" />
                                  </div>
                              </TableCell>
                          </TableRow>
                      )
                  })}
                  </TableBody>
              </Table>
          )}
          {productsSalesByQuantity.length === 0 && !isLoading && (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات مبيعات في الفترة المحددة.' : 'No sales data for the selected period.'}
              </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
