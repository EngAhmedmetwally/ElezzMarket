
export type UserRole = "Admin" | "Operations" | "Moderator" | "Courier";

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
  | "قيد الانتظار"
  | "مؤكد"
  | "قيد المعالجة"
  | "تم الشحن"
  | "تم التوصيل"
  | "ملغي"
  | "مرتجع"
  | "لم يرد";

export type OrderItem = {
  productName: string;
  quantity: number;
  price: number;
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
  moderatorId: string;
  moderatorName: string;
  courierId?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
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
