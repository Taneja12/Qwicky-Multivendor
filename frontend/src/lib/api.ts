import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle token refresh or logout
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: { email: string; password: string }) => {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
    }

    // Obtain JWT tokens from backend with full URL
    const tokenRes = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/token/`, 
      credentials
    );
    const { access, refresh } = tokenRes.data;

    // Create a temporary client to fetch the user's profile with the access token
    const authClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      headers: {
        Authorization: `Bearer ${access}`,
        'Content-Type': 'application/json',
      },
    });

    const profileRes = await authClient.get('/api/users/profile/');
    const user = profileRes.data;

    return { user, access, refresh };
  },
  register: async (data: { 
    email: string; 
    password: string; 
    password2: string;
    first_name?: string;
    last_name?: string;
  }) => {
    const response = await api.post('/api/users/register/', data);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/api/users/profile/');
    return response.data;
  },
};

export const vendorApi = {
  getVendors: async () => {
    const response = await api.get('/api/vendors/');
    return response.data;
  },
  getVendorMenu: async (vendorId: number) => {
    const response = await api.get(`/api/vendors/${vendorId}/menu/`);
    return response.data;
  },
};

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/api/cart/');
    return response.data;
  },
  addToCart: async (data: {
    product_id: number;
    quantity: number;
    customizations?: number[];
    note?: string;
  }) => {
    const response = await api.post('/api/cart/items/', data);
    return response.data;
  },
  updateCartItem: async (itemId: number, data: { quantity: number }) => {
    const response = await api.patch(`/api/cart/items/${itemId}/`, data);
    return response.data;
  },
  removeFromCart: async (itemId: number) => {
    await api.delete(`/api/cart/items/${itemId}/`);
  },
};

export const orderApi = {
  createOrder: async (data: {
    vendor_id: number;
    items: Array<{
      product_id: number;
      quantity: number;
      customizations?: number[];
      note?: string;
    }>;
    note?: string;
  }) => {
    const response = await api.post('/api/orders/', data);
    return response.data;
  },
  getOrders: async () => {
    const response = await api.get('/api/orders/');
    return response.data;
  },
  getOrderDetails: async (orderId: number) => {
    const response = await api.get(`/api/orders/${orderId}/`);
    return response.data;
  },
};

export default api;