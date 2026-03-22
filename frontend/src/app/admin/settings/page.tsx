'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface Settings {
  _id?: string;
  storeName: string;
  storeEmail: string;
  storePhone: string;
  hotline: string; // thêm hotline
  storeAddress: string;
  workingHours: string; // giờ làm việc
  logo: string;
  favicon: string;
  taxRate: number;
  currency: string;
  timezone: string;
  paymentMethods: {
    cod: boolean;
    bankTransfer: boolean;
    momo: boolean;
    zalopay: boolean;
  };
  shippingSettings: {
    freeShippingThreshold: number;
    defaultShippingFee: number;
  };
  warrantyPolicy: string; // chính sách bảo hành mặc định
  returnPolicy: string;   // chính sách đổi trả
  smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [faviconPreview, setFaviconPreview] = useState<string>('');

  const [formData, setFormData] = useState<Settings>({
    storeName: '',
    storeEmail: '',
    storePhone: '',
    hotline: '',
    storeAddress: '',
    workingHours: '8:00 - 17:00',
    logo: '',
    favicon: '',
    taxRate: 0,
    currency: 'VND',
    timezone: 'Asia/Ho_Chi_Minh',
    paymentMethods: {
      cod: true,
      bankTransfer: false,
      momo: false,
      zalopay: false
    },
    shippingSettings: {
      freeShippingThreshold: 0,
      defaultShippingFee: 0
    },
    warrantyPolicy: '',
    returnPolicy: '',
    smtp: {
      host: '',
      port: 587,
      secure: false,
      user: '',
      pass: ''
    }
  });

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchSettings();
  }, [token]);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
      setFormData(res.data);
      setLogoPreview(res.data.logo || '');
      setFaviconPreview(res.data.favicon || '');
    } catch (error) {
      console.error('Lỗi tải cài đặt:', error);
    } finally {
      setLoading(false);
    }
  };

  // Upload ảnh lên server
  const uploadImage = async (file: File, type: 'logo' | 'favicon') => {
    const formData = new FormData();
    formData.append('image', file);
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });
      const url = res.data.url;
      if (type === 'logo') {
        setFormData(prev => ({ ...prev, logo: url }));
        setLogoPreview(url);
      } else {
        setFormData(prev => ({ ...prev, favicon: url }));
        setFaviconPreview(url);
      }
    } catch (error) {
      console.error(`Lỗi upload ${type}:`, error);
      alert(`Upload ${type} thất bại`);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...(prev[parent as keyof Settings] as object || {}),
            [child]: checked
          }
        }));
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${API_URL}/api/settings`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(res.data);
      alert('Cập nhật thành công!');
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      alert('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Cài đặt cửa hàng</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        {/* Thông tin chung */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-medium mb-4 text-blue-700">Thông tin chung</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên cửa hàng</label>
              <input
                type="text"
                name="storeName"
                value={formData.storeName}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="storeEmail"
                value={formData.storeEmail}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
              <input
                type="text"
                name="storePhone"
                value={formData.storePhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hotline</label>
              <input
                type="text"
                name="hotline"
                value={formData.hotline || ''}
                onChange={handleChange}
                placeholder="1900 1234"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input
                type="text"
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ làm việc</label>
              <input
                type="text"
                name="workingHours"
                value={formData.workingHours}
                onChange={handleChange}
                placeholder="8:00 - 17:00"
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Logo & Favicon */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-medium mb-4 text-blue-700">Logo & Favicon</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
              <div className="flex items-center space-x-4">
                <div className="shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="h-16 w-auto object-contain border rounded" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded border">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, 'logo');
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingLogo && <p className="text-sm text-blue-600 mt-1">Đang tải lên...</p>}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Favicon</label>
              <div className="flex items-center space-x-4">
                <div className="shrink-0">
                  {faviconPreview ? (
                    <img src={faviconPreview} alt="Favicon" className="h-8 w-8 object-contain border rounded" />
                  ) : (
                    <div className="h-8 w-8 bg-gray-100 flex items-center justify-center rounded border">
                      <PhotoIcon className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadImage(file, 'favicon');
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadingFavicon && <p className="text-sm text-blue-600 mt-1">Đang tải lên...</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Đơn vị tiền tệ & thuế */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-medium mb-4 text-blue-700">Đơn vị tiền tệ & thuế</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị tiền tệ</label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="VND">VND (Việt Nam Đồng)</option>
                <option value="USD">USD (Đô la Mỹ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thuế VAT (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Múi giờ</label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (Việt Nam)</option>
                <option value="Asia/Bangkok">Asia/Bangkok</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Phương thức thanh toán */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-medium mb-4 text-blue-700">Phương thức thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="paymentMethods.cod"
                checked={formData.paymentMethods.cod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    
                    paymentMethods: {
                      ...formData.paymentMethods,
                      cod: e.target.checked
                      
                    }
                  })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">COD (Thanh toán khi nhận hàng)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="paymentMethods.bankTransfer"
                checked={formData.paymentMethods.bankTransfer}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethods: {
                      ...formData.paymentMethods,
                      bankTransfer: e.target.checked
                    }
                  })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Chuyển khoản ngân hàng</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="paymentMethods.momo"
                checked={formData.paymentMethods.momo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethods: {
                      ...formData.paymentMethods,
                      momo: e.target.checked
                    }
                  })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Ví MoMo</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="paymentMethods.zalopay"
                checked={formData.paymentMethods.zalopay}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethods: {
                      ...formData.paymentMethods,
                      zalopay: e.target.checked
                    }
                  })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">ZaloPay</span>
            </label>
          </div>
        </div>

        {/* Giao hàng & Bảo hành */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-medium mb-4 text-blue-700">Giao hàng & Bảo hành</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phí giao hàng mặc định (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                value={formData.shippingSettings.defaultShippingFee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingSettings: {
                      ...formData.shippingSettings,
                      defaultShippingFee: parseInt(e.target.value) || 0
                    }
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Miễn phí giao hàng cho đơn từ (VNĐ)
              </label>
              <input
                type="number"
                min="0"
                value={formData.shippingSettings.freeShippingThreshold}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    shippingSettings: {
                      ...formData.shippingSettings,
                      freeShippingThreshold: parseInt(e.target.value) || 0
                    }
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách bảo hành mặc định</label>
              <textarea
                name="warrantyPolicy"
                rows={3}
                value={formData.warrantyPolicy}
                onChange={handleChange}
                placeholder="Ví dụ: Bảo hành 12 tháng, 1 đổi 1 trong 30 ngày nếu lỗi nhà sản xuất..."
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Chính sách đổi trả</label>
              <textarea
                name="returnPolicy"
                rows={3}
                value={formData.returnPolicy}
                onChange={handleChange}
                placeholder="Ví dụ: Đổi trả trong vòng 7 ngày, sản phẩm còn nguyên tem, hóa đơn..."
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Cấu hình email (SMTP) */}
        <div className="border-b pb-4">
          <h2 className="text-lg font-medium mb-4 text-blue-700">Cấu hình email (SMTP)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
              <input
                type="text"
                value={formData.smtp.host}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, host: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Port</label>
              <input
                type="number"
                value={formData.smtp.port}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, port: parseInt(e.target.value) || 587 }
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={formData.smtp.user}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, user: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={formData.smtp.pass}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, pass: e.target.value }
                  })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="smtpSecure"
                checked={formData.smtp.secure}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtp: { ...formData.smtp, secure: e.target.checked }
                  })
                }
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="smtpSecure" className="ml-2 text-sm text-gray-700">
                Sử dụng kết nối bảo mật (TLS/SSL)
              </label>
            </div>
          </div>
        </div>

        {/* Nút lưu */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
          </button>
        </div>
      </form>
    </div>
  );
}