import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface OpenInterestBreakdownProps {
  symbol: string;
}

interface OIData {
  total: {
    value: string;
  };
  byExchange: Array<{
    exchange: string;
    value: string;
    percentage: number;
  }>;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export const OpenInterestBreakdown = ({ symbol }: OpenInterestBreakdownProps) => {
  const [data, setData] = useState<OIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: oiData, error } = await supabase.functions.invoke('fetch-open-interest', {
          body: { symbol }
        });

        if (error) throw error;
        setData(oiData);
      } catch (error) {
        console.error('Error fetching OI data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [symbol]);

  if (loading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-[300px] w-full" />
      </Card>
    );
  }

  if (!data) return null;

  const chartData = data.byExchange.map(ex => ({
    name: ex.exchange,
    value: ex.percentage,
    displayValue: ex.value
  }));

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Open Interest by Exchange</h3>
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{data.total.value}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string, props: any) => [
              `${props.payload.displayValue} (${value.toFixed(1)}%)`,
              name
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Exchange List */}
      <div className="mt-6 space-y-2">
        {data.byExchange.map((ex, idx) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-card/50 rounded">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
              />
              <span className="text-sm font-medium">{ex.exchange}</span>
            </div>
            <div className="text-sm">
              <span className="font-semibold">{ex.value}</span>
              <span className="text-muted-foreground ml-2">({ex.percentage.toFixed(1)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
