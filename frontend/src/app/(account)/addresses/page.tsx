'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  TrashIcon,
  StarIcon as StarSolid,
  StarIcon as StarOutline,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface Address {
  _id: string;
  recipientName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
}

export default function AddressesPage() {
  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [formData, setFormData] = useState({
    recipientName: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    detail: '',
    isDefault: false,
  });

  useEffect(() => {
    if (token) fetchAddresses();
  }, [token]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(res.data.addresses || res.data);
    } catch (error) {
      console.error('Lỗi tải địa chỉ:', error);
      toast.error('Không thể tải địa chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAddress) {
        await axios.put(`${API_URL}/api/addresses/${editingAddress._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Cập nhật địa chỉ thành công');
      } else {
        await axios.post(`${API_URL}/api/addresses`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Thêm địa chỉ thành công');
      }
      setShowForm(false);
      setEditingAddress(null);
      setFormData({
        recipientName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        detail: '',
        isDefault: false,
      });
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi lưu địa chỉ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try {
      await axios.delete(`${API_URL}/api/addresses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Đã xóa địa chỉ');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi xóa địa chỉ');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await axios.put(
        `${API_URL}/api/addresses/${id}/default`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Đã đặt làm mặc định');
      fetchAddresses();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi');
    }
  };

  const openForm = (address?: Address) => {
    if (address) {
      setEditingAddress(address);
      setFormData({
        recipientName: address.recipientName,
        phone: address.phone,
        province: address.province,
        district: address.district,
        ward: address.ward,
        detail: address.detail,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddress(null);
      setFormData({
        recipientName: '',
        phone: '',
        province: '',
        district: '',
        ward: '',
        detail: '',
        isDefault: false,
      });
    }
    setShowForm(true);
  };

  if (!token) {
    return <div className="p-4 text-center">Vui lòng đăng nhập</div>;
  }

  return (
    <div className="space-y-3 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sổ địa chỉ</h1>
          <button
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="w-5 h-5" />
            Thêm địa chỉ mới
          </button>
        </div>

        {loading && <div className="text-center py-4">Đang tải...</div>}

        {!loading && addresses.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Bạn chưa có địa chỉ nào.</p>
            <button
              onClick={() => openForm()}
              className="mt-2 text-blue-600 hover:underline"
            >
              Thêm địa chỉ ngay
            </button>
          </div>
        )}

        <div className="space-y-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className="flex flex-col sm:flex-row sm:items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900 dark:text-white">{addr.recipientName}</p>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      <StarSolid className="w-3 h-3" />
                      Mặc định
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <span className="font-medium">Điện thoại:</span> {addr.phone}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Địa chỉ:</span> {addr.detail}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-0 sm:ml-4">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr._id)}
                    className="p-2 text-gray-500 hover:text-yellow-500 transition"
                    title="Đặt làm mặc định"
                  >
                    <StarOutline className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => openForm(addr)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition"
                  title="Sửa"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(addr._id)}
                  className="p-2 text-gray-500 hover:text-red-600 transition"
                  title="Xóa"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form thêm/sửa địa chỉ */}
        {showForm && (
          <div className="mt-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên người nhận
                  </label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tỉnh/Thành phố
                  </label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quận/Huyện
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phường/Xã
                  </label>
                  <input
                    type="text"
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Địa chỉ chi tiết (số nhà, đường...)
                </label>
                <input
                  type="text"
                  value={formData.detail}
                  onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  required
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700 dark:text-gray-300">Đặt làm địa chỉ mặc định</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingAddress ? 'Cập nhật' : 'Thêm mới'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAddress(null);
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}