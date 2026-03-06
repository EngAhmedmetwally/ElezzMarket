'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useRealtimeCachedCollection } from '@/hooks/use-realtime-cached-collection';
import type { Order } from '@/lib/types';
import { useLanguage } from '@/components/language-provider';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function PendingOrdersList() {
  const router = useRouter();
  const { language } = useLanguage();
  const { data: allOrders, isLoading } = useRealtimeCachedCollection<Order>('orders');

  // Memoize pending orders based on ID string to prevent carousel reset on minor DB updates
  const pendingOrders = React.useMemo(() => {
    if (!allOrders) return [];
    return allOrders
      .filter(order => order.status === 'تم التسجيل' || order.status === 'قيد التجهيز')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // oldest first
  }, [allOrders]);

  const carouselOptions = React.useMemo(() => ({
    align: "start" as const,
    dragFree: true,
    containScroll: "trimSnaps" as const,
  }), []);

  if (isLoading) {
    return (
      <div className="w-full overflow-hidden mb-8 print-hidden">
        <div className="flex gap-4 pb-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-48 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (pendingOrders.length === 0) {
    return null; // Don't show anything if there are no pending orders
  }

  return (
    <Card className="mb-8 print-hidden">
      <CardContent className="p-4">
        <h3 className="mb-4 text-lg font-semibold">{language === 'ar' ? 'الطلبات قيد الانتظار' : 'Pending Orders'}</h3>
        <Carousel
            opts={carouselOptions}
            className="w-full"
        >
            <CarouselContent>
                {pendingOrders.map(order => (
                    <CarouselItem key={order.id} className="basis-1/2 md:basis-1/3 lg:basis-1/5">
                        <div className="p-1">
                            <Card 
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => router.push(`/orders/${order.id}`)}
                            >
                                <CardContent className="p-3 flex flex-col gap-2 text-sm">
                                    <div className="font-bold text-base">#{order.id}</div>
                                    <StatusBadge status={order.status} />
                                    <p className="text-muted-foreground truncate">{order.moderatorName}</p>
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
        </Carousel>
      </CardContent>
    </Card>
  );
}
