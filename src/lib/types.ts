

export type UserRole = "Admin" | "Moderator" | "Courier";

export type User = {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  status: "نشط" | "معطل";
  createdAt: string;
  orderVisibility?: "all" | "own";
  permissions?: any; // Keeping this flexible for now
};

export type OrderStatus =
  | "تم الحجز"
  | "تم الارسال"
  | "تم التسليم"
  | "ملغي";

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  weight?: number;
};

export type StatusHistoryItem = {
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  userName: string;
};

export type Order = {
  id: string;
  path?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  zoning: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  salesCommission?: number;
  deliveryCommission?: number;
  moderatorId: string;
  moderatorName: string;
  courierId?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistoryItem[];
};

export type CommissionRule = {
  id: string;
  type: 'بيع' | 'تسليم';
  amount: number;
  fromDate: string;
  toDate: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  sku: string;
  isActive: boolean;
  createdAt: string;
  salesCount?: number;
  weight?: number;
};

export type Customer = {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  zoning: string;
};
