import axios from 'axios';

// Use relative path for API to work with both HTTP and HTTPS
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const api = axios.create({
  baseURL: API_URL ? API_URL : '/api',
});

// Добавляем перехватчик для обработки ошибок аутентификации
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Если получили 401, удаляем токен и перенаправляем на логин
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Candle {
  id: number;
  sequence_number?: number;
  display_name?: string;
  category_id?: number;
  name: string;
  tagline?: string;
  description: string;
  practice: string;
  ritual_text?: string;
  color?: string;
  scent?: string;
  brand_name: string;
  website: string;
  qr_image?: string;
  logo_image?: string;
  quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_modified_at: string;
  category?: Category;
}

export interface LabelSet {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  candles?: Candle[];
}

// API functions
export const candleApi = {
  getAll: async (params?: {
    category_id?: number;
    is_active?: boolean;
    search?: string;
    sort_by?: 'sequence_number' | 'name' | 'created_at' | 'last_modified_at';
    sort_order?: 'asc' | 'desc';
  }) => {
    // По умолчанию сортируем по sequence_number
    const defaultParams = {
      sort_by: 'sequence_number' as const,
      sort_order: 'asc' as const,
      ...params
    };
    const response = await api.get<Candle[]>('/candles', { params: defaultParams });
    return response.data;
  },

  getOne: async (id: number) => {
    const response = await api.get<Candle>(`/candles/${id}`);
    return response.data;
  },

  create: async (data: Omit<Candle, 'id' | 'created_at' | 'updated_at' | 'last_modified_at' | 'sequence_number' | 'display_name'>) => {
    const response = await api.post<Candle>('/candles', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Omit<Candle, 'id' | 'created_at' | 'updated_at' | 'last_modified_at' | 'sequence_number'>>) => {
    const response = await api.put<Candle>(`/candles/${id}`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/candles/${id}`);
  },

  importFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/candles/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  downloadTemplate: () => {
    window.open('/api/candles/template/csv', '_blank');
  },
};

export const categoryApi = {
  getAll: async () => {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  create: async (name: string) => {
    const response = await api.post<Category>('/categories', { name });
    return response.data;
  },
};

export const labelApi = {
  generate: async (candleIds: number[], format: string = 'html', printType: string = 'both') => {
    const response = await api.post('/generate-labels', {
      candle_ids: candleIds,
      format,
      labels_per_page: 6,
      print_type: printType,
    });
    return response.data;
  },
};

export const uploadApi = {
  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  uploadQr: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};