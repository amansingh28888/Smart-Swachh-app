import { useState } from "react";
import { askWasteAssistant } from "../lib/gemini";
import "./Chatbot.css";

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hello! I'm SmartSwachh AI Assistant. Ask me anything about waste disposal, recycling, segregation, or cleanliness.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const quickQuestions = [
    "How to dispose plastic?",
    "What is medical waste?",
    "How to separate wet and dry waste?",
    "How to dispose e-waste?",
  ];

  const sendMessage = async (text = input) => {
    if (!text.trim() || isTyping) return;

    const cleanText = text.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: cleanText,
      },
    ]);

    setInput("");
    setIsTyping(true);

    try {
      const response = await askWasteAssistant(cleanText);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response,
        },
      ]);
    } catch (error) {
      console.error("Chatbot error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Sorry, I'm having trouble connecting to the AI service. Please try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="chatbot-window">

          {/* Header */}
          <div className="chatbot-header">
            <div>
              <strong>SmartSwachh AI</strong>
              <p>AI Waste Management Assistant</p>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">

            {messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role}`}
              >
                {message.text}
              </div>
            ))}

            {isTyping && (
              <div className="typing">
                SmartSwachh AI is thinking...
              </div>
            )}

          </div>

          {/* Quick Questions */}
          <div className="quick-questions">
            {quickQuestions.map((question) => (
              <button
                key={question}
                onClick={() => sendMessage(question)}
                disabled={isTyping}
              >
                {question}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="chatbot-input">

            <input
              type="text"
              placeholder="Ask about waste management..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  sendMessage();
                }
              }}
              disabled={isTyping}
            />

            <button
              onClick={() => sendMessage()}
              disabled={isTyping}
            >
              Send
            </button>

          </div>

        </div>
      )}

      {/* Floating Button */}
      <button
        className="chatbot-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI assistant"
        id="chatbot-toggle"
      >
        {isOpen ? "×" : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        )}
      </button>
    </>
  );
}