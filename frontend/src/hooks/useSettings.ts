import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@/context/UserContext';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Settings {
  _id?: string;
  systemName?: string;
  timezone?: string;
  dateFormat?: string;
  currency?: string;
  itemsPerPage?: number;
  maintenanceMode?: boolean;
  storeName?: string;
  storeEmail?: string;
  storePhone?: string;
  hotline?: string;
  storeAddress?: string;
  workingHours?: string;
  logo?: string;
  favicon?: string;
  taxRate?: number;
  paymentMethods?: {
    cod: boolean;
    bankTransfer: boolean;
    momo: boolean;
    zalopay: boolean;
  };
  shippingSettings?: {
    freeShippingThreshold: number;
    defaultShippingFee: number;
  };
  warrantyPolicy?: string;
  returnPolicy?: string;
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  updatedAt?: string;
}

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useUser();

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
    } catch (error) {
      console.error('Lỗi tải cài đặt:', error);
      toast.error('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (data: Partial<Settings>) => {
    try {
      const res = await axios.put(`${API_URL}/api/settings`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSettings(res.data);
      return res.data;
    } catch (error) {
      console.error('Lỗi cập nhật:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (token) fetchSettings();
  }, [token]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
};