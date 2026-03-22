'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  ChatBubbleLeftIcon,
  HeartIcon as HeartOutline,
  FaceSmileIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import toast from 'react-hot-toast';

type ReactionType = 'like';

interface Comment {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    avatar?: string;
  } | null;
  userName?: string;
  content: string;
  images?: string[];
  reactions?: Partial<Record<ReactionType, string[]>>;
  createdAt: string;
  replyCount: number;
  replies?: Comment[];
  status: 'active' | 'hidden' | 'deleted';
}

interface CommentSectionProps {
  productId: string;
}

const formatTime = (date: string) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
  return formatDistanceToNow(then, { addSuffix: true, locale: vi });
};

// Helper cập nhật replies cho comment gốc
const updateRepliesInTree = (comments: Comment[], targetId: string, newReplies: Comment[]): Comment[] => {
  return comments.map(comment => {
    if (comment._id === targetId) {
      return { ...comment, replies: newReplies };
    }
    return comment;
  });
};

const CommentItem = ({
  comment,
  rootId,
  isReply = false,
  onReply,
  onReact,
  fetchReplies,
  shouldExpand,
  apiUrl,
}: {
  comment: Comment;
  rootId: string;
  isReply?: boolean;
  onReply: (commentId: string, username: string, rootId: string) => void;
  onReact: (commentId: string, type: ReactionType) => void;
  fetchReplies: (commentId: string) => Promise<void>;
  shouldExpand?: boolean;
  apiUrl: string;
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (shouldExpand && !showReplies && !isReply) {
      const openAndFetch = async () => {
        if (!comment.replies || comment.replies.length === 0) {
          setLoadingReplies(true);
          await fetchReplies(comment._id);
          setLoadingReplies(false);
        }
        setShowReplies(true);
      };
      openAndFetch();
    }
  }, [shouldExpand, comment._id, fetchReplies, showReplies]);

  const loadReplies = async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      await fetchReplies(comment._id);
      setLoadingReplies(false);
      setShowReplies(true);
    } else {
      setShowReplies(false);
    }
  };

  const totalLikes = comment.reactions?.like?.length || 0;
  const isLiked = user
    ? comment.reactions?.like?.some(id => id.toString() === user._id.toString())
    : false;

  const displayName = comment.user?.fullName || comment.userName || 'Ẩn danh';
  const avatar = comment.user?.avatar;
  const firstChar = displayName.charAt(0).toUpperCase();

  let avatarUrl = '';
  if (avatar) {
    if (avatar.startsWith('http')) {
      avatarUrl = avatar;
    } else if (avatar.startsWith('/uploads/')) {
      avatarUrl = `${apiUrl}${avatar}`;
    } else {
      avatarUrl = `${apiUrl}/uploads/${avatar}`;
    }
  }

   const renderContent = () => {
    const parts = comment.content.split(/(@[^\s]+)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('@')) {
        return (
          <span key={idx} className="text-blue-600 font-medium">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div
      className={`${!isReply ? 'mb-4' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex ${isReply ? 'gap-2' : 'gap-3'}`}>
        {/* Avatar */}
        <div className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0`}>
          {avatar ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-medium">
              {firstChar}
            </div>
          )}
        </div>

        {/* Bubble + actions */}
        <div className="flex-1">
          <div className={`bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2 inline-block max-w-[70%]`}>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">{displayName}</p>
            <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
              {renderContent()}
            </p>
            {comment.images && comment.images.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {comment.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`${apiUrl}${img}`}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 ml-2">
            <button
              onClick={() => onReact(comment._id, 'like')}
              className={`flex items-center gap-1 transition ${isLiked ? 'text-red-500' : 'hover:text-blue-600'}`}
            >
              {isLiked ? <HeartSolid className="w-3.5 h-3.5" /> : <HeartOutline className="w-3.5 h-3.5" />}
              <span>{totalLikes}</span>
            </button>

            <button
              onClick={() => onReply(comment._id, displayName, rootId)}
              className={`flex items-center gap-1 transition ${isHovered ? 'opacity-100' : 'opacity-0'} hover:opacity-100 hover:text-blue-600 focus:opacity-100`}
            >
              <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
              <span>Trả lời</span>
            </button>

            <span>{formatTime(comment.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Replies (chỉ hiển thị cho comment gốc) */}
      {!isReply && (comment.replyCount ?? 0) > 0 && (
        <div className="ml-8 mt-2 space-y-2">
          {!showReplies ? (
            <button
              onClick={loadReplies}
              className="text-xs text-blue-600 hover:underline"
              disabled={loadingReplies}
            >
              {loadingReplies ? 'Đang tải...' : `Xem ${comment.replyCount} phản hồi`}
            </button>
          ) : (
            <div className="space-y-2">
              {comment.replies?.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  rootId={rootId}
                  isReply={true}
                  onReply={onReply}
                  onReact={onReact}
                  fetchReplies={fetchReplies}
                  apiUrl={apiUrl}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function CommentSection({ productId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; rootId: string } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const toggleReplies = (commentId: string, force?: boolean) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (force === true) newSet.add(commentId);
      else if (force === false) newSet.delete(commentId);
      else {
        if (newSet.has(commentId)) newSet.delete(commentId);
        else newSet.add(commentId);
      }
      return newSet;
    });
  };

  const fetchComments = async (pageNum = 1) => {
    try {
      const headers: any = {};
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await axios.get<{
        comments: Comment[];
        total: number;
        totalPages: number;
      }>(`${API_URL}/api/comments/product/${productId}?page=${pageNum}&limit=10`, { headers });

      if (pageNum === 1) setComments(res.data.comments);
      else setComments(prev => [...prev, ...res.data.comments]);

      setTotal(res.data.total);
      setHasMore(res.data.totalPages > pageNum);
      setPage(pageNum);
    } catch (error) {
      console.error('Lỗi tải bình luận:', error);
      toast.error('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplies = useCallback(async (commentId: string) => {
    try {
      const headers: any = {};
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }
      const res = await axios.get<Comment[]>(`${API_URL}/api/comments/${commentId}/replies`, { headers });
      const repliesData = Array.isArray(res.data) ? res.data : [];
      setComments(prev => updateRepliesInTree(prev, commentId, repliesData));
    } catch (error) {
      console.error('Lỗi tải replies:', error);
      toast.error('Không thể tải phản hồi');
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchComments(1);
  }, [productId]);

  const handleReact = async (commentId: string, type: ReactionType) => {
    if (!user) {
      toast.error('Đăng nhập để tương tác');
      return;
    }

    let previousComments: Comment[] = [];

    setComments(prev => {
      previousComments = prev;
      return prev.map(comment => {
        if (comment._id !== commentId) return comment;
        const currentList = comment.reactions?.[type] || [];
        const hasReacted = currentList.some(id => id.toString() === user._id.toString());
        const updatedList = hasReacted
          ? currentList.filter(id => id.toString() !== user._id.toString())
          : [...currentList, user._id];
        return {
          ...comment,
          reactions: { ...comment.reactions, [type]: updatedList },
        };
      });
    });

    try {
      const authToken = token || localStorage.getItem('token');
      const res = await axios.post(
        `${API_URL}/api/comments/${commentId}/react`,
        { type },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      const parentComment = comments.find(c => c.replies?.some(r => r._id === commentId));
      if (parentComment) {
        await fetchReplies(parentComment._id);
      } else {
        setComments(prev =>
          prev.map(c => (c._id === commentId ? { ...c, reactions: res.data.reactions } : c))
        );
      }
    } catch (error) {
      setComments(previousComments);
      toast.error(`Không thể ${type} bình luận`);
    }
  };

  const handleReply = (commentId: string, username: string, rootId: string) => {
    setReplyingTo({ id: commentId, username, rootId });
    setNewComment(`@${username} `);
    document.getElementById('comment-input')?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user && !guestName.trim()) {
      toast.error('Vui lòng nhập tên');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('content', newComment);
      if (replyingTo) {
        formData.append('replyTo', replyingTo.rootId);
      }
      if (editingComment) formData.append('commentId', editingComment._id);
      selectedFiles.forEach(file => formData.append('images', file));

      if (!user) {
        formData.append('userName', guestName);
      }

      const headers: any = {
        'Content-Type': 'multipart/form-data',
      };
      const authToken = token || localStorage.getItem('token');
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const res = await axios.post<Comment>(`${API_URL}/api/comments`, formData, { headers });

      if (editingComment) {
        setComments(prev => prev.map(c => (c._id === editingComment._id ? res.data : c)));
        toast.success('Đã cập nhật');
      } else if (replyingTo) {
        setComments(prev =>
          prev.map(c => {
            if (c._id === replyingTo.rootId) {
              const currentReplies = Array.isArray(c.replies) ? c.replies : [];
              return {
                ...c,
                replyCount: (c.replyCount || 0) + 1,
                replies: [...currentReplies, res.data],
              };
            }
            return c;
          })
        );
        toggleReplies(replyingTo.rootId, true);
        toast.success('Đã phản hồi');
      } else {
        setComments(prev => [res.data, ...prev]);
        toast.success('Đã đăng');
      }

      setNewComment('');
      setGuestName('');
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setSelectedFiles([]);
      setPreviewUrls([]);
      setEditingComment(null);
      setReplyingTo(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...urls]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewComment(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  if (loading && comments.length === 0) {
    return <div className="py-4 text-center">Đang tải bình luận...</div>;
  }

  return (
    <div className="mt-8">
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            rootId={comment._id}
            onReply={handleReply}
            onReact={handleReact}
            fetchReplies={fetchReplies}
            shouldExpand={expandedReplies.has(comment._id)}
            apiUrl={API_URL}
          />
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={() => fetchComments(page + 1)}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300"
          >
            Xem thêm
          </button>
        </div>
      )}

      <h3 className="text-xl font-bold mt-6 mb-4">Bình luận ({total})</h3>

      <form onSubmit={handleSubmit} className="mb-6">
        {!user && (
          <div className="mb-3">
            <input
              type="text"
              placeholder="Tên của bạn *"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
              required
            />
          </div>
        )}
        <div className="relative">
          <textarea
            id="comment-input"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={
              replyingTo
                ? `Phản hồi ${replyingTo.username}...`
                : editingComment
                ? 'Sửa bình luận...'
                : 'Viết bình luận...'
            }
            rows={3}
            className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={1000}
          />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-blue-600"
            >
              <FaceSmileIcon className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-blue-600"
            >
              <PhotoIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        {showEmojiPicker && (
          <div className="absolute z-10 mt-1">
            <EmojiPicker onEmojiClick={onEmojiClick} />
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative w-20 h-20">
                <img src={url} alt="preview" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end gap-2 mt-2">
          {replyingTo && (
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Hủy phản hồi
            </button>
          )}
          {editingComment && (
            <button
              type="button"
              onClick={() => {
                setEditingComment(null);
                setNewComment('');
                previewUrls.forEach(url => URL.revokeObjectURL(url));
                setSelectedFiles([]);
                setPreviewUrls([]);
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Hủy
            </button>
          )}
          <button
            type="submit"
            disabled={submitting || !newComment.trim() || (!user && !guestName.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting ? 'Đang gửi...' : editingComment ? 'Cập nhật' : 'Gửi'}
          </button>
        </div>
      </form>
    </div>
  );
}