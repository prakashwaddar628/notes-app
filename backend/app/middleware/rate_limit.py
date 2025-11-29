from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.redis import redis_client
from datetime import datetime

class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        # skip unprotected routes
        if request.url.path in ["/auth/login", "/auth/register", "/docs", "/openapi.json"]:
            return await call_next(request)
        
        user_id = request.headers.get("user-id")
        if not user_id:
            return await call_next(request)

        key = f"ratelimit:{user_id}"
        
        current_count = redis_client.incr(key)
        if current_count == 1:
            redis_client.expire(key, 60)
        
        if current_count > 60:
            raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")

        return await call_next(request)