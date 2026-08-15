import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, MessageCircle } from "lucide-react";
import { sendAiMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import styles from "./AiChat.module.css";

export function AiChat({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! How can I help you with your HR info today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if they clicked the AI button itself (which might be outside this div, but triggers the toggle)
      // The toggle button will handle its own logic, but just in case, we check if it's outside our container.
      if (chatRef.current && !chatRef.current.contains(event.target)) {
        // Prevent closing if the click was on the toggle button
        const toggleBtn = event.target.closest('[title="Ask AI Assistant"]');
        if (!toggleBtn) {
          onClose();
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const { answer } = await sendAiMessage(userMsg.text);
      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an error connecting to the HR system. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "What is my leave balance?",
    "How is my attendance this month?",
    "Can I take 2 days of earned leave next week?",
  ];

  const handleSuggestionClick = (text) => {
    setInput(text);
  };

  return (
    <div ref={chatRef} className={styles.chatContainer}>
      <div className={styles.header}>
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <MessageCircle className="size-4" />
          </div>
          <div>
            <h3 className="font-headline font-bold text-sm text-foreground">HR Assistant</h3>
            <p className="text-[10px] text-muted-foreground font-semibold">Powered by AI</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-muted/50 rounded-full transition-colors text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className={styles.messageList}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(styles.messageWrapper, msg.role === "user" ? styles.userWrapper : styles.assistantWrapper)}
          >
            {msg.role === "assistant" && (
              <div className={cn(styles.avatar, "bg-primary/10 text-primary")}>
                <Bot className="size-4" />
              </div>
            )}
            <div
              className={cn(
                styles.bubble,
                msg.role === "user" ? styles.userBubble : styles.assistantBubble,
                msg.isError && "bg-destructive/10 text-destructive border border-destructive/20"
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className={cn(styles.messageWrapper, styles.assistantWrapper)}>
             <div className={cn(styles.avatar, "bg-primary/10 text-primary")}>
                <Bot className="size-4" />
              </div>
            <div className={cn(styles.bubble, styles.assistantBubble)}>
              <span className={styles.typingIndicator}>
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(s)}
              className="text-[11px] bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full border border-border/50 transition-colors text-left"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputArea}>
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about leaves, attendance..."
          disabled={loading}
          className={styles.textarea}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={cn(
            "p-2 rounded-xl transition-all flex items-center justify-center",
            input.trim() && !loading
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <Send className="size-4" />
        </button>
      </div>
    </div>
  );
}
