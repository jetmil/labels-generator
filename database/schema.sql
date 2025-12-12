-- Схема базы данных для генератора этикеток свечей

-- Категории свечей
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Основная таблица свечей
CREATE TABLE candles (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    tagline VARCHAR(200),
    description TEXT NOT NULL,
    practice TEXT NOT NULL,
    ritual_text TEXT,
    color VARCHAR(100),
    scent VARCHAR(200),
    brand_name VARCHAR(100) DEFAULT 'АРТ-СВЕЧИ',
    website VARCHAR(200) DEFAULT 'art-svechi.ligardi.ru',
    qr_image VARCHAR(500),
    logo_image VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_candle_name UNIQUE (name)
);

-- Таблица для сохраненных наборов этикеток
CREATE TABLE label_sets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь между наборами и свечами
CREATE TABLE label_set_candles (
    id SERIAL PRIMARY KEY,
    label_set_id INTEGER REFERENCES label_sets(id) ON DELETE CASCADE,
    candle_id INTEGER REFERENCES candles(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    UNIQUE(label_set_id, candle_id)
);

-- Индексы для производительности
CREATE INDEX idx_candles_category ON candles(category_id);
CREATE INDEX idx_candles_active ON candles(is_active);
CREATE INDEX idx_label_set_candles_set ON label_set_candles(label_set_id);
CREATE INDEX idx_label_set_candles_candle ON label_set_candles(candle_id);

-- Триггер для обновления updated_at и last_modified_at
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.last_modified_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candles_timestamps
BEFORE UPDATE ON candles
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

-- Начальные данные для категорий
INSERT INTO categories (name) VALUES
    ('Ритуальные свечи'),
    ('Громничные свечи'),
    ('Чакральные свечи'),
    ('Восковые фигуры'),
    ('Магические свечи'),
    ('Энергетические свечи'),
    ('Целительные свечи'),
    ('Защитные свечи');