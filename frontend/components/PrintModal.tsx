'use client';

import { useState } from 'react';
import { X, Printer, Download } from 'lucide-react';
import { labelApi } from '@/lib/api';

interface PrintModalProps {
  selectedCandles: number[];
  onClose: () => void;
}

export default function PrintModal({ selectedCandles, onClose }: PrintModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await labelApi.generate(selectedCandles, 'html');

      // Create a blob from HTML response
      const blob = new Blob([response], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);

      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          setTimeout(() => {
            printWindow.print();
          }, 500);
        });
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Ошибка при генерации этикеток');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const response = await labelApi.generate(selectedCandles, 'html');

      // Create a blob and download
      const blob = new Blob([response], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `labels_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Ошибка при скачивании этикеток');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Печать этикеток</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Выбрано свечей: <span className="font-semibold">{selectedCandles.length}</span>
            </p>
            <p className="text-sm text-gray-600">
              Будет сгенерирован HTML-файл с этикетками формата А4.
              Этикетки размещаются по 6 штук на странице (2 колонки × 3 ряда).
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <Printer size={20} />
              {isGenerating ? 'Генерация...' : 'Открыть для печати'}
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Download size={20} />
              {isGenerating ? 'Генерация...' : 'Скачать HTML файл'}
            </button>

            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Отмена
            </button>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Совет:</strong> Перед печатью проверьте настройки принтера.
              Рекомендуется использовать плотную бумагу для этикеток.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}