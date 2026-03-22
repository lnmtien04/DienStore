'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ArrowLeftIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CommentDetail {
  _id: string;
  user?: { _id: string; fullName: string; email: string; avatar?: string } | null;
  userName?: string;
  productId: { _id: string; name: string; slug: string };
  content: string;
  images?: string[];
  status: string;
  replyCount: number;
  createdAt: string;
  replies?: CommentDetail[];
}

export default function CommentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [comment, setComment] = useState<CommentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

 const fetchComment = async () => {
  const authToken = token || localStorage.getItem('token');
  if (!authToken) {
    toast.error('Vui lòng đăng nhập lại');
    setLoading(false);
    return;
  }
  try {
    const res = await axios.get(`${API_URL}/api/comments/admin/${id}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    setComment(res.data);
  } catch (error) {
    toast.error('Không thể tải bình luận');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchComment();
  }, [id]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmitting(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/comments/admin/${id}/reply`,
        { content: replyContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComment(prev =>
        prev
          ? {
              ...prev,
              replies: [...(prev.replies || []), res.data],
              replyCount: (prev.replyCount || 0) + 1,
            }
          : null
      );
      setReplyContent('');
      toast.success('Đã trả lời');
    } catch (error) {
      toast.error('Lỗi khi gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  const getDisplayName = (user: any, userName?: string) => {
    if (user?.fullName) return user.fullName;
    if (userName) return userName;
    return 'Khách';
  };

  const getAvatarUrl = (avatar?: string) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    return `${API_URL}${avatar}`;
  };

  if (loading) return <div className="p-6 text-center">Đang tải...</div>;
  if (!comment) return <div className="p-6 text-center">Không tìm thấy bình luận</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center text-blue-600 hover:underline"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-1" /> Quay lại
      </button>

      <h1 className="text-2xl font-bold mb-6">Chi tiết bình luận</h1>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden shrink-0">
            {getAvatarUrl(comment.user?.avatar) ? (
              <img src={getAvatarUrl(comment.user?.avatar)!} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                {getDisplayName(comment.user, comment.userName).charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold">
                {getDisplayName(comment.user, comment.userName)}
                {comment.user?.email && ` (${comment.user.email})`}
              </span>
              <span className="text-sm text-gray-500">
                {format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-line">{comment.content}</p>
            {comment.images && comment.images.length > 0 && (
              <div className="flex gap-2 mt-2">
                {comment.images.map((img, idx) => (
                  <img key={idx} src={`${API_URL}${img}`} alt="" className="w-20 h-20 object-cover rounded" />
                ))}
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              Sản phẩm:{' '}
              {comment.productId?.slug ? (
                <a
                  href={`/products/${comment.productId.slug}`}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  {comment.productId.name}
                </a>
              ) : (
                <span className="text-gray-400 italic">Sản phẩm đã bị xóa</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">Phản hồi ({comment.replyCount})</h2>
      <div className="space-y-4 mb-6">
        {comment.replies && comment.replies.length > 0 ? (
          comment.replies.map((reply) => (
            <div key={reply._id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg ml-8">
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 overflow-hidden shrink-0">
                  {getAvatarUrl(reply.user?.avatar) ? (
                    <img src={getAvatarUrl(reply.user?.avatar)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs">
                      {getDisplayName(reply.user, reply.userName).charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className="font-medium">{getDisplayName(reply.user, reply.userName)}</span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(reply.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </span>
                  </div>
                  <p className="mt-1">{reply.content}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic">Chưa có phản hồi nào.</p>
        )}
      </div>

      <form onSubmit={handleReply} className="mt-4">
        <textarea
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          placeholder="Nhập phản hồi của bạn..."
          rows={3}
          className="w-full p-3 border rounded-lg dark:bg-gray-800 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={submitting || !replyContent.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
          </button>
        </div>
      </form>
    </div>
  );
}