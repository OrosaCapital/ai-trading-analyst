import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Database } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface SymbolAIChatProps {
  symbolData: any;
}

export function SymbolAIChat({ symbolData }: SymbolAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Dashboard & Data Technical Assistant. I help maintain 99.9% uptime by troubleshooting system issues. Ask me about errors, performance, or API problems.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [includeSystemLogs, setIncludeSystemLogs] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/symbol-ai-chat`;
    const LOGS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-system-logs`;

    try {
      // Fetch system logs if enabled
      let systemLogs = null;
      if (includeSystemLogs) {
        try {
          const logsResponse = await fetch(LOGS_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ timeRangeMinutes: 60 }),
          });
          
          if (logsResponse.ok) {
            systemLogs = await logsResponse.json();
            console.log("System logs fetched:", systemLogs.summary);
          } else {
            console.error("Failed to fetch system logs:", await logsResponse.text());
          }
        } catch (err) {
          console.error("Error fetching logs:", err);
        }
      }

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          symbolData: {
            symbol: symbolData.symbol,
            currentPrice: symbolData.currentPrice,
            priceChange24h: symbolData.priceChange24h,
            volume24h: symbolData.volume24h,
            marketCap: symbolData.marketCap,
            circulatingSupply: symbolData.circulatingSupply,
            rank: symbolData.rank,
            fundingRate: symbolData.fundingRate,
            fundingRateTrend: symbolData.fundingRateTrend,
            openInterest: symbolData.openInterest,
            openInterestChange: symbolData.openInterestChange,
            longShortRatio: symbolData.longShortRatio,
            liquidations24h: symbolData.liquidations24h,
            takerBuyVolume: symbolData.takerBuyVolume,
            takerSellVolume: symbolData.takerSellVolume,
            fearGreedIndex: symbolData.fearGreedIndex,
            fearGreedLabel: symbolData.fearGreedLabel,
            rsi: symbolData.rsi,
            aiDecision: symbolData.aiDecision,
            aiConfidence: symbolData.aiConfidence,
          },
          logs: systemLogs,
        }),
      });

      if (response.status === 429) {
        toast.error("Rate limit exceeded. Please try again in a moment.");
        return;
      }

      if (response.status === 402) {
        toast.error("AI credits exhausted. Please add credits to continue.");
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let assistantContent = "";

      // Add empty assistant message that we'll update
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((msg, idx) =>
                  idx === prev.length - 1
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get AI response. Please try again.");
      // Remove the empty assistant message on error
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await streamChat(userMessage);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[500px] border border-border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Technical Support Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIncludeSystemLogs(!includeSystemLogs)}
          className={includeSystemLogs ? "bg-primary/10" : ""}
        >
          <Database className="w-4 h-4 mr-2" />
          {includeSystemLogs ? "Logs ON" : "Logs OFF"}
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <User className="h-4 w-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this symbol..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
