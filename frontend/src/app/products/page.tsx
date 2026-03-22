'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  priceOld?: number;
  images: string[];
  discount?: number;
  stock?: number;
  sold?: number;
  rating?: number;
  reviewCount?: number;
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  description?: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilter, setShowFilter] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const pageParam = parseInt(searchParams.get('page') || '1');
    setSearchTerm(search);
    setSelectedCategory(category);
    setPage(pageParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories`);
        setCategories(res.data);
      } catch (error) {
        console.error('Lỗi tải danh mục:', error);
      }
    };
    fetchCategories();
  }, [API_URL]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category', selectedCategory);
        params.append('page', page.toString());
        params.append('limit', '8');
        const res = await axios.get(`${API_URL}/api/products?${params}`);
        setProducts(res.data.products || res.data);
        setTotalPages(res.data.totalPages || 1);
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        toast.error('Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [searchTerm, selectedCategory, page, API_URL]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (selectedCategory) params.append('category', selectedCategory);
    params.append('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (categoryId) params.append('category', categoryId);
    params.append('page', '1');
    router.push(`/products?${params.toString()}`);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const handleAddToCart = async (product: Product) => {
    const stock = product.stock ?? 0;
    if (stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    await addToCart(product._id, 1);
    toast.success('Đã thêm vào giỏ hàng');
  };

  const handleBuyNow = async (product: Product) => {
    const stock = product.stock ?? 0;
    if (stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    await addToCart(product._id, 1);
    router.push(`/checkout?selected=${product._id}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
              <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Tất cả sản phẩm</h1>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm sản phẩm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </form>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg"
        >
          <FunnelIcon className="h-5 w-5" />
          Lọc
        </button>
        <div className={`${showFilter ? 'block' : 'hidden'} md:block`}>
          <select
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {products.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => {
              const categoryName = typeof product.category === 'object' ? product.category.name : '';
              const discount = product.discount ?? 0;
              const discountedPrice = product.price * (1 - discount / 100);
              const stock = product.stock ?? 0;
              return (
                <div
                  key={product._id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full"
                >
                  <Link href={`/products/${product.slug || product._id}`} className="block">
                    <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
                          Không có ảnh
                        </div>
                      )}
                      {discount > 0 && (
                        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                          -{discount}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <div className="p-4 flex flex-col flex-1">
                    <Link href={`/products/${product.slug || product._id}`}>
                      <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-1 hover:text-blue-600 dark:hover:text-blue-400 transition line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{categoryName}</p>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(discountedPrice)}
                      </span>
                      {discount > 0 && (
                        <span className="text-sm text-gray-400 dark:text-gray-500 line-through">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={stock <= 0}
                        className={`flex-1 py-2 rounded-lg transition ${
                          stock > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {stock > 0 ? 'Thêm vào giỏ' : 'Hết hàng'}
                      </button>
                      <button
                        onClick={() => handleBuyNow(product)}
                        disabled={stock <= 0}
                        className={`flex-1 py-2 rounded-lg transition ${
                          stock > 0
                            ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
                            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        Mua ngay
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md ${
                    p === page
                      ? 'bg-blue-600 text-white dark:bg-blue-500'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Sau
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-center py-10 text-gray-500 dark:text-gray-400">Không tìm thấy sản phẩm nào.</p>
      )}
    </div>
  );
}