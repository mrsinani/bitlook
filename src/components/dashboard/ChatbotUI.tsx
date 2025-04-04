
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Message {
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatbotUIProps {
  className?: string;
}

// Sample messages
const initialMessages: Message[] = [
  {
    content: "Hello! I'm the Bitlook AI assistant. How can I help you with Bitcoin analytics today?",
    sender: 'bot',
    timestamp: new Date()
  }
];

const ChatbotUI: React.FC<ChatbotUIProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Simulate bot response
    setTimeout(() => {
      const botResponses = [
        "Based on the current data, Bitcoin's price has increased by 2.3% in the last 24 hours.",
        "On-chain data shows a decrease in exchange reserves, which is typically bullish.",
        "According to the latest metrics, whale accumulation has been increasing over the past week.",
        "The Bitcoin Fear and Greed Index currently shows 'Greed', suggesting market optimism."
      ];
      
      const botMessage: Message = {
        content: botResponses[Math.floor(Math.random() * botResponses.length)],
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };
  
  return (
    <div className={cn("data-card flex flex-col", className)}>
      <h3 className="card-heading mb-4">Ask Bitlook AI</h3>
      
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={cn(
              "flex items-start gap-3 max-w-[85%] p-3 rounded-lg",
              message.sender === 'user' ? "ml-auto bg-accent" : "bg-card"
            )}
          >
            <div className={cn(
              "flex items-center justify-center h-7 w-7 rounded-full shrink-0",
              message.sender === 'user' ? "bg-primary" : "bg-positive"
            )}>
              {message.sender === 'user' ? (
                <User className="h-4 w-4 text-white" />
              ) : (
                <Bot className="h-4 w-4 text-white" />
              )}
            </div>
            
            <div>
              <div className="text-sm">{message.content}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about Bitcoin..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1"
        />
        <Button onClick={handleSend} className="bg-primary hover:bg-primary/90">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatbotUI;
