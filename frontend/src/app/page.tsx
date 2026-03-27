'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CreditCardIcon, ShoppingCartIcon } from '@heroicons/react/24/solid';
import { useCart } from '@/context/CartContext';
import Chatbot from '@/components/Chatbot';
// Interfaces (giữ nguyên)
interface Category {
  _id: string;
  name: string;
  slug: string;
  image?: string;
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

interface Banner {
  _id: string;
  title: string;
  image: string;
  link?: string;
}

interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage?: string;
  publishedAt: string;
}

interface Brand {
  _id: string;
  name: string;
  logo: string;
  slug: string;
  image?: string;
}

// Dữ liệu tĩnh cho USP
const uspItems = [
  {
    title: 'Hàng chính hãng 100%',
    description: 'Cam kết bảo hành chính hãng, có hóa đơn VAT',
  },
  {
    title: 'Đổi trả 7 ngày',
    description: 'Hoàn tiền hoặc đổi mới nếu sản phẩm lỗi',
  },
  {
    title: 'Giao hàng nhanh',
    description: 'Miễn phí giao hàng toàn quốc (đơn > 5tr)',
  },
  {
    title: 'Bảo hành tận nơi',
    description: 'Đội ngũ kỹ thuật hỗ trợ tại nhà',
  },
];

const HeroCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const images = [
    { src: "/image/20.jpg", alt: "Banner 04" },
    { src: "/image/23.jpg", alt: "Banner 06" },
    { src: "/image/24.jpg", alt: "Banner 07" },
    { src: "/image/25.jpg", alt: "Banner 08" },
    { src: "/image/26.jpg", alt: "Banner 09" },
    { src: "/image/29.jpg", alt: "Banner 10" },
    { src: "/image/28.jpg", alt: "Banner 11" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [images.length]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  return (
    <div className="relative w-full overflow-hidden bg-white">
      <div className="relative w-full aspect-/3 md:aspect-9/3">
        {images.map((image, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-contain"
              priority={idx === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ))}
      </div>
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full p-2 z-10"
      >
        <ChevronLeft size={32} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 text-white rounded-full p-2 z-10"
      >
        <ChevronRight size={32} />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3 h-3 rounded-full transition-all ${
              idx === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const { addToCart } = useCart();

  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState<Product[]>([]);
  const [bestSellingProducts, setBestSellingProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kitchenProducts, setKitchenProducts] = useState<Product[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [beautyProducts, setBeautyProducts] = useState<Product[]>([]);
  const [fanHeaterProducts, setFanHeaterProducts] = useState<Product[]>([]);
  const [entertainmentProducts, setEntertainmentProducts] = useState<Product[]>([]);
  const [cleaningProducts, setCleaningProducts] = useState<Product[]>([]);
  const [dienLanhProducts, setDienLanhProducts] = useState<Product[]>([]);

  // State cho số lượng sản phẩm theo danh mục
  const [categoryProductCount, setCategoryProductCount] = useState<Record<string, number>>({});

  const placeholderImage = (width: number, height: number, text: string) =>
    `https://placehold.co/${width}x${height}/e2e8f0/1e293b?text=${encodeURIComponent(text)}`;

  console.log('fetchData started, API_URL:', API_URL);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const categoriesRes = await axios.get(`${API_URL}/api/categories`);
      const categories = categoriesRes.data;
      setCategories(categories.filter((c: any) => c.isActive !== false).slice(0, 6));

      // Tìm category theo slug
      const cleaningCat = categories.find((c: any) => c.slug === 'don-dep-and-cham-soc-nha-cua');
      const kitchenCat = categories.find((c: any) => c.slug === 'thiet-bi-nha-bep');
      const dienLanhCat = categories.find((c: any) => c.slug === 'dien-lanh');
      const entertainmentCat = categories.find((c: any) => c.slug === 'thiet-bi-giai-tri');
      const beautyCat = categories.find((c: any) => c.slug === 'lam-dep-ca-nhan');
      const fanHeaterCat = categories.find((c: any) => c.slug === 'quat-suoi');

      const [
        productsRes,
        bannersRes,
        postsRes,
        flashSaleRes,
        bestSellingRes,
        brandsRes,
        cleaningRes,
        dienLanhRes,
        kitchenRes,
        entertainmentRes,
        beautyRes,
        fanHeaterRes,
      ] = await Promise.all([
        axios.get(`${API_URL}/api/products?limit=4&sort=-createdAt`),
        axios.get(`${API_URL}/api/banners?position=home`),
        axios.get(`${API_URL}/api/posts?status=published&limit=4`),
        axios.get(`${API_URL}/api/products?flashSale=true&limit=4`),
        axios.get(`${API_URL}/api/products?sort=-sold&limit=4`),
        axios.get(`${API_URL}/api/brands?limit=6`),
        axios.get(`${API_URL}/api/products?category=${cleaningCat?._id || 'don-dep-and-cham-soc-nha-cua'}&limit=10`),
        axios.get(`${API_URL}/api/products?category=${dienLanhCat?._id || 'dien-lanh'}&limit=10`),
        axios.get(`${API_URL}/api/products?category=${kitchenCat?._id || 'thiet-bi-nha-bep'}&limit=10`),
        axios.get(`${API_URL}/api/products?category=${entertainmentCat?._id || 'thiet-bi-giai-tri'}&limit=10`),
        axios.get(`${API_URL}/api/products?category=${beautyCat?._id || 'lam-dep-ca-nhan'}&limit=10`),
        axios.get(`${API_URL}/api/products?category=${fanHeaterCat?._id || 'quat-suoi'}&limit=10`),
      ]);

      const safeArray = (data: any) => {
        let arr = [];
        if (Array.isArray(data)) arr = data;
        else if (data?.products && Array.isArray(data.products)) arr = data.products;
        else if (data?.data && Array.isArray(data.data)) arr = data.data;
        else return [];
        return arr.map((item: any) => ({
          ...item,
          price: Number(item.price) || 0,
          priceOld: item.priceOld ? Number(item.priceOld) : undefined,
          discount: Number(item.discount) || 0,
          stock: Number(item.stock) || 0,
          sold: Number(item.sold) || 0,
          rating: Number(item.rating) || 0,
        }));
      };

      // Mảng sản phẩm để hiển thị (giới hạn 10)
      const cleaningArray = safeArray(cleaningRes.data);
      const kitchenArray = safeArray(kitchenRes.data);
      const dienLanhArray = safeArray(dienLanhRes.data);
      const entertainmentArray = safeArray(entertainmentRes.data);
      const beautyArray = safeArray(beautyRes.data);
      const fanHeaterArray = safeArray(fanHeaterRes.data);

      // --- TÍNH SỐ LƯỢNG THỰC TẾ TỪ API (trường total) ---
      const countMap: Record<string, number> = {};
      if (cleaningCat) countMap[cleaningCat._id] = cleaningRes.data.total || 0;
      if (kitchenCat) countMap[kitchenCat._id] = kitchenRes.data.total || 0;
      if (dienLanhCat) countMap[dienLanhCat._id] = dienLanhRes.data.total || 0;
      if (entertainmentCat) countMap[entertainmentCat._id] = entertainmentRes.data.total || 0;
      if (beautyCat) countMap[beautyCat._id] = beautyRes.data.total || 0;
      if (fanHeaterCat) countMap[fanHeaterCat._id] = fanHeaterRes.data.total || 0;
      setCategoryProductCount(countMap);
      // -------------------------------------------------

      // Gán state sản phẩm (10 sản phẩm hiển thị)
      setCleaningProducts(cleaningArray);
      setKitchenProducts(kitchenArray);
      setDienLanhProducts(dienLanhArray);
      setEntertainmentProducts(entertainmentArray);
      setBeautyProducts(beautyArray);
      setFanHeaterProducts(fanHeaterArray);

      setFeaturedProducts(productsRes.data.products || productsRes.data.slice(0, 4));
      setBanners(bannersRes.data);
      setPosts(postsRes.data.posts || postsRes.data);
      setFlashSaleProducts(flashSaleRes.data.products || flashSaleRes.data.slice(0, 4));
      setBestSellingProducts(bestSellingRes.data.products || bestSellingRes.data.slice(0, 4));
      setBrands(brandsRes.data.slice(0, 6));
      setFlashSaleEndTime(flashSaleRes.data.endTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString());

    } catch (err) {
      console.error('Lỗi tải dữ liệu trang chủ:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [API_URL]);

   const handleBuyNow = (productId: string) => {
    addToCart(productId, 1);
    router.push(`/checkout?selected=${productId}`);
  };

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
        <div className="bg-red-600 text-white rounded-lg w-12 h-12 flex flex-col justify-center items-center">
          <span className="text-xl font-bold">{timeLeft.hours}</span>
          <span className="text-xs">Giờ</span>
        </div>
        <div className="bg-red-600 text-white rounded-lg w-12 h-12 flex flex-col justify-center items-center">
          <span className="text-xl font-bold">{timeLeft.minutes}</span>
          <span className="text-xs">Phút</span>
        </div>
        <div className="bg-red-600 text-white rounded-lg w-12 h-12 flex flex-col justify-center items-center">
          <span className="text-xl font-bold">{timeLeft.seconds}</span>
          <span className="text-xs">Giây</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <p className="text-center text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <p className="text-center text-red-500 dark:text-red-400">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <HeroCarousel />

  
{/* Flash Sale Section - Thiết kế chuẩn UI/UX */}
<section className="py-8">
  <div className="max-w-412 mx-auto px-12 bg-linear-to-r from-red-600 via-pink-600 to-orange-500 dark:from-red-800 dark:via-pink-800 dark:to-orange-800 rounded-xl pb-14">
    {/* Header giữ nguyên */}
    <div className="flex flex-wrap items-center justify-between mb-9">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-6xl animate-pulse">🔥</span>
          <h2 className="text-4xl font-bold text-gray-800 dark:text-white">FLASH SALE</h2>
        </div>
        {flashSaleEndTime && (
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg">
            <CountdownTimer endTime={flashSaleEndTime} />
          </div>
        )}
      </div>
      <Link
        href="/flash-sale"
        className="bg-white text-red-600 font-semibold px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-md"
      >
        Xem tất cả →
      </Link>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {flashSaleProducts.map((product) => (
        <div
          key={product._id}
          className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700 flex flex-col h-full"
        >
          <Link href={`/products/${product.slug || product._id}`} className="block">
            <div className="relative h-48 mb-4 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
             {product.discount != null && product.discount > 0 &&  (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                  -{product.discount}%
                </div>
              )}
              <Image
                src={product.images?.[0] || placeholderImage(300, 300, product.name)}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition duration-500"
                unoptimized
              />
            </div>
          </Link>
          <div className="flex-1 flex flex-col">
            <Link href={`/products/${product.slug || product._id}`}>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-12 hover:text-blue-600 transition">
                {product.name}
              </h3>
            </Link>
            <div className="flex items-baseline gap-2 mb-3">
              <p className="text-red-600 dark:text-red-400 font-bold text-xl">
                {product.price.toLocaleString('vi-VN')}đ
              </p>
              {product.priceOld && (
                <p className="text-gray-400 line-through text-xs">
                  {product.priceOld.toLocaleString('vi-VN')}đ
                </p>
              )}
            </div>
            <button
              onClick={() => handleBuyNow(product._id)}
              className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <ShoppingCartIcon className="w-5 h-5" />
              MUA NGAY
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>



{/* Banner quảng cáo */}
<section className="py-1">
  <div className="max-w-420 mx-auto px-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {/* Banner 1 */}
        <div className="w-full h-55 relative">
          <Image
            src="/image/37.jpg"
            alt="Banner 1"
            fill
            className="object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
          />
        </div>

        {/* Banner 2 */}
        <div className="w-full h-55 relative">
          <Image
            src="/image/38.jpg"
            alt="Banner 2"
            fill
            className="object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
          />
        </div>

        {/* Banner 3 */}
        <div className="w-full h-55 relative">
          <Image
            src="/image/39.jpg"
            alt="Banner 3"
            fill
            className="object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
          />
        </div>
    </div>
  </div>
</section>

   {/* Danh mục nổi bật - Phong cách Flash Sale */}
<section className="py-12">
  <div className="max-w-412.5 mx-auto px-12 bg-linear-to-r from-red-600 via-pink-600 to-orange-500 dark:from-red-800 dark:via-pink-800 dark:to-orange-800 rounded-xl pb-13">
    {/* Header */}
   <div className="flex flex-col md:flex-row justify-between items-center mb-10">
  <h2 className="mt-3 text-2xl md:text-3xl font-bold text-white tracking-wide drop-shadow-md">
    DANH MỤC NỔI BẬT
  </h2>
</div>

    {/* Grid danh mục */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-6">
  {categories.map((cat) => (
    <Link
      key={cat._id}
      href={`/categories/${cat.slug}`}
      className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] hover:border-2 hover:border-yellow-300 border-2 border-transparent"
    >
      {/* Ảnh danh mục */}
      <div className="relative h-48 mb-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        <Image
          src={cat.image || placeholderImage(300, 600, cat.name)}
          alt={cat.name}
          fill
          unoptimized
          className="object-cover group-hover:scale-110 transition duration-500"
        />
      </div>
      {/* Nội dung card */}
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">
          {cat.name}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
  {categoryProductCount[cat._id] || 0} sản phẩm
</p>
        <span className="inline-block bg-linear-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-lg font-semibold group-hover:from-orange-600 group-hover:to-red-600 transition text-sm">
          Xem sản phẩm
        </span>
      </div>
    </Link>
  ))}
</div>
  </div>
</section>
        
       {/*banner */}
      <section className="py-0 bg-white dark:bg-gray-800">
        <div className="max-w-432 mx-auto px-9">
    <div className="block w-full">
      <Image
        src="/image/41.jpg"   // thay bằng ảnh thương hiệu của bạn
        alt="Thương hiệu"
        width={2000}
        height={2500}
        className="w-full h-auto object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
        priority={false}
      />
    </div>
  </div>
</section>


 {/* Dọn dẹp & chăm sóc nhà cửa, dụng cụ nhà bếp */}
     <section className="py-0">
  <div className="max-w-414 mx-auto px-0">
    <div className="bg-linear-to-r from-blue-800 via-white-300 to-blue-800 rounded-xl pb-8">
      <div className="flex flex-wrap items-center justify-end mb-4 pt-4 pr-4">
        <Link
          href="/categories/don-dep-and-cham-soc-nha-cua"
          className="bg-white text-red-600 font-semibold px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-md"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-5 px-4 pb-4">
        {(() => {
          const combined = [...cleaningProducts, ...kitchenProducts];
          const uniqueProducts = combined.filter(
            (product, index, self) => index === self.findIndex(p => p._id === product._id)
          );
          return uniqueProducts.slice(0, 10).map((product) => (
            <div
              key={product._id}
              className="group bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700 flex flex-col h-full"
            >
              <Link href={`/products/${product.slug || product._id}`} className="block">
                <div className="relative h-48 mb-4 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                  {product.discount != null && product.discount > 0 && ( 
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                      -{product.discount}%
                    </div>
                  )}
                  <Image
                    src={product.images?.[0] || placeholderImage(300, 300, product.name)}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-110 transition duration-500"
                    unoptimized
                  />
                </div>
              </Link>
              <div className="flex-1 flex flex-col">
                <Link href={`/products/${product.slug || product._id}`}>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-12 hover:text-blue-600 transition">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-baseline gap-2 mb-3">
                  <p className="text-red-600 dark:text-red-400 font-bold text-xl">
                    {product.price.toLocaleString('vi-VN')}đ
                  </p>
                  {product.priceOld && (
                    <p className="text-gray-400 line-through text-xs">
                      {product.priceOld.toLocaleString('vi-VN')}đ
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleBuyNow(product._id)}
                  className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  MUA NGAY
                </button>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  </div>
</section>


<section className="py-9 bg-white dark:bg-gray-800"></section>
          <section className="py-0 bg-white dark:bg-gray-800">
        <div className="max-w-432 mx-auto px-9">
    <div className="block w-full">
      <Image
        src="/image/32.jpg"   // thay bằng ảnh thương hiệu của bạn
        alt="Thương hiệu"
        width={2000}
        height={1000}
        className="w-full h-auto object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
        priority={false}
      />
    </div>
  </div>
</section>

 {/* Điện lạnh & Thiết bị giải trí */}
<section className="py-0">
  <div className="max-w-415 mx-auto px-0">
    <div className="bg-linear-to-r from-emerald-100 via-white to-sky-800 rounded-xl pb-8">
      <div className="flex flex-wrap items-center justify-end mb-5 pt-4 pr-4">
        <Link
          href="/categories/dien-lanh"
          className="bg-white text-red-600 font-semibold px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-md"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-5 px-4 pb-4">
        {(() => {
          const combined = [...dienLanhProducts, ...entertainmentProducts];
          const uniqueProducts = combined.filter(
            (product, index, self) => index === self.findIndex(p => p._id === product._id)
          );
          return uniqueProducts.slice(0, 10).map((product) => {
            return (
              <div
                key={product._id}
                className="group bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700 flex flex-col h-full"
              >
                <Link href={`/products/${product.slug || product._id}`} className="block">
                  <div className="relative h-48 mb-4 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        -{product.discount}%
                      </div>
                    )}
                    <Image
                      src={product.images?.[0] || placeholderImage(300, 300, product.name)}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition duration-500"
                      unoptimized
                    />
                  </div>
                </Link>
                <div className="flex-1 flex flex-col">
                  <Link href={`/products/${product.slug || product._id}`}>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-12 hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-red-600 dark:text-red-400 font-bold text-xl">
                      {product.price.toLocaleString('vi-VN')}đ
                    </p>
                    {product.priceOld && (
                      <p className="text-gray-400 line-through text-xs">
                        {product.priceOld.toLocaleString('vi-VN')}đ
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleBuyNow(product._id)}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1 text-sm shadow-md shrink-0"
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                    MUA NGAY
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  </div>
</section>

{/* banner 03 */}
           <section className="py-9 bg-white dark:bg-gray-800"></section>
             <section className="py-0 bg-white dark:bg-gray-800">
        <div className="max-w-432 mx-auto px-9">
    <div className="block w-full">
      <Image
        src="/image/42.jpg"   // thay bằng ảnh thương hiệu của bạn
        alt="Thương hiệu"
        width={2000}
        height={2500}
        className="w-full h-auto object-cover rounded-lg shadow-md hover:shadow-xl transition-shadow"
        priority={false}
      />
    </div>
  </div>
</section>
{/*làm đẹp */}
<section className="py-0">
  <div className="max-w-414 mx-auto px-0">
    <div className="bg-linear-to-r from-pink-700 via-pink-500 to-pink-700 rounded-xl pb-8">
      <div className="flex flex-wrap items-center justify-end mb-5 pt-4 pr-4">
        <Link
          href="/categories/lam-dep-ca-nhan"
          className="bg-white text-red-600 font-semibold px-7 py-3 rounded-full hover:bg-gray-100 transition shadow-md"
        >
          Xem tất cả →
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-5 px-4 pb-4">
        {(() => {
          const combined = [...beautyProducts, ...fanHeaterProducts];
          const uniqueProducts = combined.filter(
            (product, index, self) => index === self.findIndex(p => p._id === product._id)
          );
          return uniqueProducts.slice(0, 10).map((product) => {
            return (
              <div
                key={product._id}
                className="group bg-white dark:bg-gray-800 rounded-xl p-3 shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] border border-gray-200 dark:border-gray-700 flex flex-col h-full"
              >
                <Link href={`/products/${product.slug || product._id}`} className="block">
                  <div className="relative h-48 mb-4 bg-gray-100 dark:bg-gray-600 rounded-lg overflow-hidden">
                    {product.discount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                        -{product.discount}%
                      </div>
                    )}
                    <Image
                      src={product.images?.[0] || placeholderImage(300, 300, product.name)}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-110 transition duration-500"
                      unoptimized
                    />
                  </div>
                </Link>
                <div className="flex-1 flex flex-col">
                  <Link href={`/products/${product.slug || product._id}`}>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-1 line-clamp-2 min-h-12 hover:text-blue-600 transition">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mb-3">
                    <p className="text-red-600 dark:text-red-400 font-bold text-xl">
                      {product.price.toLocaleString('vi-VN')}đ
                    </p>
                    {product.priceOld && (
                      <p className="text-gray-400 line-through text-xs">
                        {product.priceOld.toLocaleString('vi-VN')}đ
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleBuyNow(product._id)}
                    className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-lg transition flex items-center justify-center gap-1 text-sm shadow-md shrink-0"
                  >
                    <ShoppingCartIcon className="w-4 h-4" />
                    MUA NGAY
                  </button>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  </div>
</section>

  {/* Lý do chọn chúng tôi (USP) */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">
            TẠI SAO CHỌN HOMITECH?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {uspItems.map((item, idx) => (
              <div key={idx} className="text-center">
                <h3 className="font-bold text-xl text-gray-800 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


{/* Banner ưu đãi thanh toán - 8 ảnh khác nhau chạy từ trái sang phải */}
<section className="py-6 bg-white dark:bg-gray-900">
  <div className="max-w-420 mx-auto px-4">
    <div className="flex items-center gap-2 mb-6">
      <CreditCardIcon className="w-8 h-8 text-blue-600" />
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Ưu đãi khi thanh toán</h2>
    </div>
    <div className="relative overflow-hidden w-full">
      {/* Một container duy nhất chứa 16 ảnh với gap đều */}
      <div className="flex animate-marquee gap-4">
        {/* 8 ảnh gốc */}
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck01.jpg" alt="Ưu đãi 1" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck02.jpg" alt="Ưu đãi 2" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck03.jpg" alt="Ưu đãi 3" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck04.jpg" alt="Ưu đãi 4" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck05.jpg" alt="Ưu đãi 5" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck06.jpg" alt="Ưu đãi 6" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck07.jpg" alt="Ưu đãi 7" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck08.jpg" alt="Ưu đãi 8" fill className="object-cover" />
        </div>

        {/* 8 ảnh copy (giống hệt) */}
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck01.jpg" alt="Ưu đãi 1" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck02.jpg" alt="Ưu đãi 2" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck03.jpg" alt="Ưu đãi 3" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck04.jpg" alt="Ưu đãi 4" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck05.jpg" alt="Ưu đãi 5" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck06.jpg" alt="Ưu đãi 6" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck07.jpg" alt="Ưu đãi 7" fill className="object-cover" />
        </div>
        <div className="w-100 h-50 relative rounded-lg overflow-hidden shadow-md shrink-0">
          <Image src="/image/ck08.jpg" alt="Ưu đãi 8" fill className="object-cover" />
        </div>
      </div>
    </div>
  </div>

  {/* CSS animation */}
  <style jsx>{`
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      animation: marquee 30s linear infinite;
      width: fit-content;
    }
    .animate-marquee:hover {
      animation-play-state: paused;
    }
  `}</style>
</section>




      {/* Tin tức & Khuyến mãi - Phong cách Flash Sale */}
{posts.length > 0 && (
  <section className="py-8">
  <div className="max-w-412.5 mx-auto px-12 bg-linear-to-r from-red-600 via-pink-600 to-orange-500 dark:from-red-800 dark:via-pink-800 dark:to-orange-800 rounded-xl pb-13">   {/* Thêm pb-8 */}
      {/* Header với hiệu ứng pulse */}
       <div className="flex flex-col md:flex-row justify-between items-center mb-10"></div>
      <h2 className="text-4xl font-bold text-white text-center mb-12 drop-shadow-lg">
        TIN TỨC & KHUYẾN MÃI
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {posts.map((post) => (
          <Link
            key={post._id}
            href={`/tin-tuc/${post.slug}`}
            className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-yellow-300"
          >
            <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {post.featuredImage ? (
                <Image
                  src={post.featuredImage}
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2 line-clamp-2">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-3">
                  {post.excerpt}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.publishedAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="text-center mt-8">
        <Link
          href="/tin-tuc"
          className="inline-block px-6 py-3 bg-linear-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition font-semibold shadow-lg"
        >
          Xem tất cả bài viết
        </Link>
      </div>
    </div>
  </section>
)}
      {/* Đánh giá khách hàng */}
      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white text-center mb-12">
            KHÁCH HÀNG NÓI GÌ VỀ CHÚNG TÔI
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm dark:shadow-gray-700">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                    <Image
                      src={placeholderImage(100, 100, i === 1 ? 'A' : 'B')}
                      alt={`Khách hàng ${i}`}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">
                      {i === 1 ? 'Nguyễn Văn A' : 'Trần Thị B'}
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 italic">
                  {i === 1
                    ? '"Chất lượng sản phẩm tuyệt vời, giao hàng nhanh chóng. Tôi rất hài lòng!"'
                    : '"Giá cả cạnh tranh, nhân viên tư vấn nhiệt tình. Sẽ ủng hộ dài lâu."'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Chatbot />
    </main>
  );
}