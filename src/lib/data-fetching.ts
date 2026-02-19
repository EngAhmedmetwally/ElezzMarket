
import { ref, get, type Database } from "firebase/database";
import type { Order } from "./types";

export async function fetchOrdersByDateRange(
  database: Database,
  fromDate: Date,
  toDate: Date
): Promise<Order[]> {
  const start = new Date(fromDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  const monthYearKeys = new Set<string>();
  let current = new Date(start);
  while (current <= end) {
    const month = (current.getMonth() + 1).toString().padStart(2, '0');
    const year = current.getFullYear();
    monthYearKeys.add(`${month}-${year}`);
    
    // Move to the next month
    if (current.getMonth() === 11) {
        current = new Date(current.getFullYear() + 1, 0, 1);
    } else {
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
  }

  // Ensure at least one key is present if range is within a single month
  if (monthYearKeys.size === 0) {
    const month = (start.getMonth() + 1).toString().padStart(2, '0');
    const year = start.getFullYear();
    monthYearKeys.add(`${month}-${year}`);
  }

  const promises = Array.from(monthYearKeys).map(key => get(ref(database, `orders/${key}`)));
  const snapshots = await Promise.all(promises);

  const fetchedOrders: Order[] = [];
  snapshots.forEach(monthSnapshot => {
    if (monthSnapshot.exists()) {
      const ordersByDay = monthSnapshot.val();
      Object.keys(ordersByDay).forEach(day => {
        const orders = ordersByDay[day];
        Object.keys(orders).forEach(orderId => {
          const orderData = orders[orderId];
          if (!orderData.createdAt) return;
          const orderDate = new Date(orderData.createdAt);
          if (orderDate >= start && orderDate <= end) {
            const path = `${monthSnapshot.key}/${day}`;
            fetchedOrders.push({ ...orderData, id: orderId, path });
          }
        });
      });
    }
  });
  
  return fetchedOrders;
}
