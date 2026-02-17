"use client";

import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const data = [
  { name: "Delivered", value: 400, fill: "hsl(var(--chart-2))" },
  { name: "Shipped", value: 300, fill: "hsl(var(--chart-3))" },
  { name: "Pending", value: 200, fill: "hsl(var(--chart-4))" },
  { name: "Returned", value: 100, fill: "hsl(var(--chart-5))" },
];

const chartConfig = {
    orders: {
        label: "Orders"
    },
    Delivered: {
        label: "Delivered",
        color: "hsl(var(--chart-2))",
    },
    Shipped: {
        label: "Shipped",
        color: "hsl(var(--chart-3))",
    },
    Pending: {
        label: "Pending",
        color: "hsl(var(--chart-4))",
    },
    Returned: {
        label: "Returned",
        color: "hsl(var(--chart-5))",
    },
}

export function OrdersByStatusChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart>
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={60}
              paddingAngle={5}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
