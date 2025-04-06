import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Send, Bot, User, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { API_URL } from "@/lib/env";

interface Message {
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatbotUIProps {
  className?: string;
}

// Sample messages
const initialMessages: Message[] = [
  {
    content:
      "Hello! I'm the Bitlook AI assistant. How can I help you with Bitcoin analytics today?",
    sender: "bot",
    timestamp: new Date(),
  },
];

const ChatbotUI: React.FC<ChatbotUIProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    try {
      const userMessage: Message = {
        content: input,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setError(null);

      // Call the server API instead of direct implementation
      const response = await fetch(`${API_URL}/api/ai/workflow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const result = await response.json();

      // Get the final response
      const responseText =
        result.response ||
        "I couldn't find a specific answer to your question.";

      // Get a detailed trace for debugging (optional)
      const traceResponse = await fetch(`${API_URL}/api/ai/trace`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ state: result }),
      });

      if (traceResponse.ok) {
        const { trace } = await traceResponse.json();
        console.log("Execution trace:", trace);
      }

      const botMessage: Message = {
        content: responseText,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error running workflow:", error);
      setError(
        "The AI service is currently unavailable. Please try again later."
      );

      const errorMessage: Message = {
        content:
          "Sorry, I encountered an error while processing your request. The AI service might be temporarily unavailable.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("data-card flex flex-col", className)}>
      <h3 className="card-heading mb-4">Ask Bitlook AI</h3>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Service Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={cn(
              "flex items-start gap-3 max-w-[85%] p-3 rounded-lg",
              message.sender === "user" ? "ml-auto bg-accent" : "bg-card"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center h-7 w-7 rounded-full shrink-0",
                message.sender === "user" ? "bg-primary" : "bg-positive"
              )}
            >
              {message.sender === "user" ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>

            <div>
              <div className="text-sm">{message.content}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-3 max-w-[85%] p-3 rounded-lg bg-card">
            <div className="flex items-center justify-center h-7 w-7 rounded-full shrink-0 bg-positive">
              <Bot className="h-4 w-4 text-white" />
            </div>

            <div className="flex space-x-1">
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div
                className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInput(e.target.value)
          }
          placeholder="Ask a question about Bitcoin..."
          onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) =>
            e.key === "Enter" && handleSend()
          }
          className="flex-1"
          disabled={isLoading}
        />
        <Button
          onClick={handleSend}
          className="bg-primary hover:bg-primary/90"
          disabled={isLoading || !input.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatbotUI;
