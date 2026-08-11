from pydantic import BaseModel
from typing import Optional, List

class HoldingInput(BaseModel):
    symbol: str
    sector: str
    quantity: float
    average_price: float

class PortfolioRequest(BaseModel):
    user_id: str
    query: Optional[str] = None
    custom_holdings: Optional[List[HoldingInput]] = None
    save_for_future: bool = True