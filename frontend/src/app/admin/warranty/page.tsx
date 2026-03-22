'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Warranty {
  _id: string;
  name: string;
  duration: number;
  description?: string;
  warrantyType: 'official' | 'store' | 'exchange' | 'refund';
  applicableType: 'all' | 'category' | 'brand' | 'product';
  applicableIds?: string[];
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function WarrantyPage() {
  const router = useRouter();
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWarranty, setEditingWarranty] = useState<Warranty | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter, search, sort
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [applicableFilter, setApplicableFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Warranty; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'deactivate' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    description: '',
    warrantyType: 'official',
    applicableType: 'all',
    applicableIds: '',
    isDefault: false,
    isActive: true,
  });

  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch warranties
  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchWarranties();
  }, [token]);

  const fetchWarranties = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/warranties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarranties(res.data);
    } catch (error) {
      console.error('Lỗi tải bảo hành:', error);
      toast.error('Không thể tải danh sách');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort logic
  const filteredWarranties = useMemo(() => {
    let filtered = [...warranties];

    // Search
    if (debouncedSearch) {
      filtered = filtered.filter(
        (w) =>
          w.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          w.description?.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((w) => w.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((w) => !w.isActive);
    }

    // Warranty type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((w) => w.warrantyType === typeFilter);
    }

    // Applicable type filter
    if (applicableFilter !== 'all') {
      filtered = filtered.filter((w) => w.applicableType === applicableFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const key = sortConfig.key;
      let aVal = a[key] ?? '';
      let bVal = b[key] ?? '';
      if (key === 'duration' || key === 'createdAt') {
        aVal = a[key];
        bVal = b[key];
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [warranties, debouncedSearch, statusFilter, typeFilter, applicableFilter, sortConfig]);

  // Pagination
  const paginatedWarranties = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredWarranties.slice(start, start + itemsPerPage);
  }, [filteredWarranties, currentPage, itemsPerPage]);

  useEffect(() => {
    setTotalItems(filteredWarranties.length);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
  }, [filteredWarranties.length]);

  useEffect(() => {
    if (selectAll) {
      setSelectedRows(paginatedWarranties.map((w) => w._id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll, paginatedWarranties]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên chính sách bảo hành');
      return false;
    }
    if (!formData.duration || Number(formData.duration) <= 0) {
      toast.error('Thời gian bảo hành phải là số dương');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const payload: any = {
      name: formData.name,
      duration: Number(formData.duration),
      description: formData.description,
      warrantyType: formData.warrantyType,
      applicableType: formData.applicableType,
      isDefault: formData.isDefault,
      isActive: formData.isActive,
    };
    if (formData.applicableIds) {
      payload.applicableIds = formData.applicableIds.split(',').map(id => id.trim());
    }

    try {
      if (editingWarranty) {
        await axios.put(`${API_URL}/api/warranties/${editingWarranty._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật chính sách thành công!');
      } else {
        await axios.post(`${API_URL}/api/warranties`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Thêm chính sách thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchWarranties();
    } catch (error: any) {
      console.error('Lỗi lưu:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Dữ liệu không hợp lệ');
      } else {
        toast.error('Đã xảy ra lỗi');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/api/warranties/${deleteTarget}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa chính sách thành công!');
      fetchWarranties();
    } catch (error) {
      console.error('Lỗi xóa:', error);
      toast.error('Xóa thất bại');
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkAction = (action: 'delete' | 'activate' | 'deactivate') => {
    if (selectedRows.length === 0) return;
    setBulkAction(action);
    setShowBulkConfirm(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction) return;
    try {
      if (bulkAction === 'delete') {
        await Promise.all(
          selectedRows.map((id) =>
            axios.delete(`${API_URL}/api/warranties/${id}`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        toast.success(`Đã xóa ${selectedRows.length} chính sách`);
      } else {
        const active = bulkAction === 'activate';
        await Promise.all(
          selectedRows.map((id) =>
            axios.put(
              `${API_URL}/api/warranties/${id}`,
              { isActive: active },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        toast.success(`Đã cập nhật trạng thái ${selectedRows.length} chính sách`);
      }
      fetchWarranties();
      setSelectedRows([]);
      setSelectAll(false);
    } catch (error) {
      toast.error('Thao tác thất bại');
    } finally {
      setShowBulkConfirm(false);
      setBulkAction(null);
    }
  };

  const openEditModal = (warranty: Warranty) => {
    setEditingWarranty(warranty);
    setFormData({
      name: warranty.name,
      duration: warranty.duration.toString(),
      description: warranty.description || '',
      warrantyType: warranty.warrantyType,
      applicableType: warranty.applicableType,
      applicableIds: warranty.applicableIds?.join(', ') || '',
      isDefault: warranty.isDefault,
      isActive: warranty.isActive,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingWarranty(null);
    setFormData({
      name: '',
      duration: '',
      description: '',
      warrantyType: 'official',
      applicableType: 'all',
      applicableIds: '',
      isDefault: false,
      isActive: true,
    });
    setShowModal(false);
  };

  const requestSort = (key: keyof Warranty) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-600">Hoạt động</span>;
    }
    return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">Ẩn</span>;
  };

  const getWarrantyTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      official: 'Chính hãng',
      store: 'Cửa hàng',
      exchange: '1 đổi 1',
      refund: 'Hoàn tiền',
    };
    return map[type] || type;
  };

  const getApplicableLabel = (type: string) => {
    const map: Record<string, string> = {
      all: 'Toàn bộ',
      category: 'Danh mục',
      brand: 'Thương hiệu',
      product: 'Sản phẩm',
    };
    return map[type] || type;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading && warranties.length === 0) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý chính sách bảo hành</h1>
        <div className="flex flex-wrap items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <button
                onClick={() => handleBulkAction('activate')}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl hover:bg-green-100 transition"
              >
                <CheckIcon className="w-4 h-4" />
                Kích hoạt
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition"
              >
                <XMarkIcon className="w-4 h-4" />
                Tạm ẩn
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition"
              >
                <TrashIcon className="w-4 h-4" />
                Xóa ({selectedRows.length})
              </button>
            </>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm chính sách
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Ẩn</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Tất cả loại</option>
          <option value="official">Chính hãng</option>
          <option value="store">Cửa hàng</option>
          <option value="exchange">1 đổi 1</option>
          <option value="refund">Hoàn tiền</option>
        </select>
        <select
          value={applicableFilter}
          onChange={(e) => setApplicableFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl"
        >
          <option value="all">Mọi áp dụng</option>
          <option value="all">Toàn bộ</option>
          <option value="category">Danh mục</option>
          <option value="brand">Thương hiệu</option>
          <option value="product">Sản phẩm</option>
        </select>
        <select
          value={itemsPerPage}
          onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl"
        >
          <option value="10">10 / trang</option>
          <option value="20">20 / trang</option>
          <option value="50">50 / trang</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => setSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-1">
                    Tên
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('duration')}>
                  <div className="flex items-center gap-1">
                    Thời gian
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Áp dụng</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mô tả</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mặc định</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('createdAt')}>
                  <div className="flex items-center gap-1">
                    Ngày tạo
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedWarranties.map((w) => (
                <tr
                  key={w._id}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  onClick={() => openEditModal(w)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(w._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, w._id]);
                        } else {
                          setSelectedRows(selectedRows.filter((id) => id !== w._id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{w.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{w.duration} tháng</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{getWarrantyTypeLabel(w.warrantyType)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{getApplicableLabel(w.applicableType)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{w.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    {w.isDefault ? <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">Mặc định</span> : '-'}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(w.isActive)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(w.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(w)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(w._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Xóa"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredWarranties.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có chính sách bảo hành nào</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} chính sách
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Trước
            </button>
            {pageNumbers.map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === num ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingWarranty ? 'Sửa chính sách' : 'Thêm chính sách mới'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên chính sách *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian (tháng) *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại bảo hành</label>
                  <select
                    value={formData.warrantyType}
                    onChange={(e) => setFormData({ ...formData, warrantyType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="official">Chính hãng</option>
                    <option value="store">Cửa hàng</option>
                    <option value="exchange">1 đổi 1</option>
                    <option value="refund">Hoàn tiền</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Áp dụng cho</label>
                  <select
                    value={formData.applicableType}
                    onChange={(e) => setFormData({ ...formData, applicableType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="all">Toàn bộ sản phẩm</option>
                    <option value="category">Theo danh mục</option>
                    <option value="brand">Theo thương hiệu</option>
                    <option value="product">Theo sản phẩm cụ thể</option>
                  </select>
                </div>
                {formData.applicableType !== 'all' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      ID đối tượng áp dụng (cách nhau bằng dấu phẩy)
                    </label>
                    <input
                      type="text"
                      value={formData.applicableIds}
                      onChange={(e) => setFormData({ ...formData, applicableIds: e.target.value })}
                      placeholder="Ví dụ: id1, id2, id3"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Mặc định</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Hoạt động</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                  {submitting ? 'Đang xử lý...' : editingWarranty ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận xóa</h3>
            <p className="text-slate-600 mb-4">Bạn có chắc muốn xóa chính sách bảo hành này?</p>
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

      {/* Bulk Action Confirm */}
      {showBulkConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận thao tác hàng loạt</h3>
            <p className="text-slate-600 mb-4">
              {bulkAction === 'delete'
                ? `Bạn có chắc muốn xóa ${selectedRows.length} chính sách?`
                : bulkAction === 'activate'
                ? `Kích hoạt ${selectedRows.length} chính sách?`
                : `Tạm ẩn ${selectedRows.length} chính sách?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={confirmBulkAction}
                className={`px-4 py-2 text-white rounded-lg ${
                  bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}