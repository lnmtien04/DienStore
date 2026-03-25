'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { PencilIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Skeleton cho một hàng trong bảng
const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-8"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
    <td className="px-4 py-4"><div className="h-10 w-10 bg-gray-200 rounded"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
    <td className="px-4 py-4"><div className="flex gap-2"><div className="h-5 w-5 bg-gray-200 rounded"></div><div className="h-5 w-5 bg-gray-200 rounded"></div></div></td>
  </tr>
);

interface Category {
  _id: string;
  name: string;
}

interface Warranty {
  _id: string;
  name: string;
  duration: number;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discount: number;
  importPrice?: number;
  origin?: string;
  warranty?: Warranty | string;
  brand?: string;
  stock: number;
  category?: Category;
  images: string[];
  isActive: boolean;
  createdAt: string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warranties, setWarranties] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    discount: '',
    stock: '',
    category: '',
    description: '',
    importPrice: '',
    origin: '',
    warranty: '',
    brand: '',
    images: [] as string[],
    isActive: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (token) {
      fetchProducts();
      fetchCategories();
      fetchWarranties();
    }
  }, [token]);

  // 🔁 Lấy tất cả sản phẩm (tăng limit lên cao)
  const fetchProducts = async () => {
    try {
      // Thêm limit=9999 để lấy nhiều nhất có thể (tuỳ backend hỗ trợ)
      const res = await axios.get(`${API_URL}/api/products?limit=9999`);
      console.log('API /products response:', res.data);
      let productsData = Array.isArray(res.data) ? res.data : res.data?.products || [];
      productsData = productsData.map((p: any) => ({
        ...p,
        price: Number(p.price) || 0,
        discount: Number(p.discount) || 0,
        importPrice: p.importPrice ? Number(p.importPrice) : undefined,
        stock: Number(p.stock) || 0,
        name: p.name || '', // ✅ đảm bảo name không undefined
      }));
      console.log('Total products loaded:', productsData.length);
      setProducts(productsData);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/categories`);
      const categoriesData = Array.isArray(res.data) ? res.data : [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Lỗi tải danh mục:', error);
      setCategories([]);
    }
  };

  const fetchWarranties = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/warranties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWarranties(res.data);
    } catch (error) {
      console.error('Lỗi tải bảo hành:', error);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return false;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      toast.error('Giá phải là số dương');
      return false;
    }
    if (Number(formData.discount) < 0 || Number(formData.discount) > 100) {
      toast.error('Giảm giá phải từ 0 đến 100');
      return false;
    }
    if (Number(formData.stock) < 0) {
      toast.error('Tồn kho không thể âm');
      return false;
    }
    if (!formData.category) {
      toast.error('Vui lòng chọn danh mục');
      return false;
    }
    return true;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const previews: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onloadend = () => {
        previews.push(reader.result as string);
        if (previews.length === files.length) {
          setPreviewImages(prev => [...prev, ...previews]);
        }
      };
      reader.readAsDataURL(files[i]);
    }

    const uploadPromises = Array.from(files).map(async (file) => {
      const uploadData = new FormData();
      uploadData.append('image', file);
      try {
        const res = await axios.post(`${API_URL}/api/upload`, uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        });
        return res.data.url;
      } catch (error) {
        console.error('Lỗi upload ảnh:', error);
        return null;
      }
    });

    setUploading(true);
    const urls = await Promise.all(uploadPromises);
    const validUrls = urls.filter(url => url !== null) as string[];
    setFormData(prev => ({ ...prev, images: [...prev.images, ...validUrls] }));
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Kiểm tra trùng tên ở frontend (không phân biệt hoa thường)
    const isDuplicate = products.some(p => 
      p.name.toLowerCase() === formData.name.trim().toLowerCase() && 
      (!editingProduct || p._id !== editingProduct._id)
    );
    if (isDuplicate) {
  toast.error('⚠️ Tên sản phẩm này đã được sử dụng. Bạn vui lòng chọn tên khác nhé!');
  return;
}

    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        discount: Number(formData.discount) || 0,
        stock: Number(formData.stock) || 0,
        category: formData.category,
        description: formData.description || '',
        images: formData.images,
        isActive: formData.isActive,
        importPrice: Number(formData.importPrice) || 0,
        origin: formData.origin || '',
        warranty: formData.warranty || null,
        brand: formData.brand || '',
      };
      console.log('Submitting payload:', payload);

      if (editingProduct) {
        await axios.put(`${API_URL}/api/products/${editingProduct._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await axios.post(`${API_URL}/api/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Thêm sản phẩm thành công!');
      }
      setShowModal(false);
      setEditingProduct(null);
      setFormData({
        name: '', price: '', discount: '', stock: '', category: '',
        description: '', importPrice: '', origin: '', warranty: '', brand: '',
        images: [], isActive: true
      });
      setPreviewImages([]);
      fetchProducts();
    } catch (error: any) {
      console.error('Lỗi lưu sản phẩm:', error);
      if (axios.isAxiosError(error) && error.response) {
        const serverMessage = error.response.data?.message || '';
        // Nếu server trả về lỗi trùng tên (có thể là 400 với message cụ thể)
        if (serverMessage.toLowerCase().includes('duplicate') || serverMessage.toLowerCase().includes('already exists')) {
          toast.error('Sản phẩm với tên này đã tồn tại. Vui lòng chọn tên khác.');
        } else {
          toast.error(serverMessage || 'Dữ liệu không hợp lệ');
        }
      } else {
        toast.error('Đã xảy ra lỗi, vui lòng thử lại');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await axios.delete(`${API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Xóa sản phẩm thành công!');
      fetchProducts();
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error);
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || 'Không thể xóa sản phẩm');
      } else {
        toast.error('Đã xảy ra lỗi');
      }
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      discount: product.discount.toString(),
      stock: product.stock.toString(),
      category: product.category?._id || '',
      description: product.description || '',
      importPrice: product.importPrice?.toString() || '',
      origin: product.origin || '',
      warranty: typeof product.warranty === 'object' ? product.warranty?._id : product.warranty || '',
      brand: product.brand || '',
      images: product.images || [],
      isActive: product.isActive,
    });
    setPreviewImages([]);
    setShowModal(true);
  };

  const resetModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '', price: '', discount: '', stock: '', category: '',
      description: '', importPrice: '', origin: '', warranty: '', brand: '',
      images: [], isActive: true
    });
    setPreviewImages([]);
    setShowModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // ✅ Tìm kiếm an toàn
  const filteredProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/products/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Xuất file thành công!');
    } catch (error) {
      console.error('Lỗi xuất file:', error);
      toast.error('Xuất file thất bại');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setImporting(true);
    try {
      const res = await axios.post(`${API_URL}/api/products/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success(`Import thành công! Thêm mới/cập nhật: ${res.data.results.success} sản phẩm.`);
      if (res.data.results.errors.length > 0) {
        console.warn('Lỗi import:', res.data.results.errors);
      }
      fetchProducts();
    } catch (error: any) {
      console.error('Lỗi import:', error);
      toast.error(error.response?.data?.message || 'Import thất bại');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="mb-4">
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {Array(11).fill(0).map((_, i) => (
                  <th key={i} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded w-16"></div></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array(5).fill(0).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Quản lý sản phẩm</h1>
        <div className="flex items-center gap-2">
          <button onClick={handleExport} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">Xuất excel</button>
          <input type="file" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:bg-blue-300">
            {importing ? 'Đang import...' : 'Nhập excel'}
          </button>
          <button onClick={resetModal} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm">
            <PlusIcon className="h-4 w-4 mr-1" /> Thêm mới
          </button>
        </div>
      </div>

      {/* Ô tìm kiếm */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Nhập tên sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Bảng sản phẩm */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TÊN SẢN PHẨM</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ẢNH</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SỐ LƯỢNG</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GIÁ NHẬP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GIÁ XUẤT</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">LOẠI</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NƠI SẢN XUẤT</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BẢO HÀNH</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HÀNG</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredProducts.map((p, index) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.images && p.images.length > 0 ? (
                    <img src={p.images[0]} alt={p.name} className="h-10 w-10 object-cover rounded" />
                  ) : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.stock}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.importPrice ? formatCurrency(p.importPrice) : '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(p.price)}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.category?.name || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.origin || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {p.warranty && typeof p.warranty === 'object' ? `${p.warranty.name} (${p.warranty.duration} tháng)` : (p.warranty || '-')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{p.brand || '-'}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => openEditModal(p)} className="text-blue-600 hover:text-blue-900 mr-3"><PencilIcon className="h-5 w-5" /></button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <p className="text-center py-4 text-gray-500">
            {products.length === 0 ? 'Chưa có sản phẩm nào' : `Không tìm thấy sản phẩm nào khớp với "${searchTerm}"`}
          </p>
        )}
      </div>

      {/* Modal thêm/sửa */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Các trường cơ bản */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                  <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                  <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Chọn danh mục</option>
                    {categories.map((cat) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nơi sản xuất</label>
                  <input type="text" value={formData.origin} onChange={(e) => setFormData({ ...formData, origin: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá xuất *</label>
                  <input type="number" required min="0" step="1000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bảo hành</label>
                  <select value={formData.warranty} onChange={(e) => setFormData({ ...formData, warranty: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Chọn chính sách bảo hành</option>
                    {warranties.map(w => (<option key={w._id} value={w._id}>{w.name} ({w.duration} tháng)</option>))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá nhập</label>
                  <input type="number" min="0" step="1000" value={formData.importPrice} onChange={(e) => setFormData({ ...formData, importPrice: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Thương hiệu</label>
                  <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giảm giá (%)</label>
                  <input type="number" min="0" max="100" value={formData.discount} onChange={(e) => setFormData({ ...formData, discount: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
              </div>

              {/* Upload ảnh */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh sản phẩm</label>
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                {uploading && <p className="text-sm text-blue-600 mt-1">Đang tải lên...</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`product-${idx}`} className="h-16 w-16 object-cover rounded border" />
                      <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><XMarkIcon className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {previewImages.map((url, idx) => (
                    <div key={`preview-${idx}`} className="relative">
                      <img src={url} alt={`preview-${idx}`} className="h-16 w-16 object-cover rounded border opacity-50" />
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">Đang tải</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4 flex items-center">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">Hoạt động</label>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Hủy</button>
                <button type="submit" disabled={uploading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                  {uploading ? 'Đang xử lý...' : (editingProduct ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}