
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

  // Fetch the entire /orders node to handle the mixed (nested and flat) data structure.
  // This is necessary to see existing data but is less performant than querying a purely flat structure.
  const ordersRef = ref(database, 'orders');
  const snapshot = await get(ordersRef);
  const allOrders: Order[] = [];

  if (!snapshot.exists()) {
    return [];
  }

  const ordersData = snapshot.val();
  
  Object.keys(ordersData).forEach(key1 => { // key1 can be an orderId (flat) or a month-year string (nested)
    const node1 = ordersData[key1];
    if (!node1 || typeof node1 !== 'object') return;

    // Heuristic: If it has 'createdAt', it's probably a flat order object.
    if (typeof node1.createdAt === 'string') {
      const order = node1;
      const orderDate = new Date(order.createdAt);
      if (orderDate >= start && orderDate <= end) {
        allOrders.push({ ...order, id: key1 });
      }
    } 
    // Otherwise, assume it's a nested structure (e.g., "02-2026")
    else {
      Object.keys(node1).forEach(key2 => { // key2 is the day (e.g., "19")
        const node2 = node1[key2];
        if (!node2 || typeof node2 !== 'object') return;

        // node2 can be an object of orders or an array (if keys are numeric)
        Object.keys(node2).forEach(key3 => { // key3 is the orderId or array index
          const order = node2[key3];
          // Check if it's a valid order object
          if (order && typeof order === 'object' && typeof order.createdAt === 'string') {
            const orderDate = new Date(order.createdAt);
            if (orderDate >= start && orderDate <= end) {
              // The order object from the user's JSON already has an 'id' field.
              // If not, we should use key3. Let's be safe.
              allOrders.push({ ...order, id: order.id || key3 });
            }
          }
        });
      });
    }
  });

  return allOrders;
}
