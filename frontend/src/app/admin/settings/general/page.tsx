'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { useSettings } from '@/hooks/useSettings';
import { useUser } from '@/context/UserContext';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// Component upload ảnh (dropzone)
const ImageUploader = ({
  label,
  preview,
  onDrop,
  uploading,
  onRemove,
}: {
  label: string;
  preview?: string;
  onDrop: (file: File) => void;
  uploading: boolean;
  onRemove?: () => void;
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) onDrop(acceptedFiles[0]);
    },
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-6 transition cursor-pointer ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="h-24 w-24 object-contain rounded-xl border border-gray-200 dark:border-gray-700"
            />
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {isDragActive
                ? 'Thả file vào đây...'
                : 'Kéo thả hoặc nhấn để chọn'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              PNG, JPG, GIF (tối đa 5MB)
            </p>
          </div>
        )}
        {uploading && (
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">Đang tải lên...</div>
        )}
      </div>
    </div>
  );
};

export default function GeneralSettingsPage() {
  const { settings, loading, updateSettings, refetch } = useSettings();
  const { token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // State cho các trường trong card
  const [formData, setFormData] = useState({
    systemName: '',
    timezone: 'Asia/Ho_Chi_Minh',
    dateFormat: 'dd/mm/yyyy',
    currency: 'VND',
    itemsPerPage: 20,
    maintenanceMode: false,
    storeEmail: '',
    storePhone: '',
    hotline: '',
    storeAddress: '',
    workingHours: '8:00 - 17:00',
    logo: '',
    favicon: '',
    taxRate: 0,
  });

  // State cho preview ảnh và trạng thái upload
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconPreview, setFaviconPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Đồng bộ dữ liệu từ settings vào form
  useEffect(() => {
    if (settings) {
      setFormData({
        systemName: settings.systemName || '',
        timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
        dateFormat: settings.dateFormat || 'dd/mm/yyyy',
        currency: settings.currency || 'VND',
        itemsPerPage: settings.itemsPerPage || 20,
        maintenanceMode: settings.maintenanceMode || false,
        storeEmail: settings.storeEmail || '',
        storePhone: settings.storePhone || '',
        hotline: settings.hotline || '',
        storeAddress: settings.storeAddress || '',
        workingHours: settings.workingHours || '8:00 - 17:00',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        taxRate: settings.taxRate || 0,
      });
      setLogoPreview(settings.logo || '');
      setFaviconPreview(settings.favicon || '');
    }
  }, [settings]);

  // Kiểm tra có thay đổi chưa lưu
  useEffect(() => {
    if (settings) {
      const changed =
        formData.systemName !== (settings.systemName || '') ||
        formData.timezone !== (settings.timezone || 'Asia/Ho_Chi_Minh') ||
        formData.dateFormat !== (settings.dateFormat || 'dd/mm/yyyy') ||
        formData.currency !== (settings.currency || 'VND') ||
        formData.itemsPerPage !== (settings.itemsPerPage || 20) ||
        formData.maintenanceMode !== (settings.maintenanceMode || false) ||
        formData.storeEmail !== (settings.storeEmail || '') ||
        formData.storePhone !== (settings.storePhone || '') ||
        formData.hotline !== (settings.hotline || '') ||
        formData.storeAddress !== (settings.storeAddress || '') ||
        formData.workingHours !== (settings.workingHours || '8:00 - 17:00') ||
        formData.logo !== (settings.logo || '') ||
        formData.favicon !== (settings.favicon || '') ||
        formData.taxRate !== (settings.taxRate || 0);
      setHasChanges(changed);
    }
  }, [formData, settings]);

  // Cảnh báo khi rời trang nếu chưa lưu
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  // Xử lý thay đổi input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Upload ảnh
  const uploadImage = async (file: File, type: 'logo' | 'favicon') => {
    const data = new FormData();
    data.append('image', file);
    const setUploading = type === 'logo' ? setUploadingLogo : setUploadingFavicon;
    setUploading(true);
    try {
      const res = await axios.post(`${API_URL}/api/upload`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const url = res.data.url;
      setFormData((prev) => ({ ...prev, [type]: url }));
      if (type === 'logo') setLogoPreview(url);
      else setFaviconPreview(url);
    } catch (error) {
      toast.error(`Upload ${type} thất bại`);
    } finally {
      setUploading(false);
    }
  };

  const handleDropLogo = (file: File) => uploadImage(file, 'logo');
  const handleDropFavicon = (file: File) => uploadImage(file, 'favicon');

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }));
    setLogoPreview('');
  };
  const handleRemoveFavicon = () => {
    setFormData((prev) => ({ ...prev, favicon: '' }));
    setFaviconPreview('');
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(formData);
      setHasChanges(false);
      toast.success('Cập nhật thành công');
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
      {/* Breadcrumb & topbar */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <span className="text-gray-700 dark:text-gray-300">Dashboard</span> / Cài đặt / Thông tin chung
        </div>
        <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
          A
        </div>
      </div>

      {/* Card: Thông tin chung */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin chung</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cấu hình cơ bản của cửa hàng</p>
          </div>
          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
            Đang hoạt động
          </span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tên cửa hàng
              </label>
              <input
                type="text"
                name="systemName"
                value={formData.systemName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                placeholder="VD: Dienstore"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                name="storeEmail"
                value={formData.storeEmail}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Số điện thoại
              </label>
              <input
                type="text"
                name="storePhone"
                value={formData.storePhone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hotline
              </label>
              <input
                type="text"
                name="hotline"
                value={formData.hotline}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                placeholder="1900 1234"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Địa chỉ
              </label>
              <input
                type="text"
                name="storeAddress"
                value={formData.storeAddress}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
              />
            </div>
            <div className="md:w-1/2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Giờ làm việc
              </label>
              <input
                type="text"
                name="workingHours"
                value={formData.workingHours}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                placeholder="8:00 - 17:00"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card: Logo & Favicon */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Logo & Favicon</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tải lên logo và biểu tượng của cửa hàng</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <ImageUploader
            label="Logo"
            preview={logoPreview}
            onDrop={handleDropLogo}
            uploading={uploadingLogo}
            onRemove={handleRemoveLogo}
          />
          <ImageUploader
            label="Favicon"
            preview={faviconPreview}
            onDrop={handleDropFavicon}
            uploading={uploadingFavicon}
            onRemove={handleRemoveFavicon}
          />
        </div>
      </div>

      {/* Card: Tiền tệ & Thuế */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Tiền tệ & Thuế</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Đơn vị tiền tệ và thuế suất</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Đơn vị tiền tệ
            </label>
            <select
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
            >
              <option value="VND">VND (Việt Nam Đồng)</option>
              <option value="USD">USD (Đô la Mỹ)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Thuế VAT (%)
            </label>
            <div className="relative">
              <input
                type="number"
                name="taxRate"
                value={formData.taxRate}
                onChange={handleChange}
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer với nút lưu */}
      <div className="sticky bottom-6 mt-8 flex justify-end">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 flex space-x-3">
          <button
            type="button"
            onClick={() => {
              // Reset form về dữ liệu hiện tại
              if (settings) {
                setFormData({
                  systemName: settings.systemName || '',
                  timezone: settings.timezone || 'Asia/Ho_Chi_Minh',
                  dateFormat: settings.dateFormat || 'dd/mm/yyyy',
                  currency: settings.currency || 'VND',
                  itemsPerPage: settings.itemsPerPage || 20,
                  maintenanceMode: settings.maintenanceMode || false,
                  storeEmail: settings.storeEmail || '',
                  storePhone: settings.storePhone || '',
                  hotline: settings.hotline || '',
                  storeAddress: settings.storeAddress || '',
                  workingHours: settings.workingHours || '8:00 - 17:00',
                  logo: settings.logo || '',
                  favicon: settings.favicon || '',
                  taxRate: settings.taxRate || 0,
                });
                setLogoPreview(settings.logo || '');
                setFaviconPreview(settings.favicon || '');
              }
            }}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!hasChanges}
            className={`flex items-center px-6 py-2 rounded-lg text-white transition ${
              hasChanges
                ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
                : 'bg-blue-300 cursor-not-allowed'
            }`}
          >
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}