'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import {
  HomeIcon,
  CubeIcon,
  TagIcon,
  ShoppingBagIcon,
  GiftIcon,
  UsersIcon,
  EnvelopeIcon,
  TruckIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  ClockIcon,
  PhotoIcon,
  NewspaperIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  DocumentPlusIcon,
  ClipboardDocumentCheckIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '@/context/UserContext';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    title: 'Tổng quan',
    items: [{ name: 'Dashboard', href: '/admin', icon: HomeIcon, roles: ['admin', 'staff'] }],
  },
  {
    title: 'Danh mục sản phẩm',
    items: [
      { name: 'Sản phẩm', href: '/admin/products', icon: CubeIcon, roles: ['admin', 'staff'] },
      { name: 'Danh mục', href: '/admin/categories', icon: TagIcon, roles: ['admin'] },
      { name: 'Thương hiệu', href: '/admin/brands', icon: TagIcon, roles: ['admin'] },
    ],
  },
  {
    title: 'Bán hàng',
    items: [
      { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingBagIcon, roles: ['admin', 'staff'] },
      { name: 'Mã khuyến mãi', href: '/admin/coupons', icon: GiftIcon, roles: ['admin'] },
    ],
  },
  {
    title: 'Khách hàng',
    items: [
      { name: 'Khách hàng', href: '/admin/customers', icon: UsersIcon, roles: ['admin', 'staff'] },
      { name: 'Liên hệ', href: '/admin/contacts', icon: EnvelopeIcon, roles: ['admin', 'staff'] },
      { name: 'Bình luận', href: '/admin/comments', icon: ChatBubbleLeftIcon, roles: ['admin', 'staff'] },
      { name: 'Chat', href: '/admin/chat', icon: ChatBubbleLeftIcon, roles: ['admin', 'staff'] },
    ],
  },
  {
    title: 'Vận chuyển & Bảo hành',
    items: [
      { name: 'Vận chuyển', href: '/admin/shippers', icon: TruckIcon, roles: ['admin'] },
      { name: 'Bảo hành', href: '/admin/warranty', icon: DocumentTextIcon, roles: ['admin'] },
    ],
  },
  {
    title: 'Kho hàng',
    items: [
      { name: 'Kho', href: '/admin/inventory', icon: ArchiveBoxIcon, roles: ['admin'] },
      { name: 'Lịch sử kho', href: '/admin/transactions', icon: ClockIcon, roles: ['admin'] },
      { name: 'Phiếu nhập', href: '/admin/purchase-orders', icon: DocumentPlusIcon, roles: ['admin'] },
      { name: 'Kiểm kê', href: '/admin/audits', icon: ClipboardDocumentCheckIcon, roles: ['admin'] },
    ],
  },
  {
    title: 'Tiếp thị',
    items: [
      { name: 'Banner', href: '/admin/banners', icon: PhotoIcon, roles: ['admin'] },
      { name: 'Bài viết', href: '/admin/posts', icon: NewspaperIcon, roles: ['admin'] },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { name: 'Người dùng', href: '/admin/users', icon: UsersIcon, roles: ['admin', 'staff'] },
      { name: 'Chức vụ', href: '/admin/roles', icon: ShieldCheckIcon, roles: ['admin', 'staff'] },
      { name: 'Nhật ký', href: '/admin/logs', icon: DocumentTextIcon, roles: ['admin'] },
      { name: 'Sao lưu', href: '/admin/backup', icon: ArchiveBoxIcon, roles: ['admin'] },
      { name: 'Thống kê', href: '/admin/statistics', icon: ChartBarIcon, roles: ['admin'] },
      { name: 'Cài đặt', href: '/admin/settings', icon: Cog6ToothIcon, roles: ['admin'] },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, token } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    const roles = user?.roles || [];
    if (!roles.includes('admin') && !roles.includes('staff')) {
      router.push('/');
      return;
    }
  }, [token, user, router]);

  const userRoles = user?.roles || [];
  const isAdmin = userRoles.includes('admin');
  const isStaff = userRoles.includes('staff');

  const filteredMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.roles.some(role => userRoles.includes(role))
      ),
    }))
    .filter(group => group.items.length > 0);

  if (!token) {
    return null;
  }

  // Xác định vai trò hiển thị
  const roleText = isAdmin ? 'Quản trị viên' : isStaff ? 'Nhân viên' : '';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`w-64 bg-white shadow-lg shrink-0 ${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block`}
      >
        {/* Phần thông tin user trong sidebar */}
        <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
          {user?.avatar ? (
            <img
              src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`}
              alt={user.fullName || 'Avatar'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName || 'Admin'}</p>
            <p className="text-xs text-gray-500">{roleText}</p>
          </div>
        </div>

        <nav className="mt-2 px-2 pb-4 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide">
          {filteredMenuGroups.map((group) => (
            <div key={group.title} className="mb-4">
              <div className="px-3 py-1.5 bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider rounded-md w-full">
                {group.title}
              </div>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-md" />
                      )}
                      <item.icon
                        className={`mr-3 h-5 w-5 ${
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-500'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
          <button
            onClick={logout}
            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 mt-4"
          >
            <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5" />
            Đăng xuất
          </button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="flex items-center">
            <span className="text-sm text-gray-700 mr-2">
              Xin chào, {user?.fullName || 'Admin'}
            </span>
            {/* {user?.avatar ? (
              <img
                src={user.avatar.startsWith('http') ? user.avatar : `${API_URL}${user.avatar}`}
                alt="avatar"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.fullName?.charAt(0) || 'A'}
              </div>
            )} */}
            <span className="ml-2 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              {user?.roles?.includes('admin') ? 'Admin' : 'Nhân viên'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}