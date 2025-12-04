'use client';

import { useState } from 'react';
import { X, Upload, Download, FileText, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { candleApi } from '@/lib/api';

interface ImportModalProps {
  onClose: () => void;
}

export default function ImportModal({ onClose }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: (file: File) => candleApi.importFile(file),
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['candles'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Ошибка импорта';
      setImportResult({ imported: 0, errors: [message], total: 0 });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const handleImport = () => {
    if (selectedFile) {
      importMutation.mutate(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    candleApi.downloadTemplate();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-100">Массовый импорт свечей</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Инструкция */}
          <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
            <h3 className="font-semibold text-blue-300 mb-2 flex items-center gap-2">
              <FileText size={18} />
              Инструкция
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-200">
              <li>Скачайте шаблон CSV файла</li>
              <li>Заполните его данными (можно добавить до 20-30 свечей)</li>
              <li>Сохраните файл в формате CSV или JSON</li>
              <li>Загрузите файл через форму ниже</li>
            </ol>
          </div>

          {/* Скачать шаблон */}
          <div>
            <button
              onClick={handleDownloadTemplate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Download size={20} />
              Скачать шаблон CSV
            </button>
          </div>

          {/* Загрузка файла */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Выберите файл для импорта (CSV или JSON)
            </label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center bg-gray-700 hover:bg-gray-650">
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload size={32} className="text-gray-400" />
                <span className="text-sm text-gray-200">
                  {selectedFile ? selectedFile.name : 'Нажмите для выбора файла'}
                </span>
                <span className="text-xs text-gray-500">
                  Поддерживаются форматы: CSV, JSON
                </span>
              </label>
            </div>
          </div>

          {/* Кнопка импорта */}
          {selectedFile && !importResult && (
            <button
              onClick={handleImport}
              disabled={importMutation.isPending}
              className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Импорт...' : 'Импортировать'}
            </button>
          )}

          {/* Результат импорта */}
          {importResult && (
            <div className={`border rounded-lg p-4 ${
              importResult.errors.length > 0 ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' : 'bg-green-900 bg-opacity-20 border-green-700'
            }`}>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                {importResult.errors.length > 0 ? (
                  <>
                    <AlertCircle size={18} className="text-yellow-400" />
                    <span className="text-yellow-300">Импорт завершен с ошибками</span>
                  </>
                ) : (
                  <span className="text-green-300">Импорт успешно завершен</span>
                )}
              </h3>
              <div className="text-sm space-y-1 text-gray-300">
                <p><strong>Импортировано:</strong> {importResult.imported} из {importResult.total}</p>
                {importResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-red-400">Ошибки:</p>
                    <ul className="list-disc list-inside max-h-40 overflow-y-auto">
                      {importResult.errors.map((error: string, idx: number) => (
                        <li key={idx} className="text-red-300">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setImportResult(null);
                }}
                className="mt-4 px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-600"
              >
                Импортировать еще
              </button>
            </div>
          )}

          {/* Закрыть */}
          <div className="flex justify-end pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
