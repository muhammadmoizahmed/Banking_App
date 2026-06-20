import random
import string
from datetime import datetime, timedelta


def generate_account_number() -> str:
    return ''.join(random.choices(string.digits, k=14))


def generate_iban(country_code: str = "PK") -> str:
    bank_code = "BANK" + ''.join(random.choices(string.digits, k=8))
    account_number = ''.join(random.choices(string.digits, k=16))
    check_digits = random.randint(10, 99)
    return f"{country_code}{check_digits}{bank_code}{account_number}"


def generate_branch_code() -> str:
    return ''.join(random.choices(string.digits, k=4))


def generate_card_number() -> str:
    return ''.join(random.choices(string.digits, k=16))


def generate_expiry_date() -> tuple[str, str]:
    now = datetime.now()
    expiry = now + timedelta(days=365 * 5)  # 5 years
    return f"{expiry.month:02d}", f"{expiry.year}"


def generate_cvv() -> str:
    return ''.join(random.choices(string.digits, k=3))
