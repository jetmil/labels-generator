from typing import List
from models import Candle
import base64
import os

def image_to_base64(image_path: str) -> str:
    """Convert image file to base64 data URL"""
    try:
        if os.path.exists(image_path):
            with open(image_path, 'rb') as f:
                image_data = f.read()
                base64_data = base64.b64encode(image_data).decode('utf-8')
                ext = os.path.splitext(image_path)[1].lower()
                mime_type = 'image/png' if ext == '.png' else 'image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/svg+xml'
                return f"data:{mime_type};base64,{base64_data}"
    except Exception as e:
        print(f"Error converting image {image_path}: {e}")
    return ""

def generate_labels_html(candles: List[Candle], labels_per_page: int = 6) -> str:
    """Generate HTML for printing labels with rich magical design"""

    html_template = """
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Этикетки для свечей - АРТ-СВЕЧИ Мастерская Чародейки</title>
    <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 5mm;
        }

        @media print {
            body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                background: white !important;
            }
            .page {
                page-break-after: always;
                margin: 0;
            }
            .page:last-child {
                page-break-after: avoid;
            }
        }

        body {
            font-family: 'Montserrat', sans-serif;
            background: #1a1a2e;
            margin: 0;
            padding: 0;
        }

        /* Страница с этикетками - 9 на A4 */
        .page-labels {
            width: 210mm;
            height: 297mm;
            background: white;
            margin: 20px auto;
            padding: 0;
            display: grid;
            grid-template-columns: repeat(3, 70mm);
            grid-template-rows: repeat(3, 99mm);
            gap: 0;
        }

        /* Светлый дизайн этикетки для лучшей печати */
        .label {
            width: 70mm;
            height: 99mm;
            background: linear-gradient(160deg, #f8f0ff 0%, #f3e5ff 30%, #ffe0f5 60%, #ffd4e8 100%);
            border: 3px solid #5d1a75;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            padding: 4mm;
            color: #2d0a3d;
        }

        /* Звезды-искры */
        .label::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.8) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 30% 10%, rgba(255,255,255,0.6) 0%, transparent 100%),
                radial-gradient(1px 1px at 50% 30%, rgba(255,255,255,0.7) 0%, transparent 100%),
                radial-gradient(2px 2px at 70% 15%, rgba(255,215,0,0.8) 0%, transparent 100%),
                radial-gradient(1px 1px at 85% 25%, rgba(255,255,255,0.5) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 20% 80%, rgba(255,255,255,0.6) 0%, transparent 100%),
                radial-gradient(1px 1px at 60% 85%, rgba(255,215,0,0.7) 0%, transparent 100%),
                radial-gradient(2px 2px at 90% 70%, rgba(255,255,255,0.5) 0%, transparent 100%);
            pointer-events: none;
        }

        .label-header {
            text-align: center;
            margin-bottom: 2mm;
            position: relative;
            z-index: 1;
        }

        .label-category {
            font-size: 7pt;
            letter-spacing: 3px;
            text-transform: uppercase;
            color: #5d1a75;
            margin-bottom: 1mm;
            font-weight: 600;
        }

        .label-name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 15pt;
            font-weight: 700;
            color: #2d0a3d;
            text-transform: uppercase;
            letter-spacing: 1px;
            line-height: 1.1;
        }

        .label-name.long-title {
            font-size: 11pt;
        }

        .label-tagline {
            font-size: 8pt;
            font-style: italic;
            color: #8b2c5f;
            margin-top: 1.5mm;
            font-weight: 500;
        }

        .label-logo-area {
            width: 18mm;
            height: 18mm;
            margin: 3mm auto;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255,255,255,0.1);
            position: relative;
            z-index: 1;
            overflow: hidden;
        }

        .label-logo-area img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .label-description {
            flex: 1;
            font-size: 7.5pt;
            line-height: 1.4;
            color: #3d0a4d;
            text-align: center;
            padding: 0 2mm;
            position: relative;
            z-index: 1;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 5;
            -webkit-box-orient: vertical;
            font-weight: 500;
        }

        .label-footer {
            margin-top: auto;
            position: relative;
            z-index: 1;
        }

        .label-brand {
            text-align: center;
            margin-bottom: 2mm;
        }

        .label-brand-name {
            font-family: 'Cormorant Garamond', serif;
            font-size: 12pt;
            font-weight: 600;
            color: #8b4513;
            letter-spacing: 2px;
        }

        .label-website {
            font-size: 6.5pt;
            color: #5d1a75;
            letter-spacing: 0.5px;
        }

        .label-qr-row {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 2mm;
        }

        .label-qr {
            width: 12mm;
            height: 12mm;
            background: white;
            border-radius: 2px;
            padding: 1mm;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .label-qr img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .label-qr-text {
            font-size: 6pt;
            color: #5d1a75;
            text-align: left;
            font-weight: 500;
        }

        .divider {
            width: 60%;
            height: 1px;
            background: linear-gradient(90deg, transparent, rgba(139,44,95,0.5), transparent);
            margin: 2mm auto;
        }

        /* Страница с инструкциями - 4 на A4 */
        .page-instructions {
            width: 210mm;
            height: 297mm;
            background: white;
            margin: 20px auto;
            padding: 10mm;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: repeat(2, 1fr);
            gap: 5mm;
        }

        .instruction-card {
            background: linear-gradient(135deg, #f8f0ff 0%, #f3e5ff 50%, #ffe0f5 100%);
            border-radius: 10px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }

        /* Звезды для инструкций */
        .instruction-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                radial-gradient(1px 1px at 15% 25%, rgba(255,255,255,0.6) 0%, transparent 100%),
                radial-gradient(1.5px 1.5px at 85% 15%, rgba(255,215,0,0.7) 0%, transparent 100%),
                radial-gradient(1px 1px at 50% 80%, rgba(255,255,255,0.5) 0%, transparent 100%);
            pointer-events: none;
        }

        .instruction-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px solid rgba(232,185,35,0.3);
            position: relative;
            z-index: 1;
        }

        .instruction-logo {
            width: 45px;
            height: 45px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: rgba(255,255,255,0.1);
        }

        .instruction-logo img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .instruction-title {
            flex: 1;
            text-align: center;
            padding: 0 8px;
        }

        .instruction-title h2 {
            font-family: 'Cormorant Garamond', serif;
            font-size: 18pt;
            font-weight: 700;
            color: #2d0a3d;
            margin: 0 0 3px 0;
            text-transform: uppercase;
        }

        .instruction-subtitle {
            font-size: 10pt;
            color: #8b2c5f;
            font-style: italic;
            font-weight: 500;
        }

        .instruction-qr {
            width: 45px;
            height: 45px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: white;
            padding: 2px;
        }

        .instruction-qr img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .instruction-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 8px;
            position: relative;
            z-index: 1;
        }

        .instruction-section {
            padding: 6px 8px;
            background: rgba(255,255,255,0.08);
            border-radius: 6px;
            backdrop-filter: blur(5px);
        }

        .instruction-section h3 {
            font-size: 11pt;
            font-weight: 600;
            color: #8b4513;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .instruction-section p {
            font-size: 9pt;
            line-height: 1.3;
            color: #3d0a4d;
            text-align: justify;
            margin: 0;
            font-weight: 400;
        }

        .instruction-spell {
            background: rgba(139,44,95,0.08);
            border-left: 2px solid #8b2c5f;
            padding: 8px;
            border-radius: 6px;
            margin-top: 4px;
        }

        .instruction-spell h3 {
            font-size: 10pt;
            font-weight: 600;
            color: #8b4513;
            margin-bottom: 4px;
            text-transform: uppercase;
        }

        .instruction-spell p {
            font-family: 'Cormorant Garamond', serif;
            font-size: 8.5pt;
            line-height: 1.3;
            color: #2d0a3d;
            font-style: italic;
            white-space: pre-line;
            text-align: center;
            font-weight: 500;
        }

        .instruction-footer {
            margin-top: auto;
            padding-top: 6px;
            border-top: 1px solid rgba(232,185,35,0.2);
            text-align: center;
            position: relative;
            z-index: 1;
        }

        .instruction-brand {
            font-family: 'Cormorant Garamond', serif;
            font-size: 11pt;
            color: #8b4513;
            letter-spacing: 2px;
            margin-bottom: 2px;
        }

        .instruction-website {
            font-size: 8pt;
            color: #5d1a75;
        }

        @media screen {
            .page-labels, .page-instructions {
                margin: 20px auto;
                box-shadow: 0 0 20px rgba(0,0,0,0.5);
            }
        }
    </style>
</head>
<body>
"""

    # Group candles into label pages (9 per page)
    labels_per_page_count = 9
    label_pages = []
    for i in range(0, len(candles), labels_per_page_count):
        label_pages.append(candles[i:i + labels_per_page_count])

    # Group candles into instruction pages (4 per page)
    instructions_per_page_count = 4
    instruction_pages = []
    for i in range(0, len(candles), instructions_per_page_count):
        instruction_pages.append(candles[i:i + instructions_per_page_count])

    # Generate label pages
    for page_num, page_candles in enumerate(label_pages):
        html_template += f'    <!-- СТРАНИЦА {page_num + 1}: Этикетки -->\n'
        html_template += f'    <div class="page page-labels">\n'

        for candle in page_candles:
            category_name = candle.category.name if candle.category else "Магическая свеча"

            # Convert paths to base64 data URLs
            logo_path = candle.logo_image or "/uploads/logo/logo.png"
            qr_path = candle.qr_image or "/uploads/qr/qr.png"

            # Convert to absolute paths and then to base64
            logo_abs = logo_path if logo_path.startswith('/var/www') else f"/var/www/labels{logo_path}"
            qr_abs = qr_path if qr_path.startswith('/var/www') else f"/var/www/labels{qr_path}"

            logo_base64 = image_to_base64(logo_abs) or logo_path
            qr_base64 = image_to_base64(qr_abs) or qr_path

            # Check if name is long
            name_class = "label-name long-title" if len(candle.name) > 15 else "label-name"

            html_template += f"""
        <div class="label">
            <div class="label-header">
                <div class="label-category">{category_name}</div>
                <div class="{name_class}">{candle.name}</div>
                {f'<div class="label-tagline">{candle.tagline}</div>' if candle.tagline else ''}
            </div>
            <div class="label-logo-area">
                <img src="{logo_base64}" alt="АРТ-СВЕЧИ">
            </div>
            <div class="label-description">
                {candle.description}
            </div>
            <div class="divider"></div>
            <div class="label-footer">
                <div class="label-brand">
                    <div class="label-brand-name">{candle.brand_name}</div>
                    <div class="label-website">{candle.website}</div>
                </div>
                <div class="label-qr-row">
                    <div class="label-qr">
                        <img src="{qr_base64}" alt="QR код">
                    </div>
                    <div class="label-qr-text">
                        Группа<br>ВК
                    </div>
                </div>
            </div>
        </div>
"""

        html_template += '    </div>\n\n'

    # Generate instruction pages
    for page_num, page_candles in enumerate(instruction_pages):
        html_template += f'    <!-- СТРАНИЦА {len(label_pages) + page_num + 1}: Инструкции -->\n'
        html_template += f'    <div class="page page-instructions">\n'

        for candle in page_candles:
            # Convert paths to base64 data URLs
            logo_path = candle.logo_image or "/uploads/logo/logo.png"
            qr_path = candle.qr_image or "/uploads/qr/qr.png"

            # Convert to absolute paths and then to base64
            logo_abs = logo_path if logo_path.startswith('/var/www') else f"/var/www/labels{logo_path}"
            qr_abs = qr_path if qr_path.startswith('/var/www') else f"/var/www/labels{qr_path}"

            logo_base64 = image_to_base64(logo_abs) or logo_path
            qr_base64 = image_to_base64(qr_abs) or qr_path

            html_template += f"""
        <div class="instruction-card">
            <div class="instruction-header">
                <div class="instruction-logo">
                    <img src="{logo_base64}" alt="АРТ-СВЕЧИ">
                </div>
                <div class="instruction-title">
                    <h2>{candle.name}</h2>
                    {f'<div class="instruction-subtitle">{candle.tagline}</div>' if candle.tagline else ''}
                </div>
                <div class="instruction-qr">
                    <img src="{qr_base64}" alt="QR код">
                </div>
            </div>
            <div class="instruction-content">
                {f'''<div class="instruction-section">
                    <h3>Описание</h3>
                    <p>{candle.description}</p>
                </div>''' if candle.description else ''}
                {f'''<div class="instruction-section">
                    <h3>Как работать</h3>
                    <p>{candle.practice}</p>
                </div>''' if candle.practice else ''}
                {f'''<div class="instruction-spell">
                    <h3>Заговор</h3>
                    <p>{candle.ritual_text}</p>
                </div>''' if candle.ritual_text else ''}
            </div>
            <div class="instruction-footer">
                <div class="instruction-brand">{candle.brand_name}</div>
                <div class="instruction-website">{candle.website}</div>
            </div>
        </div>
"""

        html_template += '    </div>\n\n'

    html_template += """
</body>
</html>
"""

    return html_template