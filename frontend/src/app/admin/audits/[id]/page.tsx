'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface AuditItem {
  product: { _id: string; name: string; sku: string };
  systemStock: number;
  actualStock: number;
  difference: number;
  note?: string;
}

interface Audit {
  _id: string;
  code: string;
  warehouse: string;
  status: 'draft' | 'completed' | 'cancelled';
  items: AuditItem[];
  totalDifference: number;
  note?: string;
  createdBy: { fullName: string };
  completedBy?: { fullName: string };
  completedAt?: string;
  createdAt: string;
}

export default function AuditDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUser();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (id && token) fetchAudit();
  }, [id, token]);

  const fetchAudit = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/audits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAudit(res.data);
    } catch (error) {
      toast.error('Không thể tải chi tiết');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm('Xác nhận hoàn thành kiểm kê? Sẽ cập nhật tồn kho.')) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/audits/${id}/complete`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã hoàn thành kiểm kê');
      fetchAudit();
    } catch (error) {
      toast.error('Thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Hủy phiếu kiểm kê?')) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/audits/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã hủy phiếu');
      fetchAudit();
    } catch (error) {
      toast.error('Thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!audit) return <div className="text-center py-10">Không tìm thấy</div>;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };
  const statusLabels = {
    // draft: 'Nháp',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy',
  };

  const totalDiff = audit.items.reduce((sum, i) => sum + i.difference, 0);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white rounded-lg">
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Chi tiết kiểm kê</h1>
          <div className="flex-1" />
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[audit.status]}`}>
            {/* {statusLabels[audit.status]} */}
          </span>
        </div>

        {/* Thông tin chung */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Mã kiểm kê</p>
              <p className="font-medium">{audit.code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Kho</p>
              <p className="font-medium">{audit.warehouse}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Người tạo</p>
              <p className="font-medium">{audit.createdBy?.fullName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngày tạo</p>
              <p className="font-medium">{new Date(audit.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            {audit.completedBy && (
              <div>
                <p className="text-sm text-slate-500">Người hoàn thành</p>
                <p className="font-medium">
                  {audit.completedBy.fullName} - {new Date(audit.completedAt!).toLocaleString('vi-VN')}
                </p>
              </div>
            )}
          </div>
          {audit.note && (
            <div className="mt-4">
              <p className="text-sm text-slate-500">Ghi chú</p>
              <p className="text-sm bg-slate-50 p-3 rounded-lg">{audit.note}</p>
            </div>
          )}
        </div>

        {/* Danh sách sản phẩm */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold">Danh sách sản phẩm</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left">Sản phẩm</th>
                  <th className="px-4 py-3 text-right">Tồn hệ thống</th>
                  <th className="px-4 py-3 text-right">Tồn thực tế</th>
                  <th className="px-4 py-3 text-right">Chênh lệch</th>
                  <th className="px-4 py-3">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {audit.items.map((item, idx) => {
                  const diffColor =
                    item.difference > 0
                      ? 'text-green-600'
                      : item.difference < 0
                      ? 'text-red-600'
                      : '';
                  return (
                    <tr key={idx}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-xs text-slate-400">{item.product?.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-right">{item.systemStock}</td>
                      <td className="px-4 py-3 text-right">{item.actualStock}</td>
                      <td className={`px-4 py-3 text-right font-medium ${diffColor}`}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </td>
                      <td className="px-4 py-3">{item.note || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-right font-medium">
                    Tổng chênh lệch
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-bold ${
                      totalDiff > 0
                        ? 'text-green-600'
                        : totalDiff < 0
                        ? 'text-red-600'
                        : ''
                    }`}
                  >
                    {totalDiff > 0 ? `+${totalDiff}` : totalDiff}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Nút hành động (chỉ khi draft) */}
        {audit.status === 'draft' && (
          <div className="flex justify-end gap-3">
            <Link
              href={`/admin/audits/edit/${audit._id}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <PencilIcon className="w-4 h-4" />
              Sửa phiếu
            </Link>
            <button
              onClick={handleComplete}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircleIcon className="w-4 h-4" />
              {actionLoading ? 'Đang xử lý...' : 'Hoàn thành'}
            </button>
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <XCircleIcon className="w-4 h-4" />
              Hủy phiếu
            </button>
          </div>
        )}
      </div>
    </div>
  );
}