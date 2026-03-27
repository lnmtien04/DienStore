'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ShoppingBagIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  TruckIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';

type ChatState = 'idle' | 'ask_order_code' | 'ask_product_name' | 'contact_support';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  quickReplies?: QuickReply[];
}

interface QuickReply {
  label: string;
  value: string;
}

const getBotResponse = async (
  message: string,
  state: ChatState,
  setState: (s: ChatState) => void
): Promise<{ text: string; newState: ChatState; quickReplies?: QuickReply[] }> => {
  const lower = message.toLowerCase();

  if (state === 'ask_order_code') {
    const orderStatus = 'Đang giao hàng';
    setState('idle');
    return {
      text: `Đơn hàng ${message} hiện đang: ${orderStatus}. Bạn cần hỗ trợ thêm gì không?`,
      newState: 'idle',
      quickReplies: [
        { label: 'Giá sản phẩm', value: 'giá' },
        { label: 'Bảo hành', value: 'bảo hành' },
        { label: 'Kết thúc', value: 'kết thúc' },
      ],
    };
  }

  if (state === 'ask_product_name') {
    const price = '2,490,000đ';
    setState('idle');
    return {
      text: `Giá của sản phẩm "${message}" hiện là ${price}. Bạn có muốn tìm hiểu thêm không?`,
      newState: 'idle',
      quickReplies: [
        { label: 'Kiểm tra đơn hàng', value: 'đơn hàng' },
        { label: 'Bảo hành', value: 'bảo hành' },
        { label: 'Kết thúc', value: 'kết thúc' },
      ],
    };
  }

  if (state === 'contact_support') {
    setState('idle');
    return {
      text: 'Cảm ơn bạn! Nhân viên hỗ trợ sẽ liên hệ lại trong ít phút. Bạn cần giúp gì thêm không?',
      newState: 'idle',
      quickReplies: [
        { label: 'Kiểm tra đơn hàng', value: 'đơn hàng' },
        { label: 'Giá sản phẩm', value: 'giá' },
        { label: 'Kết thúc', value: 'kết thúc' },
      ],
    };
  }

  const menuReplies: QuickReply[] = [
    { label: 'Kiểm tra đơn hàng', value: 'đơn hàng' },
    { label: 'Giá sản phẩm', value: 'giá' },
    { label: 'Bảo hành', value: 'bảo hành' },
    { label: 'Vận chuyển', value: 'vận chuyển' },
    { label: 'Liên hệ hỗ trợ', value: 'liên hệ' },
  ];

  if (lower.includes('đơn hàng') || lower.includes('kiểm tra đơn')) {
    setState('ask_order_code');
    return {
      text: 'Vui lòng nhập mã đơn hàng của bạn:',
      newState: 'ask_order_code',
    };
  }

  if (lower.includes('giá') || lower.includes('bao nhiêu')) {
    setState('ask_product_name');
    return {
      text: 'Bạn đang quan tâm sản phẩm nào? (Ví dụ: máy sấy, tủ lạnh...)',
      newState: 'ask_product_name',
    };
  }

  if (lower.includes('bảo hành')) {
    setState('idle');
    return {
      text: 'Sản phẩm Homitech được bảo hành chính hãng 12–24 tháng tùy loại. Bạn cần hỗ trợ thêm không?',
      newState: 'idle',
      quickReplies: menuReplies,
    };
  }

  if (lower.includes('vận chuyển') || lower.includes('giao hàng')) {
    setState('idle');
    return {
      text: 'Miễn phí vận chuyển cho đơn hàng trên 5 triệu. Giao hàng toàn quốc 1-3 ngày.',
      newState: 'idle',
      quickReplies: menuReplies,
    };
  }

  if (lower.includes('liên hệ') || lower.includes('hỗ trợ')) {
    setState('contact_support');
    return {
      text: 'Để được hỗ trợ nhanh nhất, vui lòng để lại số điện thoại hoặc email. Nhân viên sẽ liên hệ ngay!',
      newState: 'contact_support',
    };
  }

  if (lower.includes('kết thúc')) {
    setState('idle');
    return {
      text: 'Cảm ơn bạn đã sử dụng dịch vụ! Chúc bạn một ngày tốt lành.',
      newState: 'idle',
      quickReplies: [],
    };
  }

  return {
    text: 'Mình chưa hiểu rõ câu hỏi. Bạn có thể chọn một trong các mục bên dưới:',
    newState: 'idle',
    quickReplies: menuReplies,
  };
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatState, setChatState] = useState<ChatState>('idle');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: 'Xin chào! Tôi là trợ lý AI của Homitech.\n\nBạn cần hỗ trợ gì hôm nay?',
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: [
          { label: 'Kiểm tra đơn hàng', value: 'đơn hàng' },
          { label: 'Giá sản phẩm', value: 'giá' },
          { label: 'Bảo hành', value: 'bảo hành' },
          { label: 'Vận chuyển', value: 'vận chuyển' },
          { label: 'Liên hệ hỗ trợ', value: 'liên hệ' },
        ],
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async (text?: string) => {
    const userText = text !== undefined ? text : input.trim();
    if (!userText) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    setIsTyping(true);
    setTimeout(async () => {
      const response = await getBotResponse(userText, chatState, setChatState);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        quickReplies: response.quickReplies,
      };
      addMessage(botMsg);
      setIsTyping(false);
      if (response.newState) setChatState(response.newState);
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReply = (value: string) => {
    handleSend(value);
  };

  const getQuickReplyIcon = (value: string) => {
    switch (value) {
      case 'đơn hàng':
        return <ShoppingBagIcon className="w-4 h-4" />;
      case 'giá':
        return <CurrencyDollarIcon className="w-4 h-4" />;
      case 'bảo hành':
        return <ShieldCheckIcon className="w-4 h-4" />;
      case 'vận chuyển':
        return <TruckIcon className="w-4 h-4" />;
      case 'liên hệ':
        return <PhoneIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getQuickReplyLabel = (value: string) => {
    switch (value) {
      case 'đơn hàng':
        return 'Kiểm tra đơn hàng';
      case 'giá':
        return 'Giá sản phẩm';
      case 'bảo hành':
        return 'Bảo hành';
      case 'vận chuyển':
        return 'Vận chuyển';
      case 'liên hệ':
        return 'Liên hệ hỗ trợ';
      default:
        return value;
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-linear-to-r from-blue-500 to-purple-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.6)] hover:scale-110 transition-all duration-300 group animate-[float_3s_ease-in-out_infinite]"
        aria-label="Mở trợ lý AI"
      >
        <span className="absolute inset-0 rounded-full bg-blue-400 opacity-30 animate-ping"></span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-6 h-6 relative z-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 9.75h.008v.008H9.75v-.008zm4.5 0h.008v.008h-.008v-.008zM9.75 12.75h4.5M9.75 15.75h4.5M6 9.75h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zM12 6.75v3.75m-4.5 4.5h9a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5h-9a1.5 1.5 0 0 0-1.5 1.5v3.75a1.5 1.5 0 0 0 1.5 1.5z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-96 h-137.5 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700"
          >
            <div className="bg-linear-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.75 9.75h.008v.008H9.75v-.008zm4.5 0h.008v.008h-.008v-.008zM9.75 12.75h4.5M9.75 15.75h4.5M6 9.75h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zM12 6.75v3.75m-4.5 4.5h9a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5h-9a1.5 1.5 0 0 0-1.5 1.5v3.75a1.5 1.5 0 0 0 1.5 1.5z"
                      />
                    </svg>
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                </div>
                <div>
                  <p className="font-semibold">Trợ lý AI Homitech</p>
                  <p className="text-xs opacity-90">Online · Hỗ trợ 24/7</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 rounded-full p-1 transition"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-8 h-8 rounded-full bg-linear-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-2 self-end">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-4 h-4 text-white"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.75 9.75h.008v.008H9.75v-.008zm4.5 0h.008v.008h-.008v-.008zM9.75 12.75h4.5M9.75 15.75h4.5M6 9.75h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zm0 3h.008v.008H6v-.008zM12 6.75v3.75m-4.5 4.5h9a1.5 1.5 0 0 0 1.5-1.5V9a1.5 1.5 0 0 0-1.5-1.5h-9a1.5 1.5 0 0 0-1.5 1.5v3.75a1.5 1.5 0 0 0 1.5 1.5z"
                        />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    <p className="text-[10px] mt-1 opacity-70">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.quickReplies.map((qr) => (
                          <button
                            key={qr.value}
                            onClick={() => handleQuickReply(qr.value)}
                            className="inline-flex items-center gap-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                          >
                            {getQuickReplyIcon(qr.value)}
                            <span>{getQuickReplyLabel(qr.value)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1.5">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Nhập câu hỏi..."
                  rows={1}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none overflow-hidden"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-1.5 rounded-full bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition"
                >
                  <PaperAirplaneIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
      `}</style>
    </>
  );
}