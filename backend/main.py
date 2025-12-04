from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
from datetime import datetime
import csv
import json
import io

from database import get_db, engine
from models import Base, Category, Candle, LabelSet, LabelSetCandle
import schemas
from label_generator import generate_labels_html

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Labels Generator API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.0.95:3200", "http://localhost:3200"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Labels Generator API", "version": "1.0.0"}

# Category endpoints
@app.get("/api/categories", response_model=List[schemas.Category])
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return categories

@app.post("/api/categories", response_model=schemas.Category)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = Category(name=category.name)
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

# Candle endpoints
@app.get("/api/candles", response_model=List[schemas.Candle])
def get_candles(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = True,
    sort_by: Optional[str] = "created_at",  # name, created_at
    sort_order: Optional[str] = "desc",  # asc, desc
    db: Session = Depends(get_db)
):
    query = db.query(Candle)
    if category_id:
        query = query.filter(Candle.category_id == category_id)
    if is_active is not None:
        query = query.filter(Candle.is_active == is_active)

    # Применяем сортировку
    if sort_by == "name":
        query = query.order_by(Candle.name.asc() if sort_order == "asc" else Candle.name.desc())
    else:  # created_at по умолчанию
        query = query.order_by(Candle.created_at.asc() if sort_order == "asc" else Candle.created_at.desc())

    candles = query.offset(skip).limit(limit).all()
    return candles

@app.get("/api/candles/{candle_id}", response_model=schemas.Candle)
def get_candle(candle_id: int, db: Session = Depends(get_db)):
    candle = db.query(Candle).filter(Candle.id == candle_id).first()
    if not candle:
        raise HTTPException(status_code=404, detail="Candle not found")
    return candle

@app.post("/api/candles", response_model=schemas.Candle)
def create_candle(candle: schemas.CandleCreate, db: Session = Depends(get_db)):
    db_candle = Candle(**candle.dict())
    db.add(db_candle)
    db.commit()
    db.refresh(db_candle)
    return db_candle

@app.put("/api/candles/{candle_id}", response_model=schemas.Candle)
def update_candle(candle_id: int, candle: schemas.CandleUpdate, db: Session = Depends(get_db)):
    db_candle = db.query(Candle).filter(Candle.id == candle_id).first()
    if not db_candle:
        raise HTTPException(status_code=404, detail="Candle not found")

    update_data = candle.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_candle, field, value)

    db.commit()
    db.refresh(db_candle)
    return db_candle

@app.delete("/api/candles/{candle_id}")
def delete_candle(candle_id: int, db: Session = Depends(get_db)):
    db_candle = db.query(Candle).filter(Candle.id == candle_id).first()
    if not db_candle:
        raise HTTPException(status_code=404, detail="Candle not found")

    db.delete(db_candle)
    db.commit()
    return {"message": "Candle deleted successfully"}

# Label Set endpoints
@app.get("/api/label-sets", response_model=List[schemas.LabelSet])
def get_label_sets(db: Session = Depends(get_db)):
    label_sets = db.query(LabelSet).all()
    return label_sets

@app.get("/api/label-sets/{label_set_id}", response_model=schemas.LabelSetWithCandles)
def get_label_set(label_set_id: int, db: Session = Depends(get_db)):
    label_set = db.query(LabelSet).filter(LabelSet.id == label_set_id).first()
    if not label_set:
        raise HTTPException(status_code=404, detail="Label set not found")

    candles = db.query(Candle).join(LabelSetCandle).filter(
        LabelSetCandle.label_set_id == label_set_id
    ).order_by(LabelSetCandle.position).all()

    result = schemas.LabelSetWithCandles.from_orm(label_set)
    result.candles = candles
    return result

@app.post("/api/label-sets", response_model=schemas.LabelSet)
def create_label_set(label_set: schemas.LabelSetCreate, db: Session = Depends(get_db)):
    db_label_set = LabelSet(name=label_set.name, description=label_set.description)
    db.add(db_label_set)
    db.commit()
    db.refresh(db_label_set)

    # Add candles to set
    for i, candle_id in enumerate(label_set.candle_ids):
        db_link = LabelSetCandle(
            label_set_id=db_label_set.id,
            candle_id=candle_id,
            position=i
        )
        db.add(db_link)
    db.commit()

    return db_label_set

