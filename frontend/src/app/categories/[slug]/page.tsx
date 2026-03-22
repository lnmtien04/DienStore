'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useCart } from '@/context/CartContext';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';

interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  discount: number;
  images: string[];
  stock: number;
}

export default function CategoryPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryRes = await axios.get(`${API_URL}/api/categories/slug/${slug}`);
        const cat = categoryRes.data;
        setCategory(cat);

        const productsRes = await axios.get(`${API_URL}/api/products?category=${cat._id}`);
        setProducts(productsRes.data.products || productsRes.data);
      } catch (err) {
        console.error('Lỗi tải dữ liệu:', err);
        setError('Không tìm thấy danh mục');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchData();
  }, [slug, API_URL]);

  const handleBuyNow = (productId: string) => {
    addToCart(productId, 1);
    router.push(`/checkout?selected=${productId}`);
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!category) return <div className="text-center py-10">Không tìm thấy danh mục</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
        <span className="mx-2">/</span>
        <Link href="/categories" className="hover:text-blue-600">Danh mục</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{category.name}</span>
      </div>

      <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
      {category.description && <p className="text-gray-600 mb-6">{category.description}</p>}

      {products.length === 0 ? (
        <p className="text-center py-10">Chưa có sản phẩm nào trong danh mục này.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {products.map((product) => {
            const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
            return (
              <div
                key={product._id}
                className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col h-full"
              >
                <Link href={`/products/${product.slug || product._id}`} className="block -shrink-0">
                  <div className="relative h-48 bg-gray-100 overflow-hidden">
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
                        {t('product.no_image')}
                      </div>
                    )}
                    {product.discount > 0 && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        -{product.discount}%
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <Link href={`/products/${product.slug || product._id}`}>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 transition min-h-12">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-xl font-bold text-red-600 dark:text-red-400">
                        {discountedPrice.toLocaleString('vi-VN')}đ
                      </span>
                      {product.discount > 0 && (
                        <span className="text-sm text-gray-400 line-through">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleBuyNow(product._id)}
                      className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                      MUA NGAY
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}