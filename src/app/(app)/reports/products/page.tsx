
"use client";
import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { mockProducts } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { ProductsStatusChart } from "../components/products-status-chart";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ProductsReportPage() {
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  
  const statusData = React.useMemo(() => {
    const active = mockProducts.filter(p => p.isActive).length;
    const inactive = mockProducts.length - active;
    return [
        { name: language === 'ar' ? 'متوفر' : 'In Stock', value: active, fill: 'hsl(var(--chart-2))' },
        { name: language === 'ar' ? 'نفذ' : 'Out of Stock', value: inactive, fill: 'hsl(var(--chart-5))' }
    ];
  }, [language]);

  const formatCurrency = (value: number) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
      style: "currency",
      currency: "EGP",
  }).format(value);

  return (
    <div className="space-y-8">
      <PageHeader title={language === 'ar' ? 'تقرير المنتجات' : 'Products Report'} />
      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>{language === 'ar' ? 'قائمة المنتجات الحالية' : 'Current Product List'}</CardTitle>
                </CardHeader>
                <CardContent>
                {isMobile ? (
                    <div className="space-y-4">
                        {mockProducts.map((product) => (
                            <Card key={product.id}>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div className="flex-1">
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-muted-foreground">{formatCurrency(product.price)}</p>
                                    </div>
                                     <Badge variant={product.isActive ? "secondary" : "destructive"}>
                                        {product.isActive ? (language === 'ar' ? 'متوفر' : 'In Stock') : (language === 'ar' ? 'نفذ' : 'Out of Stock')}
                                    </Badge>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>{language === 'ar' ? 'المنتج' : 'Product'}</TableHead>
                            <TableHead className="text-center">{language === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                            <TableHead className="text-end">{language === 'ar' ? 'السعر' : 'Price'}</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {mockProducts.map((product) => (
                            <TableRow key={product.id}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-center">
                                <Badge variant={product.isActive ? "secondary" : "destructive"}>
                                {product.isActive ? (language === 'ar' ? 'متوفر' : 'In Stock') : (language === 'ar' ? 'نفذ' : 'Out of Stock')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-end">
                                {formatCurrency(product.price)}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
        <div>
            <ProductsStatusChart data={statusData} />
        </div>
      </div>
    </div>
  );
}
