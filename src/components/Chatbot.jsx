import { useState, useEffect, useRef } from "react";
import { askWasteAssistant } from "../lib/gemini";
import "./Chatbot.css";

// Web Audio API soft sound synthesizer
const playTone = (type, isMuted) => {
  if (isMuted) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "receive") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    }
  } catch (e) {
    // Ignore audio autoplay restrictions
  }
};

const SUGGESTIONS = [
  { label: "🗑️ Which bin for plastic bottle?", query: "Which bin should a plastic bottle and bottle cap go into?" },
  { label: "🍌 Can I compost food scraps?", query: "How to separate wet kitchen waste and make organic compost?" },
  { label: "🔋 Where to dispose batteries?", query: "How to safely dispose expired electronic batteries and old chargers?" },
  { label: "💊 Expired medicine disposal?", query: "What is the proper way to dispose of expired medicines and syringes?" },
  { label: "📸 How to report waste here?", query: "How do I report dirty spots or overflowing bins using the SmartSwachh app?" },
  { label: "💡 Random Eco Fact", query: "Tell me a fascinating fact about recycling and waste segregation." },
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [showGreetingTooltip, setShowGreetingTooltip] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "👋 **Namaste! I'm SwachhBot AI**, your smart waste management guru.\n\nAsk me anything about waste sorting, dustbin colors, recycling, or reporting dirty spots around your campus or city!",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Proactive greeting bubble after 3.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreetingTooltip(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Voice Recognition setup
  const toggleSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your question.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        sendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("Speech recognition error:", err);
      setIsListening(false);
    }
  };

  // Text-to-speech speaker
  const speakMessage = (text, index) => {
    if (!window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown before speaking
    const cleanText = text
      .replace(/[*_#`~]/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/🟢|🔵|🔴|⚡|💡|🌱|⚠️|♻️|📸|✨/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-IN";
    utterance.rate = 1.0;

    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const sendMessage = async (textToSend = input) => {
    const cleanText = textToSend.trim();
    if (!cleanText || isTyping) return;

    playTone("pop", isMuted);

    const currentTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newMessages = [
      ...messages,
      {
        role: "user",
        text: cleanText,
        time: currentTime,
      },
    ];

    setMessages(newMessages);
    setInput("");
    setIsTyping(true);

    try {
      const response = await askWasteAssistant(cleanText, newMessages);
      playTone("receive", isMuted);

      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: response,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (error) {
      console.error("Chatbot response error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "I'm having a little trouble connecting right now, but remember:\n- 🟢 **Green Bin** for kitchen wet waste\n- 🔵 **Blue Bin** for dry recyclables\n- 🔴 **Red Bin** for medical/hazardous items!\n\nPlease try again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Start a fresh conversation?")) {
      setMessages([
        {
          role: "bot",
          text: "👋 **SwachhBot AI reset!** How can I assist you with waste sorting or campus cleanliness today?",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  // Helper to format bot responses nicely with tags and bold text
  const renderFormattedText = (rawText) => {
    return rawText.split("\n").map((line, lIdx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={lIdx} className="msg-spacer" />;

      // Header 3
      if (trimmed.startsWith("### ")) {
        return (
          <h4 key={lIdx} className="msg-h3">
            {trimmed.replace("### ", "")}
          </h4>
        );
      }

      // List Item
      const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ");
      if (isBullet) {
        trimmed = trimmed.substring(2);
      }

      // Highlight bins and bold formatting
      const parts = trimmed.split(/(\*\*.*?\*\*)/g);

      const content = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          if (boldText.toLowerCase().includes("green bin")) {
            return <span key={pIdx} className="bin-tag tag-green">🟢 {boldText}</span>;
          }
          if (boldText.toLowerCase().includes("blue bin")) {
            return <span key={pIdx} className="bin-tag tag-blue">🔵 {boldText}</span>;
          }
          if (boldText.toLowerCase().includes("red bin")) {
            return <span key={pIdx} className="bin-tag tag-red">🔴 {boldText}</span>;
          }
          if (boldText.toLowerCase().includes("e-waste")) {
            return <span key={pIdx} className="bin-tag tag-ewaste">⚡ {boldText}</span>;
          }
          return <strong key={pIdx}>{boldText}</strong>;
        }
        return part;
      });

      return isBullet ? (
        <div key={lIdx} className="msg-bullet">
          <span className="bullet-dot">•</span>
          <span className="bullet-content">{content}</span>
        </div>
      ) : (
        <p key={lIdx} className="msg-para">
          {content}
        </p>
      );
    });
  };

  return (
    <div className="chatbot-root">
      {/* ═══ PROACTIVE TOOLTIP GREETING ═══ */}
      {!isOpen && showGreetingTooltip && (
        <div
          className="chatbot-proactive-tooltip"
          onClick={() => {
            setIsOpen(true);
            setShowGreetingTooltip(false);
          }}
        >
          <span className="tooltip-avatar">🤖</span>
          <div className="tooltip-text">
            <strong>Need waste sorting help?</strong>
            <span>Ask SwachhBot AI in 1 click!</span>
          </div>
          <button
            className="tooltip-close"
            onClick={(e) => {
              e.stopPropagation();
              setShowGreetingTooltip(false);
            }}
            title="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {/* ═══ MAIN CHAT WINDOW ═══ */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="header-info">
              <div className="bot-avatar-wrap">
                <span className="bot-avatar-emoji">🤖</span>
                <span className="online-pulse-dot" title="AI Active" />
              </div>
              <div className="header-titles">
                <div className="header-name">
                  SwachhBot AI <span className="ai-badge">LIVE</span>
                </div>
                <div className="header-status">Waste & Cleanliness Assistant</div>
              </div>
            </div>

            <div className="header-actions">
              <button
                className="header-btn"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? "🔇" : "🔊"}
              </button>
              <button className="header-btn" onClick={clearChat} title="Clear conversation">
                🔄
              </button>
              <button
                className="header-btn close-btn"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                aria-label="Close chatbot"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="quick-suggestions-bar">
            {SUGGESTIONS.map((item, idx) => (
              <button
                key={idx}
                className="suggestion-chip"
                onClick={() => sendMessage(item.query)}
                disabled={isTyping}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="chatbot-messages">
            {messages.map((message, index) => {
              const isUser = message.role === "user";

              return (
                <div key={index} className={`message-row ${isUser ? "row-user" : "row-bot"}`}>
                  {!isUser && (
                    <div className="bot-msg-avatar">
                      <span>🤖</span>
                    </div>
                  )}

                  <div className={`message-bubble ${isUser ? "user-bubble" : "bot-bubble"}`}>
                    <div className="message-content">
                      {isUser ? message.text : renderFormattedText(message.text)}
                    </div>

                    <div className="message-footer">
                      <span className="message-time">{message.time}</span>

                      {!isUser && (
                        <div className="bot-message-tools">
                          <button
                            className="tool-btn"
                            onClick={() => speakMessage(message.text, index)}
                            title={speakingIndex === index ? "Stop speaking" : "Listen aloud"}
                          >
                            {speakingIndex === index ? "⏹️" : "🔊"}
                          </button>
                          <button
                            className="tool-btn"
                            onClick={() => copyToClipboard(message.text, index)}
                            title="Copy response"
                          >
                            {copiedIndex === index ? "✓" : "📋"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="message-row row-bot">
                <div className="bot-msg-avatar">
                  <span>🤖</span>
                </div>
                <div className="message-bubble bot-bubble typing-bubble">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="typing-label">SwachhBot is analyzing...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="chatbot-input-wrap">
            {isListening && (
              <div className="voice-listening-banner">
                <span className="recording-wave" />
                Listening to your voice... Speak now!
              </div>
            )}

            <div className="chatbot-input-row">
              <button
                type="button"
                className={`voice-mic-btn ${isListening ? "listening-active" : ""}`}
                onClick={toggleSpeechRecognition}
                title={isListening ? "Stop listening" : "Voice input"}
              >
                {isListening ? "🔴" : "🎙️"}
              </button>

              <input
                ref={inputRef}
                type="text"
                placeholder="Ask e.g. Which bin for pizza box?..."
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
                type="button"
                className="chatbot-send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping}
                title="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FLOATING LAUNCHER BUTTON ═══ */}
      <button
        className={`chatbot-launcher-btn ${isOpen ? "btn-is-open" : ""}`}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowGreetingTooltip(false);
          playTone("pop", isMuted);
        }}
        aria-label="Open SwachhBot AI assistant"
        id="chatbot-toggle"
      >
        <div className="launcher-glow" />
        {isOpen ? (
          <span className="launcher-close-icon">✕</span>
        ) : (
          <div className="launcher-icon-group">
            <span className="launcher-emoji">🤖</span>
            <span className="launcher-online-badge" />
          </div>
        )}
      </button>
    </div>
  );
}