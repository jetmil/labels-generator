'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export default function LoginForm() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('login', login);
      formData.append('password', password);

      const response = await api.post<LoginResponse>('/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Сохраняем токен в localStorage
      localStorage.setItem('token', response.data.access_token);

      // Устанавливаем токен в axios defaults
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;

      // Сохраняем токен в куках для middleware
      document.cookie = `token=${response.data.access_token}; path=/; max-age=1800`; // 30 минут

      // Перенаправляем на главную
      router.push('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Неверный логин или пароль');
      } else {
        setError('Произошла ошибка. Попробуйте снова.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-100">
            Вход в систему
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Генератор этикеток АРТ-СВЕЧИ
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="-space-y-px">
            <div>
              <label htmlFor="login" className="sr-only">
                Логин
              </label>
              <input
                id="login"
                name="login"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-100 bg-gray-800 rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Логин"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-600 placeholder-gray-500 text-gray-100 bg-gray-800 rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}