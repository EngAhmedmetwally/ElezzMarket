
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
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { subDays } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { Package, Weight, DollarSign, Search } from "lucide-react";

function ProductsReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
         <Skeleton className="h-28 w-full" />
         <Skeleton className="h-28 w-full" />
         <Skeleton className="h-28 w-full" />
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
  const [searchTerm, setSearchTerm] = React.useState("");

  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  // 1. Get raw summary from orders filtered by DATE
  const productsSummary = React.useMemo(() => {
    if (!allOrders || !fromDate || !toDate) return [];
    
    const from = fromDate.getTime();
    const to = toDate.getTime() + (24 * 60 * 60 * 1000);
    
    const productMap = new Map<string, { name: string; count: number; totalWeight: number; totalAmount: number }>();
    
    const filteredByDate = allOrders.filter(order => {
        if (!order.createdAt || order.status === 'ملغي') return false;
        const orderDate = new Date(order.createdAt).getTime();
        return orderDate >= from && orderDate <= to;
    });

    filteredByDate.forEach(order => {
        const items: OrderItem[] = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
        if (items.length === 0) return;

        items.forEach((item) => {
            if (!item.productName) return;
            const existing = productMap.get(item.productName) || { name: item.productName, count: 0, totalWeight: 0, totalAmount: 0 };
            const qty = (Number(item.quantity) || 0);
            const price = (Number(item.price) || 0);
            const weight = (Number(item.weight) || 0);

            existing.count += qty;
            existing.totalWeight += weight * qty;
            existing.totalAmount += price * qty;
            productMap.set(item.productName, existing);
        });
    });
    
    return Array.from(productMap.values());
  }, [allOrders, fromDate, toDate]);

  // 2. Apply SEARCH filter to the summary
  const searchFilteredData = React.useMemo(() => {
    let result = [...productsSummary];
    if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(lowerSearch));
    }
    return result;
  }, [productsSummary, searchTerm]);

  // 3. Calculate TOTALS based on searchFilteredData (Dynamic Totals)
  const totals = React.useMemo(() => {
    return searchFilteredData.reduce((acc, curr) => ({
        qty: acc.qty + curr.count,
        weight: acc.weight + curr.totalWeight,
        amount: acc.amount + curr.totalAmount
    }), { qty: 0, weight: 0, amount: 0 });
  }, [searchFilteredData]);

  // 4. Final display data with percentages based on current filter
  const filteredProducts = React.useMemo(() => {
    const totalSoldCount = searchFilteredData.reduce((acc, item) => acc + item.count, 0);
    return [...searchFilteredData]
        .sort((a, b) => b.count - a.count)
        .map(item => ({
            ...item, 
            percentage: totalSoldCount > 0 ? (item.count / totalSoldCount) * 100 : 0 
        }));
  }, [searchFilteredData]);

  const topQtyChartData = React.useMemo(() => {
      return filteredProducts.slice(0, 10).map(p => ({ 
          name: p.name, 
          value: p.count 
      }));
  }, [filteredProducts]);
  
  const topWeightChartData = React.useMemo(() => {
    return [...filteredProducts]
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .slice(0, 10)
        .map(p => ({ 
            name: p.name, 
            value: Number(p.totalWeight.toFixed(2)) 
        }));
  }, [filteredProducts]);

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

      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard
          title={language === 'ar' ? 'إجمالي المبيعات للمصفي' : 'Total Filtered Sales'}
          value={formatCurrency(totals.amount, language)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'إجمالي الكميات للمصفي' : 'Total Filtered Quantity'}
          value={totals.qty.toLocaleString()}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'إجمالي الأوزان للمصفي' : 'Total Filtered Weight'}
          value={`${totals.weight.toFixed(2)} kg`}
          icon={<Weight className="h-4 w-4" />}
        />
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
                    layout="columns"
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
                    layout="columns"
                />
            </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <CardTitle>{language === 'ar' ? 'تقرير مبيعات المنتجات' : 'Products Sales Report'}</CardTitle>
                    <CardDescription>{language === 'ar' ? 'البحث في الأصناف سيقوم بتحديث الإحصائيات في الأعلى تلقائياً.' : 'Searching items will automatically update the totals above.'}</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={language === 'ar' ? 'بحث عن منتج...' : 'Search for a product...'}
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
              </div>
          </CardHeader>
          <CardContent>
          {isMobile ? (
              <div className="space-y-4">
                {filteredProducts.map((product) => {
                  const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                  return (
                      <Link href={href} key={product.name} className="block p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                              <p className="font-bold text-primary break-words flex-1 text-start">{product.name}</p>
                              <div className="text-end shrink-0 ms-4">
                                  <p className="font-bold">{product.count}</p>
                                  <p className="text-xs text-muted-foreground">{product.totalWeight.toFixed(2)} kg</p>
                                  <p className="text-sm font-semibold text-green-600 mt-1">{formatCurrency(product.totalAmount, language)}</p>
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
                        <TableHead className="text-end">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'النسبة' : '%'}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredProducts.map((product) => {
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
                                <TableCell className="text-end font-bold text-green-600">{formatCurrency(product.totalAmount, language)}</TableCell>
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
          {filteredProducts.length === 0 && !isLoading && (
              <div className="py-20 text-center text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات مبيعات مطابقة لبحثك.' : 'No sales data matching your search.'}
              </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
