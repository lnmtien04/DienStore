// app/admin/contacts/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ContactDetailPage() {
  const { id } = useParams();
  const { token } = useUser();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) return;
    fetchContact();
  }, [token, id]);

  const fetchContact = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/contacts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContact(res.data);
      setStatus(res.data.status);
    } catch (error) {
      toast.error('Không thể tải chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!note && status === contact.status) {
      toast.error('Vui lòng nhập ghi chú hoặc thay đổi trạng thái');
      return;
    }
    setSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/api/contacts/${id}`,
        { status, note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật thành công');
      fetchContact();
      setNote('');
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('vi-VN');
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!contact) return null;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <button onClick={() => router.back()} className="flex items-center gap-1 text-slate-600 mb-4">
        <ArrowLeftIcon className="w-4 h-4" /> Quay lại
      </button>
      <h1 className="text-2xl font-bold mb-6">Chi tiết liên hệ</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="font-medium">Họ tên:</span> {contact.name}</div>
          <div><span className="font-medium">Email:</span> {contact.email}</div>
          <div><span className="font-medium">Điện thoại:</span> {contact.phone || 'Không có'}</div>
          <div><span className="font-medium">Loại:</span> {contact.type}</div>
          <div className="md:col-span-2"><span className="font-medium">Tiêu đề:</span> {contact.subject}</div>
          <div className="md:col-span-2"><span className="font-medium">Nội dung:</span> <p className="whitespace-pre-wrap bg-slate-50 p-3 rounded">{contact.message}</p></div>
          <div><span className="font-medium">Ngày gửi:</span> {formatDateTime(contact.createdAt)}</div>
          <div><span className="font-medium">Trạng thái hiện tại:</span> {contact.status}</div>
        </div>

        <hr className="my-4" />
        <h2 className="text-lg font-semibold">Cập nhật xử lý</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="border border-slate-200 rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">Mới</option>
              <option value="processing">Đang xử lý</option>
              <option value="resolved">Đã xử lý</option>
              <option value="closed">Đã đóng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Ghi chú mới</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="border border-slate-200 rounded-xl p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập ghi chú..."
            />
          </div>
          <button
            onClick={handleUpdate}
            disabled={submitting}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-blue-300"
          >
            {submitting ? 'Đang xử lý...' : 'Cập nhật'}
          </button>
        </div>

        <hr className="my-4" />
        <h2 className="text-lg font-semibold">Lịch sử ghi chú</h2>
        <div className="space-y-3">
          {contact.notes?.length === 0 ? (
            <p className="text-slate-500">Chưa có ghi chú nào.</p>
          ) : (
            contact.notes?.map((n: any, idx: number) => (
              <div key={idx} className="border-b border-slate-100 pb-2 last:border-0">
                <p className="text-sm">{n.content}</p>
                <p className="text-xs text-slate-400 mt-1">
                  Bởi {n.createdBy?.fullName || 'Unknown'} - {formatDateTime(n.createdAt)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}