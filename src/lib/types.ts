
export type UserRole = "Admin" | "Moderator" | "Courier";

export type Permissions = {
  dashboard: { view: boolean };
  orders: { view: boolean; add: boolean; edit: boolean; delete: boolean; editStatus: boolean; cancel: boolean; cancelCompleted: boolean; };
  customers: { view: boolean; };
  products: { view: boolean; add: boolean; edit: boolean; delete: boolean; };
  users: { view: boolean; add: boolean; edit: boolean; delete: boolean; };
  shipping: { view: boolean; add: boolean; edit: boolean; delete: boolean; };
  onHoldOrders: { view: boolean; };
  commissions: { view: boolean; edit: boolean; };
  adjustments: { view: boolean; add: boolean; edit: boolean; delete: boolean; };
  settings: { view: boolean; edit: boolean; };
  reports: {
    commissions: { view: boolean };
    products: { view: boolean };
    staff: { view: boolean };
    daily: { view: boolean };
    shipping: { view: boolean };
    preparationTime: { view: boolean };
    cancelled: { view: boolean };
    courierCollection: { view: boolean };
    adjustments: { view: boolean };
  };
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
  | "ملغي"
  | "معلق";

export type OrderStatusConfig = {
  id: string; // The status name itself, e.g., "تم التسجيل"
  name: string;
  level: number;
  isGeneral: boolean;
};

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

export type OrderEditHistoryItem = {
    userId: string;
    userName: string;
    createdAt: string;
    description: string;
};

export type PaymentMethod = "نقدي عند الاستلام" | "انستا باى" | "فودافون كاش" | "اورانج كاش";

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
  paymentMethod: PaymentMethod;
  total: number;
  shippingCost?: number;
  totalCommission?: number;
  moderatorId: string;
  moderatorName: string;
  moderatorUsername?: string;
  courierId?: string;
  courierName?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: Record<string, StatusHistoryItem>;
  editHistory?: Record<string, OrderEditHistoryItem>;
  notes?: string;
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

export type AdjustmentType = "bonus" | "discount";

export type Adjustment = {
  id: string;
  userId: string;
  userName: string;
  type: AdjustmentType;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
};

export type ProductHistoryItem = {
    userId: string;
    userName:string;
    createdAt: string;
    field: 'price' | 'weight';
    oldValue: number;
    newValue: number;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  sku: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  salesCount?: number;
  soldWeight?: number;
  weight?: number;
  history?: Record<string, ProductHistoryItem>;
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
  logoSize?: number;
  headerText?: string;
  showOrderId?: boolean;
  showDate?: boolean;
  showCustomerName?: boolean;
  showFacebookName?: boolean;
  showCustomerPhone?: boolean;
  showCustomerAddress?: boolean;
  showPaymentMethod?: boolean;
  showItemsSubtotal?: boolean;
  showShippingCost?: boolean;
  showGrandTotal?: boolean;
  footerText?: string;
  mandatoryFooterText?: string;
  // for items table
  showItemPrice?: boolean;
  showItemSubtotal?: boolean;
  showItemWeight?: boolean;
  showCourierName?: boolean;
  showModeratorName?: boolean;
  showModeratorUsername?: boolean;
  showTotalItems?: boolean;
  showTotalWeight?: boolean;
};

export type AppSettings = {
  maxUsers: number;
  autoGenerateOrderId?: boolean;
};
