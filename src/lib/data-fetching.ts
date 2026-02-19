
import { ref, get, type Database, query, orderByChild, startAt, endAt } from "firebase/database";
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

  const ordersRef = ref(database, 'orders');
  const dateQuery = query(
    ordersRef,
    orderByChild('createdAt'),
    startAt(start.toISOString()),
    endAt(end.toISOString())
  );

  const snapshot = await get(dateQuery);
  const fetchedOrders: Order[] = [];

  if (snapshot.exists()) {
    const ordersData = snapshot.val();
    Object.keys(ordersData).forEach(orderId => {
      // The path property is no longer relevant with the flattened structure
      fetchedOrders.push({ ...ordersData[orderId], id: orderId });
    });
  }

  return fetchedOrders;
}
