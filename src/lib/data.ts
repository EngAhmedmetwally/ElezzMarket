
import type { User, Order, CommissionRule, Product, Customer } from './types';

// This mock data is kept for reference but is no longer used by most application pages.
// Pages now fetch live data from the Firebase Realtime Database.

export const mockUsers: User[] = [
  { id: 'usr_1', name: 'مستخدم مسؤول', email: 'admin@elezz.com', role: 'Admin', avatarUrl: '/avatars/01.png', status: 'نشط', createdAt: '2023-10-01', orderVisibility: 'all' },
  { id: 'usr_3', name: 'علي حسن', email: 'ali.hassan@elezz.com', role: 'Moderator', avatarUrl: '/avatars/03.png', status: 'نشط', createdAt: '2023-10-02', orderVisibility: 'own' },
  { id: 'usr_4', name: 'فاطمة أحمد', email: 'fatima.ahmed@elezz.com', role: 'Moderator', avatarUrl: '/avatars/04.png', status: 'نشط', createdAt: '2023-10-02', orderVisibility: 'own' },
  { id: 'usr_5', name: 'عمر إبراهيم', email: 'omar.ibrahim@elezz.com', role: 'Courier', avatarUrl: '/avatars/05.png', status: 'نشط', createdAt: '2023-10-03', orderVisibility: 'own' },
  { id: 'usr_6', name: 'ليلى مصطفى', email: 'layla.mustafa@elezz.com', role: 'Courier', avatarUrl: '/avatars/06.png', status: 'معطل', createdAt: '2023-10-03', orderVisibility: 'own' },
];

export const mockOrders: Order[] = [];

export const mockCommissionRules: CommissionRule[] = [
    { id: 'sale', type: 'بيع', amount: 5, fromDate: '2024-01-01', toDate: '2024-12-31' },
    { id: 'delivery', type: 'تسليم', amount: 5, fromDate: '2024-01-01', toDate: '2024-12-31' },
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

export const mockCustomers: Customer[] = [];
