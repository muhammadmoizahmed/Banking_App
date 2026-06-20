from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
from datetime import datetime, timedelta
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from ..database import get_db
from ..models.user import User
from ..models.wallet import Wallet
from ..models.account import Account
from ..models.transaction import Transaction
from ..models.notification import Notification
from ..schemas.transaction import TransactionWithUser, TransferRequest, BillPaymentRequest
from ..dependencies import get_current_user


router = APIRouter(prefix="/api/transactions", tags=["Transactions"])


@router.get("/", response_model=List[TransactionWithUser])
def get_transactions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = db.query(Transaction).options(
        selectinload(Transaction.user),
        selectinload(Transaction.beneficiary_user),
    ).filter(
        (Transaction.user_id == current_user.id) | (Transaction.beneficiary_id == current_user.id)
    ).order_by(Transaction.created_at.desc()).all()
    return transactions


@router.post("/transfer")
def transfer(
    transfer_request: TransferRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Get recipient account by account number
    recipient_account = db.query(Account).filter(
        Account.account_number == transfer_request.recipient_account_number
    ).first()
    if not recipient_account:
        raise HTTPException(status_code=404, detail="Recipient account not found")
    
    recipient = db.query(User).filter(User.id == recipient_account.user_id).first()
    if recipient.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot transfer to yourself")

    # Get sender's account
    sender_account = db.query(Account).filter(
        Account.user_id == current_user.id, Account.is_default == True
    ).first()
    if not sender_account:
        sender_account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not sender_account:
        raise HTTPException(status_code=400, detail="Sender has no account")

    if sender_account.available_balance < transfer_request.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    sender_account.available_balance -= transfer_request.amount
    sender_account.ledger_balance -= transfer_request.amount
    recipient_account.available_balance += transfer_request.amount
    recipient_account.ledger_balance += transfer_request.amount

    debit_transaction = Transaction(
        account_id=sender_account.id,
        user_id=current_user.id,
        transaction_type="transfer",
        amount=transfer_request.amount,
        description=transfer_request.description,
        beneficiary_id=recipient.id,
    )
    credit_transaction = Transaction(
        account_id=recipient_account.id,
        user_id=recipient.id,
        transaction_type="receive",
        amount=transfer_request.amount,
        description=transfer_request.description,
        beneficiary_id=current_user.id,
    )

    db.add(debit_transaction)
    db.add(credit_transaction)

    # Create notifications
    sender_notification = Notification(
        user_id=current_user.id,
        title="Payment Sent",
        message=f"You sent Rs.{transfer_request.amount:.2f} to {recipient.first_name} {recipient.last_name}",
    )

    recipient_notification = Notification(
        user_id=recipient.id,
        title="Payment Received",
        message=f"You received Rs.{transfer_request.amount:.2f} from {current_user.first_name} {current_user.last_name}",
    )

    db.add(sender_notification)
    db.add(recipient_notification)

    db.commit()

    return {"message": "Transfer successful", "transaction": debit_transaction}


@router.post("/bill-payment")
def pay_bill(
    bill_request: BillPaymentRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Get sender's account
    sender_account = db.query(Account).filter(
        Account.user_id == current_user.id, Account.is_default == True
    ).first()
    if not sender_account:
        sender_account = db.query(Account).filter(Account.user_id == current_user.id).first()
    if not sender_account:
        raise HTTPException(status_code=400, detail="Sender has no account")

    if sender_account.available_balance < bill_request.amount:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    sender_account.available_balance -= bill_request.amount
    sender_account.ledger_balance -= bill_request.amount

    # Create bill payment transaction
    bill_transaction = Transaction(
        account_id=sender_account.id,
        user_id=current_user.id,
        transaction_type="bill_payment",
        amount=bill_request.amount,
        description=f"{bill_request.bill_type} payment to {bill_request.biller_name} (Customer ID: {bill_request.customer_id}) - {bill_request.description or ''}",
    )

    db.add(bill_transaction)

    # Create notification
    notification = Notification(
        user_id=current_user.id,
        title="Bill Payment Successful",
        message=f"You paid Rs.{bill_request.amount:.2f} for {bill_request.bill_type} to {bill_request.biller_name}",
    )

    db.add(notification)

    db.commit()

    return {"message": "Bill payment successful", "transaction": bill_transaction}


@router.get("/receipt/{transaction_id}")
def get_transaction_receipt(transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transaction = db.query(Transaction).options(
        selectinload(Transaction.user),
        selectinload(Transaction.beneficiary_user)
    ).filter(
        (Transaction.id == transaction_id) &
        ((Transaction.user_id == current_user.id) | (Transaction.beneficiary_id == current_user.id))
    ).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Generate PDF receipt
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title = Paragraph("<b>TRANSACTION RECEIPT</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Account info
    account_info = [
        ["Transaction ID", str(transaction.id)],
        ["Date", transaction.created_at.strftime("%Y-%m-%d %H:%M:%S")],
        ["Type", transaction.transaction_type],
        ["Amount", f"Rs. {transaction.amount:.2f}"],
        ["Description", transaction.description or "-"],
    ]
    account_table = Table(account_info)
    account_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(account_table)
    elements.append(Spacer(1, 24))

    # Footer
    footer = Paragraph("<i>Thank you for using our banking app!</i>", styles['BodyText'])
    elements.append(footer)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=receipt_{transaction.id}.pdf"
        }
    )


@router.get("/statement")
def get_account_statement(
    duration: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Calculate date range
    now = datetime.utcnow()
    if duration == "1week":
        start_date = now - timedelta(weeks=1)
    elif duration == "1month":
        start_date = now - timedelta(days=30)
    elif duration == "6months":
        start_date = now - timedelta(days=180)
    elif duration == "12months":
        start_date = now - timedelta(days=365)
    elif duration == "6years":
        start_date = now - timedelta(days=365*6)
    else:
        raise HTTPException(status_code=400, detail="Invalid duration")

    # Get transactions in date range
    transactions = db.query(Transaction).options(
        selectinload(Transaction.user),
        selectinload(Transaction.beneficiary_user)
    ).filter(
        ((Transaction.user_id == current_user.id) | (Transaction.beneficiary_id == current_user.id)) &
        (Transaction.created_at >= start_date)
    ).order_by(Transaction.created_at.desc()).all()

    # Generate PDF statement
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title = Paragraph(f"<b>ACCOUNT STATEMENT</b>", styles['Title'])
    elements.append(title)
    elements.append(Spacer(1, 12))

    # Date range
    date_info = Paragraph(
        f"<i>Statement from {start_date.strftime('%Y-%m-%d')} to {now.strftime('%Y-%m-%d')}</i>",
        styles['BodyText']
    )
    elements.append(date_info)
    elements.append(Spacer(1, 24))

    # Transactions table
    table_data = [
        ["Date", "Type", "Amount", "Description"]
    ]
    for tx in transactions:
        table_data.append([
            tx.created_at.strftime("%Y-%m-%d"),
            tx.transaction_type,
            f"Rs. {tx.amount:.2f}",
            tx.description or "-"
        ])
    
    tx_table = Table(table_data)
    tx_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.lightblue),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(tx_table)
    elements.append(Spacer(1, 24))

    # Footer
    footer = Paragraph("<i>Thank you for using our banking app! For longer statements, please contact the bank.</i>", styles['BodyText'])
    elements.append(footer)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=statement_{duration}.pdf"
        }
    )


