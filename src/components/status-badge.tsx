
import { cn } from "@/lib/utils";
import type { OrderStatus, User } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

type Status = OrderStatus | User['status'];

const statusColors: Record<string, string> = {
  // Order Statuses
  "تم التسجيل": "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-300 border-blue-300/50 dark:border-blue-700/80",
  "قيد التجهيز": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/70 dark:text-yellow-300 border-yellow-300/50 dark:border-yellow-700/80",
  "تم الشحن": "bg-orange-200 text-orange-900 dark:bg-orange-800/70 dark:text-orange-200 border-orange-400/50 dark:border-orange-600/80",
  "مكتمل": "bg-green-100 text-green-800 dark:bg-green-900/70 dark:text-green-300 border-green-300/50 dark:border-green-700/80",
  "ملغي": "bg-slate-200 text-slate-800 dark:bg-slate-800/70 dark:text-slate-300 border-slate-400/50 dark:border-slate-600/80",
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
