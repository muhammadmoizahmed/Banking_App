from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .user import User

class TransactionBase(BaseModel):
    transaction_type: str
    amount: float
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    wallet_id: int
    beneficiary_id: Optional[int] = None

class Transaction(TransactionBase):
    id: int
    wallet_id: Optional[int] = None
    account_id: Optional[int] = None
    user_id: int
    status: str
    beneficiary_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionWithUser(TransactionBase):
    id: int
    wallet_id: Optional[int] = None
    account_id: Optional[int] = None
    user_id: int
    status: str
    beneficiary_id: Optional[int] = None
    created_at: datetime
    user: Optional[User] = None
    beneficiary_user: Optional[User] = None

    class Config:
        from_attributes = True

class TransferRequest(BaseModel):
    recipient_account_number: str
    amount: float
    description: Optional[str] = None

class BillPaymentRequest(BaseModel):
    bill_type: str  # e.g., "electricity", "water", "internet"
    biller_name: str
    customer_id: str
    amount: float
    description: Optional[str] = None
