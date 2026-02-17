
"use client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useLanguage } from "@/components/language-provider";
import { mockProducts } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export default function ProductsReportPage() {
  const { language } = useLanguage();

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'تقرير المنتجات' : 'Products Report'} />
      <Card>
        <CardHeader>
          <CardTitle>{language === 'ar' ? 'قائمة المنتجات الحالية' : 'Current Product List'}</CardTitle>
        </CardHeader>
        <CardContent>
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
                    {new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-US', {
                      style: "currency",
                      currency: "EGP",
                    }).format(product.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
