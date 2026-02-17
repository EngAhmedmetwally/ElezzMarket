
export type UserRole = "Admin" | "Moderator" | "Courier";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  status: "نشط" | "معطل";
  createdAt: string;
};

export type OrderStatus =
  | "تم الحجز"
  | "تم الارسال"
  | "تم التسليم"
  | "ملغي"
  | "مرتجع"
  | "لم يرد";

export type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
};

export type StatusHistoryItem = {
  status: OrderStatus;
  notes?: string;
  createdAt: string;
  userName: string;
};

export type Order = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  zoning: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  commission?: number;
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
  type: 'بيع' | 'تسليم' | 'إرجاع';
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
};
