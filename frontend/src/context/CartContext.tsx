'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from './UserContext';
import toast from 'react-hot-toast';

interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
  };
  quantity: number;
}

interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  updatedAt: string;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  itemCount: number;
  totalAmount: number;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const { token, user } = useUser();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchCart = async () => {
    if (!token || !user) {
      setCart(null);
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(res.data);
    } catch (error) {
      console.error('Lỗi tải giỏ hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [token, user]);

  const refreshCart = () => fetchCart();

  const addToCart = async (productId: string, quantity: number) => {
    if (!token) {
      toast.error('Vui lòng đăng nhập để thêm vào giỏ');
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/api/cart/add`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(res.data);
      toast.success('Đã thêm vào giỏ hàng');
    } catch (error) {
      console.error('Lỗi thêm vào giỏ:', error);
      toast.error('Thêm vào giỏ thất bại');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const res = await axios.put(`${API_URL}/api/cart/update`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(res.data);
    } catch (error) {
      console.error('Lỗi cập nhật số lượng:', error);
      toast.error('Cập nhật thất bại');
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      const res = await axios.delete(`${API_URL}/api/cart/remove/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(res.data);
      toast.success('Đã xóa sản phẩm khỏi giỏ');
    } catch (error) {
      console.error('Lỗi xóa sản phẩm:', error);
      toast.error('Xóa thất bại');
    }
  };

  const clearCart = async () => {
  try {
    await axios.delete(`${API_URL}/api/cart`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setCart(prev => prev ? { ...prev, items: [] } : null);
    toast.success('Đã xóa giỏ hàng');
  } catch (error) {
    console.error('Lỗi xóa giỏ hàng:', error);
    toast.error('Không thể xóa giỏ hàng');
  }
};

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const totalAmount = cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart,
      loading,
      itemCount,
      totalAmount,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      refreshCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}