from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.beneficiary import Beneficiary
from ..schemas.beneficiary import Beneficiary as BeneficiarySchema, BeneficiaryCreate
from ..schemas.user import User as UserSchema
from ..dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime

# Create a new schema that includes beneficiary user details
class BeneficiaryWithUser(BaseModel):
    id: int
    user_id: int
    beneficiary_user_id: int
    nickname: str | None = None
    created_at: datetime
    beneficiary_user: UserSchema
    beneficiary_account_number: str | None = None

    class Config:
        from_attributes = True

router = APIRouter(prefix="/api/beneficiaries", tags=["Beneficiaries"])

@router.get("/", response_model=List[BeneficiaryWithUser])
def get_beneficiaries(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    beneficiaries = db.query(Beneficiary)\
        .options(selectinload(Beneficiary.beneficiary_user).selectinload(User.accounts))\
        .filter(Beneficiary.user_id == current_user.id).all()

    result = []
    for beneficiary in beneficiaries:
        account_number = None
        if beneficiary.beneficiary_user and beneficiary.beneficiary_user.accounts:
            default_account = next(
                (account for account in beneficiary.beneficiary_user.accounts if account.is_default),
                beneficiary.beneficiary_user.accounts[0],
            )
            account_number = default_account.account_number

        result.append({
            "id": beneficiary.id,
            "user_id": beneficiary.user_id,
            "beneficiary_user_id": beneficiary.beneficiary_user_id,
            "nickname": beneficiary.nickname,
            "created_at": beneficiary.created_at,
            "beneficiary_user": beneficiary.beneficiary_user,
            "beneficiary_account_number": account_number,
        })

    return result

@router.post("/", response_model=BeneficiaryWithUser)
def add_beneficiary(beneficiary: BeneficiaryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check if beneficiary user exists
    beneficiary_user = db.query(User).filter(User.id == beneficiary.beneficiary_user_id).first()
    if not beneficiary_user:
        raise HTTPException(status_code=404, detail="Beneficiary user not found")
    
    db_beneficiary = Beneficiary(
        user_id=current_user.id,
        beneficiary_user_id=beneficiary.beneficiary_user_id,
        nickname=beneficiary.nickname
    )
    db.add(db_beneficiary)
    db.commit()
    db.refresh(db_beneficiary)
    
    # Load the beneficiary user
    db.refresh(db_beneficiary, attribute_names=["beneficiary_user"])
    db.refresh(db_beneficiary.beneficiary_user, attribute_names=["accounts"])
    account_number = None
    if db_beneficiary.beneficiary_user and db_beneficiary.beneficiary_user.accounts:
        default_account = next(
            (account for account in db_beneficiary.beneficiary_user.accounts if account.is_default),
            db_beneficiary.beneficiary_user.accounts[0],
        )
        account_number = default_account.account_number

    return {
        "id": db_beneficiary.id,
        "user_id": db_beneficiary.user_id,
        "beneficiary_user_id": db_beneficiary.beneficiary_user_id,
        "nickname": db_beneficiary.nickname,
        "created_at": db_beneficiary.created_at,
        "beneficiary_user": db_beneficiary.beneficiary_user,
        "beneficiary_account_number": account_number,
    }

@router.delete("/{beneficiary_id}")
def delete_beneficiary(beneficiary_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    beneficiary = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id, Beneficiary.user_id == current_user.id).first()
    if not beneficiary:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    db.delete(beneficiary)
    db.commit()
    return {"message": "Beneficiary deleted"}
