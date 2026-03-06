
import type { User, Order, CommissionRule, Product, Customer } from './types';

// This mock data is kept for reference but is no longer used by most application pages.
// Pages now fetch live data from the Firebase Realtime Database.

export const mockUsers: User[] = [
  { id: 'usr_1', name: 'مستخدم مسؤول', username: 'admin', email: 'admin@elezz.com', role: 'Admin', avatarUrl: '/avatars/01.png', status: 'نشط', createdAt: '2023-10-01', orderVisibility: 'all' },
  { id: 'usr_3', name: 'علي حسن', username: 'ali.hassan', email: 'ali.hassan@elezz.com', role: 'Moderator', avatarUrl: '/avatars/03.png', status: 'نشط', createdAt: '2023-10-02', orderVisibility: 'own' },
  { id: 'usr_4', name: 'فاطمة أحمد', username: 'fatima.ahmed', email: 'fatima.ahmed@elezz.com', role: 'Moderator', avatarUrl: '/avatars/04.png', status: 'نشط', createdAt: '2023-10-02', orderVisibility: 'own' },
  { id: 'usr_5', name: 'عمر إبراهيم', username: 'omar.ibrahim', email: 'omar.ibrahim@elezz.com', role: 'Courier', avatarUrl: '/avatars/05.png', status: 'نشط', createdAt: '2023-10-03', orderVisibility: 'own' },
  { id: 'usr_6', name: 'ليلى مصطفى', username: 'layla.mustafa', email: 'layla.mustafa@elezz.com', role: 'Courier', avatarUrl: '/avatars/06.png', status: 'معطل', createdAt: '2023-10-03', orderVisibility: 'own' },
];

export const mockOrders: Order[] = [];

export const mockCommissionRules: CommissionRule[] = [
    { id: 'تم التسجيل', amount: 5 },
    { id: 'مكتمل', amount: 5 },
];

export const mockProducts: Product[] = [];

export const mockCustomers: Customer[] = [];
