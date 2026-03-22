'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BannerFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const { token } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    position: 'home',
    order: 0,
    isActive: true,
    image: null as File | null,
  });
  const [preview, setPreview] = useState<string>('');
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!isNew && token) {
      fetchBanner();
    }
  }, [isNew, token]);

  const fetchBanner = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/banners/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const banner = res.data.find((b: any) => b._id === id);
      if (banner) {
        setFormData({
          title: banner.title,
          description: banner.description || '',
          link: banner.link || '',
          position: banner.position,
          order: banner.order,
          isActive: banner.isActive,
          image: null,
        });
        setPreview(banner.image);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin banner');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const form = new FormData();
    form.append('title', formData.title);
    if (formData.description) form.append('description', formData.description);
    if (formData.link) form.append('link', formData.link);
    form.append('position', formData.position);
    form.append('order', formData.order.toString());
    form.append('isActive', formData.isActive.toString());
    if (formData.image) form.append('image', formData.image);

    try {
      if (isNew) {
        await axios.post(`${API_URL}/api/banners`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Thêm banner thành công');
      } else {
        await axios.put(`${API_URL}/api/banners/${id}`, form, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success('Cập nhật banner thành công');
      }
      router.push('/admin/banners');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lưu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold">{isNew ? 'Thêm banner mới' : 'Chỉnh sửa banner'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
        {/* Ảnh */}
        <div>
          <label className="block text-sm font-medium mb-1">Ảnh banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {preview && (
            <div className="mt-2 relative h-40 w-full bg-gray-100 rounded-lg overflow-hidden">
              <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
            </div>
          )}
        </div>

        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-medium mb-1">Tiêu đề</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium mb-1">Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Link */}
        <div>
          <label className="block text-sm font-medium mb-1">Đường dẫn (link)</label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Vị trí */}
        <div>
          <label className="block text-sm font-medium mb-1">Vị trí</label>
          <select
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="home">Trang chủ</option>
            <option value="sidebar">Sidebar</option>
            <option value="popup">Popup</option>
          </select>
        </div>

        {/* Thứ tự */}
        <div>
          <label className="block text-sm font-medium mb-1">Thứ tự (số nhỏ hiện trước)</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Kích hoạt */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium">Hiển thị banner</label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Đang xử lý...' : (isNew ? 'Thêm mới' : 'Cập nhật')}
        </button>
      </form>
    </div>
  );
}