from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class AccountType(str, Enum):
    SAVINGS = "savings"
    CURRENT = "current"
    STUDENT = "student"


class AccountStatus(str, Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    SUSPENDED = "suspended"


class AccountBase(BaseModel):
    account_type: AccountType = AccountType.SAVINGS
    currency: str = "PKR"
    is_default: bool = True


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    account_type: Optional[AccountType] = None
    is_default: Optional[bool] = None


class Account(AccountBase):
    id: int
    user_id: int
    account_number: str
    iban: str
    branch_code: str
    status: AccountStatus
    available_balance: float
    ledger_balance: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
