'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    discount?: number;
    stock?: number;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { t } = useLanguage();

  return (
    <Link
      href={`/products/${product.slug || product._id}`}
      className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-48 mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
        {product.images?.[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
              unoptimized 
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
            {t('product.no_image') || 'No image'}
          </div>
        )}
        {product.discount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{product.discount}%
          </span>
        )}
      </div>
      <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
        {product.name}
      </h3>
      <p className="text-blue-600 dark:text-blue-400 font-bold text-lg">
        {product.price.toLocaleString('vi-VN')}đ
      </p>
      {product.stock === 0 && (
        <p className="text-sm text-red-500 mt-1">{t('product.out_of_stock') || 'Hết hàng'}</p>
      )}
    </Link>
  );
}