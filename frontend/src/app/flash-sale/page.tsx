'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { StarIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

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
}

const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endTime).getTime() - now;
      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className="flex gap-2 text-center">
      <div className="bg-red-600 text-white rounded-lg w-16 h-16 flex flex-col justify-center items-center">
        <span className="text-2xl font-bold">{timeLeft.hours}</span>
        <span className="text-xs">Giờ</span>
      </div>
      <div className="bg-red-600 text-white rounded-lg w-16 h-16 flex flex-col justify-center items-center">
        <span className="text-2xl font-bold">{timeLeft.minutes}</span>
        <span className="text-xs">Phút</span>
      </div>
      <div className="bg-red-600 text-white rounded-lg w-16 h-16 flex flex-col justify-center items-center">
        <span className="text-2xl font-bold">{timeLeft.seconds}</span>
        <span className="text-xs">Giây</span>
      </div>
    </div>
  );
};

// Component con chứa logic và UI chính
function FlashSaleContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { addToCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const pageParam = searchParams.get('page') || '1';
    setPage(parseInt(pageParam));
  }, [searchParams]);

  useEffect(() => {
    const fetchFlashSale = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/products?flashSale=true&page=${page}&limit=8`);
        setProducts(res.data.products || res.data);
        setTotalPages(res.data.totalPages || 1);
        setFlashSaleEndTime(res.data.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());
      } catch (error) {
        console.error('Lỗi tải flash sale:', error);
        toast.error('Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    fetchFlashSale();
  }, [page, API_URL]);

  const handleAddToCart = async (product: Product) => {
    if (product.stock && product.stock <= 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    await addToCart(product._id, 1);
    toast.success('Đã thêm vào giỏ hàng');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
            FLASH SALE
          </h1>
          {flashSaleEndTime && <CountdownTimer endTime={flashSaleEndTime} />}
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {products.map((product) => {
                const sold = product.sold ?? 0;
                const stock = product.stock ?? 0;
                const hasSold = sold > 0;
                let percentSold = 0;
                if (hasSold) {
                  percentSold = stock > 0
                    ? Math.min((sold / (sold + stock)) * 100, 100)
                    : Math.min((sold / 100) * 100, 100);
                }

                return (
                  <div
                    key={product._id}
                    className="group bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full"
                  >
                    {/* Ảnh sản phẩm */}
                    <Link href={`/products/${product.slug || product._id}`} className="block -shrink-0">
                      <div className="relative h-48 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition duration-500"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No image
                          </div>
                        )}
                        {product.discount && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-sm font-bold px-2 py-1 rounded z-10">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Nội dung sản phẩm */}
                    <div className="p-4 flex flex-col flex-1">
                      <Link href={`/products/${product.slug || product._id}`} className="block">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 transition min-h-14">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-xl font-bold text-red-600 dark:text-red-400">
                          {formatCurrency(product.price)}
                        </span>
                        {product.priceOld && (
                          <span className="text-sm text-gray-400 line-through">
                            {formatCurrency(product.priceOld)}
                          </span>
                        )}
                      </div>

                      {hasSold && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Đã bán {sold.toLocaleString()}</span>
                            <span>Còn {stock.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-linear-to-r from-orange-500 to-red-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${percentSold}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-auto">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={stock <= 0}
                          className={`mt-4 w-full py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                            stock > 0
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <ShoppingCartIcon className="h-5 w-5" />
                          {stock > 0 ? 'MUA NGAY' : 'HẾT HÀNG'}
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
                  onClick={() => setPage(p => Math.max(1, p-1))}
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
                  onClick={() => setPage(p => Math.min(totalPages, p+1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-center py-10 text-gray-500 dark:text-gray-400">
            Không có sản phẩm flash sale nào.
          </p>
        )}
      </div>
    </div>
  );
}

// Trang chính bọc trong Suspense
export default function FlashSalePage() {
  return (
    <Suspense fallback={<div>Đang tải...</div>}>
      <FlashSaleContent />
    </Suspense>
  );
}