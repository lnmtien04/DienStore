'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, CreditCardIcon, BanknotesIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

// Interfaces
interface Shipper {
  _id: string;
  name: string;
  description?: string;
  shippingFee: number;
}

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usedCount: number;
  applicableProducts?: string[];
  applicableCategories?: string[];
  isActive: boolean;
  name?: string;
}

type CartItem = {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    stock: number;
  };
  quantity: number;
};

export default function CheckoutPage() {
  const { cart, loading: cartLoading, clearCart, removeFromCart } = useCart();
  const { user, token } = useUser();
  const isAdmin = user?.roles?.includes('admin') ?? false;
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
  });

  const paymentMethods = [
    { id: 'cod', name: 'COD', description: 'Thanh toán khi nhận hàng', icon: BanknotesIcon },
    { id: 'bank_transfer', name: 'Chuyển khoản', description: 'Chuyển khoản ngân hàng', icon: CreditCardIcon },
    { id: 'momo', name: 'Ví MoMo', description: 'Thanh toán qua ví MoMo', icon: DevicePhoneMobileIcon },
  ];
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [selectedShipper, setSelectedShipper] = useState<string>('');
  const [shippingFee, setShippingFee] = useState(0);
  const [loadingShippers, setLoadingShippers] = useState(false);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  // Tự động điền thông tin user
  useEffect(() => {
    if (user) {
      setShippingAddress({
        fullName: user.fullName || '',
        phone: user.phoneNumber || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Lọc sản phẩm từ URL và kiểm tra tính hợp lệ
  useEffect(() => {
    if (!cart?.items) {
      setCheckoutItems([]);
      return;
    }

    const selectedParam = searchParams.get('selected');
    let itemsToCheckout: CartItem[] = [];

    if (selectedParam) {
      const selectedIds = selectedParam.split(',').filter(Boolean);
      itemsToCheckout = cart.items.filter(item =>
        selectedIds.includes(item.product._id)
      );
    } else {
      itemsToCheckout = [...cart.items];
    }

    const validItems = itemsToCheckout.filter(item => 
      item.product && item.product._id && typeof item.product._id === 'string' && item.product._id.length > 0
    );

    if (validItems.length !== itemsToCheckout.length) {
      console.warn('Các sản phẩm không hợp lệ đã bị loại bỏ:', itemsToCheckout.filter(item => !validItems.includes(item)));
      toast.error('Một số sản phẩm không hợp lệ đã bị loại khỏi danh sách thanh toán.');
      
      const invalidItems = itemsToCheckout.filter(item => !validItems.includes(item));
      invalidItems.forEach(item => {
        if (item.product?._id) {
          removeFromCart(item.product._id);
        }
      });
    }

    setCheckoutItems(validItems);
  }, [cart, searchParams, removeFromCart]);

  const checkoutSubtotal = useMemo(() => {
    return checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [checkoutItems]);

  const checkoutItemCount = checkoutItems.length;

  // Lấy danh sách shipper
  useEffect(() => {
   const fetchShippers = async () => {
  setLoadingShippers(true);
  try {
    const res = await axios.get(`${API_URL}/api/shippers`);
    // Chuyển đổi dữ liệu từ API (defaultFee) sang shippingFee
    const formattedShippers = res.data.map((s: any) => ({
      _id: s._id,
      name: s.name,
      description: s.description,
      shippingFee: s.defaultFee ?? 0, // 👈 lấy từ defaultFee
    }));
    setShippers(formattedShippers);
    if (formattedShippers.length > 0) {
      setSelectedShipper(formattedShippers[0]._id);
      setShippingFee(formattedShippers[0].shippingFee);
    }
  } catch (error) {
    console.error('Lỗi tải shipper:', error);
  } finally {
    setLoadingShippers(false);
  }
};
    fetchShippers();
  }, [API_URL]);

  // Cập nhật phí ship khi chọn shipper
  useEffect(() => {
    const shipper = shippers.find(s => s._id === selectedShipper);
    setShippingFee(shipper?.shippingFee ?? 0);
  }, [selectedShipper, shippers]);

  // Lấy coupon
  useEffect(() => {
    const fetchCoupons = async () => {
      setLoadingCoupons(true);
      try {
        const res = await axios.get(`${API_URL}/api/coupons/available`);
        setCoupons(res.data);
      } catch (error) {
        console.error('Lỗi tải coupon:', error);
      } finally {
        setLoadingCoupons(false);
      }
    };
    fetchCoupons();
  }, [API_URL]);

  // Tính giảm giá
  const discountAmount = useMemo(() => {
    if (!selectedCoupon) return 0;
    const base = checkoutSubtotal + shippingFee;
    let discount = 0;
    if (selectedCoupon.discountType === 'percentage') {
      discount = base * (selectedCoupon.discountValue / 100);
      if (selectedCoupon.maxDiscountAmount && discount > selectedCoupon.maxDiscountAmount) {
        discount = selectedCoupon.maxDiscountAmount;
      }
    } else {
      discount = Math.min(selectedCoupon.discountValue, base);
    }
    return discount;
  }, [selectedCoupon, checkoutSubtotal, shippingFee]);

  const finalTotal = checkoutSubtotal + shippingFee - discountAmount;

  // Kiểm tra đăng nhập
  useEffect(() => {
    if (!user) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isAdmin) {
      toast.error('Hãy chọn tài khoản khách hàng nhé! ahihi');
      return;
    }

    if (!user || !cart) {
      toast.error('Vui lòng đăng nhập và kiểm tra giỏ hàng');
      return;
    }

    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      toast.error('Vui lòng nhập đầy đủ thông tin giao hàng');
      return;
    }

    if (!selectedShipper) {
      toast.error('Vui lòng chọn phương thức vận chuyển');
      return;
    }

    const validItems = checkoutItems.filter(item => item.product && item.product._id);
    if (validItems.length === 0) {
      toast.error('Không có sản phẩm hợp lệ để thanh toán');
      return;
    }

    const payload = {
      items: validItems.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
      })),
      shippingAddress: {
        fullName: shippingAddress.fullName,
        phone: shippingAddress.phone,
        address: shippingAddress.address,
      },
      paymentMethod,
      shippingMethod: selectedShipper,
      shippingFee,
      couponCode: selectedCoupon?.code,
      discountAmount,
      notes,
    };

    console.log('📦 Payload gửi lên:', payload);

    setSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/api/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await clearCart();
      toast.success('Đặt hàng thành công!');
      router.push(`/orders/${res.data._id}`);
    } catch (error: any) {
      console.error('❌ Lỗi đặt hàng:', error);
      console.error('Response data:', error.response?.data);
      toast.error(error.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  if (cartLoading) {
    return <div className="text-center py-10">Đang tải...</div>;
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Không có sản phẩm nào để thanh toán.</p>
        <button onClick={() => router.push('/cart')} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Quay lại giỏ hàng
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center mb-6">
          <button onClick={() => router.back()} className="mr-4 text-gray-600 dark:text-gray-300 hover:text-blue-600">
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Thanh toán</h1>
        </div>

        {/* Thông báo admin */}
        {isAdmin && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">⚠️ Tài khoản admin không được phép đặt hàng.</p>
            <p>Vui lòng đăng nhập bằng tài khoản khách hàng để tiếp tục. (Hãy chọn tài khoản khách hàng nhé! ahihi)</p>
          </div>
        )}

        {!isAdmin ? (
          <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cột trái */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin giao hàng */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Thông tin giao hàng</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Người nhận *</label>
                    <input
                      type="text"
                      value={shippingAddress.fullName}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Địa chỉ chi tiết *</label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                      placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* HomiTech Voucher */}
<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
  <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">HomiTech Voucher</h2>
  {loadingCoupons ? (
    <p className="text-gray-500">Đang tải...</p>
  ) : coupons.length === 0 ? (
    <p className="text-gray-500">Hiện chưa có voucher nào.</p>
  ) : (
    <div className="space-y-3">
      {coupons.map((coupon) => {
        const isSelected = selectedCoupon?._id === coupon._id;
        return (
          <div key={coupon._id}>
            {/* Radio thật – ẩn đi */}
            <input
              type="radio"
              name="coupon"
              id={`coupon-${coupon._id}`}
              checked={isSelected}
              onChange={() => {}} // không dùng, tránh warning
              className="hidden"
            />
            {/* Label tùy chỉnh */}
            <label
              htmlFor={`coupon-${coupon._id}`}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              onClick={(e) => {
                e.preventDefault(); // ngăn chặn hành vi mặc định của label
                if (isSelected) {
                  setSelectedCoupon(null); // bỏ chọn
                } else {
                  setSelectedCoupon(coupon); // chọn mới
                }
              }}
            >
              {/* Radio giả (hình tròn) */}
              <span
                className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                  isSelected ? 'border-blue-500' : 'border-gray-400'
                }`}
              >
                {isSelected && <span className="w-2 h-2 rounded-full bg-blue-500" />}
              </span>

              {/* Nội dung voucher */}
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-800 dark:text-white">
                    {coupon.code} {coupon.description ? `- ${coupon.description}` : ''}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {coupon.discountType === 'percentage'
                      ? `Giảm ${coupon.discountValue}%`
                      : `Giảm ${coupon.discountValue.toLocaleString('vi-VN')}đ`}
                  </span>
                </div>
                {coupon.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{coupon.description}</p>
                )}
                <p className="text-xs text-blue-600">✓ Giảm giá đơn hàng</p>
                {coupon.minOrderAmount > 0 && (
                  <p className="text-xs text-gray-400">
                    Đơn tối thiểu {coupon.minOrderAmount.toLocaleString('vi-VN')}đ
                  </p>
                )}
                {coupon.maxDiscountAmount && coupon.discountType === 'percentage' && (
                  <p className="text-xs text-gray-400">
                    Giảm tối đa {coupon.maxDiscountAmount.toLocaleString('vi-VN')}đ
                  </p>
                )}
              </div>
            </label>
          </div>
        );
      })}
    </div>
  )}
</div>

              {/* Phương thức vận chuyển */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Phương thức vận chuyển</h2>
                {loadingShippers ? (
                  <p className="text-gray-500">Đang tải...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {shippers.map((shipper) => (
                      <label
                        key={shipper._id}
                        className={`flex items-start p-3 border rounded-lg cursor-pointer transition ${
                          selectedShipper === shipper._id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="shipper"
                          value={shipper._id}
                          checked={selectedShipper === shipper._id}
                          onChange={(e) => setSelectedShipper(e.target.value)}
                          className="mt-1 h-4 w-4 text-blue-600"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-800 dark:text-white">{shipper.name}</span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                              {(shipper.shippingFee ?? 0).toLocaleString('vi-VN')}đ
                            </span>
                          </div>
                          {shipper.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">{shipper.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Phương thức thanh toán */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Phương thức thanh toán</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {paymentMethods.map((method) => {
                    const Icon = method.icon;
                    return (
                      <label
                        key={method.id}
                        className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition ${
                          paymentMethod === method.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <Icon className="h-8 w-8 mb-2 text-gray-700 dark:text-gray-300" />
                        <span className="font-medium text-gray-800 dark:text-white">{method.name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">
                          {method.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Cột phải */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-20">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Đơn hàng của bạn</h2>
                <div className="max-h-96 overflow-y-auto mb-4">
                  {checkoutItems.map((item) => (
                    <div key={item.product._id} className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden shrink-0">
                        {item.product.images?.[0] && (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            width={64}
                            height={64}
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 dark:text-white truncate">{item.product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity} x {item.product.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        {(item.quantity * item.product.price).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tổng kết */}
                <div className="space-y-2 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Tạm tính ({checkoutItemCount} sản phẩm):</span>
                    <span className="font-medium">{checkoutSubtotal.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Phí vận chuyển:</span>
                    <span className="font-medium">{(shippingFee ?? 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Giảm giá:</span>
                      <span>-{discountAmount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600 dark:text-blue-400">{finalTotal.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                </div>

                {/* Nút ĐẶT HÀNG */}
                <button
                  type="submit"
                  disabled={submitting || checkoutItems.length === 0}
                  className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-blue-300 transition"
                  style={{ position: 'relative', zIndex: 10 }}
                >
                  {submitting ? 'Đang xử lý...' : `Đặt hàng (${checkoutItems.length} sản phẩm)`}
                </button>
              </div>
            </div>
          </form>
        ) : (
          // Hiển thị khi là admin
          <div className="bg-yellow-100 p-8 rounded-lg text-center">
            <p className="text-xl mb-2">🚫 Tính năng đặt hàng không dành cho admin.</p>
            <p className="text-gray-700">Hãy chọn tài khoản khách hàng nhé! ahihi</p>
          </div>
        )}
      </div>
    </div>
  );
}