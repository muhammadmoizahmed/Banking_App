# Banking App Backend

## Setup

1. Create a virtual environment
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Create a PostgreSQL database
4. Copy `.env.example` to `.env` and update the database URL and secret key
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## API Documentation

Access the API docs at `http://localhost:8000/docs`
