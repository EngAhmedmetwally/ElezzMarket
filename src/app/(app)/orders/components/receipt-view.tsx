
"use client";

import * as React from "react";
import { format } from "date-fns";
import { Logo } from "@/components/icons/logo";
import { formatCurrency } from "@/lib/utils";
import type { Order, OrderItem, ReceiptSettings } from "@/lib/types";

interface ReceiptViewProps {
  order: Order;
  language: "ar" | "en";
  settings: ReceiptSettings | null;
}

const Hr = () => <hr className="receipt-thermal-hr" />;

export function ReceiptView({ order, language, settings }: ReceiptViewProps) {
  if (!order) return null;

  const orderItems: OrderItem[] = order.items ? (Array.isArray(order.items) ? order.items : Object.values(order.items)) : [];
  const itemsSubtotal = orderItems.reduce((acc: number, item: OrderItem) => acc + (Number(item.price) * Number(item.quantity)), 0);
  const totalItems = orderItems.reduce((acc: number, item: OrderItem) => acc + Number(item.quantity), 0);
  const totalWeight = orderItems.reduce((acc: number, item: OrderItem) => acc + ((Number(item.weight) || 0) * Number(item.quantity)), 0);
  const grandTotal = itemsSubtotal + Number(order.shippingCost || 0);

  const s = settings || {
      showLogo: true, headerText: language === 'ar' ? 'سوق العز' : 'ElEzz Market',
      showOrderId: true, showDate: true, showCustomerName: true, showFacebookName: true, showCustomerPhone: true, showCustomerPhone2: true, showCustomerAddress: true, showPaymentMethod: true,
      showItemWeight: false, showItemPrice: true, showItemSubtotal: true,
      showItemsSubtotal: true, showShippingCost: true, showGrandTotal: true,
      showOrderNotes: true,
      footerText: language === 'ar' ? 'شكراً لتعاملكم معنا!' : 'Thank you!',
      mandatoryFooterText: '',
      showCourierName: true,
      showModeratorName: false,
      showModeratorUsername: false,
      showTotalItems: true,
      showTotalWeight: true,
      logoSize: 100,
  };
  
  const formatCurrencyLocal = (value: any) => formatCurrency(value, language);
  const logoSize = s.logoSize || 100;

  return (
    <div className="receipt-thermal" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {s.showLogo && (
            <div className="receipt-thermal-header">
                <div className="mx-auto mb-2" style={{ width: `${logoSize}px`, height: `${logoSize}px` }}>
                    <Logo inverted />
                </div>
                {s.headerText && <h1 className="mt-2">{s.headerText}</h1>}
            </div>
        )}
        
        <div className="receipt-thermal-info">
             {s.showOrderId && <div className="info-item"><span>{language === 'ar' ? 'رقم الطلب' : 'Order'}:</span><span>{order.id}</span></div>}
             {s.showDate && <div className="info-item"><span>{language === 'ar' ? 'التاريخ' : 'Date'}:</span><span>{format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</span></div>}
        </div>

        <Hr />

        <div className="receipt-thermal-info">
             {s.showCustomerName && <div className="info-item"><span>{language === 'ar' ? 'العميل' : 'Cust'}:</span><span>{order.customerName}</span></div>}
             {s.showFacebookName && order.facebookName && <div className="info-item"><span>{language === 'ar' ? 'فيسبوك' : 'FB'}:</span><span>{order.facebookName}</span></div>}
             {s.showCustomerPhone && <div className="info-item"><span>{language === 'ar' ? 'الهاتف 1' : 'Phone 1'}:</span><span>{order.customerPhone1}</span></div>}
             {s.showCustomerPhone2 && order.customerPhone2 && <div className="info-item"><span>{language === 'ar' ? 'الهاتف 2' : 'Phone 2'}:</span><span>{order.customerPhone2}</span></div>}
             {s.showPaymentMethod && order.paymentMethod && <div className="info-item"><span>{language === 'ar' ? 'الدفع' : 'Payment'}:</span><span>{order.paymentMethod}</span></div>}
             {s.showCustomerAddress && order.customerAddress && <p className="text-xs break-words pt-1 text-start">{order.customerAddress}</p>}
        </div>

        {(s.showCourierName && order.courierName || s.showModeratorName && order.moderatorName || s.showModeratorUsername && order.moderatorUsername) && (
            <>
                <Hr />
                <div className="receipt-thermal-info space-y-0.5">
                    {s.showModeratorName && order.moderatorName && <div className="info-item"><span>{language === 'ar' ? 'الوسيط' : 'Moderator'}:</span><span>{order.moderatorName}</span></div>}
                    {s.showModeratorUsername && order.moderatorUsername && <div className="info-item"><span>{language === 'ar' ? 'الوسيط' : 'Moderator'}:</span><span>{order.moderatorUsername}</span></div>}
                    {s.showCourierName && order.courierName && <div className="info-item"><span>{language === 'ar' ? 'المندوب' : 'Courier'}:</span><span>{order.courierName}</span></div>}
                </div>
            </>
        )}

        {s.showOrderNotes && order.notes && (
            <>
                <Hr />
                <div className="receipt-thermal-info" style={{ backgroundColor: '#f9f9f9', padding: '4px' }}>
                    <p className="font-bold">{language === 'ar' ? 'ملاحظات الطلب:' : 'Order Notes:'}</p>
                    <p style={{ fontSize: '10px', fontStyle: 'italic', lineHeight: '1.2' }}>{order.notes}</p>
                </div>
            </>
        )}

        <table className="receipt-thermal-table">
            <thead>
                <tr>
                    <th className="item-name">{language === 'ar' ? 'الصنف' : 'Item'}</th>
                    <th className="text-center">{language === 'ar' ? 'كمية' : 'Qty'}</th>
                    {s.showItemPrice && <th className="text-end">{language === 'ar' ? 'سعر' : 'Price'}</th>}
                    {s.showItemSubtotal && <th className="text-end">{language === 'ar' ? 'إجمالي' : 'Total'}</th>}
                </tr>
            </thead>
            <tbody>
                {orderItems.map((item: OrderItem, index) => (
                    <tr key={index}>
                        <td className="item-name">{item.productName}{s.showItemWeight && item.weight ? ` (${item.weight * item.quantity}kg)` : ''}</td>
                        <td className="text-center">{item.quantity}</td>
                        {s.showItemPrice && <td className="text-end">{formatCurrencyLocal(item.price)}</td>}
                        {s.showItemSubtotal && <td className="text-end">{formatCurrencyLocal(item.price * item.quantity)}</td>}
                    </tr>
                ))}
            </tbody>
        </table>

        <Hr />

        <div className="receipt-thermal-summary space-y-1">
            {s.showItemsSubtotal && <div className="summary-item"><span>{language === 'ar' ? 'مجموع المنتجات' : 'Subtotal'}</span> <span>{formatCurrencyLocal(itemsSubtotal)}</span></div>}
            {s.showShippingCost && <div className="summary-item"><span>{language === 'ar' ? 'تكلفة الشحن' : 'Shipping'}</span> <span>{formatCurrencyLocal(order.shippingCost || 0)}</span></div>}
            
            {(s.showTotalItems || s.showTotalWeight) && (s.showItemsSubtotal || s.showShippingCost) && <Hr />}

            {s.showTotalItems && <div className="summary-item total"><span>{language === 'ar' ? 'إجمالي القطع' : 'Total Items'}</span> <span>{totalItems}</span></div>}
            {s.showTotalWeight && <div className="summary-item total"><span>{language === 'ar' ? 'إجمالي الوزن' : 'Total Weight'}</span> <span>{totalWeight.toFixed(2)} {language === 'ar' ? 'كجم' : 'kg'}</span></div>}

            {s.showGrandTotal && (s.showTotalItems || s.showTotalWeight) && <Hr />}
            
            {s.showGrandTotal && <div className="summary-item total"><span>{language === 'ar' ? 'إجمالي الكلي' : 'Total'}</span> <span>{formatCurrencyLocal(grandTotal)}</span></div>}
        </div>
        
        {s.footerText && (
            <>
                <Hr />
                <div className="receipt-thermal-footer">
                    <p>{s.footerText}</p>
                </div>
            </>
        )}
        {s.mandatoryFooterText && (
             <>
                <Hr />
                <div className="receipt-thermal-footer">
                    <p className="font-bold">{s.mandatoryFooterText}</p>
                </div>
            </>
        )}
    </div>
  );
}
