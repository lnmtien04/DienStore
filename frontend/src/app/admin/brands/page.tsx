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
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

interface Brand {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  productCount?: number;
  sortOrder?: number;
  isFeatured?: boolean;
  createdAt: string;
  // không cần meta SEO nếu chưa có trong model
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  // Filter, search, sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Brand; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
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
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0,
    isFeatured: false,
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

  // Fetch brands
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/brands`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend đã trả về productCount và sortOrder thực tế
      setBrands(res.data);
    } catch (error) {
      console.error('Lỗi tải thương hiệu:', error);
      toast.error('Không thể tải danh sách thương hiệu');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort logic (client-side)
  const filteredBrands = useMemo(() => {
    let filtered = [...brands];

    // Search
    if (debouncedSearch) {
      filtered = filtered.filter(
        (b) =>
          b.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          b.slug.toLowerCase().includes(debouncedSearch.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      filtered = filtered.filter((b) => b.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter((b) => !b.isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      const key = sortConfig.key;
      let aVal: any;
      let bVal: any;

      if (key === 'productCount') {
        aVal = a.productCount ?? 0;
        bVal = b.productCount ?? 0;
      } else if (key === 'sortOrder') {
        aVal = a.sortOrder ?? 0;
        bVal = b.sortOrder ?? 0;
      } else {
        aVal = a[key] ?? '';
        bVal = b[key] ?? '';
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [brands, debouncedSearch, statusFilter, sortConfig]);

  // Pagination
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBrands.slice(start, start + itemsPerPage);
  }, [filteredBrands, currentPage, itemsPerPage]);

  // Update total items
  useEffect(() => {
    setTotalItems(filteredBrands.length);
    setCurrentPage(1);
    setSelectedRows([]);
    setSelectAll(false);
  }, [filteredBrands.length]);

  // Select all logic
  useEffect(() => {
    if (selectAll) {
      setSelectedRows(paginatedBrands.map((b) => b._id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll, paginatedBrands]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên thương hiệu');
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
    if (!imageFile) return formData.image || null;
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
    let imageUrl = formData.image;
    if (imageFile) {
      const uploaded = await uploadImage();
      if (!uploaded) {
        setSubmitting(false);
        return;
      }
      imageUrl = uploaded;
    }

    const payload = {
      ...formData,
      image: imageUrl,
      sortOrder: Number(formData.sortOrder),
    };

    try {
      if (editingBrand) {
        await axios.put(`${API_URL}/api/brands/${editingBrand._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật thương hiệu thành công!');
      } else {
        await axios.post(`${API_URL}/api/brands`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Thêm thương hiệu thành công!');
      }
      setShowModal(false);
      resetForm();
      fetchBrands();
    } catch (error: any) {
      console.error('Lỗi lưu thương hiệu:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Dữ liệu không hợp lệ');
      } else {
        toast.error('Đã xảy ra lỗi, vui lòng thử lại');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteTarget(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_URL}/api/brands/${deleteTarget}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa thương hiệu thành công!');
      fetchBrands();
    } catch (error: any) {
      console.error('Lỗi xóa thương hiệu:', error);
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
            axios.delete(`${API_URL}/api/brands/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
          )
        );
        toast.success(`Đã xóa ${selectedRows.length} thương hiệu`);
      } else {
        const active = bulkAction === 'activate';
        await Promise.all(
          selectedRows.map((id) =>
            axios.put(
              `${API_URL}/api/brands/${id}`,
              { isActive: active },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
        toast.success(`Đã cập nhật trạng thái ${selectedRows.length} thương hiệu`);
      }
      fetchBrands();
      setSelectedRows([]);
      setSelectAll(false);
    } catch (error) {
      toast.error('Thao tác thất bại');
    } finally {
      setShowBulkConfirm(false);
      setBulkAction(null);
    }
  };

  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      image: brand.image || '',
       isActive: brand.isActive ?? true, 
      sortOrder: brand.sortOrder || 0,
      isFeatured: brand.isFeatured || false,
    });
    setPreviewImage(brand.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      description: '',
      image: '',
      isActive: true,
      sortOrder: 0,
      isFeatured: false,
    });
    setPreviewImage('');
    setImageFile(null);
    setShowModal(false);
  };

  const requestSort = (key: keyof Brand) => {
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý thương hiệu</h1>
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
            Thêm thương hiệu
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm theo tên, slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Ẩn</option>
          </select>
        </div>
      </div>

      {/* Bảng thương hiệu */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mô tả</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ảnh</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('productCount')}>
                  <div className="flex items-center gap-1">
                    Số SP
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nổi bật</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('sortOrder')}>
                  <div className="flex items-center gap-1">
                    Thứ tự
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBrands.map((brand) => (
                <tr
                  key={brand._id}
                  className="hover:bg-blue-50/40 transition cursor-pointer"
                  onClick={() => openEditModal(brand)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(brand._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, brand._id]);
                        } else {
                          setSelectedRows(selectedRows.filter((id) => id !== brand._id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{brand.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{brand.slug}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{brand.description || '-'}</td>
                  <td className="px-4 py-3">
                    {brand.image ? (
                      <div className="relative w-10 h-10">
                        <Image
                          src={brand.image}
                          alt={brand.name}
                          fill
                          className="object-contain rounded"
                          unoptimized
                        />
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {brand.productCount ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {brand.isFeatured ? (
                      <StarSolid className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <StarIcon className="w-5 h-5 text-slate-300" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">{brand.sortOrder ?? 0}</td>
                  <td className="px-4 py-3">{getStatusBadge(brand.isActive)}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(brand)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition group relative"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(brand._id)}
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
        {filteredBrands.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có thương hiệu nào</p>
        )}
      </div>

      {/* Pagination */}
      {totalItems > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} thương hiệu
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-slate-200 rounded-lg"
            >
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
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
                    currentPage === num
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-100'
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
        </div>
      )}

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên thương hiệu *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh</label>
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
                          setFormData({ ...formData, image: '' });
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thứ tự (sortOrder)</label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-4 pt-7">
                  <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!formData.isFeatured}   // ép kiểu cho isFeatured
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">Nổi bật</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                         checked={!!formData.isActive}     // ép kiểu cho isActive
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
                  disabled={submitting || uploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-blue-300"
                >
                  {submitting ? 'Đang xử lý...' : editingBrand ? 'Cập nhật' : 'Thêm mới'}
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
            <p className="text-slate-600 mb-4">Bạn có chắc muốn xóa thương hiệu này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
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
                ? `Bạn có chắc muốn xóa ${selectedRows.length} thương hiệu?`
                : bulkAction === 'activate'
                ? `Kích hoạt ${selectedRows.length} thương hiệu?`
                : `Tạm ẩn ${selectedRows.length} thương hiệu?`}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
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