'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/categories`);
        console.log('Categories:', res.data);
      } catch (error) {
        console.error('Lỗi tải danh mục:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, [API_URL]);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Danh mục sản phẩm</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat._id}
            href={`/categories/${cat.slug}`}
            className="group bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition"
          >
            <div className="h-40 bg-gray-200 relative">
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  {cat.name}
                </div>
              )}
            </div>
            <div className="p-4 text-center">
              <h3 className="font-semibold text-gray-800">{cat.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}