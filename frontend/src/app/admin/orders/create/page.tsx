'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Customer {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  address?: string;
}

interface Product {
  _id: string;
  name: string;
  price: number;
  stock: number;
  images: string[];
}

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

// Dữ liệu mẫu cho tỉnh/thành (có thể thay bằng API thật)
const provinces = [
  { code: '01', name: 'Hà Nội' },
  { code: '02', name: 'Hồ Chí Minh' },
  { code: '03', name: 'Đà Nẵng' },
  { code: '04', name: 'Hải Phòng' },
  { code: '05', name: 'Cần Thơ' },
];

// Dữ liệu mẫu cho quận/huyện (theo tỉnh)
const districtsByProvince: Record<string, { code: string; name: string }[]> = {
  '01': [
    { code: '001', name: 'Ba Đình' },
    { code: '002', name: 'Hoàn Kiếm' },
    { code: '003', name: 'Tây Hồ' },
  ],
  '02': [
    { code: '004', name: 'Quận 1' },
    { code: '005', name: 'Quận 3' },
    { code: '006', name: 'Quận 5' },
  ],
  '03': [
    { code: '007', name: 'Hải Châu' },
    { code: '008', name: 'Thanh Khê' },
    { code: '009', name: 'Sơn Trà' },
  ],
  '04': [
    { code: '010', name: 'Hồng Bàng' },
    { code: '011', name: 'Lê Chân' },
  ],
  '05': [
    { code: '012', name: 'Ninh Kiều' },
    { code: '013', name: 'Cái Răng' },
  ],
};

// Dữ liệu mẫu cho phường/xã (theo quận)
const wardsByDistrict: Record<string, { code: string; name: string }[]> = {
  '001': [
    { code: '00001', name: 'Phường Điện Biên' },
    { code: '00002', name: 'Phường Đội Cấn' },
  ],
  '002': [
    { code: '00003', name: 'Phường Hàng Trống' },
    { code: '00004', name: 'Phường Hàng Bài' },
  ],
  '003': [
    { code: '00005', name: 'Phường Yên Phụ' },
    { code: '00006', name: 'Phường Quảng An' },
  ],
  '004': [
    { code: '00007', name: 'Phường Bến Nghé' },
    { code: '00008', name: 'Phường Bến Thành' },
  ],
  '005': [
    { code: '00009', name: 'Phường 1' },
    { code: '00010', name: 'Phường 2' },
    { code: '00011', name: 'Phường 3' },
  ],
  '006': [
    { code: '00012', name: 'Phường 4' },
    { code: '00013', name: 'Phường 5' },
  ],
  '007': [
    { code: '00014', name: 'Phường Hải Châu 1' },
    { code: '00015', name: 'Phường Hải Châu 2' },
  ],
  '008': [
    { code: '00016', name: 'Phường Thanh Khê Tây' },
    { code: '00017', name: 'Phường Thanh Khê Đông' },
  ],
  '009': [
    { code: '00018', name: 'Phường An Hải Bắc' },
    { code: '00019', name: 'Phường An Hải Nam' },
  ],
  '010': [
    { code: '00020', name: 'Phường Hạ Lý' },
    { code: '00021', name: 'Phường Hoàng Văn Thụ' },
  ],
  '011': [
    { code: '00022', name: 'Phường Cát Dài' },
    { code: '00023', name: 'Phường An Biên' },
  ],
  '012': [
    { code: '00024', name: 'Phường An Khánh' },
    { code: '00025', name: 'Phường An Hòa' },
  ],
  '013': [
    { code: '00026', name: 'Phường Phú Thứ' },
    { code: '00027', name: 'Phường Tân Phú' },
  ],
};

