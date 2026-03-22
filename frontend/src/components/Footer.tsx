import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-8 dark:bg-gray-900">
      {/* Banner full width - chiều cao 70% màn hình */}
      <div className="relative w-full h-[78vh]">
        <Image
          src="/image/bannerduoi02.jpg"
          alt="Footer Banner"
          fill
          className="object-cover"
           priority 
        />
      </div>
      
      {/* Phần chữ copyright */}
      <div className="container mx-auto text-center py-6">
        <p className="dark:text-gray-300">&copy; 2026 HomiTech. All rights reserved.</p>
      </div>
    </footer>
  );
}