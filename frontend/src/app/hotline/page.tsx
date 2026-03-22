'use client';

import {
  Phone,
  Mail,
  Clock,
  MapPin,
  Facebook,
  MessageCircle,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

export default function HotlinePage() {
  // Thông tin liên hệ
  const contactInfo = [
    {
      icon: Phone,
      title: 'Số điện thoại',
      content: '1900 1234',
      description: 'Hỗ trợ 24/7',
      action: 'tel:19001234' as const,
    },
    {
      icon: Mail,
      title: 'Email',
      content: 'support@dienstore.vn',
      description: 'Phản hồi trong 24h',
      action: 'mailto:support@dienstore.vn' as const,
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      content: 'Thứ 2 - Thứ 7: 8:00 - 21:00',
      description: 'Chủ nhật: 9:00 - 17:00',
    },
    {
      icon: MapPin,
      title: 'Địa chỉ',
      content: '123 Điện Biên Phủ, Quận 3, TP.HCM',
      description: 'Văn phòng chính',
    },
  ];

  const faqs = [
    {
      q: 'Làm sao để đặt hàng?',
      a: 'Bạn có thể đặt hàng trực tiếp trên website hoặc gọi hotline 1900 1234 để được hỗ trợ.',
    },
    {
      q: 'Chính sách đổi trả như thế nào?',
      a: 'Sản phẩm được đổi trả trong vòng 7 ngày nếu có lỗi từ nhà sản xuất.',
    },
    {
      q: 'Thời gian giao hàng bao lâu?',
      a: 'Giao hàng nội thành trong 24h, ngoại thành từ 2-3 ngày làm việc.',
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 dark:text-white mb-4">
            Trung tâm hỗ trợ khách hàng
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {contactInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition p-6 text-center group"
              >
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition">
                  <Icon className="w-8 h-8 text-blue-600 dark:text-blue-300 group-hover:text-white" />
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{item.title}</h3>
                <p className="text-lg font-medium text-blue-600 dark:text-blue-400 mb-1">{item.content}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{item.description}</p>
                {item.action && (
                  <Link
                    href={item.action}
                    className="inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Liên hệ ngay →
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{faq.q}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-6">Hoặc liên hệ qua các kênh khác:</p>
          <div className="flex justify-center gap-8">
            <Link
              href="#"
              className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition"
            >
              <Facebook className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-medium">Facebook</span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition"
            >
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-medium">Zalo</span>
            </Link>
            <Link
              href="#"
              className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 transition"
            >
              <MessageCircle className="w-8 h-8 text-blue-500" />
              <span className="text-sm font-medium">Messenger</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}