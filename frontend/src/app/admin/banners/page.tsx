'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Banner {
  _id: string;
  title: string;
  image: string;
  link?: string;
  position: string;
  order: number;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    position: 'home',
    order: 0,
    isActive: true,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');

  const { token, loading: authLoading } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // Helper: tạo URL ảnh đúng
const getImageUrl = (raw: string): string => {
  if (!raw) return '';
  if (raw.startsWith('data:image')) return raw;
  if (raw.startsWith('http')) return raw;
  if (raw.startsWith('/')) return `${API_URL}${raw}`;
  // File nằm trong thư mục con banners
  return `${API_URL}/uploads/banners/${raw}`;
};

  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        router.push('/auth/login');
        return;
      }
      fetchBanners();
    }
  }, [token, authLoading]);

  const fetchBanners = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/banners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBanners(res.data);
    } catch (error) {
      console.error('Lỗi tải banners:', error);
      toast.error('Không thể tải danh sách banner');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = new FormData();
    form.append('title', formData.title);
    form.append('link', formData.link || '');
    form.append('position', formData.position);
    form.append('order', formData.order.toString());
    form.append('isActive', formData.isActive.toString());
    if (imageFile) {
      form.append('image', imageFile);
    }

    try {
      if (editingBanner) {
        await axios.put(`${API_URL}/api/banners/${editingBanner._id}`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Cập nhật banner thành công');
      } else {
        await axios.post(`${API_URL}/api/banners`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Thêm banner thành công');
      }
      setShowForm(false);
      setEditingBanner(null);
      setFormData({ title: '', link: '', position: 'home', order: 0, isActive: true });
      setImageFile(null);
      setPreview('');
      fetchBanners();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa banner này?')) return;
    try {
      await axios.delete(`${API_URL}/api/banners/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Xóa banner thành công');
      fetchBanners();
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const openEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      link: banner.link || '',
      position: banner.position,
      order: banner.order,
      isActive: banner.isActive,
    });
    // Tạo URL ảnh đúng để preview
    setPreview(getImageUrl(banner.image));
    setShowForm(true);
  };

  if (loading) return <div className="p-4 text-center">Đang tải...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-wrap justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Banner</h1>
        <button
          onClick={() => {
            setEditingBanner(null);
            setFormData({ title: '', link: '', position: 'home', order: 0, isActive: true });
            setPreview('');
            setImageFile(null);
            setShowForm(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition"
        >
          <PlusIcon className="w-5 h-5" />
          Thêm banner
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editingBanner ? 'Sửa banner' : 'Thêm banner mới'}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Link (tùy chọn)
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vị trí
                </label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="home">Trang chủ</option>
                  <option value="product">Trang sản phẩm</option>
                  <option value="category">Trang danh mục</option>
                  <option value="sidebar">Sidebar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thứ tự
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="col-span-full">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hình ảnh
                </label>
                <div className="flex items-center gap-4 flex-wrap">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {preview && (
                    <div className="relative w-32 h-20 bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null; // tránh lặp
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">Lỗi</div>';
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="col-span-full">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kích hoạt
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingBanner ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ảnh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tiêu đề</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vị trí</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thứ tự</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {banners.map((banner) => {
                const imageUrl = getImageUrl(banner.image);
                return (
                  <tr key={banner._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {banner.image ? (
                        <img
                          src={imageUrl}
                          alt={banner.title}
                          className="w-16 h-8 object-contain"
                          onError={(e) => {
                            e.currentTarget.onerror = null; // tránh lặp
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-16 h-8 flex items-center justify-center text-gray-400 text-xs">Lỗi</div>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-16 h-8 flex items-center justify-center text-gray-400 text-xs">Không có</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {banner.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 capitalize">
                      {banner.position === 'home' ? 'Trang chủ' : banner.position === 'product' ? 'Sản phẩm' : banner.position === 'category' ? 'Danh mục' : 'Sidebar'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {banner.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          banner.isActive
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {banner.isActive ? 'Hoạt động' : 'Tắt'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => openEdit(banner)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                        title="Sửa"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(banner._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Xóa"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {banners.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Chưa có banner nào. Hãy thêm banner đầu tiên.
          </div>
        )}
      </div>
    </div>
  );
}