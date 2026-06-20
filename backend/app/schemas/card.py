from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class CardType(str, Enum):
    VIRTUAL = "virtual"
    PHYSICAL = "physical"


class CardStatus(str, Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    EXPIRED = "expired"


class CardBase(BaseModel):
    card_type: CardType
    daily_limit: float = 100000.0
    online_limit: float = 50000.0


class CardCreate(CardBase):
    account_id: int


class CardUpdate(BaseModel):
    daily_limit: Optional[float] = None
    online_limit: Optional[float] = None


class Card(CardBase):
    id: int
    account_id: int
    user_id: int
    card_number: str
    expiry_month: str
    expiry_year: str
    cvv: str
    status: CardStatus
    daily_spent: float
    online_spent: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
