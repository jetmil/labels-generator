#!/usr/bin/env python3
import re
import json
import requests
from bs4 import BeautifulSoup

# Read the original HTML file
with open("/mnt/c/Users/PC/Desktop/Обменник/МАСТЕРСКАЯ ЧАРОДЕЙКИ/Этикетки HTML/all_labels_magic_fixed.html", "r", encoding="utf-8") as f:
    html_content = f.read()

soup = BeautifulSoup(html_content, 'html.parser')

# Find all label divs
labels = soup.find_all('div', class_='label')

print(f"Найдено {len(labels)} этикеток в HTML файле")

# API base URL
API_URL = "http://192.168.0.95:8201/api"

# Category mapping
category_map = {
    "ритуальные": 1,
    "громничн": 2,
    "чакральн": 3,
    "восков": 4,
    "магическ": 5,
    "энергетическ": 6,
    "целительн": 7,
    "защитн": 8,
    "очищ": 8,
    "денежн": 5,
    "любовн": 5,
    "исполнен": 5,
    "желан": 5,
}

def get_category_id(name):
    """Determine category based on candle name"""
    name_lower = name.lower()
    for key, cat_id in category_map.items():
        if key in name_lower:
            return cat_id
    return 1  # Default to ritual candles

# First, delete existing candles (except the samples)
print("\nУдаление старых тестовых данных...")
response = requests.get(f"{API_URL}/candles")
if response.status_code == 200:
    existing = response.json()
    for candle in existing:
        if candle['id'] <= 8:  # Keep first 8 sample candles for reference
            continue
        requests.delete(f"{API_URL}/candles/{candle['id']}")
        print(f"  Удалена свеча ID {candle['id']}")

candles_added = 0
errors = 0

for i, label in enumerate(labels, 1):
    try:
        # Extract name
        name_elem = label.find('h2', class_='candle-name')
        if not name_elem:
            name_elem = label.find('h3', class_='name')
        if not name_elem:
            name_elem = label.find(['h2', 'h3', 'h4'])

        if not name_elem:
            print(f"  ⚠️ Этикетка {i}: не найдено название")
            continue

        name = name_elem.get_text(strip=True)

        # Extract tagline
        tagline_elem = label.find('p', class_='tagline')
        tagline = tagline_elem.get_text(strip=True) if tagline_elem else ""

        # Extract description
        desc_elem = label.find('div', class_='description')
        if not desc_elem:
            desc_elem = label.find('p', class_='description')
        description = desc_elem.get_text(strip=True) if desc_elem else ""

        # Extract practice
        practice_elem = label.find('div', class_='practice')
        if not practice_elem:
            practice_elem = label.find('div', class_='instruction-wrapper')
        if not practice_elem:
            practice_elem = label.find('p', class_='practice')
        practice = practice_elem.get_text(strip=True) if practice_elem else ""

        # Skip if no meaningful content
        if not name or (not description and not practice):
            print(f"  ⚠️ Этикетка {i}: недостаточно данных для '{name}'")
            continue

        # Prepare candle data
        candle_data = {
            "category_id": get_category_id(name),
            "name": name,
            "tagline": tagline or f"Магическая свеча {name}",
            "description": description or f"Свеча {name} для магических практик и ритуалов.",
            "practice": practice or "Зажгите свечу с намерением. Сконцентрируйтесь на желаемом результате.",
            "qr_url": "https://art-svechi.ligardi.ru",
            "logo_url": "/uploads/logo/logo.png",
            "brand_name": "АРТ-СВЕЧИ",
            "website": "art-svechi.ligardi.ru"
        }

        # Send to API
        response = requests.post(f"{API_URL}/candles", json=candle_data)

        if response.status_code == 200:
            result = response.json()
            candles_added += 1
            print(f"  ✅ Добавлена свеча '{name}' (ID: {result['id']}, категория: {candle_data['category_id']})")
        else:
            errors += 1
            print(f"  ❌ Ошибка при добавлении '{name}': {response.text}")

    except Exception as e:
        errors += 1
        print(f"  ❌ Ошибка обработки этикетки {i}: {str(e)}")

print(f"\n📊 Результаты импорта:")
print(f"  • Обработано этикеток: {len(labels)}")
print(f"  • Успешно добавлено: {candles_added}")
print(f"  • Ошибок: {errors}")

# Get final count
response = requests.get(f"{API_URL}/candles")
if response.status_code == 200:
    total = len(response.json())
    print(f"\n✅ Всего свечей в базе данных: {total}")