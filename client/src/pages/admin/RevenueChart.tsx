import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatPrice } from "@/lib/utils";

const chartConfig: ChartConfig = {
  revenue: { label: "Revenue", color: "#4b8385" },
};

// Kept in its own module so the charting library only downloads when the
// dashboard actually draws it, not before the rest of the page can show.
export default function RevenueChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#eeeeee" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} interval={4} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={52} fontSize={11} tickFormatter={(v) => `$${v}`} />
        <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatPrice(Number(value))} labelKey="label" />} />
        <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
