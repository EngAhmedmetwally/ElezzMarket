
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

  const pathsToFetch: { dbPath: string; orderPath: string }[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');
    const monthYear = `${month}-${year}`;
    const orderPath = `${monthYear}/${day}`;
    const dbPath = `orders/${orderPath}`;
    pathsToFetch.push({ dbPath, orderPath });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const promises = pathsToFetch.map(p => get(ref(database, p.dbPath)));
  const snapshots = await Promise.all(promises);

  const fetchedOrders: Order[] = [];
  snapshots.forEach((daySnapshot, index) => {
    if (daySnapshot.exists()) {
      const ordersOnDay = daySnapshot.val();
      const { orderPath } = pathsToFetch[index];
      Object.keys(ordersOnDay).forEach(orderId => {
        const orderData = ordersOnDay[orderId];
        // Double-check the date to ensure consistency, though fetching by day should be sufficient.
        if (orderData.createdAt) {
          const orderDate = new Date(orderData.createdAt);
          if (orderDate >= start && orderDate <= end) {
            fetchedOrders.push({ ...orderData, id: orderId, path: orderPath });
          }
        }
      });
    }
  });

  return fetchedOrders;
}
