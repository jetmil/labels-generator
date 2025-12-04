# LABELS - Генератор этикеток для свечей

## Описание
Веб-приложение для создания, управления и печати этикеток для свечей АРТ-СВЕЧИ.

## Функции
- Создание новых записей свечей с полной информацией
- Управление существующими записями (редактирование, удаление)
- Выбор свечей для генерации этикеток
- Генерация HTML-страниц с этикетками для печати
- Объединенный формат этикетки (описание + практическая часть)

## Технологии
- **Backend**: Python FastAPI
- **Frontend**: Next.js 14
- **Database**: PostgreSQL
- **Process Manager**: PM2
- **Web Server**: Nginx

## Структура проекта
```
labels/
├── backend/       # FastAPI backend
├── frontend/      # Next.js frontend
├── database/      # SQL scripts and migrations
└── uploads/       # Static files (logos, QR codes)
    ├── logos/
    └── qr/
```

## Порты
- Backend: 8200
- Frontend: 3200