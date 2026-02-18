
"use client";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Progress } from "@/components/ui/progress";
import { useCollection, useDatabase, useMemoFirebase } from "@/firebase";
import { ref, query, orderByChild } from "firebase/database";
import type { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

function ProductsReportSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <Skeleton className="h-[350px] w-full" />
        </div>
        <div className="lg:col-span-3">
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
      </div>
    </div>
  )
}


export default function ProductsReportPage() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const database = useDatabase();

  const productsQuery = useMemoFirebase(() => 
    database 
      ? query(ref(database, 'products'), orderByChild('salesCount')) 
      : null, 
    [database]
  );
  const { data: productsData, isLoading } = useCollection<Product>(productsQuery);

  const productsSales = React.useMemo(() => {
    if (!productsData) return [];
    
    const sales = productsData
        .map(product => ({ 
            name: product.name, 
            count: product.salesCount || 0 
        }))
        .filter(p => p.count > 0)
        .reverse(); // reverse because query is ascending

    const totalSoldCount = sales.reduce((acc, item) => acc + item.count, 0);

    return sales.map(item => ({
        ...item, 
        percentage: totalSoldCount > 0 ? (item.count / totalSoldCount) * 100 : 0 
    }));
  }, [productsData]);

  const topProductsChartData = productsSales.slice(0, 10).map(p => ({ name: p.name, value: p.count }));

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
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
             <StaffPerformanceChart 
                data={topProductsChartData} 
                title={language === 'ar' ? 'المنتجات الأكثر مبيعًا' : 'Top Selling Products'}
                barDataKey="products"
                barLabel={language === 'ar' ? 'الكمية المباعة' : 'Quantity Sold'}
            />
        </div>
        <div className="lg:col-span-3">
            <Card>
                <CardHeader>
                <CardTitle>{language === 'ar' ? 'تقرير مبيعات جميع المنتجات' : 'All Products Sales Report'}</CardTitle>
                </CardHeader>
                <CardContent>
                {isMobile ? (
                    <div className="space-y-4">
                        {productsSales.map((product) => (
                            <Card key={product.name}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <p className="font-medium flex-1 pr-4">{product.name}</p>
                                        <p className="font-bold">{product.count} <span className="text-xs font-normal text-muted-foreground">{language === 'ar' ? 'وحدة' : 'units'}</span></p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Progress value={product.percentage} className="h-2" />
                                        <span className="text-xs text-muted-foreground">{product.percentage.toFixed(1)}%</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                            <TableHead className="text-end">{language === 'ar' ? 'الكمية المباعة' : 'Quantity Sold'}</TableHead>
                            <TableHead className="w-[150px] text-end">{language === 'ar' ? 'نسبة المبيعات' : 'Sales Percentage'}</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {productsSales.map((product) => (
                            <TableRow key={product.name}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-end font-bold">{product.count}</TableCell>
                                <TableCell className="text-end">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-xs text-muted-foreground">{product.percentage.toFixed(1)}%</span>
                                        <Progress value={product.percentage} className="h-2 w-24" />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
