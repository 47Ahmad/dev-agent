import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Send, Copy, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AdvancedChatBoxProps {
  onSendMessage?: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export default function AdvancedChatBox({
  onSendMessage,
  isLoading = false,
  placeholder = "اكتب رسالتك هنا...",
}: AdvancedChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    if (onSendMessage) {
      onSendMessage(inputValue);
    }

    // Add streaming assistant message
    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsStreaming(true);

    // Simulate streaming response
    const mockResponse = `# تحليل طلبك

تم استقبال طلبك بنجاح. إليك التحليل:

## النقاط الرئيسية:
- **النقطة الأولى:** وصف تفصيلي للنقطة الأولى
- **النقطة الثانية:** وصف تفصيلي للنقطة الثانية
- **النقطة الثالثة:** وصف تفصيلي للنقطة الثالثة

## مثال على الكود:
\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

const user: User = {
  id: "123",
  name: "أحمد",
  email: "ahmed@example.com",
};
\`\`\`

## الخطوات التالية:
1. قم بتطبيق الحل المقترح
2. اختبر النتائج
3. قم بالتحسينات اللازمة`;

    // Simulate streaming character by character
    let currentContent = "";
    for (let i = 0; i < mockResponse.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      currentContent += mockResponse[i];
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: currentContent }
            : msg
        )
      );
    }

    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === assistantMessage.id
          ? { ...msg, isStreaming: false }
          : msg
      )
    );
    setIsStreaming(false);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("تم نسخ الكود!");
  };

  const handleRegenerateMessage = (messageId: string) => {
    toast.info("جاري إعادة توليد الرسالة...");
    // TODO: Implement regenerate logic
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleClearHistory = () => {
    setMessages([]);
    toast.success("تم مسح السجل!");
  };

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border/50">
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold">فضاء العمل الذكي</h3>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearHistory}
            className="text-xs"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            مسح السجل
          </Button>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-muted-foreground mb-2">لا توجد رسائل بعد</p>
              <p className="text-sm text-muted-foreground">
                ابدأ محادثة جديدة بكتابة رسالتك أدناه
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md xl:max-w-lg ${
                  message.role === "user"
                    ? "bg-blue-500/20 text-blue-100"
                    : "bg-purple-500/20 text-purple-100"
                } rounded-lg p-4 border ${
                  message.role === "user"
                    ? "border-blue-500/30"
                    : "border-purple-500/30"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <Streamdown>{message.content}</Streamdown>
                  </div>
                ) : (
                  <p className="text-sm">{message.content}</p>
                )}

                {message.role === "assistant" && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-purple-500/20">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCode(message.content)}
                      className="text-xs h-7"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      نسخ
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRegenerateMessage(message.id)}
                      className="text-xs h-7"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      إعادة توليد
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteMessage(message.id)}
                      className="text-xs h-7"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      حذف
                    </Button>
                  </div>
                )}

                {message.isStreaming && (
                  <div className="flex items-center gap-2 mt-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs">جاري الكتابة...</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border/50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={placeholder}
            disabled={isLoading || isStreaming}
            className="bg-background/50"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || isStreaming}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            {isLoading || isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
