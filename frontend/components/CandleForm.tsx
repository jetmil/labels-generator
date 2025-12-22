'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candleApi, categoryApi, uploadApi, Candle, Category } from '@/lib/api';

// Рекомендуемые лимиты символов для областей печати
const CHAR_LIMITS = {
  name: 30,
  description: 450,
  practice: 450,
  ritual_text: 350,
};

// Функция для определения статуса заполнения
function getCharStatus(current: number, max: number): 'ok' | 'warning' | 'danger' {
  const ratio = current / max;
  if (ratio <= 0.8) return 'ok';
  if (ratio <= 1) return 'warning';
  return 'danger';
}

// Компонент счётчика символов
function CharCounter({ current, max, label }: { current: number; max: number; label?: string }) {
  const status = getCharStatus(current, max);
  const statusColors = {
    ok: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
  };
  const bgColors = {
    ok: 'bg-green-900/30',
    warning: 'bg-yellow-900/30',
    danger: 'bg-red-900/30',
  };

  return (
    <div className={`flex items-center justify-between text-xs mt-1 px-2 py-1 rounded ${bgColors[status]}`}>
      <span className="text-gray-400">{label || 'Символов'}</span>
      <span className={statusColors[status]}>
        {current} / {max}
        {status === 'danger' && <span className="ml-1">⚠️ превышен лимит</span>}
      </span>
    </div>
  );
}

interface CandleFormProps {
  candle: Candle | null;
  categories: Category[];
  onClose: () => void;
}

interface CandleFormData {
  name: string;
  tagline: string;
  category_id: number;
  description: string;
  practice: string;
  ritual_text: string;
  color: string;
  scent: string;
  brand_name: string;
  website: string;
  qr_image: string;
  logo_image: string;
  quantity: number;
  is_active: boolean;
}

export default function CandleForm({ candle, categories, onClose }: CandleFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<CandleFormData>({
    name: '',
    tagline: '',
    category_id: 0,
    description: '',
    practice: '',
    ritual_text: '',
    color: '',
    scent: '',
    brand_name: 'АРТ-СВЕЧИ',
    website: 'art-svechi.ligardi.ru',
    qr_image: '',
    logo_image: '',
    quantity: 1,
    is_active: true,
  });
  const [newCategory, setNewCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  useEffect(() => {
    if (candle) {
      setFormData({
        name: candle.name,
        tagline: candle.tagline || '',
        category_id: candle.category_id || 0,
        description: candle.description,
        practice: candle.practice,
        ritual_text: candle.ritual_text || '',
        color: candle.color || '',
        scent: candle.scent || '',
        brand_name: candle.brand_name,
        website: candle.website,
        qr_image: candle.qr_image || '',
        logo_image: candle.logo_image || '',
        quantity: candle.quantity || 1,
        is_active: candle.is_active,
      });
    }
  }, [candle]);

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => candleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candles'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => candleApi.update(candle!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candles'] });
      onClose();
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: categoryApi.create,
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormData(prev => ({ ...prev, category_id: newCat.id }));
      setNewCategory('');
      setIsCreatingCategory(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (candle) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'qr') => {
    try {
      const result = type === 'logo'
        ? await uploadApi.uploadLogo(file)
        : await uploadApi.uploadQr(file);

      const field = type === 'logo' ? 'logo_image' : 'qr_image';
      setFormData(prev => ({ ...prev, [field]: result.url }));
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-100">
            {candle ? 'Редактировать свечу' : 'Добавить новую свечу'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Название *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Например: СВЕЧА ОЧИЩЕНИЯ"
            />
            <CharCounter current={formData.name.length} max={CHAR_LIMITS.name} label="Для этикетки" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Слоган</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Например: Путь к чистоте"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Категория</label>
            {!isCreatingCategory ? (
              <div className="flex gap-2">
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                >
                  <option value={0}>Без категории</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Новая
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="Название новой категории"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newCategory.trim()) {
                      createCategoryMutation.mutate(newCategory);
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCategory(false);
                    setNewCategory('');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Количество копий для печати</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              placeholder="Сколько копий печатать"
            />
            <p className="text-xs text-gray-400 mt-1">При генерации этикеток эта свеча будет продублирована указанное количество раз</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Описание *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              rows={3}
              placeholder="Краткое описание свечи..."
            />
            <CharCounter current={formData.description.length} max={CHAR_LIMITS.description} label="Для этикетки и инструкции" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Практика *</label>
            <textarea
              required
              value={formData.practice}
              onChange={(e) => setFormData(prev => ({ ...prev, practice: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              rows={4}
              placeholder="Инструкции по использованию..."
            />
            <CharCounter current={formData.practice.length} max={CHAR_LIMITS.practice} label="Для инструкции" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-300">Ритуальный текст</label>
            <textarea
              value={formData.ritual_text}
              onChange={(e) => setFormData(prev => ({ ...prev, ritual_text: e.target.value }))}
              className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              rows={3}
              placeholder="Заговор или молитва..."
            />
            <CharCounter current={formData.ritual_text.length} max={CHAR_LIMITS.ritual_text} label="Для инструкции" />
          </div>

          {/* Общий счётчик для карточки инструкции */}
          <div className="p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <div className="text-sm font-medium text-gray-300 mb-2">📋 Общий объём текста инструкции</div>
            <CharCounter
              current={formData.description.length + formData.practice.length + formData.ritual_text.length}
              max={900}
              label="Описание + Практика + Заговор"
            />
            <p className="text-xs text-gray-500 mt-1">При превышении 900 символов текст может не поместиться на карточке</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Цвет</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Например: Белый"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Аромат</label>
              <input
                type="text"
                value={formData.scent}
                onChange={(e) => setFormData(prev => ({ ...prev, scent: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Например: Лаванда"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Бренд</label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Сайт</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">Логотип</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.logo_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_image: e.target.value }))}
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="URL или загрузите"
                />
                <label className="px-3 py-2 bg-gray-600 text-gray-200 rounded-lg cursor-pointer hover:bg-gray-500">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'logo');
                      }
                    }}
                  />
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">QR код</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.qr_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, qr_image: e.target.value }))}
                  className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  placeholder="URL или загрузите"
                />
                <label className="px-3 py-2 bg-gray-600 text-gray-200 rounded-lg cursor-pointer hover:bg-gray-500">
                  <Upload size={20} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileUpload(e.target.files[0], 'qr');
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded bg-gray-700 border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
              Активная (отображается в каталоге)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}