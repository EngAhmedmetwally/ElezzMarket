import { cn } from "@/lib/utils";
import type { OrderStatus, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Status = OrderStatus | User['status'];

const statusColors: Record<Status, string> = {
  // Order Statuses
  Pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300 border-yellow-300/50 dark:border-yellow-700/80",
  Confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/80",
  Processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300 border-indigo-300/50 dark:border-indigo-700/80",
  Shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-300 border-purple-300/50 dark:border-purple-700/80",
  Delivered: "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300 border-green-300/50 dark:border-green-700/80",
  Cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80",
  Returned: "bg-red-100 text-red-800 dark:bg-red-900/70 dark:text-red-300 border-red-300/50 dark:border-red-700/80",
  "No Answer": "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-300 border-orange-300/50 dark:border-orange-700/80",
  // User Statuses
  Active: "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300 border-green-300/50 dark:border-green-700/80",
  Disabled: "bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <Badge
      className={cn(
        "font-medium",
        statusColors[status] || "bg-gray-100 text-gray-800"
      )}
    >
      {status}
    </Badge>
  );
}
