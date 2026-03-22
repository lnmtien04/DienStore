// app/admin/settings/layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Cog6ToothIcon,
  BuildingStorefrontIcon,
  CreditCardIcon,
  TruckIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { name: 'Cài đặt chung', href: '/admin/settings/general', icon: Cog6ToothIcon },
  { name: 'Thông tin cửa hàng', href: '/admin/settings/store', icon: BuildingStorefrontIcon },
  { name: 'Thanh toán', href: '/admin/settings/payment', icon: CreditCardIcon },
  { name: 'Vận chuyển', href: '/admin/settings/shipping', icon: TruckIcon },
  { name: 'Email', href: '/admin/settings/email', icon: EnvelopeIcon },
  { name: 'Phân quyền', href: '/admin/settings/permissions', icon: UserGroupIcon },
  { name: 'Sao lưu', href: '/admin/settings/backup', icon: ArrowPathIcon },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-800">Cài đặt hệ thống</h2>
        </div>
        <nav className="mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Nội dung chính */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}