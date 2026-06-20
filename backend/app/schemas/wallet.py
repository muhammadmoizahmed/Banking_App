from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class WalletBase(BaseModel):
    wallet_name: str
    currency: Optional[str] = "USD"

class WalletCreate(WalletBase):
    pass

class Wallet(WalletBase):
    id: int
    user_id: int
    balance: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class WalletBalanceUpdate(BaseModel):
    amount: float
