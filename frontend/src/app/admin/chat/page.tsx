'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  UserCircleIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import EmojiPicker from 'emoji-picker-react';

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: 'User' | 'Admin';
  content: string;
  timestamp: string;
  read?: boolean;
}

interface Conversation {
  _id: string;
  lastMessage: string;
  lastTimestamp: string;
  count: number;
  userInfo?: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  };
}

export default function AdminChatPage() {
  const { user, token } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [typing, setTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoad = useRef(true); // Thêm ref để kiểm soát scroll lần đầu
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
const messagesContainerRef = useRef<HTMLDivElement>(null);
  // Kiểm tra quyền admin
  useEffect(() => {
    if (user && !user.roles?.includes('admin') && !user.roles?.includes('staff')) {
      window.location.href = '/';
    }
  }, [user]);

  // Kết nối socket và tải dữ liệu
  useEffect(() => {
    if (!user || !user.roles?.includes('admin')) return;

    const socketIo = io(API_URL, { transports: ['websocket'] });
    setSocket(socketIo);

    // Lấy danh sách conversation (có userInfo)
    axios.get(`${API_URL}/api/chat/admin/conversations`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setConversations(res.data))
      .catch(err => console.error('Lỗi tải danh sách:', err));

    // Lắng nghe tin nhắn mới
    socketIo.on('receive-message', (msg: Message) => {
      if (selectedConv === msg.conversationId) {
        // Đang xem conversation này -> thêm tin nhắn
        setMessages(prev => [...prev, msg]);
      } else {
        // Không phải conversation đang xem -> cập nhật sidebar
        setConversations(prev => {
          const existing = prev.find(c => c._id === msg.conversationId);
          if (existing) {
            return prev.map(c =>
              c._id === msg.conversationId
                ? { ...c, lastMessage: msg.content, lastTimestamp: msg.timestamp, count: (c.count || 0) + 1 }
                : c
            );
          } else {
            // Conversation mới
            return [{ _id: msg.conversationId, lastMessage: msg.content, lastTimestamp: msg.timestamp, count: 1 }, ...prev];
          }
        });
      }
    });

    socketIo.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
      if (data.conversationId === selectedConv) {
        setIsTyping(data.isTyping);
      }
    });

    return () => {
      socketIo.disconnect();
    };
  }, [user, token, selectedConv]);

  const loadMessages = async (convId: string) => {
    setSelectedConv(convId);
    isInitialLoad.current = true; // Đặt flag trước khi load
    try {
      const res = await axios.get(`${API_URL}/api/chat/${convId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
      // Đánh dấu đã đọc (tuỳ chọn)
      // await axios.put(`${API_URL}/api/chat/${convId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      // Cập nhật count về 0
      setConversations(prev =>
        prev.map(c => c._id === convId ? { ...c, count: 0 } : c)
      );
    } catch (err) {
      console.error('Lỗi tải tin nhắn:', err);
    }

    if (socket) {
      socket.emit('join-conversation', { conversationId: convId, userId: user?._id, userType: 'Admin' });
    }
  };

  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !selectedConv || !user || !socket) return;

    // Đảm bảo socket đã join room trước khi gửi tin nhắn
    socket.emit('join-conversation', { conversationId: selectedConv, userId: user._id, userType: 'Admin' });

    const msg = {
      conversationId: selectedConv,
      senderId: user._id,
      senderType: 'Admin' as const,
      content: text,
      timestamp: new Date().toISOString()
    };
    socket.emit('send-message', msg);
    setNewMessage('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    if (typing) {
      socket.emit('typing', { conversationId: selectedConv, isTyping: false });
      setTyping(false);
    }
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleTyping = () => {
    if (!typing && newMessage.length > 0) {
      setTyping(true);
      socket?.emit('typing', { conversationId: selectedConv, isTyping: true });
    } else if (typing && newMessage.length === 0) {
      setTyping(false);
      socket?.emit('typing', { conversationId: selectedConv, isTyping: false });
    }
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prev => prev + emoji.emoji);
    setShowEmojiPicker(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      // Gửi URL ảnh dưới dạng text
      const imageUrl = res.data.url;
      if (imageUrl && socket && selectedConv && user) {
        const msg = {
          conversationId: selectedConv,
          senderId: user._id,
          senderType: 'Admin' as const,
          content: imageUrl,
          timestamp: new Date().toISOString()
        };
        socket.emit('send-message', msg);
      }
    } catch (err) {
      console.error('Upload ảnh thất bại:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Scroll to bottom khi có tin nhắn mới, nhưng không scroll lần đầu load
  useEffect(() => {
  if (messages.length > 0 && messagesContainerRef.current) {
    if (!isInitialLoad.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    } else {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'auto'
      });
      isInitialLoad.current = false;
    }
  }
}, [messages]);


  if (!user || (!user.roles?.includes('admin') && !user.roles?.includes('staff'))) {
    return <div className="p-4 text-center">Đang chuyển hướng...</div>;
  }

  const getConversationName = (conv: Conversation) => {
    if (conv.userInfo?.fullName) return conv.userInfo.fullName;
    const parts = conv._id.replace('user_', '').replace('_admin', '').split('_');
    return parts[0] || 'Khách hàng';
  };

  const getAvatar = (conv: Conversation) => {
    if (conv.userInfo?.avatar) return conv.userInfo.avatar;
    return null;
  };

  const renderMessageContent = (content: string) => {
    if (content.match(/^https?:\/\/[^\s]+$/)) {
      return <img src={content} alt="image" className="max-w-full max-h-48 rounded-lg object-cover" />;
    }
    return <div className="text-sm wrap-break-word whitespace-pre-wrap">{content}</div>;
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Tin nhắn</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div
              key={conv._id}
              onClick={() => loadMessages(conv._id)}
              className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 ${
                selectedConv === conv._id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative shrink-0">
                  {getAvatar(conv) ? (
                    <img src={getAvatar(conv)!} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCircleIcon className="w-6 h-6 text-blue-500" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getConversationName(conv)}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(conv.lastTimestamp), { addSuffix: true, locale: vi })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                {conv.count > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                    {conv.count}
                  </span>
                )}
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">Chưa có tin nhắn nào</div>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-100">
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {(() => {
                  const conv = conversations.find(c => c._id === selectedConv);
                  const avatar = conv ? getAvatar(conv) : null;
                  return (
                    <>
                      {avatar ? (
                        <img src={avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserCircleIcon className="w-6 h-6 text-blue-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-md font-medium text-gray-900">
                          {conv ? getConversationName(conv) : 'Khách hàng'}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {isTyping ? 'Đang nhập...' : (conv ? `Hoạt động ${formatDistanceToNow(new Date(conv.lastTimestamp), { addSuffix: true, locale: vi })}` : '')}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100">
                  <EllipsisHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => {
                const isAdmin = msg.senderType === 'Admin';
                const showAvatar = !isAdmin && (idx === 0 || messages[idx-1]?.senderType !== 'User');
                const showTime = idx === 0 || new Date(msg.timestamp).toLocaleDateString() !== new Date(messages[idx-1]?.timestamp).toLocaleDateString();
                return (
                  <div key={idx}>
                    {showTime && (
                      <div className="text-center text-xs text-gray-400 my-2">
                        {format(new Date(msg.timestamp), 'dd/MM/yyyy', { locale: vi })}
                      </div>
                    )}
                    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                      {!isAdmin && showAvatar && (
                        <div className="shrink-0 mb-1">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <UserCircleIcon className="w-5 h-5 text-blue-500" />
                          </div>
                        </div>
                      )}
                      <div className={`max-w-[70%] ${isAdmin ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`px-4 py-2 rounded-2xl shadow-sm ${
                            isAdmin
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                          }`}
                        >
                          {renderMessageContent(msg.content)}
                        </div>
                        <div className={`text-xs text-gray-400 mt-1 ${isAdmin ? 'text-right' : 'text-left'}`}>
                          {format(new Date(msg.timestamp), 'HH:mm', { locale: vi })}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="shrink-0 mb-1 order-1">
                          {user?.avatar ? (
                            <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                              {user?.fullName?.charAt(0) || 'A'}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex items-end space-x-2">
                <div className="relative">
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <FaceSmileIcon className="w-5 h-5" />
                  </button>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-10">
                      <EmojiPicker onEmojiClick={handleEmojiSelect} />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                  disabled={uploading}
                >
                  <PhotoIcon className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyDown={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    rows={1}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!newMessage.trim()}
                    className="absolute right-2 bottom-2 p-1 text-blue-500 disabled:text-gray-300 hover:text-blue-600"
                  >
                    <PaperAirplaneIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {uploading && <div className="text-xs text-gray-400 mt-2">Đang tải ảnh lên...</div>}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Chọn một cuộc trò chuyện để bắt đầu
          </div>
        )}
      </div>
    </div>
  );
}