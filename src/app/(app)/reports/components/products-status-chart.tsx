
"use client"
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useLanguage } from "@/components/language-provider";

const chartConfig = {
    value: {
        label: "Products",
    },
    active: { label: "متوفر", color: "hsl(var(--chart-2))" },
    inactive: { label: "نفذ", color: "hsl(var(--chart-5))" },
}

interface ProductsStatusChartProps {
    data: { name: string; value: number, fill: string }[];
}

export function ProductsStatusChart({ data }: ProductsStatusChartProps) {
    const { language } = useLanguage();
    const chartTitle = language === 'ar' ? 'حالة المنتجات' : 'Products Status';

    return (
        <Card>
            <CardHeader>
                <CardTitle>{chartTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
                    <PieChart>
                        <Tooltip content={<ChartTooltipContent hideLabel />} />
                        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} labelLine={false} label>
                            {data.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                            ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
