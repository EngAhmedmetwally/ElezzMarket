
import type { User, Order, CommissionRule, Product } from './types';

export const mockUsers: User[] = [
  { id: 'usr_1', name: 'مستخدم مسؤول', email: 'admin@elezz.com', role: 'Admin', avatarUrl: '/avatars/01.png', status: 'نشط', createdAt: '2023-10-01' },
  { id: 'usr_2', name: 'مدير عمليات', email: 'ops@elezz.com', role: 'Operations', avatarUrl: '/avatars/02.png', status: 'نشط', createdAt: '2023-10-01' },
  { id: 'usr_3', name: 'علي حسن', email: 'ali.hassan@elezz.com', role: 'Moderator', avatarUrl: '/avatars/03.png', status: 'نشط', createdAt: '2023-10-02' },
  { id: 'usr_4', name: 'فاطمة أحمد', email: 'fatima.ahmed@elezz.com', role: 'Moderator', avatarUrl: '/avatars/04.png', status: 'نشط', createdAt: '2023-10-02' },
  { id: 'usr_5', name: 'عمر إبراهيم', email: 'omar.ibrahim@elezz.com', role: 'Courier', avatarUrl: '/avatars/05.png', status: 'نشط', createdAt: '2023-10-03' },
  { id: 'usr_6', name: 'ليلى مصطفى', email: 'layla.mustafa@elezz.com', role: 'Courier', avatarUrl: '/avatars/06.png', status: 'معطل', createdAt: '2023-10-03' },
];

export const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'خالد الفارسي', customerPhone: '01012345678', customerAddress: '123 شارع النصر، القاهرة', zoning: 'القاهرة', status: 'تم التوصيل', items: [{ productName: 'ماوس لاسلكي', quantity: 1, price: 350 }, { productName: 'لوحة مفاتيح', quantity: 1, price: 600 }], total: 950, moderatorId: 'usr_3', moderatorName: 'علي حسن', courierId: 'usr_5', courierName: 'عمر إبراهيم', createdAt: '2023-10-25T10:00:00Z', updatedAt: '2023-10-26T15:30:00Z' },
  { id: 'ORD-002', customerName: 'نادية السيد', customerPhone: '01123456789', customerAddress: '456 شارع التحرير، الجيزة', zoning: 'الجيزة', status: 'تم الشحن', items: [{ productName: 'شاشة', quantity: 1, price: 4500 }], total: 4500, moderatorId: 'usr_4', moderatorName: 'فاطمة أحمد', courierId: 'usr_5', courierName: 'عمر إبراهيم', createdAt: '2023-10-25T11:30:00Z', updatedAt: '2023-10-25T18:00:00Z' },
  { id: 'ORD-003', customerName: 'يوسف منصور', customerPhone: '01234567890', customerAddress: '789 شارع عباس، الإسكندرية', zoning: 'الإسكندرية', status: 'قيد المعالجة', items: [{ productName: 'حامل لابتوب', quantity: 2, price: 400 }], total: 800, moderatorId: 'usr_3', moderatorName: 'علي حسن', createdAt: '2023-10-26T09:00:00Z', updatedAt: '2023-10-26T11:00:00Z' },
  { id: 'ORD-004', customerName: 'عائشة عبدالله', customerPhone: '01543210987', customerAddress: '101 طريق الكورنيش، الإسكندرية', zoning: 'الإسكندرية', status: 'قيد الانتظار', items: [{ productName: 'موزع USB-C', quantity: 1, price: 750 }], total: 750, moderatorId: 'usr_4', moderatorName: 'فاطمة أحمد', createdAt: '2023-10-27T14:00:00Z', updatedAt: '2023-10-27T14:00:00Z' },
  { id: 'ORD-005', customerName: 'محمد صلاح', customerPhone: '01098765432', customerAddress: '21 شارع جمال عبد الناصر، الجيزة', zoning: 'الجيزة', status: 'ملغي', items: [{ productName: 'كاميرا ويب', quantity: 1, price: 1200 }], total: 1200, moderatorId: 'usr_3', moderatorName: 'علي حسن', createdAt: '2023-10-24T16:00:00Z', updatedAt: '2023-10-25T09:00:00Z' },
  { id: 'ORD-006', customerName: 'هناء عادل', customerPhone: '01187654321', customerAddress: '32 طريق صلاح سالم، القاهرة', zoning: 'القاهرة', status: 'مرتجع', items: [{ productName: 'هارد SSD خارجي 1 تيرابايت', quantity: 1, price: 2500 }], total: 2500, moderatorId: 'usr_4', moderatorName: 'فاطمة أحمد', courierId: 'usr_6', courierName: 'ليلى مصطفى', createdAt: '2023-10-22T12:00:00Z', updatedAt: '2023-10-24T13:00:00Z' },
  { id: 'ORD-007', customerName: 'سامي محمود', customerPhone: '01276543210', customerAddress: '55 شارع الحجاز، القاهرة', zoning: 'القاهرة', status: 'لم يرد', items: [{ productName: 'سماعة ألعاب', quantity: 1, price: 1800 }], total: 1800, moderatorId: 'usr_3', moderatorName: 'علي حسن', courierId: 'usr_5', courierName: 'عمر إبراهيم', createdAt: '2023-10-23T10:00:00Z', updatedAt: '2023-10-24T11:00:00Z' },
  { id: 'ORD-008', customerName: 'ريم طارق', customerPhone: '01065432109', customerAddress: '88 شارع فيصل، الجيزة', zoning: 'الجيزة', status: 'تم التوصيل', items: [{ productName: 'كرسي مريح', quantity: 1, price: 6000 }], total: 6000, moderatorId: 'usr_4', moderatorName: 'فاطمة أحمد', courierId: 'usr_6', courierName: 'ليلى مصطفى', createdAt: '2023-10-21T15:00:00Z', updatedAt: '2023-10-22T18:00:00Z' }
];

