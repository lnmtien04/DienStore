'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import Image from 'next/image';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Shipper {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  logo?: string;
  defaultFee: number;
  freeThreshold: number;
  estimatedDelivery?: string;
  coverage: 'nationwide' | 'city' | 'district';
  serviceType: 'standard' | 'fast' | 'express';
  priority: number;
  status: 'active' | 'suspended' | 'discontinued';
  trackingUrlTemplate?: string;
  isDefault: boolean;
  createdAt: string;
}

export default function ShippersPage() {
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter, search, sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [coverageFilter, setCoverageFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Shipper; direction: 'asc' | 'desc' }>({
    key: 'priority',
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
  const [bulkAction, setBulkAction] = useState<'delete' | 'activate' | 'suspend' | 'discontinue' | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    phone: '',
    email: '',
    logo: '',
    defaultFee: '',
    freeThreshold: '',
    estimatedDelivery: '',
    coverage: 'nationwide',
    serviceType: 'standard',
    priority: '',
    status: 'active',
    trackingUrlTemplate: '',
    isDefault: false,
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

  // Fetch shippers
  useEffect(() => {
    fetchShippers();
  }, []);

  const fetchShippers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/shippers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShippers(res.data);
    } catch (error) {
      console.error('Lỗi tải đơn vị vận chuyển:', error);
      toast.error('Không thể tải danh sách');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort logic (client-side)
  const filteredShippers = useMemo(() => {
    let filtered = [...shippers];

    // Search
    if (debouncedSearch) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          s.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          s.phone?.includes(debouncedSearch)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    // Coverage filter
    if (coverageFilter !== 'all') {
      filtered = filtered.filter((s) => s.coverage === coverageFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const key = sortConfig.key;
      let aVal = a[key] ?? '';
      let bVal = b[key] ?? '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [shippers, debouncedSearch, statusFilter, coverageFilter, sortConfig]);

  // Pagination
  const paginatedShippers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredShippers.slice(start, start + itemsPerPage);
  }, [filteredShippers, currentPage, itemsPerPage]);

  // Update total items khi filter thay đổi
  useEffect(() => {
    setTotalItems(filteredShippers.length);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
  }, [filteredShippers.length]);

  // Select all logic
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(paginatedShippers.map((s) => s._id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll, paginatedShippers]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên đơn vị vận chuyển');
      return false;
    }
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.logo || null;
    const uploadData = new FormData();
    uploadData.append('image', imageFile);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      return res.data.url;
    } catch (error) {
      console.error('Lỗi upload ảnh:', error);
      toast.error('Upload ảnh thất bại');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    let logoUrl = formData.logo;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) {
        setSubmitting(false);
        return;
      }
      logoUrl = uploaded;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      website: formData.website,
      phone: formData.phone,
      email: formData.email,
      logo: logoUrl,
      defaultFee: Number(formData.defaultFee) || 0,
      freeThreshold: Number(formData.freeThreshold) || 0,
      estimatedDelivery: formData.estimatedDelivery,
      coverage: formData.coverage,
      serviceType: formData.serviceType,
      priority: Number(formData.priority) || 0,
      status: formData.status,
      trackingUrlTemplate: formData.trackingUrlTemplate,
      isDefault: formData.isDefault,
    };

    try {
      if (editingShipper) {
        await axios.put(`${API_URL}/api/shippers/${editingShipper._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật thành công!');
      } else {
        await axios.post(`${API_URL}/api/shippers`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Thêm mới thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchShippers();
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
      await axios.delete(`${API_URL}/api/shippers/${deleteTarget}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa thành công!');
      fetchShippers();
    } catch (error: any) {
      console.error('Lỗi xóa:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Không thể xóa');
      } else {
        toast.error('Xóa thất bại');
      }
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const handleBulkAction = (action: 'delete' | 'activate' | 'suspend' | 'discontinue') => {
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
            axios.delete(`${API_URL}/api/shippers/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        toast.success(`Đã xóa ${selectedRows.length} đơn vị`);
      } else {
        let newStatus: 'active' | 'suspended' | 'discontinued' = 'active';
        if (bulkAction === 'suspend') newStatus = 'suspended';
        if (bulkAction === 'discontinue') newStatus = 'discontinued';
        await Promise.all(
          selectedRows.map((id) =>
            axios.put(
              `${API_URL}/api/shippers/${id}`,
              { status: newStatus },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        toast.success(`Đã cập nhật trạng thái ${selectedRows.length} đơn vị`);
      }
      fetchShippers();
      setSelectedRows([]);
      setSelectAll(false);
    } catch (error) {
      toast.error('Thao tác thất bại');
    } finally {
      setShowBulkConfirm(false);
      setBulkAction(null);
    }
  };

  const openEditModal = (shipper: Shipper) => {
    setEditingShipper(shipper);
    setFormData({
      name: shipper.name,
      description: shipper.description || '',
      website: shipper.website || '',
      phone: shipper.phone || '',
      email: shipper.email || '',
      logo: shipper.logo || '',
      defaultFee: shipper.defaultFee?.toString() || '',
      freeThreshold: shipper.freeThreshold?.toString() || '',
      estimatedDelivery: shipper.estimatedDelivery || '',
      coverage: shipper.coverage || 'nationwide',
      serviceType: shipper.serviceType || 'standard',
      priority: shipper.priority?.toString() || '',
      status: shipper.status || 'active',
      trackingUrlTemplate: shipper.trackingUrlTemplate || '',
      isDefault: shipper.isDefault || false,
    });
    setPreviewImage(shipper.logo || '');
    setImageFile(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingShipper(null);
    setFormData({
      name: '',
      description: '',
      website: '',
      phone: '',
      email: '',
      logo: '',
      defaultFee: '',
      freeThreshold: '',
      estimatedDelivery: '',
      coverage: 'nationwide',
      serviceType: 'standard',
      priority: '',
      status: 'active',
      trackingUrlTemplate: '',
      isDefault: false,
    });
    setPreviewImage('');
    setImageFile(null);
    setShowModal(false);
  };

  const requestSort = (key: keyof Shipper) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status: Shipper['status']) => {
    const colors: Record<Shipper['status'], string> = {
      active: 'bg-green-100 text-green-600',
      suspended: 'bg-yellow-100 text-yellow-600',
      discontinued: 'bg-red-100 text-red-600',
    };
    const labels: Record<Shipper['status'], string> = {
      active: 'Hoạt động',
      suspended: 'Tạm ngưng',
      discontinued: 'Ngừng hợp tác',
    };
    return (
      <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading && shippers.length === 0) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý đơn vị vận chuyển</h1>
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
                onClick={() => handleBulkAction('suspend')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition"
              >
                <XMarkIcon className="w-4 h-4" />
                Tạm ngưng
              </button>
              <button
                onClick={() => handleBulkAction('discontinue')}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition"
              >
                <XMarkIcon className="w-4 h-4" />
                Ngừng
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
            Thêm đơn vị
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, email, SĐT..."
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
          <option value="active">Hoạt động</option>
          <option value="suspended">Tạm ngưng</option>
          <option value="discontinued">Ngừng hợp tác</option>
        </select>
        <select
          value={coverageFilter}
          onChange={(e) => setCoverageFilter(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none"
        >
          <option value="all">Tất cả khu vực</option>
          <option value="nationwide">Toàn quốc</option>
          <option value="city">Nội thành</option>
          <option value="district">Quận/Huyện</option>
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

      {/* Bảng */}
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Website</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Điện thoại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Phí cơ bản</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Miễn phí từ</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thời gian</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Khu vực</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('priority')}>
                  <div className="flex items-center gap-1">
                    Thứ tự
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mặc định</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedShippers.map((shipper) => (
                <tr
                  key={shipper._id}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  onClick={() => openEditModal(shipper)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(shipper._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, shipper._id]);
                        } else {
                          setSelectedRows(selectedRows.filter((id) => id !== shipper._id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {shipper.logo ? (
                        <Image src={shipper.logo} alt={shipper.name} width={32} height={32} className="object-contain rounded" unoptimized />
                      ) : null}
                      <span className="text-sm font-medium text-slate-900">{shipper.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {shipper.website ? (
                      <a href={shipper.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {shipper.website.replace(/^https?:\/\//, '')}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{shipper.phone || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{shipper.email || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{shipper.defaultFee.toLocaleString()}đ</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{shipper.freeThreshold > 0 ? `${shipper.freeThreshold.toLocaleString()}đ` : '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{shipper.estimatedDelivery || '-'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 capitalize">{shipper.coverage === 'nationwide' ? 'Toàn quốc' : shipper.coverage === 'city' ? 'Nội thành' : 'Quận/Huyện'}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 capitalize">
                    {shipper.serviceType === 'standard' ? 'Tiêu chuẩn' : shipper.serviceType === 'fast' ? 'Nhanh' : 'Hỏa tốc'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{shipper.priority}</td>
                  <td className="px-4 py-3">{getStatusBadge(shipper.status)}</td>
                  <td className="px-4 py-3 text-sm">
                    {shipper.isDefault ? (
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs">Mặc định</span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(shipper)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition group relative"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(shipper._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition group relative"
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
        {filteredShippers.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có đơn vị vận chuyển nào</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} đơn vị
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingShipper ? 'Sửa đơn vị vận chuyển' : 'Thêm đơn vị vận chuyển mới'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tên *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phí cơ bản (VNĐ)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.defaultFee}
                    onChange={(e) => setFormData({ ...formData, defaultFee: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miễn phí từ (VNĐ, 0 = không)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.freeThreshold}
                    onChange={(e) => setFormData({ ...formData, freeThreshold: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian giao (VD: 2-3 ngày)</label>
                  <input
                    type="text"
                    value={formData.estimatedDelivery}
                    onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực áp dụng</label>
                  <select
                    value={formData.coverage}
                    onChange={(e) => setFormData({ ...formData, coverage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="nationwide">Toàn quốc</option>
                    <option value="city">Nội thành</option>
                    <option value="district">Quận/Huyện</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại dịch vụ</label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="standard">Tiêu chuẩn</option>
                    <option value="fast">Nhanh</option>
                    <option value="express">Hỏa tốc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự ưu tiên (số nhỏ ưu tiên)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="suspended">Tạm ngưng</option>
                    <option value="discontinued">Ngừng hợp tác</option>
                  </select>
                </div>
                <div className="col-span-2">
                 <label>Template URL tracking (ví dụ: https://tracking.com/{`{`}trackingCode{`}`})</label>
                  <input
                    type="text"
                    value={formData.trackingUrlTemplate}
                    onChange={(e) => setFormData({ ...formData, trackingUrlTemplate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <PhotoIcon className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
                      >
                        Chọn ảnh
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      {previewImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setPreviewImage('');
                            setFormData({ ...formData, logo: '' });
                          }}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Đặt làm mặc định</span>
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
                  disabled={submitting || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                  {submitting ? 'Đang xử lý...' : editingShipper ? 'Cập nhật' : 'Thêm mới'}
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
            <p className="text-slate-600 mb-4">Bạn có chắc muốn xóa đơn vị vận chuyển này? Hành động này không thể hoàn tác.</p>
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
                ? `Bạn có chắc muốn xóa ${selectedRows.length} đơn vị?`
                : bulkAction === 'activate'
                ? `Kích hoạt ${selectedRows.length} đơn vị?`
                : bulkAction === 'suspend'
                ? `Tạm ngưng ${selectedRows.length} đơn vị?`
                : `Ngừng hợp tác ${selectedRows.length} đơn vị?`}
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