import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from app.db.database import SessionLocal
from app.models.apm_log import APMLog

class APMMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)

        end_time = time.time()
        response_time_ms = (end_time - start_time) * 1000

        db = SessionLocal()
        try:
            log = APMLog(
                endpoint=request.url.path,
                method=request.method,
                status_code=response.status_code,
                response_time_ms=response_time_ms
            )
            db.add(log)
            db.commit()
        finally:
            db.close()

        return response