@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Get default account
    default_account = db.query(Account).filter(
        Account.user_id == current_user.id, Account.is_default == True
    ).first()

    total_balance = (
        default_account.available_balance if default_account else 0.0
    )

    transactions = db.query(Transaction).filter(
        (Transaction.user_id == current_user.id) | (Transaction.beneficiary_id == current_user.id)
    ).all()

    total_income = sum(
        t.amount
        for t in transactions
        if t.transaction_type in ["deposit", "receive"] and t.user_id == current_user.id
    )
    total_expenses = sum(
        t.amount
        for t in transactions
        if t.transaction_type in ["withdrawal", "transfer"] and t.user_id == current_user.id
    )

    recent_transactions = db.query(Transaction).options(
        selectinload(Transaction.user),
        selectinload(Transaction.beneficiary_user),
    ).filter(
        (Transaction.user_id == current_user.id) | (Transaction.beneficiary_id == current_user.id)
    ).order_by(Transaction.created_at.desc()).limit(10).all()

    unread_count = db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).count()

    return {
        "total_balance": total_balance,
        "total_income": total_income,
        "total_expenses": total_expenses,
        "recent_transactions": recent_transactions,
        "unread_notifications_count": unread_count,
        "account": default_account,
    }


@router.get("/{transaction_id}", response_model=TransactionWithUser)
def get_transaction(
    transaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    transaction = db.query(Transaction).options(
        selectinload(Transaction.user),
        selectinload(Transaction.beneficiary_user),
    ).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if transaction.user_id != current_user.id and transaction.beneficiary_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return transaction
