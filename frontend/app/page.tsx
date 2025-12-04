'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Printer, Check, Upload } from 'lucide-react';
import { candleApi, categoryApi, labelApi, Candle } from '@/lib/api';
import CandleForm from '@/components/CandleForm';
import PrintModal from '@/components/PrintModal';
import ImportModal from '@/components/ImportModal';

export default function Home() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCandle, setEditingCandle] = useState<Candle | null>(null);
  const [selectedCandles, setSelectedCandles] = useState<number[]>([]);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candles'] });
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
          <h1 className="text-4xl font-bold text-gray-100 mb-2">
            Генератор этикеток АРТ-СВЕЧИ
          </h1>
          <p className="text-gray-400">
            Управление каталогом свечей и генерация этикеток для печати
          </p>
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
                {selectedCandles.length > 0 && (
                  <>
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
                  </>
                )}
              </div>

              <div className="flex gap-3 items-center">
                <span className="text-sm text-gray-300">Сортировка:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at')}
                  className="bg-gray-700 border-gray-600 text-gray-100 rounded px-3 py-1 text-sm"
                >
                  <option value="created_at">По дате</option>
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
              {candles?.map((candle) => (
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
                            {candle.name}
                          </h3>
                          {candle.tagline && (
                            <p className="text-sm text-gray-400 italic">{candle.tagline}</p>
                          )}
                          <p className="text-sm text-purple-400 mt-1">
                            {candle.category?.name || 'Без категории'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Создано: {new Date(candle.created_at).toLocaleDateString('ru-RU')}
                            {candle.updated_at && candle.updated_at !== candle.created_at && (
                              <> • Изменено: {new Date(candle.updated_at).toLocaleDateString('ru-RU')}</>
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
