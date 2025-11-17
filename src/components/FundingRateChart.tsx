import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FundingRateChartProps {
  symbol: string;
}

interface FundingData {
  history: Array<{
    time: number;
    rate: number;
  }>;
}

export const FundingRateChart = ({ symbol }: FundingRateChartProps) => {
  const [data, setData] = useState<FundingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: fundingData, error } = await supabase.functions.invoke('fetch-funding-rate', {
          body: { symbol, interval: 'h1' }
        });

        if (error) throw error;
        setData(fundingData);
      } catch (error) {
        console.error('Error fetching funding rate chart:', error);
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

  if (!data || !data.history) return null;

  const chartData = data.history.map(item => ({
    time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    rate: (item.rate * 100).toFixed(4),
    rateValue: item.rate * 100
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Funding Rate (24h)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="fundingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="time" 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
          />
          <YAxis 
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--popover))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            labelStyle={{ color: 'hsl(var(--popover-foreground))' }}
            formatter={(value: number) => [`${value}%`, 'Funding Rate']}
          />
          <Area 
            type="monotone" 
            dataKey="rateValue" 
            stroke="hsl(var(--primary))" 
            fill="url(#fundingGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};
