
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ProductsClient } from "./components/client";
import { getProductColumns } from "./components/columns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ProductForm } from "./components/product-form";
import { useLanguage } from "@/components/language-provider";
import type { Product, Order, OrderItem } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useRealtimeCachedCollection } from "@/hooks/use-realtime-cached-collection";

export default function ProductsPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const { language } = useLanguage();

  const { data: products, isLoading: isLoadingProducts } = useRealtimeCachedCollection<Product>('products');
  const { data: allOrders, isLoading: isLoadingOrders } = useRealtimeCachedCollection<Order>('orders');
  
  const isLoading = isLoadingProducts || isLoadingOrders;

  const handleSuccess = () => {
    setIsFormOpen(false);
  };
  
  const productsWithSalesData = React.useMemo(() => {
    if (!products || !allOrders) return [];

    const salesMap = new Map<string, { count: number; weight: number }>();

    allOrders.forEach(order => {
      if (order.status === 'ملغي') return; // Skip cancelled orders

      const items: OrderItem[] = Array.isArray(order.items) ? order.items : Object.values(order.items || {});
      items.forEach((item) => {
        if (item.productId) {
          const sale = salesMap.get(item.productId) || { count: 0, weight: 0 };
          sale.count += item.quantity;
          sale.weight += (item.weight || 0) * item.quantity;
          salesMap.set(item.productId, sale);
        }
      });
    });

    return products.map(product => {
      const sales = salesMap.get(product.id);
      return {
        ...product,
        salesCount: sales?.count || 0,
        soldWeight: sales?.weight || 0,
      };
    });
  }, [products, allOrders]);

  const columns = getProductColumns(language, handleSuccess);

  return (
    <div>
      <PageHeader title={language === 'ar' ? 'المنتجات' : 'Products'}>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="me-2 h-4 w-4" />
              {language === 'ar' ? 'إضافة منتج' : 'Add Product'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <ProductForm onSuccess={handleSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </PageHeader>
      {isLoading ? (
        <div className="space-y-4">
            <div className="flex items-center py-4">
                <Skeleton className="h-10 w-full max-w-sm" />
            </div>
            <div className="rounded-md border p-4">
                <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
      ) : (
        <ProductsClient data={productsWithSalesData || []} columns={columns} onUpdate={handleSuccess} />
      )}
    </div>
  );
}
