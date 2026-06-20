from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class BeneficiaryBase(BaseModel):
    beneficiary_user_id: int
    nickname: Optional[str] = None

class BeneficiaryCreate(BeneficiaryBase):
    pass

class Beneficiary(BeneficiaryBase):
    id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True
