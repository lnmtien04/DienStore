'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/context/UserContext';
import io from 'socket.io-client';
import axios from 'axios';
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PhotoIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import EmojiPicker from 'emoji-picker-react';

interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  senderType: 'User' | 'Admin';
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const { user, token } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!user) return;

    const convId = `user_${user._id}_admin`;
    setConversationId(convId);

    const socketIo = io(API_URL, { transports: ['websocket'] });
    setSocket(socketIo);

    socketIo.emit('join-conversation', { conversationId: convId, userId: user._id, userType: 'User' });

    axios.get(`${API_URL}/api/chat/${convId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setMessages(res.data))
      .catch(err => console.error(err));

    socketIo.on('receive-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketIo.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (content: string) => {
    if (!content.trim() || !user) return;
    const msg = {
      conversationId,
      senderId: user._id,
      senderType: 'User' as const,
      content: content.trim(),
      timestamp: new Date().toISOString()
    };
    socket.emit('send-message', msg);
  };

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
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
      const imageUrl = res.data.url; // Giả sử server trả về { url: '...' }
      sendMessage(imageUrl);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!user) return <div className="p-4 text-center">Vui lòng đăng nhập để chat</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserCircleIcon className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-md font-medium text-gray-900">Hỗ trợ khách hàng</h3>
            <p className="text-xs text-gray-500">Phản hồi trong giờ làm việc</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.senderType === 'User';
          const showAvatar = isUser && (idx === 0 || messages[idx-1]?.senderType !== 'User');
          const showTime = idx === 0 || new Date(msg.timestamp).toLocaleDateString() !== new Date(messages[idx-1]?.timestamp).toLocaleDateString();
          return (
            <div key={idx}>
              {showTime && (
                <div className="text-center text-xs text-gray-400 my-2">
                  {format(new Date(msg.timestamp), 'dd/MM/yyyy', { locale: vi })}
                </div>
              )}
              <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end space-x-2`}>
                {!isUser && (
                  <div className="shrink-0 mb-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <UserCircleIcon className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                )}
                <div className={`max-w-[70%] ${isUser ? 'order-2' : 'order-1'}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl shadow-sm ${
                      isUser
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                    }`}
                  >
                    <div className="text-sm wrap-break-word-break-words whitespace-pre-wrap">
                      {msg.content.startsWith('http') ? (
                        <img src={msg.content} alt="Image" className="max-w-full max-h-48 rounded-lg object-cover" />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
                    {format(new Date(msg.timestamp), 'HH:mm', { locale: vi })}
                  </div>
                </div>
                {isUser && (
                  <div className="shrink-0 mb-1 order-1">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {user?.fullName?.charAt(0) || 'U'}
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
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <FaceSmileIcon className="w-5 h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
            disabled={uploading}
          >
            <PhotoIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleInput();
              }}
              onKeyDown={handleKeyPress}
              placeholder="Nhập tin nhắn..."
              rows={1}
              className="w-full border border-gray-200 rounded-2xl px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none overflow-hidden"
            />
            <button
              onClick={handleSend}
              disabled={!newMessage.trim()}
              className="absolute right-2 bottom-2 p-1 text-blue-500 disabled:text-gray-300 hover:text-blue-600"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-50">
            <EmojiPicker onEmojiClick={(emoji) => {
              setNewMessage(prev => prev + emoji.emoji);
              setShowEmojiPicker(false);
            }} />
          </div>
        )}
      </div>
    </div>
  );
}