
export type UserRole = "Admin" | "Moderator" | "Courier";

export type Permissions = {
  dashboard: { view: boolean };
  orders: { view: boolean; add: boolean; edit: boolean; delete: boolean; editStatus: boolean; cancel: boolean; };
  customers: { view: boolean; };
  users: { view: boolean; add: boolean; edit: boolean; delete: boolean; };
  shipping: { view: boolean; add: boolean; edit: boolean; delete: boolean; };
  commissions: { view: boolean; edit: boolean; };
  settings: { view: boolean; edit: boolean; };
  reports: { view: boolean; };
}

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
  permissions?: Permissions;
  phone1?: string;
  phone2?: string;
};

export type OrderStatus =
  | "تم التسجيل"
  | "قيد التجهيز"
  | "تم الشحن"
  | "مكتمل"
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
  userId: string;
};

export type Order = {
  id: string;
  path?: string;
  customerName: string;
  facebookName?: string;
  customerPhone1: string;
  customerPhone2?: string;
  customerAddress: string;
  zoning: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  shippingCost?: number;
  totalCommission?: number;
  moderatorId: string;
  moderatorName: string;
  courierId?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: Record<string, StatusHistoryItem>;
};

export type CommissionRule = {
  id: string; // Corresponds to OrderStatus
  amount: number;
};

export type Commission = {
  id: string;
  orderId: string;
  userId: string; // Moderator or Courier ID
  orderStatus: OrderStatus;
  amount: number;
  calculationDate: string;
  paymentStatus: 'Calculated' | 'Paid';
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
  facebookName?: string;
  customerPhone1: string;
  customerPhone2?: string;
  customerAddress: string;
  zoning: string;
};

export type ShippingZone = {
  id: string;
  name: string;
  cost: number;
};

export type ReceiptSettings = {
  showLogo?: boolean;
  headerText?: string;
  showOrderId?: boolean;
  showDate?: boolean;
  showCustomerName?: boolean;
  showCustomerPhone?: boolean;
  showCustomerAddress?: boolean;
  showItemsSubtotal?: boolean;
  showShippingCost?: boolean;
  showGrandTotal?: boolean;
  footerText?: string;
  // for items table
  showItemPrice?: boolean;
  showItemSubtotal?: boolean;
  showItemWeight?: boolean;
  showCourierName?: boolean;
};

export type AppSettings = {
  maxUsers: number;
};
    
