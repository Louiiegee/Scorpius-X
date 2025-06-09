
from fastapi import Depends, HTTPException

def require_role(role: str):
    def decorator(user=Depends()):
        if getattr(user, "role", None) != role:
            raise HTTPException(status_code=403, detail="Forbidden")
    return decorator
