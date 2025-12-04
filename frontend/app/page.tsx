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
  const queryClient = useQueryClient();

  const { data: candles, isLoading } = useQuery({
    queryKey: ['candles', sortBy, sortOrder],
    queryFn: () => candleApi.getAll({ sort_by: sortBy, sort_order: sortOrder }),
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

  const selectAll = () => {
    if (candles) {
      setSelectedCandles(candles.map(c => c.id));
    }
  };

  const deselectAll = () => {
    setSelectedCandles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-purple-800 mb-2">
            Генератор этикеток АРТ-СВЕЧИ
          </h1>
          <p className="text-gray-600">
            Управление каталогом свечей и генерация этикеток для печати
          </p>
        </header>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Каталог свечей</h2>
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

          <div className="mb-4 flex justify-between items-center">
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
              <span className="text-sm text-gray-600">Сортировка:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'created_at')}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="created_at">По дате</option>
                <option value="name">По названию</option>
              </select>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="desc">Убывание</option>
                <option value="asc">Возрастание</option>
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : (
            <div className="grid gap-4">
              {candles?.map((candle) => (
                <div
                  key={candle.id}
                  className={`border rounded-lg p-4 hover:shadow-md transition ${
                    selectedCandles.includes(candle.id)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleCandleSelection(candle.id)}
                      className={`mt-1 w-6 h-6 rounded border-2 flex items-center justify-center ${
                        selectedCandles.includes(candle.id)
                          ? 'bg-purple-600 border-purple-600'
                          : 'border-gray-300 hover:border-purple-400'
                      }`}
                    >
                      {selectedCandles.includes(candle.id) && (
                        <Check size={16} className="text-white" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {candle.name}
                          </h3>
                          {candle.tagline && (
                            <p className="text-sm text-gray-600 italic">{candle.tagline}</p>
                          )}
                          <p className="text-sm text-purple-600 mt-1">
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
                            className="text-blue-600 hover:text-blue-700 p-1"
                            title="Редактировать"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(candle.id)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="Удалить"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                        {candle.description}
                      </p>
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
