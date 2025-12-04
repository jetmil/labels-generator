#!/usr/bin/env python3
"""
Comprehensive candle data importer for АРТ-СВЕЧИ
Extracts ALL candles from HTML file and imports to database
"""

import requests
import json
from bs4 import BeautifulSoup
from pathlib import Path
import sys

# API endpoint
API_URL = "http://192.168.0.95:8201/api"

# HTML file path
HTML_FILE = "/mnt/c/Users/PC/Desktop/Обменник/МАСТЕРСКАЯ ЧАРОДЕЙКИ/Этикетки HTML/all_labels_magic_fixed.html"

def parse_html_file(file_path):
    """Parse HTML file and extract all candle data"""
    print(f"Reading HTML file: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all labels
    labels = soup.find_all('div', class_='label')
    print(f"Found {len(labels)} label cards")

    # Find all instruction cards
    instruction_cards = soup.find_all('div', class_='instruction-card')
    print(f"Found {len(instruction_cards)} instruction cards")

    candles = []

    # Parse labels and match with instructions
    for idx, label in enumerate(labels):
        try:
            # Extract label data (handle different HTML structures)
            # Try to find name in different ways
            name_elem = label.find('div', class_='label-name')
            if not name_elem:
                name_elem = label.find('h1', class_='label-name')
            if not name_elem:
                name_elem = label.find('p', class_='label-name')

            if not name_elem:
                print(f"Warning: Skipping label {idx} - no name found")
                continue

            # Extract category
            category_elem = label.find('div', class_='label-category')

            # Extract tagline (can be div or p)
            tagline_elem = label.find('div', class_='label-tagline')
            if not tagline_elem:
                tagline_elem = label.find('p', class_='label-tagline')

            # Extract description (can be div or p, may not exist for some labels)
            description_elem = label.find('div', class_='label-description')
            if not description_elem:
                description_elem = label.find('p', class_='label-description')

            name = name_elem.text.strip()
            category = category_elem.text.strip() if category_elem else "Программная свеча"
            tagline = tagline_elem.text.strip() if tagline_elem else ""

            # If no description, use tagline as description
            if description_elem:
                description = description_elem.text.strip()
            else:
                description = tagline if tagline else ""

            # Find matching instruction card
            practice_text = ""
            if idx < len(instruction_cards):
                instruction = instruction_cards[idx]

                # Extract spell/practice from instruction
                spell_section = instruction.find('div', class_='instruction-spell')
                if spell_section:
                    spell_p = spell_section.find('p')
                    if spell_p:
                        practice_text = spell_p.text.strip()

            candle_data = {
                'name': name,
                'category': category,
                'tagline': tagline,
                'description': description,
                'practice': practice_text,
                'image_url': 'logo.png',  # Default logo
                'qr_code_url': 'qr.png'   # Default QR
            }

            candles.append(candle_data)
            print(f"  {idx + 1}. {name} - {tagline[:50]}...")

        except Exception as e:
            print(f"Error parsing label {idx}: {e}")
            continue

    return candles


def get_or_create_category(category_name):
    """Get category ID by name, create if doesn't exist"""
    try:
        # Get all categories
        response = requests.get(f"{API_URL}/categories")
        if response.status_code == 200:
            categories = response.json()
            # Find matching category
            for cat in categories:
                if cat['name'] == category_name:
                    return cat['id']

        # Category not found, create it
        response = requests.post(
            f"{API_URL}/categories",
            json={'name': category_name},
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code in [200, 201]:
            new_cat = response.json()
            print(f"  ✨ Created new category: {category_name} (ID: {new_cat['id']})")
            return new_cat['id']
        else:
            print(f"  ⚠️  Failed to create category '{category_name}', using default ID 1")
            return 1

    except Exception as e:
        print(f"  ⚠️  Error with category '{category_name}': {e}, using default ID 1")
        return 1


def import_to_database(candles):
    """Import candles to database via API"""
    print(f"\n{'='*60}")
    print(f"Importing {len(candles)} candles to database...")
    print(f"{'='*60}\n")

    # Get existing candles once
    existing_candles = []
    try:
        response = requests.get(f"{API_URL}/candles")
        if response.status_code == 200:
            existing_candles = response.json()
            print(f"Found {len(existing_candles)} existing candles in database\n")
    except Exception as e:
        print(f"Warning: Could not fetch existing candles: {e}\n")

    # Map categories
    category_map = {}

    success_count = 0
    error_count = 0
    skip_count = 0

    for idx, candle in enumerate(candles, 1):
        try:
            # Check if candle already exists
            if any(c['name'] == candle['name'] for c in existing_candles):
                skip_count += 1
                print(f"  [{idx}/{len(candles)}] ⏭️  SKIP: {candle['name']} (already exists)")
                continue

            # Get or create category
            category_name = candle.pop('category')
            if category_name not in category_map:
                category_map[category_name] = get_or_create_category(category_name)

            category_id = category_map[category_name]

            # Prepare candle data for API
            api_candle = {
                'category_id': category_id,
                'name': candle['name'],
                'tagline': candle['tagline'],
                'description': candle['description'],
                'practice': candle['practice'],
                'brand_name': 'АРТ-СВЕЧИ',
                'website': 'art-svechi.ligardi.ru',
                'is_active': True
            }

            # Create new candle
            response = requests.post(
                f"{API_URL}/candles",
                json=api_candle,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code in [200, 201]:
                success_count += 1
                print(f"  [{idx}/{len(candles)}] ✅ SUCCESS: {candle['name']}")
            else:
                error_count += 1
                print(f"  [{idx}/{len(candles)}] ❌ ERROR: {candle['name']} - {response.status_code}")
                print(f"       Response: {response.text[:200]}")

        except Exception as e:
            error_count += 1
            print(f"  [{idx}/{len(candles)}] ❌ EXCEPTION: {candle['name']} - {str(e)}")

    print(f"\n{'='*60}")
    print(f"Import completed!")
    print(f"  ✅ Success: {success_count}")
    print(f"  ⏭️  Skipped: {skip_count}")
    print(f"  ❌ Errors: {error_count}")
    print(f"  📊 Total: {len(candles)}")
    print(f"{'='*60}\n")


def export_to_json(candles, output_file):
    """Export parsed candles to JSON file for inspection"""
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(candles, f, ensure_ascii=False, indent=2)
    print(f"Exported {len(candles)} candles to {output_file}")


def main():
    print("\n" + "="*60)
    print("АРТ-СВЕЧИ - Candle Data Importer")
    print("="*60 + "\n")

    # Check if HTML file exists
    if not Path(HTML_FILE).exists():
        print(f"ERROR: HTML file not found: {HTML_FILE}")
        sys.exit(1)

    # Parse HTML
    candles = parse_html_file(HTML_FILE)

    if not candles:
        print("ERROR: No candles extracted from HTML!")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"Successfully extracted {len(candles)} candles!")
    print(f"{'='*60}\n")

    # Export to JSON for inspection
    json_output = "/var/www/labels/backend/extracted_candles.json"
    export_to_json(candles, json_output)

    # Ask for confirmation before importing
    print("\nReady to import to database at:", API_URL)
    response = input("Continue with import? (yes/no): ").strip().lower()

    if response in ['yes', 'y']:
        import_to_database(candles)
    else:
        print("\nImport cancelled. Data saved to:", json_output)
        print("Review the JSON file and run again when ready.")


if __name__ == "__main__":
    main()
