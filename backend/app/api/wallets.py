from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.wallet import Wallet
from ..schemas.wallet import Wallet as WalletSchema, WalletCreate, WalletBalanceUpdate
from ..dependencies import get_current_user

router = APIRouter(prefix="/api/wallets", tags=["Wallets"])

@router.post("/", response_model=WalletSchema)
def create_wallet(wallet: WalletCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_wallet = Wallet(
        user_id=current_user.id,
        wallet_name=wallet.wallet_name,
        currency=wallet.currency
    )
    db.add(db_wallet)
    db.commit()
    db.refresh(db_wallet)
    return db_wallet

@router.get("/", response_model=List[WalletSchema])
def get_wallets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wallets = db.query(Wallet).filter(Wallet.user_id == current_user.id).all()
    return wallets

@router.get("/{wallet_id}", response_model=WalletSchema)
def get_wallet(wallet_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet

@router.post("/{wallet_id}/deposit")
def deposit(wallet_id: int, balance_update: WalletBalanceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    wallet.balance += balance_update.amount
    db.commit()
    db.refresh(wallet)
    from ..models.transaction import Transaction
    transaction = Transaction(
        wallet_id=wallet_id,
        user_id=current_user.id,
        transaction_type="deposit",
        amount=balance_update.amount,
        description="Deposit"
    )
    db.add(transaction)
    db.commit()
    return {"message": "Deposit successful", "balance": wallet.balance}

@router.post("/{wallet_id}/withdraw")
def withdraw(wallet_id: int, balance_update: WalletBalanceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    wallet = db.query(Wallet).filter(Wallet.id == wallet_id, Wallet.user_id == current_user.id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet.balance < balance_update.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")
    wallet.balance -= balance_update.amount
    db.commit()
    db.refresh(wallet)
    from ..models.transaction import Transaction
    transaction = Transaction(
        wallet_id=wallet_id,
        user_id=current_user.id,
        transaction_type="withdrawal",
        amount=balance_update.amount,
        description="Withdrawal"
    )
    db.add(transaction)
    db.commit()
    return {"message": "Withdrawal successful", "balance": wallet.balance}
