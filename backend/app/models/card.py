from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import enum


class CardType(str, enum.Enum):
    VIRTUAL = "virtual"
    PHYSICAL = "physical"


class CardStatus(str, enum.Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    EXPIRED = "expired"


class Card(Base):
    __tablename__ = "cards"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    card_number = Column(String, unique=True, nullable=False)
    expiry_month = Column(String(2), nullable=False)
    expiry_year = Column(String(4), nullable=False)
    cvv = Column(String, nullable=False)
    card_type = Column(Enum(CardType), nullable=False)
    status = Column(Enum(CardStatus), nullable=False, default=CardStatus.ACTIVE)
    daily_limit = Column(Float, default=100000.0)
    online_limit = Column(Float, default=50000.0)
    daily_spent = Column(Float, default=0.0)
    online_spent = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    account = relationship("Account", back_populates="cards")
    user = relationship("User", back_populates="cards")
