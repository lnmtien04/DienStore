'use client';

import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
  applicableType?: 'all' | 'category' | 'product'; // giả định, có thể thay bằng field thật
  applicableIds?: string[];
  isActive: boolean;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    startDate: '',
    endDate: '',
    usageLimit: '',
    isActive: true,
  });

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Thêm field giả định cho applicableType (nếu backend chưa có)
      const data = (res.data.coupons || res.data).map((c: Coupon) => ({
        ...c,
        applicableType: c.applicableType || (Math.random() > 0.5 ? 'all' : Math.random() > 0.5 ? 'category' : 'product'), // demo
      }));
      setCoupons(data);
    } catch (error) {
      console.error('Lỗi tải mã khuyến mãi:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        toast.error('Phiên đăng nhập hết hạn');
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.code.trim()) {
      toast.error('Vui lòng nhập mã khuyến mãi');
      return false;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Giá trị giảm phải lớn hơn 0');
      return false;
    }
    if (!formData.startDate || !formData.endDate) {
      toast.error('Vui lòng chọn ngày hiệu lực');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      code: formData.code,
      description: formData.description,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxDiscountAmount: formData.discountType === 'percentage' ? (Number(formData.maxDiscountAmount) || null) : null,
      startDate: formData.startDate,
      endDate: formData.endDate,
      usageLimit: Number(formData.usageLimit) || null,
      isActive: formData.isActive,
    };

    try {
      if (editingCoupon) {
        await axios.put(`${API_URL}/api/coupons/${editingCoupon._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật mã thành công!');
      } else {
        await axios.post(`${API_URL}/api/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Thêm mã thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      console.error('Lỗi lưu mã:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Dữ liệu không hợp lệ');
      }
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/api/coupons/${deleteTarget}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa mã thành công!');
      fetchCoupons();
    } catch (error: any) {
      console.error('Lỗi xóa mã:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Không thể xóa');
      }
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Đã copy mã!');
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue.toString(),
      minOrderAmount: coupon.minOrderAmount.toString(),
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      startDate: coupon.startDate.slice(0, 16),
      endDate: coupon.endDate.slice(0, 16),
      usageLimit: coupon.usageLimit?.toString() || '',
      isActive: coupon.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '', description: '', discountType: 'percentage', discountValue: '',
      minOrderAmount: '', maxDiscountAmount: '', startDate: '', endDate: '', usageLimit: '', isActive: true
    });
  };

  // Tính trạng thái tự động
  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);
    if (!coupon.isActive) return { label: 'Tạm khóa', color: 'bg-gray-100 text-gray-600' };
    if (now < start) return { label: 'Sắp diễn ra', color: 'bg-yellow-100 text-yellow-600' };
    if (now > end) return { label: 'Hết hạn', color: 'bg-red-100 text-red-600' };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { label: 'Hết lượt', color: 'bg-orange-100 text-orange-600' };
    return { label: 'Hoạt động', color: 'bg-green-100 text-green-600' };
  };

  // Filter coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchesSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      const status = getCouponStatus(c).label;
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (typeFilter !== 'all') {
        if (typeFilter === 'percentage' && c.discountType !== 'percentage') return false;
        if (typeFilter === 'fixed' && c.discountType !== 'fixed') return false;
      }
      return true;
    });
  }, [coupons, searchTerm, statusFilter, typeFilter]);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý mã khuyến mãi</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm mã
        </button>
      </div>

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo mã, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="Hoạt động">Hoạt động</option>
          <option value="Sắp diễn ra">Sắp diễn ra</option>
          <option value="Hết hạn">Hết hạn</option>
          <option value="Tạm khóa">Tạm khóa</option>
          <option value="Hết lượt">Hết lượt</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="all">Tất cả loại</option>
          <option value="percentage">Phần trăm</option>
          <option value="fixed">Giảm tiền</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Mã</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Giá trị</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Giảm tối đa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Đơn tối thiểu</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Phạm vi</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Hiệu lực</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Đã dùng / Giới hạn</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCoupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <tr
                    key={coupon._id}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => { setSelectedCoupon(coupon); setShowDetailModal(true); }}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{coupon.code}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {coupon.discountType === 'percentage' ? 'Phần trăm' : 'Tiền mặt'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : coupon.discountValue.toLocaleString() + 'đ'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toLocaleString() + 'đ' : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {coupon.minOrderAmount > 0 ? coupon.minOrderAmount.toLocaleString() + 'đ' : '0đ'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {coupon.applicableType === 'all' ? 'Toàn bộ' : coupon.applicableType === 'category' ? 'Danh mục' : 'Sản phẩm'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(coupon.startDate).toLocaleDateString('vi-VN')}<br />
                      <span className="text-xs">{new Date(coupon.endDate).toLocaleDateString('vi-VN')}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="text-slate-600">
                        Đã dùng: <span className="font-medium">{coupon.usedCount}</span>
                      </div>
                      {coupon.usageLimit && (
                        <div className="text-xs text-slate-400">
                          Giới hạn: {coupon.usageLimit}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Copy mã"
                        >
                          <ClipboardDocumentIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openEditModal(coupon)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Sửa"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Xóa"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredCoupons.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có mã khuyến mãi nào</p>
        )}
      </div>

      {/* Modal thêm/sửa (giữ nguyên form cũ, đã có) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-xl font-bold mb-4">{editingCoupon ? 'Sửa mã' : 'Thêm mã mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ... (giữ nguyên form cũ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mã *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại giảm</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="percentage">Phần trăm</option>
                    <option value="fixed">Tiền mặt</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giá trị *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                {formData.discountType === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Giảm tối đa (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                      placeholder="Không giới hạn"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn tối thiểu (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày bắt đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày kết thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Giới hạn lượt dùng</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    placeholder="Không giới hạn"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span className="text-sm">Hoạt động</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  {editingCoupon ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {showDetailModal && selectedCoupon && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Chi tiết mã {selectedCoupon.code}</h3>
              <button onClick={() => setShowDetailModal(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              <p><span className="font-medium">Mã:</span> {selectedCoupon.code}</p>
              <p><span className="font-medium">Mô tả:</span> {selectedCoupon.description || '-'}</p>
              <p><span className="font-medium">Loại:</span> {selectedCoupon.discountType === 'percentage' ? 'Phần trăm' : 'Tiền mặt'}</p>
              <p><span className="font-medium">Giá trị:</span> {selectedCoupon.discountType === 'percentage' ? `${selectedCoupon.discountValue}%` : selectedCoupon.discountValue.toLocaleString() + 'đ'}</p>
              {selectedCoupon.maxDiscountAmount && (
                <p><span className="font-medium">Giảm tối đa:</span> {selectedCoupon.maxDiscountAmount.toLocaleString()}đ</p>
              )}
              <p><span className="font-medium">Đơn tối thiểu:</span> {selectedCoupon.minOrderAmount.toLocaleString()}đ</p>
              <p><span className="font-medium">Phạm vi:</span> {selectedCoupon.applicableType === 'all' ? 'Toàn bộ' : selectedCoupon.applicableType === 'category' ? 'Danh mục' : 'Sản phẩm'}</p>
              <p><span className="font-medium">Hiệu lực:</span> {new Date(selectedCoupon.startDate).toLocaleString('vi-VN')} - {new Date(selectedCoupon.endDate).toLocaleString('vi-VN')}</p>
              <p><span className="font-medium">Đã dùng:</span> {selectedCoupon.usedCount}</p>
              {selectedCoupon.usageLimit && <p><span className="font-medium">Giới hạn:</span> {selectedCoupon.usageLimit}</p>}
              <p><span className="font-medium">Trạng thái:</span> <span className={`px-2 py-1 text-xs rounded-full ${getCouponStatus(selectedCoupon).color}`}>{getCouponStatus(selectedCoupon).label}</span></p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-4">Bạn có chắc muốn xóa mã khuyến mãi này?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}