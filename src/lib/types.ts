export type UserRole = "Admin" | "Operations" | "Moderator" | "Courier";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  status: "Active" | "Disabled";
  createdAt: string;
};

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "No Answer";

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
  type: 'Sale' | 'Delivery' | 'Return';
  amount: number;
  fromDate: string;
  toDate: string;
};
