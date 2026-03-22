'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  UserIcon,
  MapPinIcon,
  HeartIcon,
  ShoppingBagIcon,
  BellIcon,
  GlobeAltIcon,
  PaintBrushIcon,
  DocumentTextIcon,
  ScaleIcon,
  InformationCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const settingsGroups = [
  {
    title: 'Tài khoản',
    items: [
      { href: '/settings/account', label: 'Tài khoản và bảo mật', icon: UserIcon },
      { href: '/addresses', label: ' Địa chỉ', icon: MapPinIcon },
    ],
  },
  {
    title: 'Cài đặt',
    items: [
      { href: '/notifications', label: 'Thông báo', icon: BellIcon },
      { href: '/language', label: 'Ngôn ngữ', icon: GlobeAltIcon },
      { href: '/preferences', label: 'Giao diện', icon: PaintBrushIcon },
    ],
  },
  {
    title: 'Hỗ trợ',
    items: [
      { href: '/terms', label: 'Điều khoản', icon: DocumentTextIcon },
      { href: '/community-standards', label: 'Tiêu chuẩn cộng đồng', icon: ScaleIcon },
      { href: '/about', label: 'Giới thiệu', icon: InformationCircleIcon },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="space-y-8 w-full"> {/* w-full đảm bảo full màn hình */}
      {settingsGroups.map((group) => (
        <section key={group.title} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="w-1 h-6 bg-linear-to-b from-blue-500 to-blue-600 rounded-full"></span>
            {group.title}
          </h2>
          <div className="flex flex-col space-y-2"> {/* Xếp dọc */}
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="shrink-0 p-2 bg-linear-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* Nút Đăng xuất */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-linear-to-b from-red-500 to-red-600 rounded-full"></span>
          Khác
        </h2>
        <div className="flex flex-col space-y-2">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left w-full"
          >
            <div className="shrink-0 p-2 bg-linear-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg">
              <ArrowRightOnRectangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              Đăng xuất
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}