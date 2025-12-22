'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Printer, Check, Upload } from 'lucide-react';
import { candleApi, categoryApi, labelApi, Candle } from '@/lib/api';
import { checkAuth, logout, isAuthenticated } from '@/lib/auth';
import CandleForm from '@/components/CandleForm';
import PrintModal from '@/components/PrintModal';
import ImportModal from '@/components/ImportModal';

export default function Home() {
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCandle, setEditingCandle] = useState<Candle | null>(null);
  const [selectedCandles, setSelectedCandles] = useState<number[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'sequence_number' | 'name' | 'created_at' | 'last_modified_at'>('sequence_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  // Проверяем аутентификацию при загрузке
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    checkAuth();
  }, [router]);

  // Если не аутентифицирован, показываем загрузку
  if (!isAuthenticated()) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  const { data: candles, isLoading } = useQuery({
    queryKey: ['candles', sortBy, sortOrder, searchQuery],
    queryFn: () => candleApi.getAll({
      sort_by: sortBy,
      sort_order: sortOrder,
      search: searchQuery || undefined,
    }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryApi.getAll,
  });

  // Сортируем: выбранные свечи вверху, сохраняя порядок сортировки между собой
  const sortedCandles = useMemo(() => {
    if (!candles) return [];

    const selected = candles.filter(c => selectedCandles.includes(c.id));
    const unselected = candles.filter(c => !selectedCandles.includes(c.id));

    return [...selected, ...unselected];
  }, [candles, selectedCandles]);

  const deleteMutation = useMutation({
    mutationFn: candleApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candles'] });
    },
  });

  const handleEdit = (candle: Candle) => {
    setEditingCandle(candle);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Вы уверены, что хотите удалить эту свечу?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCandle(null);
  };

  const toggleCandleSelection = (id: number) => {
    setSelectedCandles(prev =>
      prev.includes(id)
        ? prev.filter(candleId => candleId !== id)
        : [...prev, id]
    );
  };

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) =>
      candleApi.update(id, { quantity }),
    onMutate: async (variables) => {
      // Отменяем исходящие рефетчи (чтобы они не перезаписали наше оптимистичное обновление)
      await queryClient.cancelQueries({ queryKey: ['candles', sortBy, sortOrder, searchQuery] });

      // Сохраняем предыдущее значение для rollback
      const previousCandles = queryClient.getQueryData(['candles', sortBy, sortOrder, searchQuery]);

      // Оптимистично обновляем кэш
      queryClient.setQueryData(['candles', sortBy, sortOrder, searchQuery], (old: Candle[] | undefined) => {
        if (!old) return old;
        return old.map(candle =>
          candle.id === variables.id
            ? { ...candle, quantity: variables.quantity }
            : candle
        );
      });

      return { previousCandles };
    },
    onError: (_err, _variables, context) => {
      // При ошибке откатываем к предыдущему состоянию
      if (context?.previousCandles) {
        queryClient.setQueryData(['candles', sortBy, sortOrder, searchQuery], context.previousCandles);
      }
    },
  });

  const handleQuantityChange = (id: number, delta: number) => {
    const candle = candles?.find(c => c.id === id);
    if (!candle) return;

    const newQuantity = Math.max(1, Math.min(100, candle.quantity + delta));
    if (newQuantity !== candle.quantity) {
      updateQuantityMutation.mutate({ id, quantity: newQuantity });
    }
  };

  const handleQuantityInput = (id: number, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 100) {
      updateQuantityMutation.mutate({ id, quantity: numValue });
    } else if (value === '') {
      // Если поле очищено, не делаем ничего (ждём blur)
      return;
    }
  };

  const handleQuantityBlur = (id: number, value: string) => {
    const candle = candles?.find(c => c.id === id);
    if (!candle) return;

    const numValue = parseInt(value);
    // Если невалидное значение или пустое, возвращаем к текущему
    if (isNaN(numValue) || numValue < 1 || numValue > 100) {
      // Триггерим re-render для возврата к оригинальному значению
      queryClient.invalidateQueries({ queryKey: ['candles', sortBy, sortOrder, searchQuery] });
    } else if (numValue !== candle.quantity) {
      updateQuantityMutation.mutate({ id, quantity: numValue });
    }
  };

  const selectAll = () => {
    if (candles) {
      setSelectedCandles(candles.map(c => c.id));
    }
  };

  const deselectAll = () => {
    setSelectedCandles([]);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-100 mb-2">
                Генератор этикеток АРТ-СВЕЧИ
              </h1>
              <p className="text-gray-400">
                Управление каталогом свечей и генерация этикеток для печати
              </p>
              {candles && (
                <p className="text-gray-500 mt-1">
                  Всего свечей: {candles.length} (Нумерация: с №{candles[0]?.sequence_number || 1} по №{candles[candles.length - 1]?.sequence_number || candles.length})
                </p>
              )}
            </div>
            <button
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Выйти
            </button>
          </div>
        </header>

        <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-100">Каталог свечей</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingCandle(null);
                  setIsFormOpen(true);
                }}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
              >
                <Plus size={20} />
                Добавить свечу
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Upload size={20} />
                Импорт CSV/JSON
              </button>
              {selectedCandles.length > 0 && (
                <button
                  onClick={() => setIsPrintModalOpen(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                >
                  <Printer size={20} />
                  Печать этикеток ({selectedCandles.length})
                </button>
              )}
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск по названию свечи..."
                className="flex-1 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg px-4 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 bg-gray-600 text-gray-200 rounded-lg hover:bg-gray-500"
                >
                  Сбросить
                </button>
              )}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Выбрать все
                </button>
                <span className="text-gray-400">|</span>
                <button
                  onClick={deselectAll}
                  className="text-sm text-purple-600 hover:text-purple-700"
                >
                  Снять выделение
                </button>
                {selectedCandles.length > 0 && (
                  <>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => {
                        const updates = candles?.map(candle => ({ id: candle.id, quantity: 1 })) || [];
                        updates.forEach(update => {
                          updateQuantityMutation.mutate({ id: update.id, quantity: 1 });
                        });
                      }}
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      Обнулить количество
                    </button>
                  </>
                )}
              </div>
              <div className="flex gap-3 items-center">
                <span className="text-sm text-gray-300">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'sequence_number' | 'name' | 'created_at' | 'last_modified_at')}
                  className="bg-gray-700 border-gray-600 text-gray-100 rounded px-3 py-1 text-sm"
                >
                  <option value="sequence_number">По номеру</option>
                  <option value="created_at">По дате создания</option>
                  <option value="last_modified_at">По дате изменения</option>
                  <option value="name">По названию</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="bg-gray-700 border-gray-600 text-gray-100 rounded px-3 py-1 text-sm"
                >
                  <option value="desc">Убывание</option>
                  <option value="asc">Возрастание</option>
                </select>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-300">Загрузка...</div>
          ) : (
            <div className="grid gap-4">
              {sortedCandles.map((candle) => (
                <div
                  key={candle.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition ${
                    selectedCandles.includes(candle.id)
                      ? 'border-purple-500 bg-purple-900 bg-opacity-20'
                      : 'border-gray-600 bg-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleCandleSelection(candle.id)}
                      className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedCandles.includes(candle.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-500 hover:border-purple-400'
                      }`}
                    >
                      {selectedCandles.includes(candle.id) && (
                        <Check size={16} className="text-white" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-100">
                            {candle.sequence_number ? `${candle.sequence_number}. ` : ""}{candle.display_name || candle.name}
                          </h3>
                          {candle.tagline && (
                            <p className="text-sm text-gray-400 italic">{candle.tagline}</p>
                          )}
                          <p className="text-sm text-purple-400 mt-1">
                            {candle.category?.name || 'Без категории'}
                          </p>
                          {candle.sequence_number && (
                            <p className="text-xs text-yellow-400 mt-1">
                              Порядковый номер: {candle.sequence_number}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Создано: {new Date(candle.created_at).toLocaleDateString('ru-RU')}
                            {candle.last_modified_at && candle.last_modified_at !== candle.created_at && (
                              <> • Последнее изменение: {new Date(candle.last_modified_at).toLocaleDateString('ru-RU')}</>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(candle)}
                            className="text-blue-400 hover:text-blue-300 p-1"
                            title="Редактировать"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(candle.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                        {candle.description}
                      </p>

                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-600">
                        <span className="text-sm text-gray-400">Количество для печати:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(candle.id, -1)}
                            disabled={candle.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={candle.quantity}
                            onChange={(e) => handleQuantityInput(candle.id, e.target.value)}
                            onBlur={(e) => handleQuantityBlur(candle.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className="w-16 text-center font-semibold bg-gray-600 border border-gray-500 text-gray-100 rounded px-2 py-1 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => handleQuantityChange(candle.id, 1)}
                            disabled={candle.quantity >= 100}
                            className="w-8 h-8 flex items-center justify-center bg-gray-600 text-white rounded hover:bg-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <CandleForm
          candle={editingCandle}
          categories={categories || []}
          onClose={handleCloseForm}
        />
      )}

      {isPrintModalOpen && (
        <PrintModal
          selectedCandles={selectedCandles}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {isImportModalOpen && (
        <ImportModal
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
}