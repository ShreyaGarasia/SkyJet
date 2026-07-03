import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Loader } from 'lucide-react';

export default function Chatbot({ 
  flight, 
  user,
  onRebook, 
  onRefund, 
  addToast,
  isLoggedIn,
  onTabChange,
  onLoginClick,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hello! I'm your SkyJet assistant. I can help you book flights, check status, rebook, refund, or download your ticket.", date: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addBotMessage = (text, options = null) => {
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, sender: 'bot', text, options, date: new Date() }
    ]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [
      ...prev,
      { id: prev.length + 1, sender: 'user', text, date: new Date() }
    ]);
  };

  const askBackend = async (messageText) => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        booking_id: user?.bookingId || '',
        message: messageText,
      }),
    });
    const data = await res.json();
    return data;
  };

  // Send a free-text message to the /api/chat backend (rule-based engine)
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');
    addUserMessage(userText);
    setIsTyping(true);

    try {
      const data = await askBackend(userText);
      setIsTyping(false);
      addBotMessage(data.reply || 'Sorry, I could not process that request.', data.options);
    } catch {
      setIsTyping(false);
      addBotMessage("I'm having trouble connecting to the server. Please try again in a moment.");
    }
  };

  // Handle chatbot quick-action buttons
  const handleOptionClick = async (optionValue) => {
    let userDisplay = '';
    switch (optionValue) {
      case 'rebook_menu':        userDisplay = 'View Rebooking Options'; break;
      case 'refund_claim':       userDisplay = 'Refund Details'; break;
      case 'alternatives_info':  userDisplay = 'What are my alternatives?'; break;
      case 'refund_rules':       userDisplay = 'Show Refund Policies'; break;
      case 'execute_refund':     userDisplay = 'Submit Refund Request'; break;
      case 'flights_tonight':    userDisplay = 'Flights departing tonight'; break;
      case 'flights_tomorrow':   userDisplay = 'Flights departing tomorrow'; break;
      case 'confirm_sj416':      userDisplay = 'Rebook to SJ-416 (Tonight, 11:45 PM)'; break;
      case 'confirm_sj420':      userDisplay = 'Rebook to SJ-420 (Tomorrow, 08:30 AM)'; break;
      case 'help_disruption':    userDisplay = 'What is my flight status?'; break;
      case 'go_book_flight':     userDisplay = 'How do I book a new flight?'; break;
      case 'go_my_trips':        userDisplay = 'Show my trips'; break;
      case 'go_retrieve_booking': userDisplay = 'Retrieve my booking'; break;
      case 'go_view_ticket':     userDisplay = 'Download my ticket PDF'; break;
      default:                   userDisplay = 'Request help';
    }
    addUserMessage(userDisplay);
    setIsTyping(true);

    // Navigation quick actions
    if (optionValue === 'go_book_flight') {
      setIsTyping(false);
      onTabChange?.('book');
      setIsOpen(false);
      addBotMessage('Opening **Book Flight** — search routes, pick a seat, and complete checkout there.');
      addToast('Use Book Flight to purchase a new ticket.', 'info');
      return;
    }
    if (optionValue === 'go_my_trips') {
      setIsTyping(false);
      onTabChange?.('profile');
      setIsOpen(false);
      addBotMessage('Opening **My Trips** — view bookings and download PDF tickets.');
      return;
    }
    if (optionValue === 'go_retrieve_booking') {
      setIsTyping(false);
      onLoginClick?.('retrieve');
      addBotMessage('Use **Manage Trip** with your Booking ID and last name to open your ticket dashboard.');
      return;
    }
    if (optionValue === 'go_view_ticket') {
      setIsTyping(false);
      if (user?.bookingId) {
        onTabChange?.('home');
        addBotMessage('Your ticket dashboard is on **Home**. Use **Ticket PDF** or **Download PDF** on the boarding pass.');
      } else {
        onLoginClick?.('retrieve');
        addBotMessage('Retrieve your booking first, then download the PDF from the dashboard or My Trips.');
      }
      return;
    }

    // Handle actions that hit the real API
    if (optionValue === 'execute_refund') {
      try {
        const res = await fetch('/api/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: user?.bookingId }),
        });
        const data = await res.json();
        setIsTyping(false);
        if (!res.ok) {
          addBotMessage(data.error || 'Refund could not be processed.');
          return;
        }
        onRefund(data.booking.flight);
        addToast('Refund claim submitted via AI Assistant', 'success');
        addBotMessage(`Refund request received. A full refund of $${user?.refundAmount?.toFixed(2) || '540.00'} is being issued to card *${user?.cardLast4 || '4321'}. Your ticket is now cancelled.`);
      } catch {
        setIsTyping(false);
        addBotMessage('Server error. Please try the Refund option from the dashboard instead.');
      }
      return;
    }

    if (optionValue === 'confirm_sj416') {
      try {
        const res = await fetch('/api/rebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: user?.bookingId, new_flight_id: 'F-TON-1' }),
        });
        const data = await res.json();
        setIsTyping(false);
        if (!res.ok) {
          addBotMessage(data.error || 'Rebooking failed. Please try from the dashboard.');
          return;
        }
        onRebook(data.booking.flight);
        addToast('Rebooked to SJ-416 via AI Assistant', 'success');
        addBotMessage('Success! I have rebooked you to Flight SJ-416 departing tonight at 11:45 PM. Your dashboard has been updated.');
      } catch {
        setIsTyping(false);
        addBotMessage('Server error. Please try the rebooking option from the dashboard instead.');
      }
      return;
    }

    if (optionValue === 'confirm_sj420') {
      try {
        const res = await fetch('/api/rebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ booking_id: user?.bookingId, new_flight_id: 'F-TOM-1' }),
        });
        const data = await res.json();
        setIsTyping(false);
        if (!res.ok) {
          addBotMessage(data.error || 'Rebooking failed. Please try from the dashboard.');
          return;
        }
        onRebook(data.booking.flight);
        addToast('Rebooked to SJ-420 via AI Assistant', 'success');
        addBotMessage('Success! I have rebooked you to Flight SJ-420 departing tomorrow at 08:30 AM. Your boarding pass is updated.');
      } catch {
        setIsTyping(false);
        addBotMessage('Server error. Please try the rebooking option from the dashboard instead.');
      }
      return;
    }

    // Info options: ask the backend chat engine
    const optionToMessage = {
      help_disruption: 'what is my flight status',
      rebook_menu: 'show rebook options',
      refund_claim: 'refund options',
      alternatives_info: 'what are my flight alternatives',
      refund_rules: 'refund policy',
      flights_tonight: 'flights departing tonight',
      flights_tomorrow: 'flights departing tomorrow',
    };

    if (optionToMessage[optionValue]) {
      try {
        const data = await askBackend(optionToMessage[optionValue]);
        setIsTyping(false);
        addBotMessage(data.reply, data.options);
      } catch {
        setIsTyping(false);
        addBotMessage('Could not reach the assistant. Please try again.');
      }
      return;
    }

    setIsTyping(false);
    addBotMessage('How else can I assist you?');
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-blue text-white shadow-xl hover:bg-blue-700 hover:scale-105 transition-all duration-200 cursor-pointer"
        title="Open Support Chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window Container */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-40 w-full max-w-sm sm:max-w-md h-[480px] rounded-2xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          
          {/* Chat Header */}
          <div className="bg-brand-blue-dark p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-lg bg-white/10">
                <Sparkles className="w-4 h-4 text-brand-green animate-pulse" />
              </div>
              <div className="text-left">
                <h4 className="font-display font-bold text-sm">SkyJet AI Agent</h4>
                <p className="text-[10px] text-brand-green font-semibold">Online • Ready to assist</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chat Message Box */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Profile Icon */}
                <div className={`h-8 w-8 flex items-center justify-center rounded-lg shrink-0 ${
                  msg.sender === 'bot' ? 'bg-blue-50 text-brand-blue border border-blue-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Bubble Content */}
                <div className="space-y-2">
                  <div className={`p-3 rounded-2xl text-xs text-left leading-relaxed shadow-2xs ${
                    msg.sender === 'user' 
                      ? 'bg-brand-blue text-white rounded-tr-none' 
                      : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none whitespace-pre-line'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Bubble Quick Actions */}
                  {msg.sender === 'bot' && msg.options && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleOptionClick(opt.value)}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-brand-blue hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-all cursor-pointer shadow-3xs"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            ))}

            {/* Simulated Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 max-w-[80%]">
                <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-blue-50 text-brand-blue border border-blue-100 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200/80 bg-white flex gap-2 items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about booking, status, refund, ticket PDF..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:border-brand-blue focus:bg-white focus:outline-hidden transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className="h-8 w-8 flex items-center justify-center bg-brand-blue text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-brand-blue transition-all shrink-0 cursor-pointer"
            >
              {isTyping ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </form>

        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
