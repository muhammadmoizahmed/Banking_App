from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from ..database import get_db
from ..config import settings
from ..models.user import User
from ..models.wallet import Wallet
from ..models.account import Account
from ..schemas.user import UserCreate, UserLogin, User as UserSchema, Token
from ..utils.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from ..dependencies import get_current_user
from ..utils.account_utils import (
    generate_account_number,
    generate_iban,
    generate_branch_code,
)


router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserSchema)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(func.lower(User.email) == user.email).first()
    if db_user:
        raise HTTPException(status_code=409, detail="Email already registered")

    try:
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            phone=user.phone,
            password_hash=hashed_password,
        )
        db.add(db_user)
        db.flush()

        # Create default wallet for user
        default_wallet = Wallet(
            user_id=db_user.id,
            wallet_name="Main Wallet",
            balance=0.0,
            currency="PKR",
        )
        db.add(default_wallet)

        # Create default account for user
        account_number = generate_account_number()
        iban = generate_iban()
        default_account = Account(
            user_id=db_user.id,
            account_number=account_number,
            iban=iban,
            branch_code=generate_branch_code(),
            account_type="savings",
            available_balance=0.0,
            ledger_balance=0.0,
            currency="PKR",
            is_default=True,
        )
        db.add(default_account)
        db.commit()
        db.refresh(db_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    return db_user


@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user or not verify_password(user_credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    access_token = create_access_token(data={"sub": str(current_user.id)})
    refresh_token = create_refresh_token(data={"sub": str(current_user.id)})
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserSchema)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user



