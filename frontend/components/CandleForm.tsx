'use client';

import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candleApi, categoryApi, uploadApi, Candle, Category } from '@/lib/api';

interface CandleFormProps {
  candle: Candle | null;
  categories: Category[];
  onClose: () => void;
}

export default function CandleForm({ candle, categories, onClose }: CandleFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {candle ? 'Редактировать свечу' : 'Добавить новую свечу'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Название *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Например: СВЕЧА ОЧИЩЕНИЯ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Слоган</label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Например: Путь к чистоте"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Категория</label>
            {!isCreatingCategory ? (
              <div className="flex gap-2">
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: parseInt(e.target.value) }))}
                  className="flex-1 border rounded-lg px-3 py-2"
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
                  className="flex-1 border rounded-lg px-3 py-2"
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
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Отмена
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Описание *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              placeholder="Краткое описание свечи..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Практика *</label>
            <textarea
              required
              value={formData.practice}
              onChange={(e) => setFormData(prev => ({ ...prev, practice: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              rows={4}
              placeholder="Инструкции по использованию..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ритуальный текст</label>
            <textarea
              value={formData.ritual_text}
              onChange={(e) => setFormData(prev => ({ ...prev, ritual_text: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2"
              rows={3}
              placeholder="Заговор или молитва..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Цвет</label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Например: Белый"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Аромат</label>
              <input
                type="text"
                value={formData.scent}
                onChange={(e) => setFormData(prev => ({ ...prev, scent: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Например: Лаванда"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Бренд</label>
              <input
                type="text"
                value={formData.brand_name}
                onChange={(e) => setFormData(prev => ({ ...prev, brand_name: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Сайт</label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Логотип</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.logo_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, logo_image: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="URL или загрузите"
                />
                <label className="px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
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
              <label className="block text-sm font-medium mb-1">QR код</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.qr_image}
                  onChange={(e) => setFormData(prev => ({ ...prev, qr_image: e.target.value }))}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  placeholder="URL или загрузите"
                />
                <label className="px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
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
              className="rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium">
              Активная (отображается в каталоге)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
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