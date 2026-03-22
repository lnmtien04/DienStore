'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Product {
  _id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  purchasePrice: number;
  total: number;
}

interface Supplier {
  _id: string;
  name: string;
}

export default function EditPurchaseOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    supplier: '',
    orderDate: '',
    notes: '',
  });
  const [items, setItems] = useState<OrderItem[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (token) {
      fetchSuppliers();
      fetchProducts();
      fetchOrder();
    }
  }, [token, id]);

  const fetchSuppliers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuppliers(res.data);
    } catch (error) {
      console.error('Lỗi tải nhà cung cấp:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    }
  };

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/purchase-orders/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const order = res.data;
      setFormData({
        supplier: order.supplier?._id || '',
        orderDate: order.orderDate ? order.orderDate.slice(0, 10) : '',
        notes: order.notes || '',
      });
      setItems(order.items.map((item: any) => ({
        productId: item.product?._id || '',
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        purchasePrice: item.purchasePrice,
        total: item.total,
      })));
    } catch (error) {
      toast.error('Không thể tải thông tin phiếu');
      router.push('/admin/purchase-orders');
    } finally {
      setLoading(false);
    }
  };

  // Tìm kiếm sản phẩm để thêm
  useEffect(() => {
    if (searchProduct.trim()) {
      const results = products.filter(p =>
        p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchProduct.toLowerCase()))
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  }, [searchProduct, products]);

  const addItem = (product: Product) => {
    // Kiểm tra trùng
    if (items.some(item => item.productId === product._id)) {
      toast.error('Sản phẩm đã có trong danh sách');
      return;
    }
    const newItem: OrderItem = {
      productId: product._id,
      productName: product.name,
      sku: product.sku || '',
      quantity: 1,
      purchasePrice: product.price,
      total: product.price,
    };
    setItems([...items, newItem]);
    setSearchProduct('');
    setSearchResults([]);
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const updated = [...items];
    const item = updated[index];
    if (field === 'quantity') {
      const qty = parseInt(value) || 0;
      item.quantity = qty;
      item.total = qty * item.purchasePrice;
    } else if (field === 'purchasePrice') {
      const price = parseFloat(value) || 0;
      item.purchasePrice = price;
      item.total = item.quantity * price;
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier) {
      toast.error('Vui lòng chọn nhà cung cấp');
      return;
    }
    if (items.length === 0) {
      toast.error('Phải có ít nhất một sản phẩm');
      return;
    }

    setSubmitting(true);
    try {
      await axios.put(
        `${API_URL}/api/purchase-orders/${id}`,
        {
          supplier: formData.supplier,
          orderDate: formData.orderDate,
          notes: formData.notes,
          items: items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Cập nhật phiếu nhập thành công');
      router.push(`/admin/purchase-orders/${id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white rounded-lg transition"
          >
            <ArrowLeftIcon className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Sửa phiếu nhập</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Thông tin chung */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin chung</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp *</label>
                <select
                  required
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn nhà cung cấp</option>
                  {suppliers.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhập</label>
                <input
                  type="date"
                  value={formData.orderDate}
                  onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-semibold mb-4">Sản phẩm nhập</h2>

            {/* Tìm kiếm sản phẩm */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Tìm sản phẩm (tên, SKU)..."
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((p) => (
                    <div
                      key={p._id}
                      className="px-4 py-2 hover:bg-slate-100 cursor-pointer"
                      onClick={() => addItem(p)}
                    >
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-slate-500">SKU: {p.sku} | Tồn: {p.stock} | Giá: {p.price.toLocaleString()}đ</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bảng sản phẩm */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Sản phẩm</th>
                    <th className="px-4 py-2 text-left">SKU</th>
                    <th className="px-4 py-2 text-right">Số lượng</th>
                    <th className="px-4 py-2 text-right">Giá nhập</th>
                    <th className="px-4 py-2 text-right">Thành tiền</th>
                    <th className="px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="px-4 py-2">{item.productName}</td>
                      <td className="px-4 py-2">{item.sku}</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(index, 'purchasePrice', e.target.value)}
                          className="w-28 px-2 py-1 border rounded text-right"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-medium">{item.total.toLocaleString()}đ</td>
                      <td className="px-4 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-right font-semibold">Tổng cộng</td>
                    <td className="px-4 py-2 text-right font-bold text-blue-600">{totalAmount.toLocaleString()}đ</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Nút hành động */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-100"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Cập nhật phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}