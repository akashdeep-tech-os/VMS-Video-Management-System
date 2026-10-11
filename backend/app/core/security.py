"""Password hashing and access-token helpers.

Deliberately stdlib-only: passwords use PBKDF2-HMAC-SHA256 with a random
per-user salt, tokens are compact HS256 JWTs. Both are verified with a
constant-time comparison.
"""

import base64
import hashlib
import hmac
import json
import os
import time

from app.core.config import settings

PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 390_000


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, PBKDF2_ITERATIONS
    )
    return f"{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str | None) -> bool:
    if not stored:
        return False
    try:
        algorithm, iterations, salt_hex, digest_hex = stored.split("$")
        if algorithm != PBKDF2_ALGORITHM:
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), digest_hex)
    except (ValueError, TypeError):
        return False


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(segment: str) -> bytes:
    padding = "=" * (-len(segment) % 4)
    return base64.urlsafe_b64decode(segment + padding)


def create_access_token(*, user_id: int, username: str, role: str) -> str:
    issued_at = int(time.time())
    claims = {
        "sub": username,
        "uid": user_id,
        "role": role,
        "iat": issued_at,
        "exp": issued_at + settings.auth_token_ttl_seconds,
    }
    header = {"alg": "HS256", "typ": "JWT"}
    signing_input = (
        f"{_b64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))}."
        f"{_b64url_encode(json.dumps(claims, separators=(',', ':')).encode('utf-8'))}"
    )
    signature = hmac.new(
        settings.auth_secret_key.encode("utf-8"),
        signing_input.encode("ascii"),
        hashlib.sha256,
    ).digest()
    return f"{signing_input}.{_b64url_encode(signature)}"


def decode_token(token: str) -> dict | None:
    """Return the verified claims, or None when the token is invalid/expired."""
    try:
        header_b64, payload_b64, signature_b64 = token.split(".")
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        expected = hmac.new(
            settings.auth_secret_key.encode("utf-8"),
            signing_input,
            hashlib.sha256,
        ).digest()
        if not hmac.compare_digest(expected, _b64url_decode(signature_b64)):
            return None
        header = json.loads(_b64url_decode(header_b64))
        if header.get("alg") != "HS256":
            return None
        claims = json.loads(_b64url_decode(payload_b64))
    except (ValueError, TypeError, UnicodeDecodeError):
        return None

    expires_at = claims.get("exp")
    if not isinstance(expires_at, int) or expires_at < time.time():
        return None
    return claims
