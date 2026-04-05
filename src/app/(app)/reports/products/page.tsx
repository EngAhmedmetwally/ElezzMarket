
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
import { Package, Weight, DollarSign, Search, CheckSquare, Square } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

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
  const [selectedProductNames, setSelectedProductNames] = React.useState<Set<string>>(new Set());

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

  // Initial selection: Select all items on first load or when productsSummary changes
  React.useEffect(() => {
    if (productsSummary.length > 0 && selectedProductNames.size === 0 && !searchTerm) {
        setSelectedProductNames(new Set(productsSummary.map(p => p.name)));
    }
  }, [productsSummary, searchTerm]);

  // Handle Select All (filtered only)
  const handleSelectAll = () => {
    const newSelection = new Set(selectedProductNames);
    searchFilteredData.forEach(p => newSelection.add(p.name));
    setSelectedProductNames(newSelection);
  };

  // Handle Deselect All (filtered only)
  const handleDeselectAll = () => {
    const newSelection = new Set(selectedProductNames);
    searchFilteredData.forEach(p => newSelection.delete(p.name));
    setSelectedProductNames(newSelection);
  };

  const toggleProductSelection = (name: string) => {
    const newSelection = new Set(selectedProductNames);
    if (newSelection.has(name)) {
        newSelection.delete(name);
    } else {
        newSelection.add(name);
    }
    setSelectedProductNames(newSelection);
  };

  // 3. Calculate TOTALS based on SELECTED products (Dynamic Totals)
  const totals = React.useMemo(() => {
    const selectedData = searchFilteredData.filter(p => selectedProductNames.has(p.name));
    return selectedData.reduce((acc, curr) => ({
        qty: acc.qty + curr.count,
        weight: acc.weight + curr.totalWeight,
        amount: acc.amount + curr.totalAmount
    }), { qty: 0, weight: 0, amount: 0 });
  }, [searchFilteredData, selectedProductNames]);

  // 4. Final display data with percentages based on current filter
  const displayProducts = React.useMemo(() => {
    const totalSoldCount = searchFilteredData.reduce((acc, item) => acc + item.count, 0);
    return [...searchFilteredData]
        .sort((a, b) => b.count - a.count)
        .map(item => ({
            ...item, 
            percentage: totalSoldCount > 0 ? (item.count / totalSoldCount) * 100 : 0 
        }));
  }, [searchFilteredData]);

  // Charts use only SELECTED data
  const topQtyChartData = React.useMemo(() => {
      return displayProducts
        .filter(p => selectedProductNames.has(p.name))
        .slice(0, 10)
        .map(p => ({ 
            name: p.name, 
            value: p.count 
        }));
  }, [displayProducts, selectedProductNames]);
  
  const topWeightChartData = React.useMemo(() => {
    return [...displayProducts]
        .filter(p => selectedProductNames.has(p.name))
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .slice(0, 10)
        .map(p => ({ 
            name: p.name, 
            value: Number(p.totalWeight.toFixed(2)) 
        }));
  }, [displayProducts, selectedProductNames]);

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
          title={language === 'ar' ? 'إجمالي المبيعات (للمختار)' : 'Selected Total Sales'}
          value={formatCurrency(totals.amount, language)}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'إجمالي الكميات (للمختار)' : 'Selected Total Qty'}
          value={totals.qty.toLocaleString()}
          icon={<Package className="h-4 w-4" />}
        />
        <KpiCard
          title={language === 'ar' ? 'إجمالي الأوزان (للمختار)' : 'Selected Total Weight'}
          value={`${totals.weight.toFixed(2)} kg`}
          icon={<Weight className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="min-w-0">
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'أفضل المنتجات المختارة (كمية)' : 'Top Selected Products (Qty)'}</CardTitle>
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
                <CardTitle>{language === 'ar' ? 'أفضل المنتجات المختارة (وزن)' : 'Top Selected Products (Weight)'}</CardTitle>
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
                <div className="flex-1">
                    <CardTitle>{language === 'ar' ? 'مبيعات المنتجات' : 'Products Sales'}</CardTitle>
                    <CardDescription>
                        {language === 'ar' 
                            ? `تم اختيار ${selectedProductNames.size} منتج من أصل ${productsSummary.length}` 
                            : `Selected ${selectedProductNames.size} of ${productsSummary.length} products`}
                    </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleSelectAll} className="flex-1 sm:flex-none">
                            <CheckSquare className="me-2 h-4 w-4" />
                            {language === 'ar' ? 'تحديد الكل' : 'Select All'}
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDeselectAll} className="flex-1 sm:flex-none">
                            <Square className="me-2 h-4 w-4" />
                            {language === 'ar' ? 'إلغاء التحديد' : 'Deselect'}
                        </Button>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={language === 'ar' ? 'بحث...' : 'Search...'}
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
              </div>
          </CardHeader>
          <CardContent>
          {isMobile ? (
              <div className="space-y-4">
                {displayProducts.map((product) => {
                  const isSelected = selectedProductNames.has(product.name);
                  const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                  return (
                      <div key={product.name} className={`flex gap-3 p-4 border rounded-lg transition-colors ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}>
                          <Checkbox 
                            checked={isSelected} 
                            onCheckedChange={() => toggleProductSelection(product.name)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <Link href={href} className="block mb-2">
                                <div className="flex justify-between items-start">
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
                          </div>
                      </div>
                  )
                })}
              </div>
          ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead className="w-12 text-center">
                            <Checkbox 
                                checked={searchFilteredData.length > 0 && searchFilteredData.every(p => selectedProductNames.has(p.name))}
                                onCheckedChange={(checked) => checked ? handleSelectAll() : handleDeselectAll()}
                            />
                        </TableHead>
                        <TableHead className="text-start">{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'الكمية' : 'Qty'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'الوزن الإجمالي' : 'Total Weight'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'إجمالي المبلغ' : 'Total Amount'}</TableHead>
                        <TableHead className="text-end">{language === 'ar' ? 'النسبة' : '%'}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {displayProducts.map((product) => {
                        const isSelected = selectedProductNames.has(product.name);
                        const href = `/reports/products/${encodeURIComponent(product.name)}?from=${fromDateString}&to=${toDateString}`;
                        return (
                            <TableRow key={product.name} className={isSelected ? 'bg-primary/5' : ''}>
                                <TableCell className="text-center">
                                    <Checkbox 
                                        checked={isSelected} 
                                        onCheckedChange={() => toggleProductSelection(product.name)}
                                    />
                                </TableCell>
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
          {displayProducts.length === 0 && !isLoading && (
              <div className="py-20 text-center text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات مبيعات مطابقة لبحثك.' : 'No sales data matching your search.'}
              </div>
          )}
          </CardContent>
      </Card>
    </div>
  );
}
