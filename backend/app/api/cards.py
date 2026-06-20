from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.account import Account
from ..models.card import Card, CardType, CardStatus
from ..schemas.card import (
    Card as CardSchema,
    CardCreate,
    CardUpdate,
)
from ..dependencies import get_current_user
from ..utils.account_utils import (
    generate_card_number,
    generate_expiry_date,
    generate_cvv,
)


router = APIRouter(prefix="/api/cards", tags=["Cards"])


@router.get("/", response_model=List[CardSchema])
def get_cards(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    cards = db.query(Card).filter(Card.user_id == current_user.id).all()
    return cards


@router.get("/{card_id}", response_model=CardSchema)
def get_card(
    card_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(
        Card.id == card_id, Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    return card


@router.post("/", response_model=CardSchema)
def create_card(
    card_data: CardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(
        Account.id == card_data.account_id, Account.user_id == current_user.id
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    card_number = generate_card_number()
    while db.query(Card).filter(Card.card_number == card_number).first():
        card_number = generate_card_number()

    expiry_month, expiry_year = generate_expiry_date()

    card = Card(
        account_id=card_data.account_id,
        user_id=current_user.id,
        card_number=card_number,
        expiry_month=expiry_month,
        expiry_year=expiry_year,
        cvv=generate_cvv(),
        card_type=card_data.card_type,
        daily_limit=card_data.daily_limit,
        online_limit=card_data.online_limit,
    )

    db.add(card)
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}/freeze", response_model=CardSchema)
def freeze_card(
    card_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(
        Card.id == card_id, Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.status = CardStatus.FROZEN
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}/unfreeze", response_model=CardSchema)
def unfreeze_card(
    card_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(
        Card.id == card_id, Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    card.status = CardStatus.ACTIVE
    db.commit()
    db.refresh(card)
    return card


@router.put("/{card_id}", response_model=CardSchema)
def update_card(
    card_id: int,
    card_data: CardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    card = db.query(Card).filter(
        Card.id == card_id, Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    update_data = card_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(card, field, value)

    db.commit()
    db.refresh(card)
    return card


@router.delete("/{card_id}")
def delete_card(
    card_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    card = db.query(Card).filter(
        Card.id == card_id, Card.user_id == current_user.id
    ).first()
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    db.delete(card)
    db.commit()
    return {"message": "Card deleted successfully"}