export default function CreateOrderPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);

  // State cho địa chỉ
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [districts, setDistricts] = useState<{ code: string; name: string }[]>([]);
  const [wards, setWards] = useState<{ code: string; name: string }[]>([]);

  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // State cho phương thức thanh toán từ settings
  const [paymentMethods, setPaymentMethods] = useState<{
    cod: boolean;
    bankTransfer: boolean;
    momo: boolean;
    zalopay: boolean;
  }>({
    cod: true,
    bankTransfer: true,
    momo: true,
    zalopay: false,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const { token } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Kiểm tra token
  useEffect(() => {
    if (!token) {
      alert('Vui lòng đăng nhập lại');
      router.push('/auth/login');
    }
  }, [token, router]);

  // Fetch settings để lấy danh sách phương thức thanh toán được bật
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/api/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.paymentMethods) {
          setPaymentMethods(res.data.paymentMethods);
          // Đảm bảo paymentMethod hiện tại được bật
          const availableMethods = Object.entries(res.data.paymentMethods)
            .filter(([_, enabled]) => enabled)
            .map(([key]) => key);
          if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
            setPaymentMethod(availableMethods[0]);
          }
        }
      } catch (error) {
        console.error('Lỗi tải cài đặt thanh toán:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [token]);

  // Khi paymentMethods thay đổi, kiểm tra lại paymentMethod hiện tại
  useEffect(() => {
    const availableMethods = Object.entries(paymentMethods)
      .filter(([_, enabled]) => enabled)
      .map(([key]) => key);
    if (availableMethods.length > 0 && !availableMethods.includes(paymentMethod)) {
      setPaymentMethod(availableMethods[0]);
    }
  }, [paymentMethods, paymentMethod]);

  // Cập nhật shippingAddress khi các dropdown thay đổi
  useEffect(() => {
    const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
    const districtName = districts.find(d => d.code === selectedDistrict)?.name || '';
    const wardName = wards.find(w => w.code === selectedWard)?.name || '';
    setShippingAddress(prev => ({
      ...prev,
      city: provinceName,
      district: districtName,
      ward: wardName,
    }));
  }, [selectedProvince, selectedDistrict, selectedWard, districts, wards]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = e.target.value;
    setSelectedProvince(provinceCode);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts(districtsByProvince[provinceCode] || []);
    setWards([]);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtCode = e.target.value;
    setSelectedDistrict(districtCode);
    setSelectedWard('');
    setWards(wardsByDistrict[districtCode] || []);
  };

  const searchCustomers = async (keyword: string) => {
    if (!keyword || !token) return;
    try {
      const res = await axios.get(`${API_URL}/api/customers?search=${keyword}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(res.data);
    } catch (error) {
      console.error('Lỗi tìm khách hàng:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn');
        router.push('/auth/login');
      }
    }
  };

  const searchProducts = async (keyword: string) => {
    if (!keyword || !token) return;
    try {
      const res = await axios.get(`${API_URL}/api/products?search=${keyword}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (error) {
      console.error('Lỗi tìm sản phẩm:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn');
        router.push('/auth/login');
      }
    }
  };

  const addItem = (product: Product) => {
    const price = Number(product.price) || 0;
    const stock = Number(product.stock) || 0;
    const existing = selectedItems.find(item => item.productId === product._id);
    if (existing) {
      if (existing.quantity >= stock) {
        alert('Số lượng vượt quá tồn kho');
        return;
      }
      setSelectedItems(prev =>
        prev.map(item =>
          item.productId === product._id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setSelectedItems(prev => [
        ...prev,
        { productId: product._id, name: product.name, price, quantity: 1, stock }
      ]);
    }
    setShowProductModal(false);
    setProductSearch('');
  };

  const updateQuantity = (productId: string, newQty: number) => {
    const item = selectedItems.find(i => i.productId === productId);
    if (!item) return;
    if (newQty < 1) {
      removeItem(productId);
      return;
    }
    if (newQty > item.stock) {
      alert('Số lượng vượt quá tồn kho');
      return;
    }
    setSelectedItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity: newQty } : item
      )
    );
  };

  const removeItem = (productId: string) => {
    setSelectedItems(prev => prev.filter(item => item.productId !== productId));
  };

  const totalAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      alert('Vui lòng đăng nhập lại');
      router.push('/auth/login');
      return;
    }
    if (!selectedCustomer) {
      alert('Vui lòng chọn khách hàng');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Vui lòng chọn sản phẩm');
      return;
    }
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
      alert('Vui lòng nhập đầy đủ thông tin giao hàng');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        userId: selectedCustomer._id,
        items: selectedItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress,
        paymentMethod,
        notes,
      };
      const res = await axios.post(`${API_URL}/api/orders`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      router.push(`/admin/orders/${res.data._id}`);
    } catch (error: any) {
      console.error('Lỗi tạo đơn:', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn');
        router.push('/auth/login');
      } else {
        alert(error.response?.data?.message || 'Tạo đơn thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Tạo đơn hàng mới</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Chọn khách hàng */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-3">1. Thông tin khách hàng</h2>
          {selectedCustomer ? (
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
              <div>
                <p className="font-medium">{selectedCustomer.fullName}</p>
                <p className="text-sm text-gray-600">{selectedCustomer.email} - {selectedCustomer.phoneNumber}</p>
                <p className="text-sm text-gray-600">{selectedCustomer.address}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Chọn khách hàng
            </button>
          )}
        </div>

        {/* Chọn sản phẩm */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-3">2. Sản phẩm</h2>
          {selectedItems.length > 0 ? (
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      Giá: {(item.price || 0).toLocaleString()}đ | Tồn: {item.stock}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                      className="w-16 text-center border rounded"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="text-red-600 hover:text-red-800 ml-2"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-right font-medium mt-2">Tạm tính: {(totalAmount || 0).toLocaleString()}đ</p>
            </div>
          ) : (
            <p className="text-gray-500">Chưa có sản phẩm nào</p>
          )}
          <button
            type="button"
            onClick={() => setShowProductModal(true)}
            className="mt-3 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
          >
            + Thêm sản phẩm
          </button>
        </div>

        {/* Thông tin giao hàng */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-3">3. Thông tin giao hàng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Người nhận *</label>
              <input
                type="text"
                value={shippingAddress.fullName}
                onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Số điện thoại *</label>
              <input
                type="tel"
                value={shippingAddress.phone}
                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Địa chỉ chi tiết *</label>
              <input
                type="text"
                value={shippingAddress.address}
                onChange={(e) => setShippingAddress({ ...shippingAddress, address: e.target.value })}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                required
                placeholder="Số nhà, tên đường..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tỉnh/Thành *</label>
              <select
                value={selectedProvince}
                onChange={handleProvinceChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                required
              >
                <option value="">Chọn tỉnh/thành</option>
                {provinces.map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quận/Huyện *</label>
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                required
                disabled={!selectedProvince}
              >
                <option value="">Chọn quận/huyện</option>
                {districts.map(d => (
                  <option key={d.code} value={d.code}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phường/Xã *</label>
              <select
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                required
                disabled={!selectedDistrict}
              >
                <option value="">Chọn phường/xã</option>
                {wards.map(w => (
                  <option key={w.code} value={w.code}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Phương thức thanh toán và ghi chú */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-3">4. Thanh toán</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phương thức</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md"
                disabled={loadingSettings}
              >
                {loadingSettings ? (
                  <option>Đang tải...</option>
                ) : (
                  <>
                    {paymentMethods.cod && <option value="cod">COD (Thanh toán khi nhận hàng)</option>}
                    {paymentMethods.bankTransfer && <option value="bank_transfer">Chuyển khoản ngân hàng</option>}
                    {paymentMethods.momo && <option value="momo">Ví MoMo</option>}
                    {paymentMethods.zalopay && <option value="zalopay">ZaloPay</option>}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ghi chú</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Nút submit */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Đang tạo...' : 'Tạo đơn hàng'}
          </button>
        </div>
      </form>

      {/* Modal chọn khách hàng */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Chọn khách hàng</h3>
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="space-y-2">
              {customers.map((c) => (
                <div
                  key={c._id}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                  onClick={() => {
                    setSelectedCustomer(c);
                    setShowCustomerModal(false);
                    setCustomerSearch('');
                  }}
                >
                  <p className="font-medium">{c.fullName}</p>
                  <p className="text-sm text-gray-600">{c.email} - {c.phoneNumber}</p>
                  <p className="text-sm text-gray-600">{c.address}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowCustomerModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal chọn sản phẩm */}
      {showProductModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">Chọn sản phẩm</h3>
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm sản phẩm..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((p) => (
                <div
                  key={p._id}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer flex gap-3"
                  onClick={() => addItem(p)}
                >
                  {p.images && p.images.length > 0 && (
                    <img src={p.images[0]} alt={p.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{p.name}</p>
                    <p className="text-sm text-gray-600">Giá: {(p.price || 0).toLocaleString()}đ</p>
                    <p className="text-sm text-gray-600">Tồn kho: {p.stock}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}