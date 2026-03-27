'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  FaShoppingCart,
  FaUser,
  FaSearch,
  FaPhone,
  FaBars,
  FaTimes,
  FaGlobe,
  FaSun,
  FaMoon,
} from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import axios from 'axios';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage } = useLanguage();
  const { user, logout } = useUser();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories`);
        setCategories(res.data.slice(0, 6));
      } catch (error) {
        console.error('Lỗi tải danh mục:', error);
      }
    };
    fetchCategories();
  }, [API_URL]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseLeave = () => {
    setIsMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const isAdmin = user?.roles?.includes('admin');
  const isStaff = user?.roles?.includes('staff');
  const hasAdminAccess = isAdmin || isStaff;

  return (
    <>
      <div className="w-full h-15 relative">
        <Image
          src="/image/31.jpg"
          alt="Banner chính"
          fill
          className="object-cover"
          priority
          quality={100}
        />
      </div>

      <nav className="bg-white dark:bg-gray-900 text-gray-800 dark:text-white py-3 shadow-md sticky top-0 z-50 transition-colors">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <button
              ref={buttonRef}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Menu"
            >
              {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
            <Link
              href="/"
              className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition whitespace-nowrap"
            >
              HomiTech
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 mx-4">
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
            <button type="submit" className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <FaSearch className="text-gray-400 dark:text-gray-500 hover:text-blue-500" />
            </button>
          </form>

          <ul className="hidden md:flex items-center space-x-3">
            <li>
              <button
                onClick={() => changeLanguage(language === 'vi' ? 'en' : 'vi')}
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              >
                <FaGlobe className="text-lg" />
                <span className="font-medium text-sm">{language === 'vi' ? 'VI' : 'EN'}</span>
              </button>
            </li>

            <li>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center space-x-1 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              >
                {mounted ? (
                  theme === 'dark' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />
                ) : (
                  <div className="w-5 h-5" />
                )}
              </button>
            </li>

            <li>
              <Link
                href="/hotline"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              >
                <FaPhone className="text-lg" />
                <span className="font-medium">Hotline</span>
              </Link>
            </li>

            <li>
              <Link
                href="/cart"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              >
                <FaShoppingCart className="text-lg" />
                <span className="font-medium">Giỏ hàng</span>
              </Link>
            </li>

            <li className="relative">
              {user ? (
                hasAdminAccess ? (
                  // Admin/Staff: button + dropdown
                  <>
                    <button
                      ref={userMenuButtonRef}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                    >
                      <FaUser className="text-lg" />
                      <span className="font-medium">{user.fullName || 'Tài khoản'}</span>
                    </button>
                    {isUserMenuOpen && (
                      <div
                        ref={userMenuRef}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                      >
                        <Link
                          href="/InformationProfile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Thông tin tài khoản
                        </Link>
                        <Link
                          href="/admin"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Quản trị hệ thống
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  // Khách hàng thường: link trực tiếp đến profile
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                  >
                    <FaUser className="text-lg" />
                    <span className="font-medium">{user.fullName || 'Tài khoản'}</span>
                  </Link>
                )
              ) : (
                // Chưa đăng nhập: button + dropdown
                <>
                  <button
                    ref={userMenuButtonRef}
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
                  >
                    <FaUser className="text-lg" />
                    <span className="font-medium">Tài khoản</span>
                  </button>
                  {isUserMenuOpen && (
                    <div
                      ref={userMenuRef}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
                    >
                      <Link
                        href="/auth/login"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Đăng ký
                      </Link>
                    </div>
                  )}
                </>
              )}
            </li>
          </ul>
        </div>

        {isMenuOpen && (
          <div
            ref={menuRef}
            onMouseLeave={handleMouseLeave}
            className="absolute left-0 right-0 mt-2 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40"
          >
            <div className="container mx-auto px-4 py-4">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-3 uppercase tracking-wider">
                Danh mục sản phẩm
              </h3>
              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {categories.map((cat) => (
                  <Link
                    key={cat._id}
                    href={`/categories/${cat.slug}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex flex-col items-center text-center group"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 relative rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 mb-1">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="80px"
                          className="object-cover group-hover:scale-110 transition duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                          ?
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}