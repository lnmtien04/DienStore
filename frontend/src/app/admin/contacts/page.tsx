'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  ChevronUpDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: 'general' | 'support' | 'complaint' | 'warranty';
  status: 'new' | 'processing' | 'resolved' | 'closed';
  assignedTo?: string;
  notes?: any[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Contact['status'] | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchContacts();
  }, [token, filter, page]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const url = new URL(`${API_URL}/api/contacts`);
      if (filter !== 'all') url.searchParams.append('status', filter);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', '10');
      const res = await axios.get(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data.contacts || res.data;
      setContacts(data);
      setTotalPages(res.data.totalPages || 1);
      setTotalItems(res.data.total || data.length);
    } catch (error) {
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Contact['status']) => {
    const colors: Record<Contact['status'], string> = {
      new: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
    };
    const labels: Record<Contact['status'], string> = {
      new: 'Mới',
      processing: 'Đang xử lý',
      resolved: 'Đã giải quyết',
      closed: 'Đã đóng',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  // Tính số lượng theo trạng thái từ dữ liệu hiện tại (tạm thời)
  const countByStatus = useMemo(() => {
    const counts = {
      new: contacts.filter(c => c.status === 'new').length,
      processing: contacts.filter(c => c.status === 'processing').length,
      resolved: contacts.filter(c => c.status === 'resolved').length,
      closed: contacts.filter(c => c.status === 'closed').length,
    };
    return counts;
  }, [contacts]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('vi-VN');
  };

  if (loading && contacts.length === 0) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Quản lý liên hệ</h1>

      {/* Thanh lọc trạng thái */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'all', label: 'Tất cả' },
          { key: 'new', label: 'Mới' },
          { key: 'processing', label: 'Đang xử lý' },
          { key: 'resolved', label: 'Đã xử lý' },
          { key: 'closed', label: 'Đã đóng' },
        ].map((item) => {
          const count = item.key === 'all' ? totalItems : countByStatus[item.key as keyof typeof countByStatus];
          return (
            <button
              key={item.key}
              onClick={() => { setFilter(item.key as any); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === item.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Bảng danh sách */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Họ tên</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">SĐT</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ngày gửi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contacts.map((c) => (
                <tr
                  key={c._id}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  onClick={() => router.push(`/admin/contacts/${c._id}`)}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.email}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{c.subject}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 capitalize">{c.type}</td>
                  <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/admin/contacts/${c._id}`} className="text-blue-600 hover:text-blue-800">
                      <EyeIcon className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {contacts.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có liên hệ nào</p>
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)} / {totalItems} liên hệ
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`px-3 py-1 rounded-lg ${
                  page === num ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}