from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, TIMESTAMP, func, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    candles = relationship("Candle", back_populates="category")

class Candle(Base):
    __tablename__ = "candles"
    __table_args__ = (UniqueConstraint('name', name='unique_candle_name'),)

    id = Column(Integer, primary_key=True, index=True)
    sequence_number = Column(Integer, nullable=True)  # Добавляем поле порядкового номера
    display_name = Column(String(300), nullable=True)  # Добавляем поле для отображения с номером
    category_id = Column(Integer, ForeignKey("categories.id"))
    name = Column(String(200), nullable=False)
    tagline = Column(String(200))
    description = Column(Text, nullable=False)
    practice = Column(Text, nullable=False)
    ritual_text = Column(Text)
    color = Column(String(100))
    scent = Column(String(200))
    brand_name = Column(String(100), default="АРТ-СВЕЧИ")
    website = Column(String(200), default="art-svechi.ligardi.ru")
    qr_image = Column(String(500))
    logo_image = Column(String(500))
    quantity = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    last_modified_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    category = relationship("Category", back_populates="candles")
    label_sets = relationship("LabelSetCandle", back_populates="candle")

class LabelSet(Base):
    __tablename__ = "label_sets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())

    candles = relationship("LabelSetCandle", back_populates="label_set")

class LabelSetCandle(Base):
    __tablename__ = "label_set_candles"

    id = Column(Integer, primary_key=True, index=True)
    label_set_id = Column(Integer, ForeignKey("label_sets.id", ondelete="CASCADE"))
    candle_id = Column(Integer, ForeignKey("candles.id", ondelete="CASCADE"))
    position = Column(Integer, default=0)

    label_set = relationship("LabelSet", back_populates="candles")
    candle = relationship("Candle", back_populates="label_sets")
