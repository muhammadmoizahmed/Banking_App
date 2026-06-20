from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base
import enum


class AccountType(str, enum.Enum):
    SAVINGS = "savings"
    CURRENT = "current"
    STUDENT = "student"


class AccountStatus(str, enum.Enum):
    ACTIVE = "active"
    FROZEN = "frozen"
    SUSPENDED = "suspended"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    account_number = Column(String, unique=True, index=True, nullable=False)
    iban = Column(String, unique=True, nullable=False)
    branch_code = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False, default=AccountType.SAVINGS)
    status = Column(Enum(AccountStatus), nullable=False, default=AccountStatus.ACTIVE)
    available_balance = Column(Float, default=0.0, nullable=False)
    ledger_balance = Column(Float, default=0.0, nullable=False)
    currency = Column(String, default="PKR", nullable=False)
    is_default = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    cards = relationship("Card", back_populates="account", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="account")
