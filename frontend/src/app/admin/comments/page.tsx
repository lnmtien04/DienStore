'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';

interface Comment {
  _id: string;
  user?: {
    _id: string;
    fullName: string;
    email: string;
    avatar?: string;
  } | null;
  userName?: string;
  productId: { _id: string; name: string; slug: string };
  content: string;
  images?: string[];
  status: 'active' | 'hidden' | 'deleted';
  replyCount: number;
  createdAt: string;
}

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedComments, setSelectedComments] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const { token, loading: authLoading, user } = useUser();
  const [imageModal, setImageModal] = useState<{ open: boolean; images: string[] }>({ open: false, images: [] });
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const isAdmin = user?.roles?.includes('admin');

  // Fetch comments
  const fetchComments = async () => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);

      const res = await axios.get(`${API_URL}/api/comments/admin?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setComments(res.data.comments || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (error) {
      toast.error('Không thể tải bình luận');
    } finally {
      setLoading(false);
    }
  };

  // Refresh when dependencies change
  useEffect(() => {
    if (!authLoading) {
      fetchComments();
    }
  }, [page, statusFilter, search, authLoading, token]);

  // Debounced search
  const handleSearchChange = useCallback(
    debounce((value: string) => {
      setSearch(value);
      setPage(1);
    }, 300),
    []
  );

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // Selection helpers – chỉ admin mới có
  const toggleSelectComment = (id: string) => {
    if (!isAdmin) return;
    setSelectedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (!isAdmin) return;
    if (selectedComments.size === comments.length) {
      setSelectedComments(new Set());
    } else {
      setSelectedComments(new Set(comments.map(c => c._id)));
    }
  };

  // Actions – chỉ admin mới có
  const handleToggleStatus = async (id: string) => {
    if (!isAdmin) return;
    try {
      const res = await axios.put(
        `${API_URL}/api/comments/admin/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(prev =>
        prev.map(c => (c._id === id ? { ...c, status: res.data.status } : c))
      );
      toast.success(res.data.message);
    } catch (error) {
      toast.error('Lỗi cập nhật trạng thái');
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    if (!confirm('Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.')) return;
    try {
      await axios.delete(`${API_URL}/api/comments/admin/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(prev => prev.filter(c => c._id !== id));
      setSelectedComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast.success('Đã xóa bình luận');
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleBulkAction = async (action: 'hide' | 'show' | 'delete') => {
    if (!isAdmin) return;
    if (selectedComments.size === 0) {
      toast.error('Vui lòng chọn ít nhất một bình luận');
      return;
    }

    if (action === 'delete' && !confirm(`Bạn có chắc muốn xóa ${selectedComments.size} bình luận? Hành động này không thể hoàn tác.`)) {
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = Array.from(selectedComments).map(id => {
        if (action === 'hide' || action === 'show') {
          return axios.put(
            `${API_URL}/api/comments/admin/${id}/toggle`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          return axios.delete(`${API_URL}/api/comments/admin/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      });
      await Promise.all(promises);
      fetchComments();
      setSelectedComments(new Set());
      const actionText = action === 'delete' ? 'xóa' : action === 'hide' ? 'ẩn' : 'hiển thị';
      toast.success(`Đã ${actionText} ${selectedComments.size} bình luận`);
    } catch (error) {
      toast.error('Lỗi khi thực hiện hàng loạt');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleExport = async () => {
    window.location.href = `${API_URL}/api/comments/admin/export`;
  };

  // Helper functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'hidden': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'deleted': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Hiển thị';
      case 'hidden': return 'Ẩn';
      case 'deleted': return 'Đã xóa';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 24 * 60 * 60 * 1000) {
      return format(date, 'HH:mm', { locale: vi });
    }
    return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
  };

  const isNewComment = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    return diff < 24 * 60 * 60 * 1000;
  };

  // Loading skeleton
  if (loading && comments.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý bình luận</h1>
        {/* <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <DocumentArrowDownIcon className="w-5 h-5" />
          Tải CSV
        </button> */}
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm nội dung hoặc người dùng..."
            className="w-full border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
            onChange={(e) => handleSearchChange(e.target.value)}
            defaultValue={search}
          />
        </div>
        <select
          className="border rounded-lg px-4 py-2 dark:bg-gray-800 dark:border-gray-700"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="">Tất cả</option>
          <option value="active">Hiển thị</option>
          <option value="hidden">Ẩn</option>
          <option value="deleted">Đã xóa</option>
        </select>
      </div>

      {isAdmin && selectedComments.size > 0 && (
        <div className="mb-4 flex gap-2 items-center p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm font-medium">Đã chọn {selectedComments.size} bình luận</span>
          <button
            onClick={() => handleBulkAction('hide')}
            disabled={bulkActionLoading}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 text-sm"
          >
            Ẩn hàng loạt
          </button>
          <button
            onClick={() => handleBulkAction('show')}
            disabled={bulkActionLoading}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            Hiển thị hàng loạt
          </button>
          <button
            onClick={() => handleBulkAction('delete')}
            disabled={bulkActionLoading}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 text-sm"
          >
            Xóa hàng loạt
          </button>
          <button
            onClick={() => setSelectedComments(new Set())}
            className="ml-auto text-gray-500 hover:text-gray-700"
            title="Bỏ chọn tất cả"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">Không có bình luận nào</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
            <table className="min-w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  {isAdmin && (
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedComments.size === comments.length && comments.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-sm font-medium">Người dùng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Sản phẩm</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nội dung</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Ảnh</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">Phản hồi</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ngày</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Trạng thái</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comments.map((comment) => {
                  const displayName = comment.user?.fullName || comment.userName || 'Khách';
                  const avatarUrl = comment.user?.avatar;
                  const isNew = isNewComment(comment.createdAt);
                  const images = comment.images;
                  const hasImages = images && images.length > 0;
                  return (
                    <tr
                      key={comment._id}
                      className={`transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        isNew ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      } ${comment.status === 'deleted' ? 'opacity-60' : ''}`}
                    >
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedComments.has(comment._id)}
                            onChange={() => toggleSelectComment(comment._id)}
                            className="rounded border-gray-300 dark:border-gray-600"
                            disabled={comment.status === 'deleted'}
                          />
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden shrink-0 flex items-center justify-center">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl.startsWith('http') ? avatarUrl : `${API_URL}${avatarUrl}`}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                {displayName.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{displayName}</div>
                            {comment.user?.email && (
                              <div className="text-sm text-gray-500">{comment.user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {comment.productId?.slug ? (
                          <Link
                            href={`/products/${comment.productId.slug}`}
                            target="_blank"
                            className="text-blue-600 hover:underline line-clamp-2"
                            title={comment.productId.name}
                          >
                            {comment.productId.name}
                          </Link>
                        ) : (
                          <span className="text-gray-500 italic text-sm">
                            {comment.productId?.name || 'Sản phẩm đã bị xóa'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="max-w-xs truncate cursor-help"
                          title={comment.content}
                        >
                          {comment.content}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {hasImages ? (
                          <button
                            onClick={() => setImageModal({ open: true, images: images!.map(img => `${API_URL}${img}`) })}
                            className="relative w-12 h-12 rounded overflow-hidden border border-gray-200 hover:shadow-md transition"
                            title={`${images!.length} ảnh đính kèm`}
                          >
                            <img
                              src={`${API_URL}${images![0]}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {images!.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1 rounded-tl">
                                +{images!.length - 1}
                              </span>
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/admin/comments/${comment._id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {comment.replyCount}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {formatDate(comment.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(comment.status)}`}>
                          {getStatusText(comment.status)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Link
                              href={`/admin/comments/${comment._id}`}
                              className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              title="Xem chi tiết & trả lời"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </Link>
                            {comment.status !== 'deleted' && (
                              <button
                                onClick={() => handleToggleStatus(comment._id)}
                                className="p-1 text-yellow-600 hover:bg-yellow-100 rounded transition-colors"
                                title={comment.status === 'active' ? 'Ẩn bình luận' : 'Hiển thị bình luận'}
                              >
                                {comment.status === 'active' ? (
                                  <EyeSlashIcon className="w-5 h-5" />
                                ) : (
                                  <EyeIcon className="w-5 h-5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                              title="Xóa bình luận (không thể hoàn tác)"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tổng: {total} bình luận
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Trước
              </button>
              <span className="px-3 py-1">
                Trang {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal xem ảnh */}
      {imageModal.open && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setImageModal({ open: false, images: [] })}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl max-h-[90vh] overflow-auto p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setImageModal({ open: false, images: [] })}
                className="text-gray-500 hover:text-gray-700"
              >
                ✖
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {imageModal.images.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Ảnh ${idx + 1}`}
                  className="w-full h-auto rounded-lg shadow"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}