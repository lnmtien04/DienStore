'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  CheckIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  parent?: Category | null;
  image?: string;
  productCount?: number;
  createdAt: string;
  metaTitle?: string;
  metaDescription?: string;
  showOnHome?: boolean;
  showInMenu?: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
    parent: '',
    metaTitle: '',
    metaDescription: '',
    showOnHome: false,
    showInMenu: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      setParentCategories(categories.filter(c => c.isActive && (!editingCategory || c._id !== editingCategory._id)));
    }
  }, [categories, editingCategory]);

  useEffect(() => {
    let filtered = [...categories];
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter === 'active') {
      filtered = filtered.filter(c => c.isActive);
    } else if (statusFilter === 'inactive') {
      filtered = filtered.filter(c => !c.isActive);
    }
    filtered.sort((a, b) => {
      let aVal: any = a[sortConfig.key as keyof Category];
      let bVal: any = b[sortConfig.key as keyof Category];
      if (sortConfig.key === 'productCount') {
        aVal = a.productCount || 0;
        bVal = b.productCount || 0;
      }
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    setFilteredCategories(filtered);
    setTotalItems(filtered.length);
    setCurrentPage(1);
  }, [categories, searchTerm, statusFilter, sortConfig]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(start, start + itemsPerPage);
  }, [filteredCategories, currentPage, itemsPerPage]);

  useEffect(() => {
    if (selectAll) {
      setSelectedRows(paginatedCategories.map(c => c._id));
    } else {
      setSelectedRows([]);
    }
  }, [selectAll, paginatedCategories]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      const categoriesWithCounts = res.data; // vì backend đã trả về productCount
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
      toast.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return false;
    }
    return true;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('description', formData.description || '');
    formDataToSend.append('isActive', String(formData.isActive));
    if (formData.parent) formDataToSend.append('parent', formData.parent);
    if (imageFile) formDataToSend.append('image', imageFile);
    formDataToSend.append('metaTitle', formData.metaTitle || '');
    formDataToSend.append('metaDescription', formData.metaDescription || '');
    formDataToSend.append('showOnHome', String(formData.showOnHome));
    formDataToSend.append('showInMenu', String(formData.showInMenu));

    try {
      if (editingCategory) {
        await axios.put(
          `${API_URL}/api/categories/${editingCategory._id}`,
          formDataToSend,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Cập nhật danh mục thành công!');
      } else {
        await axios.post(
          `${API_URL}/api/categories`,
          formDataToSend,
          { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Thêm danh mục thành công!');
      }
      setShowModal(false);
      resetModal();
      fetchCategories();
    } catch (error: any) {
      console.error('Lỗi lưu danh mục:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Dữ liệu không hợp lệ');
      } else {
        toast.error('Đã xảy ra lỗi, vui lòng thử lại');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
    try {
      await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa danh mục thành công!');
      fetchCategories();
    } catch (error) {
      console.error('Lỗi xóa danh mục:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Không thể xóa');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!confirm(`Xóa ${selectedRows.length} danh mục?`)) return;
    try {
      await Promise.all(
        selectedRows.map(id =>
          axios.delete(`${API_URL}/api/categories/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      toast.success(`Đã xóa ${selectedRows.length} danh mục`);
      fetchCategories();
      setSelectedRows([]);
      setSelectAll(false);
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const handleBulkStatus = async (active: boolean) => {
    if (selectedRows.length === 0) return;
    try {
      await Promise.all(
        selectedRows.map(id =>
          axios.put(
            `${API_URL}/api/categories/${id}`,
            { isActive: active },
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );
      toast.success(`Đã cập nhật trạng thái`);
      fetchCategories();
      setSelectedRows([]);
      setSelectAll(false);
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || '',
      isActive: cat.isActive,
      parent: cat.parent?._id || '',
      metaTitle: cat.metaTitle || '',
      metaDescription: cat.metaDescription || '',
      showOnHome: cat.showOnHome || false,
      showInMenu: cat.showInMenu ?? true,
    });
    setImagePreview(cat.image || '');
    setImageFile(null);
    setShowModal(true);
  };

  const resetModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
      parent: '',
      metaTitle: '',
      metaDescription: '',
      showOnHome: false,
      showInMenu: true,
    });
    setImageFile(null);
    setImagePreview('');
    setShowModal(false);
  };

  const requestSort = (key: string) => {
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
    return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-600">Tạm ẩn</span>;
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Quản lý danh mục</h1>
        <div className="flex flex-wrap items-center gap-2">
          {selectedRows.length > 0 && (
            <>
              <button
                onClick={() => handleBulkStatus(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl hover:bg-green-100 transition"
              >
                <CheckIcon className="w-4 h-4" />
                Kích hoạt
              </button>
              <button
                onClick={() => handleBulkStatus(false)}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition"
              >
                <XMarkIcon className="w-4 h-4" />
                Tạm ẩn
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl hover:bg-red-100 transition"
              >
                <TrashIcon className="w-4 h-4" />
                Xóa ({selectedRows.length})
              </button>
            </>
          )}
          <button
            onClick={() => {
              resetModal();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-sm transition"
          >
            <PlusIcon className="w-4 h-4" />
            Thêm danh mục
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-60">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, mô tả..."
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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="inactive">Tạm ẩn</option>
          </select>
        </div>
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:text-blue-600" onClick={() => requestSort('productCount')}>
                  <div className="flex items-center gap-1">
                    Số sản phẩm
                    <ChevronUpDownIcon className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedCategories.map((cat) => (
                <tr key={cat._id} className="hover:bg-blue-50/40 transition">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(cat._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRows([...selectedRows, cat._id]);
                        } else {
                          setSelectedRows(selectedRows.filter(id => id !== cat._id));
                        }
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{cat.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{cat.slug}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-xs truncate">{cat.description || '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                      {cat.productCount || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(cat.isActive)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition group relative"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                          Sửa
                        </span>
                      </button>
                      <button
                        onClick={() => handleDelete(cat._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition group relative"
                        title="Xóa"
                      >
                        <TrashIcon className="w-5 h-5" />
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap">
                          Xóa
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCategories.length === 0 && (
          <p className="text-center py-8 text-slate-500">Không có danh mục nào</p>
        )}
      </div>

      {totalItems > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            Hiển thị {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} / {totalItems} danh mục
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1 border border-slate-200 rounded-lg"
            >
              <option value="10">10 / trang</option>
              <option value="20">20 / trang</option>
              <option value="50">50 / trang</option>
            </select>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Trước
              </button>
              {pageNumbers.map(num => (
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
                onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên danh mục *</label>
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục cha</label>
                <select
                  value={formData.parent}
                  onChange={(e) => setFormData({ ...formData, parent: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Không có (danh mục gốc)</option>
                  {parentCategories.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Upload ảnh */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh đại diện</label>
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
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
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Title (SEO)</label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Meta Description (SEO)</label>
                <textarea
                  rows={2}
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Hoạt động</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showOnHome}
                    onChange={(e) => setFormData({ ...formData, showOnHome: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Hiển thị trang chủ</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showInMenu}
                    onChange={(e) => setFormData({ ...formData, showInMenu: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Hiển thị menu</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}