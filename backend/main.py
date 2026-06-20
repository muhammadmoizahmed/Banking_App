from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import (
    auth,
    users,
    wallets,
    transactions,
    notifications,
    beneficiaries,
    accounts,
    cards,
)
from app.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IU-Pay API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(wallets.router)
app.include_router(transactions.router)
app.include_router(notifications.router)
app.include_router(beneficiaries.router)
app.include_router(accounts.router)
app.include_router(cards.router)


@app.get("/")
def root():
    return {"message": "IU-Pay API"}
