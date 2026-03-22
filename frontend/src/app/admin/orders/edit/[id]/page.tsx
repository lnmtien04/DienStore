'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function EditOrderPage() {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: ''
  });
  const [notes, setNotes] = useState('');
  const { token } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchOrder();
  }, [token, id]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrder(res.data);
      setShippingAddress(res.data.shippingAddress);
      setNotes(res.data.notes || '');
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(`${API_URL}/api/orders/${id}`, {
        shippingAddress,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Cập nhật thành công');
      router.push(`/admin/orders/${id}`);
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (!order) return <div>Không tìm thấy đơn hàng</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-900">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-semibold">Sửa đơn hàng #{order.orderNumber}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <h2 className="text-lg font-medium mb-2">Thông tin giao hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Người nhận</label>
              <input
                type="text"
                value={shippingAddress.fullName}
                onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Số điện thoại</label>
              <input
                type="text"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium">Địa chỉ</label>
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Tỉnh/Thành</label>
              <input
                type="text"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Quận/Huyện</label>
              <input
                type="text"
                value={shippingAddress.district}
                onChange={(e) => setShippingAddress({ ...shippingAddress, district: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phường/Xã</label>
              <input
                type="text"
                value={shippingAddress.ward}
                onChange={(e) => setShippingAddress({ ...shippingAddress, ward: e.target.value })}
                className="w-full border rounded-md px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Ghi chú</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
}