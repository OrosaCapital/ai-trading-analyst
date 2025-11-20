import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageCircle, Send, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AdminSupportChatProps {
  systemAlerts?: any[];
}

export const AdminSupportChat = ({ systemAlerts = [] }: AdminSupportChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare system context with current alerts
      const systemContext = {
        alerts: systemAlerts.map(alert => ({
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
        })),
        timestamp: new Date().toISOString(),
      };

      const { data, error } = await supabase.functions.invoke("admin-support-chat", {
        body: {
          message: input,
          systemContext,
        },
      });

      if (error) throw error;

      if (data?.success && data?.response) {
        const assistantMessage: Message = {
          role: "assistant",
          content: typeof data.response === 'string' 
            ? data.response 
            : JSON.stringify(data.response, null, 2),
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error("Invalid response from support system");
      }
    } catch (error) {
      console.error("Support chat error:", error);
      toast.error("Failed to send message. Please try again.");
      
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm unable to respond right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAlertSummary = async () => {
    if (systemAlerts.length === 0) {
      toast.info("No system alerts to send");
      return;
    }

    const alertSummary = `System Status Report:\n${systemAlerts
      .map((alert, i) => `${i + 1}. [${alert.severity}] ${alert.type}: ${alert.message}`)
      .join("\n")}`;

    setInput(alertSummary);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Admin Support Chat
        </CardTitle>
        {systemAlerts.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={sendAlertSummary}
            className="mt-2"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Send Alert Summary ({systemAlerts.length})
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Send system errors and warnings to get help</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Describe the issue or paste error messages..."
            className="min-h-[60px] resize-none"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
