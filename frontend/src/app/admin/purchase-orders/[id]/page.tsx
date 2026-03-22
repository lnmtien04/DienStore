'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface PurchaseOrderItem {
  product: { _id: string; name: string; sku: string };
  sku: string;
  productName: string;
  currentStock: number;
  quantity: number;
  purchasePrice: number;
  total: number;
}

interface PurchaseOrder {
  _id: string;
  code: string;
  supplier: { _id: string; name: string };
  supplierName: string;
  orderDate: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  status: 'draft' | 'approved' | 'cancelled';
  notes?: string;
  createdBy: { _id: string; fullName: string };
  approvedBy?: { _id: string; fullName: string };
  approvedAt?: string;
  cancelledBy?: { _id: string; fullName: string };
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUser();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (token) {
      fetchOrder();
    }
  }, [token, id]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(res.data);
    } catch (error) {
      console.error('Lỗi tải phiếu nhập:', error);
      toast.error('Không thể tải thông tin phiếu');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Xác nhận duyệt phiếu nhập? Hành động này sẽ cập nhật tồn kho và không thể hoàn tác.')) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/purchase-orders/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã duyệt phiếu và cập nhật kho');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Duyệt thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Hủy phiếu nhập?')) return;
    setActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/purchase-orders/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã hủy phiếu');
      fetchOrder();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Hủy thất bại');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!order) return <div className="text-center py-10">Không tìm thấy phiếu</div>;

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    approved: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels = {
    draft: 'Nháp',
    approved: 'Đã duyệt',
    cancelled: 'Đã hủy',
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Chi tiết phiếu nhập</h1>
          <div className="flex-1"></div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>

        {/* Thông tin chung */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Mã phiếu</p>
              <p className="font-medium">{order.code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Nhà cung cấp</p>
              <p className="font-medium">{order.supplier?.name || order.supplierName}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Ngày nhập</p>
              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Người tạo</p>
              <p className="font-medium">{order.createdBy?.fullName || 'N/A'}</p>
            </div>
            {order.approvedBy && (
              <div>
                <p className="text-sm text-slate-500">Người duyệt</p>
                <p className="font-medium">{order.approvedBy.fullName} - {new Date(order.approvedAt!).toLocaleString('vi-VN')}</p>
              </div>
            )}
            {order.cancelledBy && (
              <div>
                <p className="text-sm text-slate-500">Người hủy</p>
                <p className="font-medium">{order.cancelledBy.fullName} - {new Date(order.cancelledAt!).toLocaleString('vi-VN')}</p>
              </div>
            )}
          </div>
          {order.notes && (
            <div className="mt-4">
              <p className="text-sm text-slate-500">Ghi chú</p>
              <p className="text-sm bg-slate-50 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Danh sách sản phẩm */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold">Sản phẩm nhập</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">SKU</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Số lượng</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Giá nhập</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 font-medium text-slate-900">{item.product?.name || item.productName}</td>
                    <td className="px-6 py-4 text-slate-500">{item.sku || item.product?.sku}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.quantity}</td>
                    <td className="px-6 py-4 text-right text-slate-500">{item.purchasePrice.toLocaleString()}đ</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">{item.total.toLocaleString()}đ</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-medium text-slate-600">Tổng cộng</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">{order.totalAmount.toLocaleString()}đ</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex justify-end gap-3">
          {order.status === 'draft' && (
            <>
              <Link
                href={`/admin/purchase-orders/edit/${order._id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <PencilIcon className="w-4 h-4" />
                Sửa phiếu
              </Link>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <CheckCircleIcon className="w-4 h-4" />
                {actionLoading ? 'Đang xử lý...' : 'Duyệt & nhập kho'}
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <XCircleIcon className="w-4 h-4" />
                Hủy phiếu
              </button>
            </>
          )}
          {order.status === 'approved' && (
            <Link
              href={`/admin/inventory/transactions?reference=${order.code}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Xem lịch sử kho
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}