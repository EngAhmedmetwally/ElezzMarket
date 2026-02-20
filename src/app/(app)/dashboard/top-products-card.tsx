"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useLanguage } from "@/components/language-provider";
import { Progress } from "@/components/ui/progress";

interface TopProductsCardProps {
    data: { name: string; quantity: number }[];
}

export function TopProductsCard({ data }: TopProductsCardProps) {
    const { language } = useLanguage();
    
    const totalQuantity = data.reduce((acc, product) => acc + product.quantity, 0);

    if (!data || data.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>{language === 'ar' ? 'المنتجات الأكثر مبيعاً' : 'Top Selling Products'}</CardTitle>
                     <CardDescription>{language === 'ar' ? 'لا توجد بيانات لعرضها' : 'No data to display'}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[280px]">
                    <p className="text-muted-foreground">{language === 'ar' ? 'لا توجد منتجات مباعة في الفترة المحددة' : 'No products sold in the selected period'}</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{language === 'ar' ? 'المنتجات الأكثر مبيعاً' : 'Top Selling Products'}</CardTitle>
                 <CardDescription>{language === 'ar' ? 'أفضل 5 منتجات حسب الكمية المباعة' : 'Top 5 products by quantity sold'}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {data.map((product) => {
                        const percentage = totalQuantity > 0 ? (product.quantity / totalQuantity) * 100 : 0;
                        return (
                            <div key={product.name} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium">{product.name}</span>
                                    <span className="text-muted-foreground">{product.quantity}</span>
                                </div>
                                <Progress value={percentage} aria-label={`${percentage.toFixed(1)}%`} />
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
