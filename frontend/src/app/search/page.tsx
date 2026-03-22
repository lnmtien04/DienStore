'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discount: number;
  images: string[];
  stock: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/api/products?search=${encodeURIComponent(query)}`);
        setProducts(res.data.products || res.data);
      } catch (err) {
        console.error('Lỗi tìm kiếm:', err);
        setError('Có lỗi xảy ra');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [query, API_URL]);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Kết quả tìm kiếm cho "{query}"</h1>
      {products.length === 0 ? (
        <p className="text-center py-10">Không tìm thấy sản phẩm nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
            return (
              <Link
                key={product._id}
                href={`/products/${product.slug || product._id}`}
                className="group bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative h-48 bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition"
                      unoptimized
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      {t('product.no_image')}
                    </div>
                  )}
                  {product.discount > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      -{product.discount}%
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-red-600">
                      {discountedPrice.toLocaleString('vi-VN')}đ
                    </span>
                    {product.discount > 0 && (
                      <span className="text-sm text-gray-400 line-through">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Đang tải...</div>}>
      <SearchContent />
    </Suspense>
  );
}