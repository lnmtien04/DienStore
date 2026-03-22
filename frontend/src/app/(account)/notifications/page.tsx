'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';

interface NotificationSettings {
  orderUpdates: boolean;
  promotions: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

export default function NotificationsPage() {
  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [settings, setSettings] = useState<NotificationSettings>({
    orderUpdates: true,
    promotions: false,
    emailNotifications: true,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchSettings();
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/notifications/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (error) {
      console.error('Lỗi tải cài đặt thông báo:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationSettings) => {
    const newValue = !settings[key];
    const updated = { ...settings, [key]: newValue };
    
    // Cập nhật UI ngay lập tức
    setSettings(updated);

    try {
      await axios.put(`${API_URL}/api/notifications/settings`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Cập nhật thành công');
    } catch (error) {
      // Nếu lỗi, rollback lại giá trị cũ
      setSettings(settings);
      toast.error('Cập nhật thất bại');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Cài đặt thông báo</h2>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          {/* Thông báo đơn hàng */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <BellIcon className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Cập nhật đơn hàng</h3>
                <p className="text-sm text-gray-500">Nhận thông báo khi đơn hàng thay đổi trạng thái</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('orderUpdates')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.orderUpdates ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.orderUpdates ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Khuyến mãi */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-pink-600" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Khuyến mãi & ưu đãi</h3>
                <p className="text-sm text-gray-500">Nhận thông tin về các chương trình khuyến mãi</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('promotions')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.promotions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.promotions ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Email notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <EnvelopeIcon className="w-5 h-5 text-green-600" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Thông báo qua email</h3>
                <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('emailNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* SMS notifications */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              <DevicePhoneMobileIcon className="w-5 h-5 text-purple-600" />
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">Thông báo qua SMS</h3>
                <p className="text-sm text-gray-500">Nhận thông báo qua tin nhắn điện thoại</p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('smsNotifications')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.smsNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}