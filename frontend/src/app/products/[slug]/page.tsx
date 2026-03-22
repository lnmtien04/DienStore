'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
  BoltIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import CommentSection from '@/components/CommentSection'; // Import component bình luận

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  category: { _id: string; name: string };
  importPrice: number;
  origin: string;
  warranty: string;
  brand: string;
  images: string[];
  stock: number;
  isActive: boolean;
  sold?: number;
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { user } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/products/slug/${slug}`);
        setProduct(res.data);
      } catch (error) {
        console.error('Lỗi tải sản phẩm:', error);
        toast.error('Không tìm thấy sản phẩm');
      } finally {
        setLoading(false);
      }
    };
    if (slug) fetchProduct();
  }, [slug, API_URL]);

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ');
      return;
    }
    if (!product) return;
    if (product.stock === 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    addToCart(product._id, quantity);
  };

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      return;
    }
    if (!product) return;
    if (product.stock === 0) {
      toast.error('Sản phẩm đã hết hàng');
      return;
    }
    addToCart(product._id, quantity);
    router.push(`/checkout?selected=${product._id}`);
  };

  if (loading) return <div className="text-center py-20">Đang tải...</div>;
  if (!product) return <div className="text-center py-20">Không tìm thấy sản phẩm</div>;

  const discountedPrice = product.price * (1 - product.discount / 100);
  const hasDiscount = product.discount > 0;

  const specs = [
    { label: 'Thương hiệu', value: product.brand || 'Đang cập nhật' },
    { label: 'Xuất xứ', value: product.origin || 'Đang cập nhật' },
    { label: 'Bảo hành', value: product.warranty || 'Không có' },
    { label: 'Trạng thái', value: product.stock > 0 ? 'Còn hàng' : 'Hết hàng' },
  ];

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm flex flex-wrap items-center text-gray-500 dark:text-gray-400">
          <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
          <span className="mx-2">/</span>
          <Link href="/categories" className="hover:text-blue-600">Danh mục</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700 dark:text-gray-300">{product.category?.name}</span>
        </nav>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
            {/* Gallery ảnh - bên trái */}
            <div>
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                <Image
                  src={product.images[selectedImage] || '/placeholder.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                  unoptimized
                  priority
                />
                {hasDiscount && (
                  <div className="absolute top-4 left-4 bg-linear-to-r from-red-500 to-orange-500 text-white text-lg font-bold px-4 py-2 rounded-full shadow-lg">
                    -{product.discount}% GIẢM SỐC
                  </div>
                )}
                {product.stock <= 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-2xl font-bold px-6 py-3 rounded-lg rotate-12 shadow-xl">
                      HẾT HÀNG
                    </span>
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative w-20 h-20 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                        selectedImage === idx ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <Image src={img} alt={`thumb-${idx}`} fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Thông tin sản phẩm - bên phải */}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3">{product.name}</h1>

              {/* Giá */}
              <div className="mb-6 p-4 bg-linear-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl">
                {hasDiscount ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-3xl lg:text-4xl font-bold text-red-600">
                      {discountedPrice.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-lg text-gray-400 line-through">{product.price.toLocaleString('vi-VN')}đ</span>
                    <span className="bg-red-100 text-red-600 text-sm font-bold px-3 py-1 rounded-full">-{product.discount}%</span>
                  </div>
                ) : (
                  <span className="text-3xl lg:text-4xl font-bold text-blue-600">{product.price.toLocaleString('vi-VN')}đ</span>
                )}
              </div>

              {/* Số lượng */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Số lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg">-</button>
                    <span className="px-6 py-2 text-gray-800 dark:text-white font-medium min-w-15 text-center">{quantity}</span>
                    <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg" disabled={quantity >= product.stock}>+</button>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {product.stock > 0 ? `${product.stock} sản phẩm có sẵn` : 'Hết hàng'}
                  </span>
                </div>
              </div>

              {/* Cam kết dịch vụ */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <TruckIcon className="h-4 w-4" /> Giao hàng toàn quốc
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <ShieldCheckIcon className="h-4 w-4" /> Bảo hành chính hãng
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <ArrowPathIcon className="h-4 w-4" /> Đổi trả 7 ngày
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                  <CreditCardIcon className="h-4 w-4" /> Thanh toán khi nhận
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                  <ShoppingCartIcon className="h-5 w-5" /> Thêm vào giỏ
                </button>
                <button onClick={handleBuyNow} disabled={product.stock === 0} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                  Mua ngay
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Thông số & Mô tả gộp chung */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <BoltIcon className="w-6 h-6 text-blue-600" />
            Thông số & Mô tả
          </h2>
          <div className="space-y-4">
            {specs.map((spec, idx) => (
              <div key={idx} className="flex border-b border-gray-200 dark:border-gray-700 pb-3">
                <span className="w-1/4 text-gray-600 dark:text-gray-400 font-medium">{spec.label}</span>
                <span className="w-3/4 text-gray-800 dark:text-white">{spec.value}</span>
              </div>
            ))}
            {product.description && (
              <div className="pt-4">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">{product.description}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phần bình luận - thêm vào đây */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 lg:p-8">
          <CommentSection productId={product._id} />
        </div>

        {/* Nút quay lại */}
        <div className="mt-8 text-center">
          <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold transition shadow-md">
            <ArrowLeftIcon className="h-5 w-5" /> Quay lại trang trước
          </button>
        </div>
      </div>
    </div>
  );
}