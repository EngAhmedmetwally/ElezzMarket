
import { cn } from "@/lib/utils";
import type { OrderStatus, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Status = OrderStatus | User['status'];

const statusColors: Record<string, string> = {
  // Order Statuses
  "تم التسجيل": "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/80",
  "قيد التجهيز": "bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-300 border-purple-300/50 dark:border-purple-700/80",
  "تم التسليم للمندوب": "bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-300 border-orange-300/50 dark:border-orange-700/80",
  "تم التسليم للعميل": "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300 border-green-300/50 dark:border-green-700/80",
  "ملغي": "bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80",
  // User Statuses
  "نشط": "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300 border-green-300/50 dark:border-green-700/80",
  "معطل": "bg-gray-100 text-gray-800 dark:bg-gray-800/70 dark:text-gray-300 border-gray-300/50 dark:border-gray-600/80",
};

export function StatusBadge({ status, className }: { status: Status | string, className?: string }) {
  return (
    <Badge
      className={cn(
        "font-medium",
        statusColors[status] || "bg-gray-100 text-gray-800",
        className
      )}
    >
      {status}
    </Badge>
  );
}
