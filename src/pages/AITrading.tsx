import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navbar } from '@/components/layout/Navbar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AITrading() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (userMessage: Message) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });

      if (!resp.ok) {
        if (resp.status === 429) {
          toast({
            title: "Rate Limit",
            description: "Too many requests. Please wait a moment.",
            variant: "destructive",
          });
          return;
        }
        if (resp.status === 402) {
          toast({
            title: "Credits Required",
            description: "Please add credits to continue using AI.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to start stream');
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let assistantContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMsg = newMessages[newMessages.length - 1];
                if (lastMsg?.role === 'assistant') {
                  newMessages[newMessages.length - 1] = { ...lastMsg, content: assistantContent };
                } else {
                  newMessages.push({ role: 'assistant', content: assistantContent });
                }
                return newMessages;
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to communicate with AI. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    await streamChat(userMessage);
  };

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-black via-slate-950 to-black text-gray-100 flex-col">
      <Navbar />
      
      <div className="flex-1 container mx-auto px-6 py-8 flex flex-col max-w-5xl">
        <div className="glass rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-accent" />
            <div>
              <h1 className="text-2xl font-bold text-gradient">AI Trading Assistant</h1>
              <p className="text-sm text-muted-foreground">Your elite crypto trading advisor</p>
            </div>
          </div>
        </div>

        <Card className="flex-1 glass-strong border-primary/20 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12 space-y-4">
                  <Sparkles className="w-16 h-16 mx-auto text-accent/50" />
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Ready to analyze markets</h2>
                    <p className="text-muted-foreground mt-2">Ask me anything about crypto trading, market analysis, or strategies</p>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-6">
                    {['Analyze BTC trend', 'Best indicators for day trading?', 'Explain support levels'].map((q) => (
                      <Button
                        key={q}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setInput(q);
                        }}
                        className="glass-strong"
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'glass-strong border border-border/50'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="glass-strong border border-border/50 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  </div>
                </div>
              )}
              
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border/40 p-4">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask about markets, strategies, or analysis..."
                className="flex-1 glass-strong"
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-6"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
