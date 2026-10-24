import requests
import time
import ssl
import socket
from datetime import datetime, timezone
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.website import Website
from app.models.website_check import WebsiteCheck

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------
MAX_RETRIES = 3               # attempts before declaring "down"
RETRY_DELAY_S = 1.5           # gap between retries
DEGRADED_THRESHOLD_MS = 3000  # CHANGED: was 1000. Slower than this = "degraded"
RECOVERY_COOLDOWN_S = 300     # don't fire /heal more than once per 5 min per site
REQUEST_HEADERS = {"User-Agent": "SentinelOps-Monitor/1.0"}  # ADDED


def utcnow():
    """Timezone-aware replacement for the deprecated datetime.utcnow()."""
    return datetime.now(timezone.utc)


def get_ssl_expiry_days(url: str):
    """Opens a socket to the hostname and returns days until SSL expires."""
    try:
        parsed_url = urlparse(url)
        hostname = parsed_url.netloc

        if parsed_url.scheme != 'https' or not hostname:
            return None

        context = ssl.create_default_context()
        with socket.create_connection((hostname, 443), timeout=5.0) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                expire_date = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")
                expire_date = expire_date.replace(tzinfo=timezone.utc)
                days_remaining = (expire_date - utcnow()).days
                return days_remaining
    except Exception:
        return None


def _classify_failure(exc: Exception) -> str:
    """Turn a raw exception into a human-readable reason for the dashboard."""
    if isinstance(exc, socket.gaierror):
        return "DNS Resolution Failed"
    if isinstance(exc, (socket.timeout, requests.exceptions.Timeout, TimeoutError)):
        return "Timeout"
    if isinstance(exc, (ConnectionRefusedError, requests.exceptions.ConnectionError)):
        return "Connection Refused"
    if isinstance(exc, ssl.SSLError):
        return "SSL/TLS Error"
    return "Unknown Error"


def _attempt_once(url: str, expected_text: str = None) -> dict:
    """A single diagnostic ping. Raises on hard failure so the caller can retry."""
    parsed_url = urlparse(url)
    hostname = parsed_url.hostname  # CHANGED: .hostname strips any :port
    port = parsed_url.port or (443 if parsed_url.scheme == 'https' else 80)

    dns_time_ms, tcp_time_ms, tls_time_ms, ttfb_ms, total_time_ms = None, None, None, None, None
    status_code = None

    # 1. DNS Resolution
    start_dns = time.time()
    ip = socket.gethostbyname(hostname)
    dns_time_ms = round((time.time() - start_dns) * 1000, 2)

    # 2. TCP Connection
    start_tcp = time.time()
    sock = socket.create_connection((ip, port), timeout=5.0)
    tcp_time_ms = round((time.time() - start_tcp) * 1000, 2)

    # 3. TLS Handshake (if HTTPS)
    if parsed_url.scheme == 'https':
        start_tls = time.time()
        context = ssl.create_default_context()
        ssock = context.wrap_socket(sock, server_hostname=hostname)
        tls_time_ms = round((time.time() - start_tls) * 1000, 2)
        ssock.close()
    else:
        sock.close()

    # 4. Total HTTP Request & TTFB
    start_http = time.time()
    response = requests.get(
        url,
        timeout=10,
        headers=REQUEST_HEADERS,   # ADDED
        allow_redirects=True,      # ADDED (explicit)
    )
    total_time_ms = round((time.time() - start_http) * 1000, 2)
    ttfb_ms = round(response.elapsed.total_seconds() * 1000, 2)
    status_code = response.status_code

    # 5. Evaluate Status & Content Assertion
    if status_code < 400:
        if expected_text and expected_text not in response.text:
            status = "assertion_failed"
        elif total_time_ms and total_time_ms > DEGRADED_THRESHOLD_MS:
            status = "degraded"
        else:
            status = "up"
    else:
        status = "down"

    return {
        "status": status,
        "status_code": status_code,
        "response_time_ms": total_time_ms,
        "dns_time_ms": dns_time_ms,
        "tcp_time_ms": tcp_time_ms,
        "tls_time_ms": tls_time_ms,
        "ttfb_ms": ttfb_ms,
        "failure_reason": None,
    }


