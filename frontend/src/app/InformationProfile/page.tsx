'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  CameraIcon,
  KeyIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  ComputerDesktopIcon,
  GlobeAltIcon,
  DocumentTextIcon,
  CubeIcon,
  ShoppingBagIcon,
  UsersIcon,
  TagIcon,
  TruckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function InformationProfileI() {
  const { user, token, refreshUser, logout } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [updating, setUpdating] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Mock data cho lịch sử đăng nhập và hoạt động
  const [loginHistory] = useState([
    { time: '04/03/2026 09:20', ip: '113.161.45.78', device: 'Chrome / Windows', location: 'Hồ Chí Minh' },
    { time: '03/03/2026 18:45', ip: '113.161.45.78', device: 'Chrome / Windows', location: 'Hồ Chí Minh' },
    { time: '02/03/2026 10:12', ip: '113.161.45.78', device: 'Firefox / Windows', location: 'Hồ Chí Minh' },
  ]);

  const [activities] = useState([
    { time: '04/03/2026 10:30', action: 'Tạo sản phẩm mới: Tủ đông 2 cánh' },
    { time: '04/03/2026 09:15', action: 'Cập nhật đơn hàng #DH20260304-01' },
    { time: '03/03/2026 16:20', action: 'Tạo mã giảm giá SALE10' },
    { time: '03/03/2026 14:50', action: 'Xác nhận đơn hàng #DH20260303-05' },
  ]);

  // Kiểm tra quyền admin
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    } else if (!user.roles?.includes('admin')) {
      router.push('/');
    }
  }, [user, router]);

  // Đồng bộ state với user
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phoneNumber || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  if (!user) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const avatarUrl = user.avatar?.startsWith('http')
    ? user.avatar
    : `${API_URL}${user.avatar}`;

  // Cập nhật thông tin cá nhân
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axios.put(
        `${API_URL}/api/accounts/profile`,
        { fullName, phoneNumber: phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật thông tin thành công');
      if (refreshUser) await refreshUser();
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    } finally {
      setUpdating(false);
    }
  };

  // Upload avatar
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', avatarFile);
    try {
      await axios.post(`${API_URL}/api/accounts/avatar`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Cập nhật ảnh đại diện thành công');
      if (refreshUser) await refreshUser();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi upload ảnh');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Đổi mật khẩu (mock)
  const handleChangePassword = () => {
    toast.success('Chức năng đổi mật khẩu sẽ sớm được cập nhật');
  };

  // Đăng xuất khỏi tất cả thiết bị (mock)
  const handleLogoutAll = () => {
    toast.success('Đã đăng xuất khỏi tất cả thiết bị (demo)');
  };

  // Các module quyền
  const modules = [
    { name: 'Dashboard', icon: ChartBarIcon },
    { name: 'Sản phẩm', icon: CubeIcon },
    { name: 'Đơn hàng', icon: ShoppingBagIcon },
    { name: 'Khách hàng', icon: UsersIcon },
    { name: 'Danh mục', icon: DocumentTextIcon },
    { name: 'Thương hiệu', icon: TagIcon },
    { name: 'Vận chuyển', icon: TruckIcon },
    { name: 'Chức vụ', icon: ShieldCheckIcon },
    { name: 'Bảo hành', icon: Cog6ToothIcon },
    { name: 'Mã khuyến mãi', icon: TagIcon },
    { name: 'Thống kê', icon: ChartBarIcon },
    { name: 'Kho', icon: CubeIcon },
    { name: 'Lịch sử kho', icon: ClockIcon },
    { name: 'Cài đặt', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header với tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8">
            {[
              { id: 'profile', label: 'Hồ sơ', icon: PencilIcon },
              { id: 'security', label: 'Bảo mật', icon: KeyIcon },
              { id: 'permissions', label: 'Quyền hạn', icon: ShieldCheckIcon },
              { id: 'activity', label: 'Hoạt động', icon: ClockIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Nội dung theo tab */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
          {activeTab === 'profile' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Thông tin cá nhân</h2>
              
              {/* Avatar */}
              <div className="flex items-center gap-6 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-linear-to-r from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-gray-700">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-3xl font-bold">
                        {user.fullName?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition"
                  >
                    <CameraIcon className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                {avatarFile && (
                  <button
                    onClick={uploadAvatar}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                  >
                    {uploadingAvatar ? 'Đang tải...' : 'Lưu ảnh'}
                  </button>
                )}
              </div>

              {/* Thông tin */}
              {!isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Họ tên</label>
                      <p className="text-gray-900 dark:text-white font-medium">{user.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Username</label>
                      <p className="text-gray-900 dark:text-white font-medium">{user.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
                      <p className="text-gray-900 dark:text-white font-medium">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Số điện thoại</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {user.phoneNumber || 'Chưa cập nhật'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Trạng thái</label>
                      <p className="text-green-600 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        Hoạt động
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400">Ngày tạo</label>
                      <p className="text-gray-900 dark:text-white font-medium">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('vi-VN')
                          : 'Không xác định'}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Họ tên
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFullName(user.fullName);
                        setPhone(user.phoneNumber || '');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                    >
                      {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Bảo mật tài khoản</h2>
              
              {/* Đổi mật khẩu */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <KeyIcon className="w-5 h-5" />
                  Đổi mật khẩu
                </h3>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Đổi mật khẩu
                </button>
              </div>

              {/* Lịch sử đăng nhập */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5" />
                  Lịch sử đăng nhập
                </h3>
                <div className="space-y-2">
                  {loginHistory.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-sm border-b border-gray-200 dark:border-gray-600 pb-2 last:border-0">
                      <ComputerDesktopIcon className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="font-medium">{log.time}</p>
                        <p className="text-gray-500 dark:text-gray-400">
                          IP: {log.ip} - {log.device} - {log.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Đăng xuất khỏi tất cả thiết bị */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleLogoutAll}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Đăng xuất khỏi tất cả thiết bị
                </button>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Vai trò & Quyền hạn</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Tài khoản của bạn có quyền **Super Admin** - toàn quyền trên hệ thống.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {modules.map((mod) => (
                  <div key={mod.name} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <mod.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="text-gray-700 dark:text-gray-200">{mod.name}</span>
                    <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Đầy đủ</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Nhật ký hoạt động</h2>
              <div className="space-y-3">
                {activities.map((act, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <ClockIcon className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{act.time}</p>
                      <p className="text-gray-600 dark:text-gray-300">{act.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}