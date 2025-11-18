import { useState } from "react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { CheckCircle2, XCircle, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface APITestResult {
  name: string;
  status: "idle" | "testing" | "success" | "error";
  message?: string;
  responseTime?: number;
}

export function APIConnectionTest() {
  const { toast } = useToast();
  const [results, setResults] = useState<APITestResult[]>([
    { name: "CoinMarketCap API", status: "idle" },
    { name: "Coinglass API", status: "idle" },
    { name: "Tatum API", status: "idle" },
    { name: "API Ninjas", status: "idle" },
  ]);

  const testAPI = async (apiName: string) => {
    setResults((prev) =>
      prev.map((r) => (r.name === apiName ? { ...r, status: "testing" } : r))
    );

    const startTime = Date.now();
    let edgeFunction = "";
    let payload = {};

    try {
      switch (apiName) {
        case "CoinMarketCap API":
          edgeFunction = "fetch-cmc-quotes";
          payload = { symbol: "BTC" };
          break;
        case "Coinglass API":
          edgeFunction = "fetch-funding-rate";
          payload = { symbol: "BTCUSDT" };
          break;
        case "Tatum API":
          edgeFunction = "fetch-tatum-price";
          payload = { symbol: "BTC" };
          break;
        case "API Ninjas":
          edgeFunction = "fetch-rsi";
          payload = { symbol: "BTCUSDT" };
          break;
      }

      const { data, error } = await supabase.functions.invoke(edgeFunction, {
        body: payload,
      });

      const responseTime = Date.now() - startTime;

      if (error) throw error;

      if (data?.unavailable || data?.error) {
        throw new Error(data.error || "API returned unavailable status");
      }

      setResults((prev) =>
        prev.map((r) =>
          r.name === apiName
            ? {
                ...r,
                status: "success",
                message: `Response: ${responseTime}ms`,
                responseTime,
              }
            : r
        )
      );
    } catch (error: any) {
      setResults((prev) =>
        prev.map((r) =>
          r.name === apiName
            ? {
                ...r,
                status: "error",
                message: error.message || "Connection failed",
              }
            : r
        )
      );
    }
  };

  const testAllAPIs = async () => {
    toast({
      title: "Testing APIs",
      description: "Running connection tests for all APIs...",
    });

    for (const result of results) {
      await testAPI(result.name);
    }

    toast({
      title: "Tests Complete",
      description: "All API connection tests finished.",
    });
  };

  return (
    <Card className="font-mono">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">API Connection Tests</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={testAllAPIs}
          disabled={results.some((r) => r.status === "testing")}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Test All
        </Button>
      </div>
      <div className="space-y-3">
        {results.map((result) => (
          <div
            key={result.name}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{result.name}</span>
                {result.status === "success" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                )}
                {result.status === "error" && (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {result.status === "testing" && (
                  <Loader2 className="h-4 w-4 text-primary animate-spin" />
                )}
              </div>
              {result.message && (
                <p className="text-xs text-muted-foreground mt-1">
                  {result.message}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => testAPI(result.name)}
              disabled={result.status === "testing"}
            >
              Test
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
