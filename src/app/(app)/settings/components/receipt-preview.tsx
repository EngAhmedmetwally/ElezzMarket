"use client";

import * as React from "react";
import { Rocket } from 'lucide-react';
import { format } from "date-fns";
import { useLanguage } from "@/components/language-provider";
import type { ReceiptSettings } from "@/lib/types";

interface ReceiptPreviewProps {
  settings: Partial<ReceiptSettings>;
}

const mockOrder = {
  id: "12345",
  createdAt: new Date().toISOString(),
  customerName: "محمد علي",
  customerPhone1: "01234567890",
  customerAddress: "123 شارع المثال، القاهرة",
  courierName: "عمر إبراهيم",
  items: [
    { productName: "منتج تجريبي 1", quantity: 2, price: 50.00, weight: 0.5 },
    { productName: "منتج آخر طويل جداً", quantity: 1, price: 120.50, weight: 1.2 },
    { productName: "صنف ثالث", quantity: 5, price: 10.00, weight: 0.1 },
  ],
  shippingCost: 30.00,
};

const Hr = () => <hr className="border-t border-dashed border-border my-2" />;

export function ReceiptPreview({ settings }: ReceiptPreviewProps) {
  const { language } = useLanguage();

  const itemsSubtotal = mockOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = itemsSubtotal + mockOrder.shippingCost;

  return (
    <div className="bg-card p-4 rounded-lg shadow-inner w-full max-w-[302px] mx-auto font-mono text-card-foreground text-xs leading-relaxed">
        {settings.showLogo && (
            <div className="text-center mb-2">
            <Rocket className="h-8 w-8 mx-auto" />
            {settings.headerText && <h2 className="font-bold text-base mt-2 break-words">{settings.headerText}</h2>}
            </div>
        )}
        {settings.showOrderId && <p className="text-xs break-words">{language === 'ar' ? 'رقم الطلب:' : 'Order ID:'} {mockOrder.id}</p>}
        {settings.showDate && <p className="text-xs break-words">{language === 'ar' ? 'التاريخ:' : 'Date:'} {format(new Date(mockOrder.createdAt), "dd/MM/yyyy HH:mm")}</p>}
        
        {(settings.showOrderId || settings.showDate) && (settings.showCustomerName || settings.showCustomerPhone || settings.showCustomerAddress || settings.showCourierName) && <Hr />}
        
        {settings.showCustomerName && <p className="text-xs font-semibold break-words">{language === 'ar' ? 'العميل:' : 'Customer:'} {mockOrder.customerName}</p>}
        {settings.showCustomerPhone && <p className="text-xs break-words">{language === 'ar' ? 'الهاتف:' : 'Phone:'} {mockOrder.customerPhone1}</p>}
        {settings.showCustomerAddress && mockOrder.customerAddress && <p className="text-xs break-words">{language === 'ar' ? 'العنوان:' : 'Address:'} {mockOrder.customerAddress}</p>}
        
        {settings.showCourierName && mockOrder.courierName && <p className="text-xs font-semibold break-words">{language === 'ar' ? 'المندوب:' : 'Courier:'} {mockOrder.courierName}</p>}
        
        {(settings.showCustomerName || settings.showCustomerPhone || settings.showCustomerAddress || settings.showCourierName) && <Hr />}
        
        <table className="w-full text-xs">
            <thead>
            <tr className="font-bold">
                <td className="text-left pb-1">{language === 'ar' ? 'الصنف' : 'Item'}</td>
                {settings.showItemWeight && <td className="text-center pb-1">{language === 'ar' ? 'وزن' : 'Wt.'}</td>}
                <td className="text-center pb-1">{language === 'ar' ? 'كمية' : 'Qty'}</td>
                {settings.showItemPrice && <td className="text-right pb-1">{language === 'ar' ? 'سعر' : 'Price'}</td>}
                {settings.showItemSubtotal && <td className="text-right pb-1">{language === 'ar' ? 'إجمالي' : 'Total'}</td>}
            </tr>
            </thead>
            <tbody>
            {mockOrder.items.map((item, index) => (
                <tr key={index} className="align-top">
                <td className="text-left break-words w-2/5 pr-1">{item.productName}</td>
                {settings.showItemWeight && <td className="text-center px-1">{item.weight ? `${(item.weight * item.quantity).toFixed(2)}` : '-'}</td>}
                <td className="text-center px-1">{item.quantity}</td>
                {settings.showItemPrice && <td className="text-right px-1">{item.price.toFixed(2)}</td>}
                {settings.showItemSubtotal && <td className="text-right pl-1">{(item.price * item.quantity).toFixed(2)}</td>}
                </tr>
            ))}
            </tbody>
        </table>
        <Hr />
        <div className="space-y-1 text-xs">
            {settings.showItemsSubtotal && <div className="flex justify-between"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span> <span>{itemsSubtotal.toFixed(2)}</span></div>}
            {settings.showShippingCost && <div className="flex justify-between"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span> <span>{mockOrder.shippingCost.toFixed(2)}</span></div>}
            {settings.showGrandTotal && <div className="flex justify-between font-bold text-sm pt-1"><span>{language === 'ar' ? 'الإجمالي الكلي' : 'Total'}</span> <span>{total.toFixed(2)}</span></div>}
        </div>
        {(settings.showItemsSubtotal || settings.showShippingCost || settings.showGrandTotal) && <Hr />}
        {settings.footerText && <p className="text-center text-xs break-words">{settings.footerText}</p>}

        <div className="mt-2 text-center text-muted-foreground">
            <svg width="100%" height="20">
                <line x1="0" y1="10" x2="100%" y2="10" stroke="currentColor" strokeWidth="2" strokeDasharray="5 3" strokeLinecap="square"/>
            </svg>
        </div>
    </div>
  );
}
