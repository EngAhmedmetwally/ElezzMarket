
"use client";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { mockOrders } from "@/lib/data";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaffPerformanceChart } from "../components/staff-performance-chart";
import { Progress } from "@/components/ui/progress";

export default function ProductsReportPage() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();

  const productsSales = React.useMemo(() => {
    const sales: Record<string, number> = {};
    mockOrders.forEach(order => {
        order.items.forEach(item => {
            sales[item.productName] = (sales[item.productName] || 0) + item.quantity;
        });
    });

    const sortedSales = Object.entries(sales)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    
    const totalSoldCount = sortedSales.reduce((acc, item) => acc + item.count, 0);

    return sortedSales.map(item => ({
        ...item, 
        percentage: totalSoldCount > 0 ? (item.count / totalSoldCount) * 100 : 0 
    }));
  }, []);

  const topProductsChartData = productsSales.slice(0, 10).reverse().map(p => ({ name: p.name, value: p.count }));

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
