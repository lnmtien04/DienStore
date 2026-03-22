'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

// Định nghĩa Address
interface Address {
  fullName?: string;
  phone?: string;
  street?: string;
  province?: string;
  provinceCode?: string;
  district?: string;
  districtCode?: string;
  ward?: string;
  wardCode?: string;
}

// Export User interface để dùng nơi khác
export interface User {
  _id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  address?: string;
  defaultAddress?: {
    fullName?: string;
    phone?: string;
    street?: string;
    province?: string;
    provinceCode?: string;
    district?: string;
    districtCode?: string;
    ward?: string;
    wardCode?: string;
  };
  roles?: string[];
  avatar?: string;
  username?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other' | '';
  dob?: string;
  createdAt?: string;
  preferredLanguage?: string; // Thêm cho language
}

interface UserContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setToken(null);
        setLoading(false);
        return;
      }
      const res = await axios.get(`${API_URL}/api/accounts/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (error) {
      console.error('Fetch user failed:', error);
      localStorage.removeItem('token');
      setToken(null);
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    if (token) {
      try {
        const res = await axios.get(`${API_URL}/api/accounts/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
      } catch (error) {
        console.error('Refresh user failed:', error);
      }
    }
  };

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${API_URL}/api/accounts/login`, {
      loginIdentifier: email,
      password,
    });
    const { token, ...userData } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);

    if (userData.roles && userData.roles.includes('admin')) {
      router.push('/admin');
    } else {
      router.push('/');
    }
  };

  const register = async (data: RegisterData) => {
    let raw = data.email.split('@')[0].toLowerCase();
    raw = raw.replace(/[^a-z0-9_.]/g, '');
    if (raw.length < 6) {
      const random = Math.random().toString(36).substring(2, 8);
      raw = raw + random;
    }
    const username = raw.slice(0, 20);
    const payload = {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber || '',
      username,
      address: '',
      avatar: '',
    };
    const res = await axios.post(`${API_URL}/api/accounts/register`, payload);
    const { token, ...userData } = res.data;
    localStorage.setItem('token', token);
    setToken(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    router.push('/auth/login');
  };

  return (
    <UserContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
};