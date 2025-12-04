-- Создание базы данных для проекта LABELS
CREATE DATABASE labels_db;

-- Создание пользователя
CREATE USER labels_user WITH PASSWORD 'labels123';

-- Предоставление прав
GRANT ALL PRIVILEGES ON DATABASE labels_db TO labels_user;
ALTER DATABASE labels_db OWNER TO labels_user;

-- Подключение к базе данных
\c labels_db;

-- Установка владельца схемы
GRANT ALL ON SCHEMA public TO labels_user;