def check_website(url: str, expected_text: str = None):
    """Performs a Datadog-style deep diagnostic ping, with retries before declaring down."""
    last_reason = "Unknown Error"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            result = _attempt_once(url, expected_text)
            result["checked_at"] = utcnow()
            result["ssl_expiry_days"] = get_ssl_expiry_days(url)
            return result
        except Exception as e:
            last_reason = _classify_failure(e)
            print(f"[check_website] attempt {attempt}/{MAX_RETRIES} failed for {url}: {last_reason} ({e})")  # ADDED: debug
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_S)

    # All retries exhausted -> genuinely down
    return {
        "status": "down",
        "status_code": None,
        "response_time_ms": None,
        "dns_time_ms": None,
        "tcp_time_ms": None,
        "tls_time_ms": None,
        "ttfb_ms": None,
        "checked_at": utcnow(),
        "ssl_expiry_days": None,
        "failure_reason": last_reason,
    }


def _try_auto_heal(website: Website) -> bool:
    """
    Fires the /heal endpoint for self-healing demo targets, respecting a cooldown
    so we never restart-loop. Returns True if a heal attempt was actually fired.
    """
    last_attempt = getattr(website, "last_recovery_attempt", None)
    if last_attempt is not None:
        if last_attempt.tzinfo is None:
            last_attempt = last_attempt.replace(tzinfo=timezone.utc)
        elapsed = (utcnow() - last_attempt).total_seconds()
        if elapsed < RECOVERY_COOLDOWN_S:
            print(f"[recovery] cooldown active for {website.url} "
                  f"({int(RECOVERY_COOLDOWN_S - elapsed)}s left) — skipping")
            return False

    print(f"CRASH DETECTED at {website.url}! Deploying Auto-Heal script...")
    try:
        requests.post("http://localhost:8001/heal", timeout=3)
        print("Server successfully healed.")
    except Exception as e:
        print(f"Auto-Heal failed: {e}")

    if hasattr(website, "last_recovery_attempt"):
        website.last_recovery_attempt = utcnow()
    return True


def _check_and_save_one(db: Session, website_id: int):
    """
    Re-fetches a single website fresh (in case it was deleted or changed by another
    request while a previous website in the batch was being checked), runs the check,
    and commits immediately — so one bad row never rolls back everyone else's results.
    """
    website = db.get(Website, website_id)
    if website is None:
        return

    result = check_website(website.url, website.expected_text)

    if result["status"] == "down" and "localhost:8001" in website.url:
        healed = _try_auto_heal(website)
        if healed:
            time.sleep(1.5)
            result = check_website(website.url, website.expected_text)

    website.status = result["status"]
    website.response_time_ms = result["response_time_ms"]
    website.last_checked_at = result["checked_at"]
    website.ssl_expiry_days = result["ssl_expiry_days"]
    if hasattr(website, "failure_reason"):
        website.failure_reason = result.get("failure_reason")

    check_kwargs = dict(
        website_id=website.id,
        status=result["status"],
        status_code=result["status_code"],
        response_time_ms=result["response_time_ms"],
        dns_time_ms=result["dns_time_ms"],
        tcp_time_ms=result["tcp_time_ms"],
        tls_time_ms=result["tls_time_ms"],
        ttfb_ms=result["ttfb_ms"],
        checked_at=result["checked_at"],
    )
    if hasattr(WebsiteCheck, "failure_reason"):
        check_kwargs["failure_reason"] = result.get("failure_reason")

    db.add(WebsiteCheck(**check_kwargs))
    db.commit()


def check_all_websites(db: Session):
    """
    Grabs just the IDs up front (cheap, fast), then checks + commits each
    website ONE AT A TIME. If a website was deleted mid-cycle, or any single
    check fails unexpectedly, we roll back only that one and move on —
    the rest of the batch is unaffected.
    """
    website_ids = [w.id for w in db.query(Website.id).all()]

    for website_id in website_ids:
        try:
            _check_and_save_one(db, website_id)
        except SQLAlchemyError as e:
            # The website was deleted or changed concurrently — safe to skip.
            db.rollback()
            print(f"[check_all_websites] Database error for website id={website_id}: {e}")
        except Exception as e:
            # Any other unexpected error: don't let it kill the whole batch.
            db.rollback()
            print(f"[check_all_websites] unexpected error checking website id={website_id}: {e}")


if __name__ == "__main__":
    from app.db.database import SessionLocal

    print("Starting manual website check cycle...")
    db = SessionLocal()
    try:
        check_all_websites(db)
        print("Check complete! Database updated.")
    finally:
        db.close()