# Upload endpoints
@app.post("/api/upload/logo")
async def upload_logo(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Защита от path traversal - только базовое имя файла
    from pathlib import Path
    safe_filename = Path(file.filename).name

    if not safe_filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PNG and JPEG files are allowed")

    # Дополнительная проверка на опасные символы
    if any(char in safe_filename for char in ['..', '/', '\\', '\0']):
        raise HTTPException(status_code=400, detail="Invalid filename")

    filename = f"logo_{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_filename}"
    file_path = os.path.join("/var/www/labels/uploads/logos", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": filename, "url": f"/uploads/logos/{filename}"}

@app.post("/api/upload/qr")
async def upload_qr(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Защита от path traversal - только базовое имя файла
    from pathlib import Path
    safe_filename = Path(file.filename).name

    if not safe_filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        raise HTTPException(status_code=400, detail="Only PNG and JPEG files are allowed")

    # Дополнительная проверка на опасные символы
    if any(char in safe_filename for char in ['..', '/', '\\', '\0']):
        raise HTTPException(status_code=400, detail="Invalid filename")

    filename = f"qr_{datetime.now().strftime('%Y%m%d%H%M%S')}_{safe_filename}"
    file_path = os.path.join("/var/www/labels/uploads/qr", filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": filename, "url": f"/uploads/qr/{filename}"}

# Generate labels endpoint
@app.post("/api/generate-labels")
def generate_labels(request: schemas.GenerateLabelsRequest, db: Session = Depends(get_db)):
    candles = db.query(Candle).filter(Candle.id.in_(request.candle_ids)).all()

    if not candles:
        raise HTTPException(status_code=404, detail="No candles found")

    if request.format == "html":
        html_content = generate_labels_html(candles, request.labels_per_page)
        return HTMLResponse(content=html_content)
    else:
        raise HTTPException(status_code=400, detail="Unsupported format")

# Bulk import endpoint
@app.post("/api/candles/import")
async def import_candles(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Import candles from CSV or JSON file"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    file_ext = file.filename.lower().split('.')[-1]
    content = await file.read()

    imported_count = 0
    errors = []

    try:
        if file_ext == 'csv':
            # Parse CSV
            text_content = content.decode('utf-8')
            csv_reader = csv.DictReader(io.StringIO(text_content))

            for row_num, row in enumerate(csv_reader, start=2):
                try:
                    # Get or create category
                    category = None
                    if row.get('category'):
                        category = db.query(Category).filter(Category.name == row['category']).first()
                        if not category:
                            category = Category(name=row['category'])
                            db.add(category)
                            db.commit()
                            db.refresh(category)

                    # Create candle
                    candle_data = {
                        'name': row['name'],
                        'tagline': row.get('tagline', ''),
                        'category_id': category.id if category else None,
                        'description': row['description'],
                        'practice': row['practice'],
                        'ritual_text': row.get('ritual_text', ''),
                        'color': row.get('color', ''),
                        'scent': row.get('scent', ''),
                        'brand_name': row.get('brand_name', 'АРТ-СВЕЧИ'),
                        'website': row.get('website', 'art-svechi.ligardi.ru'),
                        'qr_image': row.get('qr_image', ''),
                        'logo_image': row.get('logo_image', ''),
                        'is_active': row.get('is_active', '1') in ['1', 'true', 'True', 'yes'],
                    }

                    db_candle = Candle(**candle_data)
                    db.add(db_candle)
                    db.commit()
                    imported_count += 1

                except Exception as e:
                    errors.append(f"Строка {row_num}: {str(e)}")
                    db.rollback()

        elif file_ext == 'json':
            # Parse JSON
            data = json.loads(content.decode('utf-8'))

            if not isinstance(data, list):
                raise HTTPException(status_code=400, detail="JSON должен содержать массив объектов")

            for idx, item in enumerate(data, start=1):
                try:
                    # Get or create category
                    category = None
                    if item.get('category'):
                        category = db.query(Category).filter(Category.name == item['category']).first()
                        if not category:
                            category = Category(name=item['category'])
                            db.add(category)
                            db.commit()
                            db.refresh(category)

                    # Create candle
                    candle_data = {
                        'name': item['name'],
                        'tagline': item.get('tagline', ''),
                        'category_id': category.id if category else None,
                        'description': item['description'],
                        'practice': item['practice'],
                        'ritual_text': item.get('ritual_text', ''),
                        'color': item.get('color', ''),
                        'scent': item.get('scent', ''),
                        'brand_name': item.get('brand_name', 'АРТ-СВЕЧИ'),
                        'website': item.get('website', 'art-svechi.ligardi.ru'),
                        'qr_image': item.get('qr_image', ''),
                        'logo_image': item.get('logo_image', ''),
                        'is_active': item.get('is_active', True),
                    }

                    db_candle = Candle(**candle_data)
                    db.add(db_candle)
                    db.commit()
                    imported_count += 1

                except Exception as e:
                    errors.append(f"Элемент {idx}: {str(e)}")
                    db.rollback()
        else:
            raise HTTPException(status_code=400, detail="Поддерживаются только CSV и JSON файлы")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Ошибка обработки файла: {str(e)}")

    return {
        "imported": imported_count,
        "errors": errors,
        "total": imported_count + len(errors)
    }

# Download CSV template
@app.get("/api/candles/template/csv")
def download_csv_template():
    """Download CSV template for bulk import"""
    csv_content = """name,tagline,category,description,practice,ritual_text,color,scent,brand_name,website,qr_image,logo_image,is_active
СВЕЧА ОЧИЩЕНИЯ,Путь к чистоте,Программная свеча,Свеча для глубокого очищения ауры и пространства,Зажгите свечу в тихом месте. Сосредоточьтесь на намерении очищения.,Огонь горит - очищает. Свет сияет - защищает. Да будет так.,Белый,Лаванда,АРТ-СВЕЧИ,art-svechi.ligardi.ru,/uploads/qr/qr.png,/uploads/logo/logo.png,1"""

    return HTMLResponse(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=candles_template.csv"}
    )

# Static files serving with path traversal protection
@app.get("/uploads/{file_type}/{filename}")
async def get_upload(file_type: str, filename: str):
    # Защита от path traversal
    if ".." in file_type or ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=403, detail="Недопустимый путь")

    # Белый список разрешённых типов файлов
    allowed_file_types = ["logos", "qr", "images", "documents"]
    if file_type not in allowed_file_types:
        raise HTTPException(status_code=403, detail="Недопустимый тип файла")

    # Используем Path для безопасной работы с путями
    from pathlib import Path
    base_dir = Path("/var/www/labels/uploads").resolve()
    file_path = (base_dir / file_type / filename).resolve()

    # Проверяем, что итоговый путь находится внутри разрешённой директории
    if not str(file_path).startswith(str(base_dir)):
        raise HTTPException(status_code=403, detail="Доступ запрещён")

    # Проверяем существование файла
    if not file_path.exists() or not file_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(file_path)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8201))
    uvicorn.run(app, host="0.0.0.0", port=port)