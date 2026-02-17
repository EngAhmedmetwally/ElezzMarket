import type { User, Order, CommissionRule } from './types';

export const mockUsers: User[] = [
  { id: 'usr_1', name: 'Admin User', email: 'admin@elezz.com', role: 'Admin', avatarUrl: '/avatars/01.png', status: 'Active', createdAt: '2023-10-01' },
  { id: 'usr_2', name: 'Operations Manager', email: 'ops@elezz.com', role: 'Operations', avatarUrl: '/avatars/02.png', status: 'Active', createdAt: '2023-10-01' },
  { id: 'usr_3', name: 'Ali Hassan', email: 'ali.hassan@elezz.com', role: 'Moderator', avatarUrl: '/avatars/03.png', status: 'Active', createdAt: '2023-10-02' },
  { id: 'usr_4', name: 'Fatima Ahmed', email: 'fatima.ahmed@elezz.com', role: 'Moderator', avatarUrl: '/avatars/04.png', status: 'Active', createdAt: '2023-10-02' },
  { id: 'usr_5', name: 'Omar Ibrahim', email: 'omar.ibrahim@elezz.com', role: 'Courier', avatarUrl: '/avatars/05.png', status: 'Active', createdAt: '2023-10-03' },
  { id: 'usr_6', name: 'Layla Mustafa', email: 'layla.mustafa@elezz.com', role: 'Courier', avatarUrl: '/avatars/06.png', status: 'Disabled', createdAt: '2023-10-03' },
];

export const mockOrders: Order[] = [
  { id: 'ORD-001', customerName: 'Khalid Al-Farsi', customerPhone: '01012345678', customerAddress: '123 Nasr St, Cairo', zoning: 'Cairo', status: 'Delivered', items: [{ productName: 'Wireless Mouse', quantity: 1, price: 350 }, { productName: 'Keyboard', quantity: 1, price: 600 }], total: 950, moderatorId: 'usr_3', moderatorName: 'Ali Hassan', courierId: 'usr_5', courierName: 'Omar Ibrahim', createdAt: '2023-10-25T10:00:00Z', updatedAt: '2023-10-26T15:30:00Z' },
  { id: 'ORD-002', customerName: 'Nadia El-Sayed', customerPhone: '01123456789', customerAddress: '456 Tahrir Ave, Giza', zoning: 'Giza', status: 'Shipped', items: [{ productName: 'Monitor', quantity: 1, price: 4500 }], total: 4500, moderatorId: 'usr_4', moderatorName: 'Fatima Ahmed', courierId: 'usr_5', courierName: 'Omar Ibrahim', createdAt: '2023-10-25T11:30:00Z', updatedAt: '2023-10-25T18:00:00Z' },
  { id: 'ORD-003', customerName: 'Youssef Mansour', customerPhone: '01234567890', customerAddress: '789 Abbas St, Alexandria', zoning: 'Alexandria', status: 'Processing', items: [{ productName: 'Laptop Stand', quantity: 2, price: 400 }], total: 800, moderatorId: 'usr_3', moderatorName: 'Ali Hassan', createdAt: '2023-10-26T09:00:00Z', updatedAt: '2023-10-26T11:00:00Z' },
  { id: 'ORD-004', customerName: 'Aisha Abdullah', customerPhone: '01543210987', customerAddress: '101 Corniche Rd, Alexandria', zoning: 'Alexandria', status: 'Pending', items: [{ productName: 'USB-C Hub', quantity: 1, price: 750 }], total: 750, moderatorId: 'usr_4', moderatorName: 'Fatima Ahmed', createdAt: '2023-10-27T14:00:00Z', updatedAt: '2023-10-27T14:00:00Z' },
  { id: 'ORD-005', customerName: 'Mohammed Salah', customerPhone: '01098765432', customerAddress: '21 Gamal Abdel Nasser St, Giza', zoning: 'Giza', status: 'Cancelled', items: [{ productName: 'Webcam', quantity: 1, price: 1200 }], total: 1200, moderatorId: 'usr_3', moderatorName: 'Ali Hassan', createdAt: '2023-10-24T16:00:00Z', updatedAt: '2023-10-25T09:00:00Z' },
  { id: 'ORD-006', customerName: 'Hana Adel', customerPhone: '01187654321', customerAddress: '32 Salah Salem Rd, Cairo', zoning: 'Cairo', status: 'Returned', items: [{ productName: 'External SSD 1TB', quantity: 1, price: 2500 }], total: 2500, moderatorId: 'usr_4', moderatorName: 'Fatima Ahmed', courierId: 'usr_6', courierName: 'Layla Mustafa', createdAt: '2023-10-22T12:00:00Z', updatedAt: '2023-10-24T13:00:00Z' },
  { id: 'ORD-007', customerName: 'Sami Mahmoud', customerPhone: '01276543210', customerAddress: '55 Hegaz St, Cairo', zoning: 'Cairo', status: 'No Answer', items: [{ productName: 'Gaming Headset', quantity: 1, price: 1800 }], total: 1800, moderatorId: 'usr_3', moderatorName: 'Ali Hassan', courierId: 'usr_5', courierName: 'Omar Ibrahim', createdAt: '2023-10-23T10:00:00Z', updatedAt: '2023-10-24T11:00:00Z' },
  { id: 'ORD-008', customerName: 'Reem Tarek', customerPhone: '01065432109', customerAddress: '88 Faisal St, Giza', zoning: 'Giza', status: 'Delivered', items: [{ productName: 'Ergonomic Chair', quantity: 1, price: 6000 }], total: 6000, moderatorId: 'usr_4', moderatorName: 'Fatima Ahmed', courierId: 'usr_6', courierName: 'Layla Mustafa', createdAt: '2023-10-21T15:00:00Z', updatedAt: '2023-10-22T18:00:00Z' }
];

export const mockCommissionRules: CommissionRule[] = [
    { id: 'cr_1', type: 'Sale', amount: 50, fromDate: '2024-01-01', toDate: '2024-01-31' },
    { id: 'cr_2', type: 'Delivery', amount: 10, fromDate: '2024-01-01', toDate: '2024-01-31' },
    { id: 'cr_3', type: 'Return', amount: -20, fromDate: '2024-01-01', toDate: '2024-01-31' },
    { id: 'cr_4', type: 'Sale', amount: 55, fromDate: '2024-02-01', toDate: '2024-02-29' },
];
