from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Category schemas
class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Candle schemas
class CandleBase(BaseModel):
    category_id: Optional[int] = None
    name: str
    tagline: Optional[str] = None
    description: str
    practice: str
    ritual_text: Optional[str] = None
    color: Optional[str] = None
    scent: Optional[str] = None
    brand_name: str = "АРТ-СВЕЧИ"
    website: str = "art-svechi.ligardi.ru"
    qr_image: Optional[str] = None
    logo_image: Optional[str] = None
    quantity: int = 1
    is_active: bool = True

class CandleCreate(CandleBase):
    pass

class CandleUpdate(BaseModel):
    category_id: Optional[int] = None
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    practice: Optional[str] = None
    ritual_text: Optional[str] = None
    color: Optional[str] = None
    scent: Optional[str] = None
    brand_name: Optional[str] = None
    website: Optional[str] = None
    qr_image: Optional[str] = None
    logo_image: Optional[str] = None
    quantity: Optional[int] = None
    is_active: Optional[bool] = None

class Candle(CandleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    category: Optional[Category] = None

    class Config:
        from_attributes = True

# Label Set schemas
class LabelSetBase(BaseModel):
    name: str
    description: Optional[str] = None

class LabelSetCreate(LabelSetBase):
    candle_ids: List[int] = []

class LabelSet(LabelSetBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class LabelSetWithCandles(LabelSet):
    candles: List[Candle] = []

# Generate labels request
class GenerateLabelsRequest(BaseModel):
    candle_ids: List[int]
    format: str = "html"  # html, pdf
    labels_per_page: int = 6