export const mockCommissionRules: CommissionRule[] = [
    { id: 'cr_1', type: 'بيع', amount: 50, fromDate: '2024-01-01', toDate: '2024-01-31' },
    { id: 'cr_2', type: 'تسليم', amount: 10, fromDate: '2024-01-01', toDate: '2024-01-31' },
    { id: 'cr_3', type: 'إرجاع', amount: -20, fromDate: '2024-01-01', toDate: '2024-01-31' },
    { id: 'cr_4', type: 'بيع', amount: 55, fromDate: '2024-02-01', toDate: '2024-02-29' },
];

export const mockProducts: Product[] = [
  { id: 'prod_1', name: 'ماوس لاسلكي', price: 350, sku: 'MO-WL-01', isActive: true, createdAt: '2023-01-15' },
  { id: 'prod_2', name: 'لوحة مفاتيح ميكانيكية', price: 600, sku: 'KB-MECH-05', isActive: true, createdAt: '2023-01-20' },
  { id: 'prod_3', name: 'شاشة 27 بوصة', price: 4500, sku: 'MON-27-QHD-01', isActive: false, createdAt: '2023-02-10' },
  { id: 'prod_4', name: 'حامل لابتوب ألومنيوم', price: 400, sku: 'LS-ALU-02', isActive: true, createdAt: '2023-03-01' },
  { id: 'prod_5', name: 'موزع USB-C', price: 750, sku: 'HUB-USBC-08', isActive: true, createdAt: '2023-03-05' },
  { id: 'prod_6', name: 'كاميرا ويب 4K', price: 1200, sku: 'WC-4K-PRO', isActive: true, createdAt: '2023-04-11' },
  { id: 'prod_7', name: 'هارد SSD خارجي 1 تيرابايت', price: 2500, sku: 'SSD-EXT-1TB-01', isActive: false, createdAt: '2023-04-22' },
  { id: 'prod_8', name: 'سماعة ألعاب لاسلكية', price: 1800, sku: 'HP-GM-WL-03', isActive: true, createdAt: '2023-05-30' },
  { id: 'prod_9', name: 'كرسي مكتب مريح', price: 6000, sku: 'CH-ERG-01', isActive: true, createdAt: '2023-06-15' },
];
