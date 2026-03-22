'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
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
  ClipboardDocumentCheckIcon ,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useUser } from '@/context/UserContext';

// Cấu trúc menu theo nhóm (đầy đủ các chức năng)
const menuGroups = [
  {
    title: 'Tổng quan',
    items: [{ name: 'Dashboard', href: '/admin', icon: HomeIcon }],
  },
  {
    title: 'Danh mục sản phẩm',
    items: [
      { name: 'Sản phẩm', href: '/admin/products', icon: CubeIcon },
      { name: 'Danh mục', href: '/admin/categories', icon: TagIcon },
      { name: 'Thương hiệu', href: '/admin/brands', icon: TagIcon },
    ],
  },
  {
    title: 'Bán hàng',
    items: [
      { name: 'Đơn hàng', href: '/admin/orders', icon: ShoppingBagIcon },
      { name: 'Mã khuyến mãi', href: '/admin/coupons', icon: GiftIcon },
    ],
  },
  {
    title: 'Khách hàng',
    items: [
      { name: 'Khách hàng', href: '/admin/customers', icon: UsersIcon },
      { name: 'Liên hệ', href: '/admin/contacts', icon: EnvelopeIcon },
       { name: 'Bình luận', href: '/admin/comments', icon: ChatBubbleLeftIcon },
    ],
  },
  {
    title: 'Vận chuyển & Bảo hành',
    items: [
      { name: 'Vận chuyển', href: '/admin/shippers', icon: TruckIcon },
      { name: 'Bảo hành', href: '/admin/warranty', icon: DocumentTextIcon },
    ],
  },
  {
    title: 'Kho hàng',
    items: [
      { name: 'Kho', href: '/admin/inventory', icon: ArchiveBoxIcon },
      { name: 'Lịch sử kho', href: '/admin/transactions', icon: ClockIcon },
      { name: 'Phiếu nhập', href: '/admin/purchase-orders', icon: DocumentPlusIcon },
  { name: 'Kiểm kê', href: '/admin/audits', icon: ClipboardDocumentCheckIcon },
    ],
  },
  {
    title: 'Tiếp thị',
    items: [
      { name: 'Banner', href: '/admin/banners', icon: PhotoIcon },
      { name: 'Bài viết', href: '/admin/posts', icon: NewspaperIcon },
    ],
  },
  {
    title: 'Hệ thống',
    items: [
      { name: 'Chức vụ', href: '/admin/roles', icon: ShieldCheckIcon },
      { name: 'Nhật ký', href: '/admin/logs', icon: DocumentTextIcon },
      { name: 'Sao lưu', href: '/admin/backup', icon: ArchiveBoxIcon },
      { name: 'Thống kê', href: '/admin/statistics', icon: ChartBarIcon },
      { name: 'Cài đặt', href: '/admin/settings', icon: Cog6ToothIcon },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { user, logout } = useUser();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`w-64 bg-white shadow-lg shrink-0 ${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block`}
      >
        <div className="flex items-center justify-center h-16 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="mt-5 px-2 pb-4 overflow-y-auto h-[calc(100vh-4rem)] scrollbar-hide">
          {menuGroups.map((group) => (
            <div key={group.title} className="mb-4">
              {/* Tiêu đề nhóm với nền xanh nước biển */}
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
                      {/* Active indicator */}
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
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {user?.fullName?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>

      {/* CSS để ẩn scrollbar nhưng vẫn cuộn được */}
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