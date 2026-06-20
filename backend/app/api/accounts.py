from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from ..database import get_db
from ..models.user import User
from ..models.account import Account
from ..models.transaction import Transaction
from ..schemas.account import (
    Account as AccountSchema,
    AccountCreate,
    AccountUpdate,
    AccountType,
)
from ..dependencies import get_current_user
from ..utils.account_utils import (
    generate_account_number,
    generate_iban,
    generate_branch_code,
)


router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


class DepositRequest(BaseModel):
    amount: float


class WithdrawRequest(BaseModel):
    amount: float


@router.get("/", response_model=List[AccountSchema])
def get_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).all()
    return accounts


@router.get("/{account_id}", response_model=AccountSchema)
def get_account(
    account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.post("/", response_model=AccountSchema)
def create_account(
    account_data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if account_data.is_default:
        existing = db.query(Account).filter(
            Account.user_id == current_user.id, Account.is_default == True
        ).first()
        if existing:
            existing.is_default = False

    account_number = generate_account_number()
    while db.query(Account).filter(Account.account_number == account_number).first():
        account_number = generate_account_number()

    iban = generate_iban()
    while db.query(Account).filter(Account.iban == iban).first():
        iban = generate_iban()

    account = Account(
        user_id=current_user.id,
        account_number=account_number,
        iban=iban,
        branch_code=generate_branch_code(),
        account_type=account_data.account_type,
        currency=account_data.currency,
        is_default=account_data.is_default,
    )

    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.put("/{account_id}", response_model=AccountSchema)
def update_account(
    account_id: int,
    account_data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account_data.is_default is True:
        existing = db.query(Account).filter(
            Account.user_id == current_user.id,
            Account.is_default == True,
            Account.id != account_id,
        ).first()
        if existing:
            existing.is_default = False

    update_data = account_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


@router.post("/{account_id}/deposit", response_model=AccountSchema)
def deposit(
    account_id: int,
    request: DepositRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.available_balance += request.amount
    account.ledger_balance += request.amount

    transaction = Transaction(
        account_id=account_id,
        user_id=current_user.id,
        transaction_type="deposit",
        amount=request.amount,
        description="Deposit",
    )
    db.add(transaction)
    db.commit()
    db.refresh(account)

    return account


@router.post("/{account_id}/withdraw", response_model=AccountSchema)
def withdraw(
    account_id: int,
    request: WithdrawRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(
        Account.id == account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if account.available_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    account.available_balance -= request.amount
    account.ledger_balance -= request.amount

    transaction = Transaction(
        account_id=account_id,
        user_id=current_user.id,
        transaction_type="withdraw",
        amount=request.amount,
        description="Withdraw",
    )
    db.add(transaction)
    db.commit()
    db.refresh(account)

    return account


@router.get("/default/my", response_model=AccountSchema)
def get_default_account(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    account = db.query(Account).filter(
        Account.user_id == current_user.id, Account.is_default == True
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="No default account found")
    return account
