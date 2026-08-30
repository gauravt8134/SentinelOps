import requests
import time
import ssl
import socket
from datetime import datetime
from urllib.parse import urlparse
from sqlalchemy.orm import Session
from app.models.website import Website
from app.models.website_check import WebsiteCheck

def get_ssl_expiry_days(url: str):
    """Opens a socket to the hostname and returns days until SSL expires."""
    try:
        parsed_url = urlparse(url)
        hostname = parsed_url.netloc
        
        # Only check SSL for HTTPS URLs
        if parsed_url.scheme != 'https' or not hostname:
            return None
            
        context = ssl.create_default_context()
        # Connect to port 443 (standard HTTPS port)
        with socket.create_connection((hostname, 443), timeout=5.0) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                # Extract the expiration date from the certificate
                expire_date = datetime.strptime(cert['notAfter'], "%b %d %H:%M:%S %Y %Z")
                days_remaining = (expire_date - datetime.utcnow()).days
                return days_remaining
    except Exception:
        # If there is an SSL error, timeout, or it's not HTTPS
        return None

def check_website(url: str, expected_text: str = None):
    """Performs a Datadog-style deep diagnostic ping of a website."""
    parsed_url = urlparse(url)
    hostname = parsed_url.netloc
    port = 443 if parsed_url.scheme == 'https' else 80

    # Initialize advanced metric variables
    dns_time_ms, tcp_time_ms, tls_time_ms, ttfb_ms, total_time_ms = None, None, None, None, None
    status_code = None
    status = "down"

    try:
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
        response = requests.get(url, timeout=10)
        total_time_ms = round((time.time() - start_http) * 1000, 2)
        ttfb_ms = round(response.elapsed.total_seconds() * 1000, 2)
        status_code = response.status_code

        # 5. Evaluate Status & Content Assertion
        if status_code < 400:
            if expected_text and expected_text not in response.text:
                status = "Assertion Failed"
            else:
                status = "up"
        else:
            status = "down"

    except Exception:
        pass # Variables remain None/down if the connection completely fails

    ssl_days = get_ssl_expiry_days(url)

    return {
        "status": status,
        "status_code": status_code,
        "response_time_ms": total_time_ms,
        "dns_time_ms": dns_time_ms,
        "tcp_time_ms": tcp_time_ms,
        "tls_time_ms": tls_time_ms,
        "ttfb_ms": ttfb_ms,
        "checked_at": datetime.utcnow(),
        "ssl_expiry_days": ssl_days
    }

def check_all_websites(db: Session):
    websites = db.query(Website).all()

    for website in websites:
        # Pass the URL and the new expected_text field
        result = check_website(website.url, website.expected_text)

        # Update the main Website record
        website.status = result["status"]
        website.response_time_ms = result["response_time_ms"]
        website.last_checked_at = result["checked_at"]
        website.ssl_expiry_days = result["ssl_expiry_days"]

        # Log the detailed historical check with the new waterfall metrics
        new_check = WebsiteCheck(
            website_id=website.id,
            status=result["status"],
            status_code=result["status_code"],
            response_time_ms=result["response_time_ms"],
            dns_time_ms=result["dns_time_ms"],
            tcp_time_ms=result["tcp_time_ms"],
            tls_time_ms=result["tls_time_ms"],
            ttfb_ms=result["ttfb_ms"],
            checked_at=result["checked_at"]
        )
        db.add(new_check)

    db.commit()

if __name__ == "__main__":
    from app.db.database import SessionLocal
    
    print("Starting manual website check cycle...")
    db = SessionLocal()
    try:
        check_all_websites(db)
        print("Check complete! Database updated.")
    finally:
        db.close()