from __future__ import annotations

import json
import mimetypes
import ast
import csv
import base64
import hashlib
import html
import io
import re
import secrets
import socket
import sys
import urllib.error
import urllib.parse
import urllib.request
import os
import zipfile
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timedelta
from email.utils import parsedate_to_datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from time import time
from xml.etree import ElementTree

from scanner_engine import build_scanner_feature


ROOT = Path(__file__).resolve().parent


def load_dotenv_file(path: Path):
    if not path.exists():
        return
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return
    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


load_dotenv_file(ROOT / ".env")

HOST = os.environ.get("WOOGI_HOST", "127.0.0.1")
PORT = int(os.environ.get("WOOGI_PORT") or os.environ.get("PORT") or "8019")
BROWSER_FIREBASE_ENV_FIELDS = (
    ("apiKey", "WOOGI_FIREBASE_API_KEY"),
    ("authDomain", "WOOGI_FIREBASE_AUTH_DOMAIN"),
    ("projectId", "WOOGI_FIREBASE_PROJECT_ID"),
    ("storageBucket", "WOOGI_FIREBASE_STORAGE_BUCKET"),
    ("messagingSenderId", "WOOGI_FIREBASE_MESSAGING_SENDER_ID"),
    ("appId", "WOOGI_FIREBASE_APP_ID"),
    ("measurementId", "WOOGI_FIREBASE_MEASUREMENT_ID"),
)
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    ),
    "Accept": "application/json,text/plain,*/*",
}
HAS_KOREAN = re.compile(r"[가-힣ㄱ-ㅎㅏ-ㅣ]")
IS_NUMERIC_CODE = re.compile(r"^\d{4,6}$")
IS_US_TICKER = re.compile(r"^[A-Za-z][A-Za-z0-9.\-]{0,11}$")
NAVER_INDEX_SYMBOLS = {"^KS11": "KOSPI", "^KQ11": "KOSDAQ"}
STOOQ_SYMBOLS = {
    "^GSPC": "^SPX",
    "^IXIC": "^NDQ",
    "KRW=X": "USDKRW",
    "NQ=F": "NQ.F",
    "CL=F": "CL.F",
}
HTTP_CACHE: dict[tuple[str, tuple[tuple[str, str], ...]], tuple[float, bytes]] = {}
CACHE_TTL_SECONDS = 60
SCANNER_CACHE: dict[tuple[str, int, int], tuple[float, dict]] = {}
SCANNER_CACHE_TTL_SECONDS = 5 * 60
DART_CORP_CODE_CACHE: dict[str, str] | None = None
FMKOREA_LAST_SNAPSHOT: dict | None = None
FMKOREA_RETRY_AFTER = 0.0
INVESTOR_FLOW_SOURCES = [
    {
        "key": "foreignTop5",
        "market": "kospi",
        "sosok": "01",
        "investorGubun": "9000",
    },
    {
        "key": "institutionTop5",
        "market": "kospi",
        "sosok": "01",
        "investorGubun": "1000",
    },
    {
        "key": "foreignTop5",
        "market": "kosdaq",
        "sosok": "02",
        "investorGubun": "9000",
    },
    {
        "key": "institutionTop5",
        "market": "kosdaq",
        "sosok": "02",
        "investorGubun": "1000",
    },
]
FMKOREA_STOCK_ALIASES = [
    {"ticker": "005930", "name": "삼성전자", "market": "KS", "aliases": ["삼성전자", "삼전"]},
    {"ticker": "000660", "name": "SK하이닉스", "market": "KS", "aliases": ["sk하이닉스", "하이닉스", "하닉", "닉스"]},
    {"ticker": "035420", "name": "NAVER", "market": "KS", "aliases": ["naver", "네이버"]},
    {"ticker": "035720", "name": "카카오", "market": "KS", "aliases": ["카카오"]},
    {"ticker": "042700", "name": "한미반도체", "market": "KS", "aliases": ["한미반도체", "한미"]},
    {"ticker": "086520", "name": "에코프로", "market": "KQ", "aliases": ["에코프로"]},
    {"ticker": "373220", "name": "LG에너지솔루션", "market": "KS", "aliases": ["lg에너지솔루션", "엘지에너지솔루션", "lg엔솔", "엘지엔솔", "엔솔"]},
    {"ticker": "051910", "name": "LG화학", "market": "KS", "aliases": ["lg화학", "엘지화학"]},
    {"ticker": "006400", "name": "삼성SDI", "market": "KS", "aliases": ["삼성sdi", "삼스디"]},
    {"ticker": "005380", "name": "현대차", "market": "KS", "aliases": ["현대차", "현차"]},
    {"ticker": "000270", "name": "기아", "market": "KS", "aliases": ["기아"]},
    {"ticker": "068270", "name": "셀트리온", "market": "KS", "aliases": ["셀트리온", "셀트"]},
    {"ticker": "207940", "name": "삼성바이오로직스", "market": "KS", "aliases": ["삼성바이오로직스", "삼바"]},
    {"ticker": "105560", "name": "KB금융", "market": "KS", "aliases": ["kb금융", "케이비금융"]},
    {"ticker": "055550", "name": "신한지주", "market": "KS", "aliases": ["신한지주"]},
    {"ticker": "012450", "name": "한화에어로스페이스", "market": "KS", "aliases": ["한화에어로스페이스", "한화에어로"]},
    {"ticker": "042660", "name": "한화오션", "market": "KS", "aliases": ["한화오션"]},
    {"ticker": "329180", "name": "HD현대중공업", "market": "KS", "aliases": ["hd현대중공업", "현대중공업", "현중"]},
    {"ticker": "034020", "name": "두산에너빌리티", "market": "KS", "aliases": ["두산에너빌리티", "두에빌"]},
    {"ticker": "064350", "name": "현대로템", "market": "KS", "aliases": ["현대로템", "로템"]},
]


def browser_config_script():
    firebase_config = {
        field: os.environ.get(env_name, "").strip()
        for field, env_name in BROWSER_FIREBASE_ENV_FIELDS
    }
    firebase_value = firebase_config if any(firebase_config.values()) else None
    admin_uids = [
        uid.strip()
        for uid in os.environ.get("WOOGI_ADMIN_UIDS", "").split(",")
        if uid.strip()
    ]
    values = {
        "WOOGI_FIREBASE_CONFIG": firebase_value,
        "WOOGI_FIREBASE_REGION": os.environ.get("WOOGI_FIREBASE_REGION", "asia-northeast3").strip(),
        "WOOGI_API_BASE_URL": os.environ.get("WOOGI_API_BASE_URL", "").strip(),
        "WOOGI_ADMIN_UIDS": admin_uids,
    }
    lines = [
        f"window.{name} = window.{name} || {json.dumps(value, ensure_ascii=False)};"
        for name, value in values.items()
    ]
    return ("\n".join(lines) + "\n").encode("utf-8")


def json_response(handler: SimpleHTTPRequestHandler, status: int, payload: dict | list):
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    try:
        handler.send_response(status)
        handler.send_header("Content-Type", "application/json; charset=utf-8")
        handler.send_header("Cache-Control", "no-store")
        handler.send_header("Access-Control-Allow-Origin", "*")
        handler.send_header("Content-Length", str(len(body)))
        handler.end_headers()
        handler.wfile.write(body)
    except (BrokenPipeError, ConnectionResetError):
        return


def fetch_raw(url: str, timeout: int = 8, extra_headers: dict | None = None):
    headers = dict(HEADERS)
    if extra_headers:
        headers.update(extra_headers)
    cache_key = (url, tuple(sorted((str(key), str(value)) for key, value in headers.items())))
    cached = HTTP_CACHE.get(cache_key)
    now = time()
    if cached and now - cached[0] < CACHE_TTL_SECONDS:
        return cached[1]
    request = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read()
    except urllib.error.HTTPError:
        if cached:
            return cached[1]
        raise
    HTTP_CACHE[cache_key] = (now, raw)
    if len(HTTP_CACHE) > 512:
        oldest = sorted(HTTP_CACHE.items(), key=lambda item: item[1][0])[:128]
        for key, _ in oldest:
            HTTP_CACHE.pop(key, None)
    return raw


def fetch_json(url: str, timeout: int = 8, extra_headers: dict | None = None):
    raw = fetch_raw(url, timeout, extra_headers)
    return json.loads(raw.decode("utf-8", errors="replace"))


def fetch_text(url: str, timeout: int = 8, extra_headers: dict | None = None):
    raw = fetch_raw(url, timeout, extra_headers)
    return raw.decode("utf-8", errors="replace")


def market_symbol(ticker: str, market: str) -> str:
    market = market.upper()
    ticker = ticker.upper()
    if market == "KS":
        return f"{ticker}.KS"
    if market == "KQ":
        return f"{ticker}.KQ"
    return ticker


def parse_yahoo_quote(symbol: str):
    encoded = urllib.parse.quote(symbol, safe="")
    url = f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}?interval=1d&range=1d"
    data = fetch_json(url)
    result = ((data.get("chart") or {}).get("result") or [None])[0]
    meta = (result or {}).get("meta") or {}
    price = meta.get("regularMarketPrice")
    if not isinstance(price, (int, float)):
        return None
    change = meta.get("regularMarketChange")
    previous = (
        meta.get("regularMarketPreviousClose")
        or meta.get("chartPreviousClose")
        or meta.get("previousClose")
        or price
    )
    if not isinstance(change, (int, float)):
        change = price - previous
    change_rate = meta.get("regularMarketChangePercent")
    if not isinstance(change_rate, (int, float)):
        change_rate = (change / previous * 100) if previous else 0
    return {
        "symbol": symbol,
        "price": price,
        "change": change,
        "changeRate": change_rate,
        "currency": meta.get("currency") or "KRW",
        "marketTime": meta.get("regularMarketTime"),
        "source": "Yahoo Finance"
    }


def stooq_symbol(ticker: str, market: str) -> str | None:
    ticker = ticker.upper()
    if ticker in STOOQ_SYMBOLS:
        return STOOQ_SYMBOLS[ticker]
    if market.upper() == "US" and "." not in ticker and "=" not in ticker and ticker.startswith("^") is False:
        return f"{ticker}.US"
    return None


def parse_stooq_quote(ticker: str, market: str):
    symbol = stooq_symbol(ticker, market)
    if not symbol:
        return None
    url = "https://stooq.com/q/l/?" + urllib.parse.urlencode(
        {"s": symbol.lower(), "f": "sd2t2ohlcv", "h": "", "e": "csv"}
    )
    text = fetch_text(url, timeout=8)
    rows = list(csv.DictReader(io.StringIO(text)))
    row = rows[0] if rows else {}
    close = parse_first_number(row.get("Close"))
    open_price = parse_first_number(row.get("Open"))
    if not close:
        return None
    change = close - open_price if open_price else 0
    change_rate = (change / open_price * 100) if open_price else 0
    market_time = " ".join(part for part in [row.get("Date"), row.get("Time")] if part)
    return {
        "symbol": ticker,
        "price": close,
        "change": change,
        "changeRate": change_rate,
        "currency": "USD" if market.upper() == "US" and ticker != "KRW=X" else "KRW",
        "marketTime": market_time,
        "source": "Stooq",
    }


def fetch_quote(ticker: str, market: str):
    quote = None
    if ticker in NAVER_INDEX_SYMBOLS:
        quote = parse_naver_index_quote(ticker)
    elif market in {"KS", "KQ"}:
        quote = parse_naver_domestic_quote(ticker)
    if quote:
        return quote
    try:
        quote = parse_yahoo_quote(market_symbol(ticker, market))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
        quote = None
    return quote or parse_stooq_quote(ticker, market)


def parse_naver_domestic_quote(ticker: str):
    url = f"https://polling.finance.naver.com/api/realtime/domestic/stock/{urllib.parse.quote(ticker)}"
    data = fetch_json(url, extra_headers={"Referer": "https://finance.naver.com"})
    item = next(iter(data.get("datas") or []), None)
    if not isinstance(item, dict):
        return None

    def num(value):
        try:
            return float(str(value or "0").replace(",", ""))
        except ValueError:
            return 0.0

    def signed(value, compare):
        raw = num(value)
        if raw == 0:
            return 0.0
        text = json.dumps(compare or {}, ensure_ascii=False).upper()
        return -abs(raw) if "FALLING" in text or "LOWER" in text or "하락" in text or '"5"' in text else abs(raw)

    regular_price = num(item.get("closePriceRaw") or item.get("closePrice"))
    over = item.get("overMarketPriceInfo") if isinstance(item.get("overMarketPriceInfo"), dict) else {}
    over_price = num(over.get("overPrice"))
    if regular_price > 0:
        price = regular_price
        change = signed(
            item.get("compareToPreviousClosePriceRaw") or item.get("compareToPreviousClosePrice"),
            item.get("compareToPreviousPrice"),
        )
        change_rate = num(item.get("fluctuationsRatioRaw") or item.get("fluctuationsRatio"))
        market_time = item.get("localTradedAt")
    elif over_price > 0:
        price = over_price
        change = signed(over.get("compareToPreviousClosePrice"), over.get("compareToPreviousPrice"))
        change_rate = num(over.get("fluctuationsRatio"))
        market_time = over.get("localTradedAt") or item.get("localTradedAt")
    else:
        price = 0
        change = 0
        change_rate = 0
        market_time = item.get("localTradedAt")
    if price <= 0:
        return None
    return {
        "symbol": ticker,
        "price": price,
        "change": change,
        "changeRate": change_rate,
        "currency": "KRW",
        "marketTime": market_time,
        "source": "Naver Finance"
    }


def parse_naver_index_quote(symbol: str):
    naver_symbol = NAVER_INDEX_SYMBOLS.get(symbol.upper())
    if not naver_symbol:
        return None
    url = f"https://polling.finance.naver.com/api/realtime/domestic/index/{naver_symbol}"
    data = fetch_json(url, extra_headers={"Referer": "https://finance.naver.com"})
    items = data.get("datas") or []
    if not items:
        areas = ((data.get("result") or {}).get("areas") or [])
        items = [
            item
            for area in areas
            for item in (area.get("datas") or [])
            if isinstance(item, dict)
        ]
    item = next((value for value in items if isinstance(value, dict)), None)
    if not item:
        return None

    def num(value):
        try:
            return float(str(value or "0").replace(",", ""))
        except ValueError:
            return 0.0

    def signed(value, compare):
        raw = num(value)
        if raw == 0:
            return 0.0
        text = json.dumps(compare or {}, ensure_ascii=False).upper()
        return -abs(raw) if "FALLING" in text or "LOWER" in text or "하락" in text or '"5"' in text else abs(raw)

    price = num(item.get("closePriceRaw") or item.get("closePrice"))
    if price <= 0:
        return None
    return {
        "symbol": symbol,
        "price": price,
        "change": signed(item.get("compareToPreviousClosePrice"), item.get("compareToPreviousPrice")),
        "changeRate": num(item.get("fluctuationsRatioRaw") or item.get("fluctuationsRatio")),
        "currency": "KRW",
        "marketTime": item.get("localTradedAt"),
        "source": "Naver Finance"
    }


def kst_now():
    return datetime.utcnow() + timedelta(hours=9)


def kst_date_key():
    return kst_now().strftime("%Y-%m-%d")


def naver_investor_date_key():
    return kst_now().strftime("%y.%m.%d")


def get_second_thursday(year: int, month: int) -> int:
    first_day = datetime(year, month, 1)
    first_thursday = 1 + (3 - first_day.weekday() + 7) % 7
    return first_thursday + 7


def get_night_futures_symbol(now: datetime | None = None) -> str:
    current = now or kst_now()
    year = current.year
    month = current.month
    day = current.day
    quarter_months = [3, 6, 9, 12]
    expiry_month = next((m for m in quarter_months if m >= month), 3)
    expiry_year = year if expiry_month >= month else year + 1
    if expiry_month == month and expiry_year == year and day > get_second_thursday(year, month):
        index = quarter_months.index(expiry_month)
        if index < len(quarter_months) - 1:
            expiry_month = quarter_months[index + 1]
        else:
            expiry_month = 3
            expiry_year = year + 1
    return f"A0{str(expiry_year - 2010).zfill(2)}{str(expiry_month).zfill(2)}"


def night_futures_session(now: datetime | None = None) -> dict:
    current = now or kst_now()
    active = current.hour >= 18 or current.hour < 5
    session_date = current - timedelta(days=1) if current.hour < 5 else current
    return {
        "label": "18:00~05:00 KST",
        "active": active,
        "date": session_date.strftime("%Y-%m-%d"),
    }


def kis_keys_configured() -> bool:
    app_key = os.environ.get("KIS_APP_KEY") or os.environ.get("WOOGI_KIS_APP_KEY")
    app_secret = os.environ.get("KIS_APP_SECRET") or os.environ.get("WOOGI_KIS_APP_SECRET")
    return bool(app_key and app_secret)


def kis_credentials() -> tuple[str, str]:
    return (
        (os.environ.get("KIS_APP_KEY") or os.environ.get("WOOGI_KIS_APP_KEY") or "").strip(),
        (os.environ.get("KIS_APP_SECRET") or os.environ.get("WOOGI_KIS_APP_SECRET") or "").strip(),
    )


def get_kis_approval_key(app_key: str, app_secret: str) -> str:
    request = urllib.request.Request(
        "https://openapi.koreainvestment.com:9443/oauth2/Approval",
        data=json.dumps({
            "grant_type": "client_credentials",
            "appkey": app_key,
            "secretkey": app_secret,
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8", errors="replace"))
    approval_key = str(payload.get("approval_key") or "").strip()
    if not approval_key:
        raise ValueError("KIS approval_key missing")
    return approval_key


def kis_frame_message(payload: str) -> bytes:
    raw = payload.encode("utf-8")
    mask = secrets.token_bytes(4)
    header = bytearray([0x81])
    length = len(raw)
    if length < 126:
        header.append(0x80 | length)
    elif length < 65536:
        header.extend([0x80 | 126, (length >> 8) & 0xFF, length & 0xFF])
    else:
        header.append(0x80 | 127)
        header.extend(length.to_bytes(8, "big"))
    masked = bytes(byte ^ mask[index % 4] for index, byte in enumerate(raw))
    return bytes(header) + mask + masked


def read_exact(sock: socket.socket, length: int) -> bytes:
    chunks = []
    remaining = length
    while remaining > 0:
        chunk = sock.recv(remaining)
        if not chunk:
            raise TimeoutError("websocket closed")
        chunks.append(chunk)
        remaining -= len(chunk)
    return b"".join(chunks)


def read_kis_websocket_text(sock: socket.socket) -> str:
    first, second = read_exact(sock, 2)
    opcode = first & 0x0F
    length = second & 0x7F
    if length == 126:
        length = int.from_bytes(read_exact(sock, 2), "big")
    elif length == 127:
        length = int.from_bytes(read_exact(sock, 8), "big")
    masked = bool(second & 0x80)
    mask = read_exact(sock, 4) if masked else b""
    payload = read_exact(sock, length) if length else b""
    if masked:
        payload = bytes(byte ^ mask[index % 4] for index, byte in enumerate(payload))
    if opcode == 0x8:
        raise TimeoutError("websocket closed")
    if opcode == 0x9:
        sock.sendall(bytes([0x8A, 0x00]))
        return ""
    return payload.decode("utf-8", errors="replace")


def parse_kis_night_futures_tick(message: str, symbol: str) -> dict | None:
    raw = str(message or "")
    if not raw or raw.startswith("{"):
        return None
    parts = raw.split("|")
    if len(parts) < 4 or parts[1] != "H0UPANC0":
        return None
    payload = parts[3]
    records = payload.split(f"^{symbol}") if f"^{symbol}" in payload else [payload]
    fields = (records[0] or payload).split("^")
    if len(fields) < 6:
        return None
    price = parse_first_number(fields[3])
    if not price or price <= 0:
        return None
    return {
        "price": price,
        "change": parse_first_number(fields[4]) or 0,
        "changeRate": parse_first_number(fields[5]) or 0,
    }


def kis_night_futures_timeout() -> int:
    raw = os.environ.get("WOOGI_KIS_NIGHT_FUTURES_TIMEOUT") or os.environ.get("KIS_NIGHT_FUTURES_TIMEOUT") or "6"
    try:
        return max(2, min(int(float(raw)), 18))
    except ValueError:
        return 6


def fetch_kis_night_futures_tick(symbol: str, timeout: int | None = None) -> dict:
    timeout = timeout or kis_night_futures_timeout()
    app_key, app_secret = kis_credentials()
    if not app_key or not app_secret:
        raise ValueError("KIS keys missing")
    approval_key = get_kis_approval_key(app_key, app_secret)
    host = "ops.koreainvestment.com"
    port = 21000
    sock = socket.create_connection((host, port), timeout=timeout)
    sock.settimeout(timeout)
    try:
        ws_key = base64.b64encode(secrets.token_bytes(16)).decode("ascii")
        handshake = (
            "GET / HTTP/1.1\r\n"
            f"Host: {host}:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {ws_key}\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        sock.sendall(handshake.encode("ascii"))
        response = b""
        while b"\r\n\r\n" not in response:
            response += sock.recv(4096)
            if len(response) > 16384:
                break
        if b" 101 " not in response.split(b"\r\n", 1)[0]:
            raise TimeoutError("KIS websocket handshake failed")
        expected = base64.b64encode(hashlib.sha1((ws_key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode("ascii")).digest())
        if expected not in response:
            raise TimeoutError("KIS websocket accept mismatch")
        subscribe = json.dumps({
            "header": {
                "approval_key": approval_key,
                "custtype": "P",
                "tr_type": "1",
                "content-type": "utf-8",
            },
            "body": {"input": {"tr_id": "H0UPANC0", "tr_key": symbol}},
        }, ensure_ascii=False)
        sock.sendall(kis_frame_message(subscribe))
        deadline = time() + timeout
        while time() < deadline:
            message = read_kis_websocket_text(sock)
            if not message:
                continue
            if message.startswith("{"):
                try:
                    payload = json.loads(message)
                except json.JSONDecodeError:
                    continue
                if payload.get("header", {}).get("tr_id") == "PINGPONG":
                    sock.sendall(kis_frame_message(message))
                    continue
                body = payload.get("body") or {}
                if body.get("rt_cd") == "9":
                    raise ValueError(str(body.get("msg_cd") or body.get("msg1") or "KIS websocket rejected"))
                continue
            tick = parse_kis_night_futures_tick(message, symbol)
            if tick:
                return tick
        raise TimeoutError("KIS night futures timeout")
    finally:
        try:
            sock.close()
        except OSError:
            pass


def load_night_futures_snapshot() -> dict:
    raw = os.environ.get("WOOGI_NIGHT_FUTURES_SNAPSHOT", "").strip()
    file_path = os.environ.get("WOOGI_NIGHT_FUTURES_HISTORY_FILE", "").strip()
    if not raw and file_path:
        try:
            raw = Path(file_path).read_text(encoding="utf-8")
        except OSError:
            raw = ""
    if not raw:
        return {}
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return {"history": parsed} if isinstance(parsed, list) else (parsed if isinstance(parsed, dict) else {})


def normalize_night_futures_history(items) -> list[dict]:
    history = []
    if not isinstance(items, list):
        return history
    for item in items[-1200:]:
        if not isinstance(item, dict):
            continue
        price = parse_first_number(item.get("price") or item.get("close") or item.get("value"))
        if not price or price <= 0:
            continue
        history.append({
            "time": item.get("time") or item.get("timestamp") or item.get("updatedAt") or item.get("date") or "",
            "price": price,
            "change": parse_first_number(item.get("change")),
            "changeRate": parse_first_number(item.get("changeRate") or item.get("rate")),
        })
    return history


def collect_night_futures() -> dict:
    snapshot = load_night_futures_snapshot()
    history = normalize_night_futures_history(snapshot.get("history"))
    session = night_futures_session()
    live_error = ""
    live_tick = {}
    configured = kis_keys_configured()
    if configured and session.get("active") and not snapshot.get("price"):
        symbol = str(snapshot.get("symbol") or get_night_futures_symbol())
        try:
            live_tick = fetch_kis_night_futures_tick(symbol, timeout=kis_night_futures_timeout())
            now = kst_now().isoformat(timespec="seconds")
            live_tick = {**live_tick, "time": now, "symbol": symbol, "source": "KIS OpenAPI"}
            history.append(live_tick)
            snapshot = {**snapshot, **live_tick, "updatedAt": now}
        except (urllib.error.URLError, TimeoutError, ValueError, OSError) as error:
            live_error = str(error)[:160]
    latest = history[-1] if history else {}
    price = parse_first_number(snapshot.get("price")) or latest.get("price")
    change = parse_first_number(snapshot.get("change")) or latest.get("change")
    change_rate = parse_first_number(snapshot.get("changeRate")) or latest.get("changeRate")
    previous_close = parse_first_number(snapshot.get("previousClose"))
    if change is None and price and previous_close:
        change = price - previous_close
    if change_rate is None and change is not None and previous_close:
        change_rate = change / previous_close * 100
    available = bool(price and price > 0)
    mode = "kis-live" if live_tick else ("local-snapshot" if available else ("configured-awaiting-collector" if configured else "not-configured"))
    message = (
        "KIS 실시간 스냅샷을 수신했습니다."
        if live_tick
        else "KIS 연동 값이 준비되었습니다."
        if available
        else (
            f"KIS 키는 설정됐지만 현재 수집 대기 중입니다. {live_error}".strip()
            if configured and live_error
            else ("KIS 키는 설정됐지만 야간선물 스냅샷이 아직 없습니다." if configured else "KIS_APP_KEY/KIS_APP_SECRET 미설정")
        )
    )
    return {
        "name": "KOSPI200 야간선물",
        "symbol": str(snapshot.get("symbol") or get_night_futures_symbol()),
        "source": str(snapshot.get("source") or "KIS OpenAPI"),
        "configured": configured,
        "available": available,
        "mode": mode,
        "message": message,
        "session": session,
        "price": price,
        "change": change,
        "changeRate": change_rate,
        "previousClose": previous_close,
        "updatedAt": snapshot.get("updatedAt") or latest.get("time") or "",
        "history": history,
        "requires": ["KIS_APP_KEY", "KIS_APP_SECRET", "night_futures_prices collector"],
    }


def fetch_euckr_text(url: str, timeout: int = 10, extra_headers: dict | None = None):
    raw = fetch_raw(url, timeout=timeout, extra_headers=extra_headers)
    head = raw[:4096].decode("ascii", errors="ignore").lower()
    if "charset=utf-8" in head or "charset=\"utf-8\"" in head or "charset='utf-8'" in head:
        return raw.decode("utf-8", errors="replace")
    if "charset=euc-kr" in head or "charset=ks_c_5601" in head or "charset=cp949" in head:
        return raw.decode("cp949", errors="replace")
    for encoding in ("utf-8", "cp949", "euc-kr"):
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="replace")


def clean_html_text(html_text: str):
    text = re.sub(r"<script\b.*?</script>", "", str(html_text or ""), flags=re.I | re.S)
    text = re.sub(r"<style\b.*?</style>", "", text, flags=re.I | re.S)
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


def html_attr(tag: str, name: str):
    match = re.search(rf"\b{re.escape(name)}\s*=\s*([\"'])(.*?)\1", tag, flags=re.I | re.S)
    return html.unescape(match.group(2)) if match else ""


def investor_number(value):
    cleaned = re.sub(r"[^\d.\-]", "", str(value or ""))
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def market_date_from_naver(source_date_key: str | None):
    match = re.match(r"^(\d{2})\.(\d{2})\.(\d{2})$", str(source_date_key or ""))
    return f"20{match.group(1)}-{match.group(2)}-{match.group(3)}" if match else None


def parse_investor_flow_html(html_text: str, expected_date: str):
    parts = re.split(r"(?=<div\b[^>]*class=[\"'][^\"']*box_type_ms)", html_text, flags=re.I)
    boxes = [
        part
        for part in parts
        if re.search(r"class=[\"'][^\"']*box_type_ms", part, flags=re.I)
    ]
    target_box = ""
    source_date_key = None
    for box in boxes:
        date_match = re.search(
            r"class=[\"'][^\"']*sise_guide_date[^\"']*[\"'][^>]*>(.*?)<",
            box,
            flags=re.I | re.S,
        )
        date_key = clean_html_text(date_match.group(1)) if date_match else None
        if date_key == expected_date:
            target_box = box
            source_date_key = date_key
            break
    if not target_box and boxes:
        target_box = boxes[-1]
        date_match = re.search(
            r"class=[\"'][^\"']*sise_guide_date[^\"']*[\"'][^>]*>(.*?)<",
            target_box,
            flags=re.I | re.S,
        )
        source_date_key = clean_html_text(date_match.group(1)) if date_match else None

    rows = []
    for row_html in re.findall(r"<tr\b.*?</tr>", target_box, flags=re.I | re.S):
        link_match = re.search(
            r"<a\b[^>]*class=[\"'][^\"']*tltle[^\"']*[\"'][^>]*>.*?</a>",
            row_html,
            flags=re.I | re.S,
        )
        if not link_match:
            continue
        link_tag = link_match.group(0)
        href = html_attr(link_tag, "href")
        code_match = re.search(r"code=(\d+)", href)
        if not code_match:
            continue
        cells = [
            clean_html_text(cell)
            for cell in re.findall(r"<td\b[^>]*>(.*?)</td>", row_html, flags=re.I | re.S)
        ]
        if len(cells) < 4:
            continue
        name = html_attr(link_tag, "title") or clean_html_text(link_tag)
        rows.append({
            "rank": len(rows) + 1,
            "code": code_match.group(1),
            "ticker": code_match.group(1),
            "name": name,
            "quantity": investor_number(cells[1]),
            "amount": investor_number(cells[2]),
            "volume": investor_number(cells[3]),
            "quantityText": cells[1],
            "amountText": cells[2],
            "volumeText": cells[3],
        })
        if len(rows) >= 5:
            break

    return {
        "items": rows,
        "sourceDateKey": source_date_key,
        "expectedDate": expected_date,
        "isExpectedDate": source_date_key == expected_date,
    }


def fetch_investor_flow_top5(source: dict):
    url = "https://finance.naver.com/sise/sise_deal_rank_iframe.naver?" + urllib.parse.urlencode(
        {"sosok": source["sosok"], "investor_gubun": source["investorGubun"], "type": "buy"}
    )
    text = fetch_euckr_text(
        url,
        timeout=10,
        extra_headers={
            "Referer": "https://finance.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
    )
    return parse_investor_flow_html(text, naver_investor_date_key())


def collect_investor_flow():
    result = {
        "marketDate": kst_date_key(),
        "expectedDate": naver_investor_date_key(),
        "fetchedAt": datetime.utcnow().isoformat() + "Z",
        "source": "finance.naver.com",
        "basis": "market_close",
        "sources": {},
        "kospi": {"foreignTop5": [], "institutionTop5": []},
        "kosdaq": {"foreignTop5": [], "institutionTop5": []},
    }
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {
            executor.submit(fetch_investor_flow_top5, source): source
            for source in INVESTOR_FLOW_SOURCES
        }
        for future in as_completed(futures):
            source = futures[future]
            key = f"{source['market']}.{source['key']}"
            try:
                fetched = future.result()
                result[source["market"]][source["key"]] = fetched["items"]
                result["sources"][key] = {
                    "sourceDateKey": fetched["sourceDateKey"],
                    "expectedDate": fetched["expectedDate"],
                    "isExpectedDate": fetched["isExpectedDate"],
                    "count": len(fetched["items"]),
                }
            except Exception as exc:
                result[source["market"]][source["key"]] = []
                result["sources"][key] = {
                    "sourceDateKey": None,
                    "expectedDate": result["expectedDate"],
                    "isExpectedDate": False,
                    "count": 0,
                    "error": str(exc),
                }
    source_dates = sorted(
        entry["sourceDateKey"]
        for entry in result["sources"].values()
        if isinstance(entry.get("sourceDateKey"), str)
    )
    source_market_date = market_date_from_naver(source_dates[-1] if source_dates else None)
    if source_market_date:
        result["marketDate"] = source_market_date
    result["isExpectedDate"] = all(
        entry.get("isExpectedDate") is True for entry in result["sources"].values()
    )
    return result


def parse_naver_sector_html(html_text: str):
    table_match = re.search(
        r"<table\b[^>]*class=[\"'][^\"']*type_1[^\"']*[\"'][^>]*>(.*?)</table>",
        html_text,
        flags=re.I | re.S,
    )
    table_html = table_match.group(1) if table_match else ""
    sectors = []
    for row_html in re.findall(r"<tr\b.*?</tr>", table_html, flags=re.I | re.S):
        cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row_html, flags=re.I | re.S)
        if len(cells) < 3:
            continue
        name = clean_html_text(cells[0])
        rate = parse_first_number(clean_html_text(cells[1]))
        if name and rate is not None:
            sectors.append({"name": name, "rate": rate})
    return sectors


def top_sector_changes(sectors: list[dict]):
    deduped = {}
    for sector in sectors:
        name = str(sector.get("name") or "").strip()
        rate = float(sector.get("rate") or 0)
        if name and (name not in deduped or abs(rate) > abs(float(deduped[name].get("rate") or 0))):
            deduped[name] = {"name": name, "rate": rate}
    unique_sectors = list(deduped.values())
    return {
        "up": sorted(
            (sector for sector in unique_sectors if float(sector.get("rate") or 0) > 0),
            key=lambda sector: float(sector.get("rate") or 0),
            reverse=True,
        )[:3],
        "down": sorted(
            (sector for sector in unique_sectors if float(sector.get("rate") or 0) < 0),
            key=lambda sector: float(sector.get("rate") or 0),
        )[:3],
    }


def fetch_naver_sector_page(sosok: str | None = None):
    params = {"type": "upjong"}
    if sosok:
        params["sosok"] = sosok
    url = "https://finance.naver.com/sise/sise_group.nhn?" + urllib.parse.urlencode(params)
    raw = fetch_raw(
        url,
        timeout=10,
        extra_headers={
            "Referer": "https://finance.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9",
        },
    )
    text = raw.decode("cp949", errors="replace")
    return parse_naver_sector_html(text)


def is_plain_listed_stock(item: dict):
    end_type = str(item.get("stockEndType") or "").lower()
    name = str(item.get("stockName") or "").strip().upper()
    if end_type and end_type != "stock":
        return False
    if not name:
        return False
    return not (
        re.match(
            r"^(KODEX|TIGER|ACE|SOL|KBSTAR|ARIRANG|HANARO|KOSEF|TIMEFOLIO|PLUS|RISE|히어로즈|마이티|TREX|FOCUS|BNK|UNICORN|WOORI|파워|SMART|QV|TRUE)\s?",
            name,
        )
        or " ETF" in name
        or " ETN" in name
        or "인버스" in name
        or "레버리지" in name
    )


def fetch_market_stock_page(market: str, page: int, page_size: int = 100):
    url = (
        f"https://m.stock.naver.com/api/stocks/marketValue/{urllib.parse.quote(market)}?"
        + urllib.parse.urlencode({"page": page, "pageSize": page_size})
    )
    return fetch_json(
        url,
        timeout=10,
        extra_headers={"Referer": "https://m.stock.naver.com/", "Accept": "application/json"},
    )


def fetch_market_stock_list(market: str):
    page_size = 100
    first = fetch_market_stock_page(market, 1, page_size)
    total_count = int(first.get("totalCount") or len(first.get("stocks") or []))
    total_pages = max(1, (total_count + page_size - 1) // page_size)
    pages = [first]
    if total_pages > 1:
        with ThreadPoolExecutor(max_workers=min(12, total_pages - 1)) as executor:
            futures = [
                executor.submit(fetch_market_stock_page, market, page, page_size)
                for page in range(2, total_pages + 1)
            ]
            pages.extend(future.result() for future in as_completed(futures))
    return [
        stock
        for page in pages
        for stock in (page.get("stocks") or [])
        if isinstance(stock, dict)
    ]


def parse_naver_stock_number(stock: dict, key: str, fallback: str = "") -> float:
    value = stock.get(key)
    if value in {None, ""}:
        value = stock.get(fallback) if fallback else 0
    try:
        return float(str(value or 0).replace(",", ""))
    except ValueError:
        return 0.0


def fetch_scanner_universe(market: str, page_limit: int = 3):
    markets = ["KOSPI", "KOSDAQ"] if market == "ALL" else ["KOSDAQ" if market == "KQ" else "KOSPI"]
    futures = []
    with ThreadPoolExecutor(max_workers=min(8, len(markets) * page_limit)) as executor:
        for market_name in markets:
            for page in range(1, page_limit + 1):
                futures.append(executor.submit(fetch_market_stock_page, market_name, page, 100))
        pages = [future.result() for future in as_completed(futures)]
    stocks = [
        stock
        for page in pages
        for stock in (page.get("stocks") or [])
        if isinstance(stock, dict) and is_plain_listed_stock(stock)
    ]
    return sorted(
        stocks,
        key=lambda stock: parse_naver_stock_number(stock, "accumulatedTradingValueRaw"),
        reverse=True,
    )


def scan_market_opportunities(market: str = "ALL", limit: int = 20, universe_limit: int = 30):
    market = market.upper()
    if market not in {"ALL", "KS", "KQ"}:
        market = "ALL"
    limit = max(1, min(int(limit), 50))
    universe_limit = max(limit, min(int(universe_limit), 120))
    cache_key = (market, limit, universe_limit)
    cached = SCANNER_CACHE.get(cache_key)
    now = time()
    if cached and now - cached[0] < SCANNER_CACHE_TTL_SECONDS:
        return cached[1]

    candidates = fetch_scanner_universe(market)[:universe_limit]

    def build(stock: dict):
        ticker = str(stock.get("itemCode") or stock.get("reutersCode") or "")
        if not ticker:
            return None
        try:
            history = naver_history(ticker, "1y")
            return build_scanner_feature(stock, history.get("points") or [])
        except (urllib.error.URLError, TimeoutError, ValueError, SyntaxError, OSError):
            return None

    with ThreadPoolExecutor(max_workers=min(10, len(candidates) or 1)) as executor:
        features = [
            feature
            for feature in (future.result() for future in as_completed([executor.submit(build, stock) for stock in candidates]))
            if feature
        ]
    features.sort(key=lambda item: (float(item.get("score") or 0), float(item.get("tradingValue") or 0)), reverse=True)
    payload = {
        "items": features[:limit],
        "source": "Naver Finance Scanner",
        "updatedAt": datetime.utcnow().isoformat() + "Z",
        "market": market,
        "universeCount": len(candidates),
        "scoredCount": len(features),
        "method": "liquidity prefilter + trend/momentum/breakout/risk score",
    }
    SCANNER_CACHE[cache_key] = (now, payload)
    return payload


def count_market_breadth(stocks: list[dict]):
    result = {"up": 0, "down": 0, "flat": 0, "excludes": "ETF/ETN 제외"}
    for item in stocks:
        if not is_plain_listed_stock(item):
            continue
        try:
            rate = float(str(item.get("fluctuationsRatio") or "0").replace(",", ""))
        except ValueError:
            rate = 0.0
        compare = item.get("compareToPreviousPrice") or {}
        code = str(compare.get("code") or "")
        name = str(compare.get("name") or "").upper()
        if rate > 0 or code == "2" or name == "RISING":
            result["up"] += 1
        elif rate < 0 or code == "5" or name == "FALLING":
            result["down"] += 1
        else:
            result["flat"] += 1
    return result


def collect_market_breadth():
    result = {}
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {
            executor.submit(fetch_market_stock_list, market.upper()): market
            for market in ("kospi", "kosdaq")
        }
        for future in as_completed(futures):
            market = futures[future]
            try:
                result[market] = count_market_breadth(future.result())
            except Exception as exc:
                result[market] = {"up": 0, "down": 0, "flat": 0, "excludes": "ETF/ETN 제외", "error": str(exc)}
    return result


def collect_market_sectors():
    with ThreadPoolExecutor(max_workers=3) as executor:
        kospi_future = executor.submit(fetch_naver_sector_page)
        kosdaq_future = executor.submit(fetch_naver_sector_page, "1")
        breadth_future = executor.submit(collect_market_breadth)
        kospi_sectors = kospi_future.result()
        kosdaq_sectors = kosdaq_future.result()
        breadth = breadth_future.result()
    kospi = top_sector_changes(kospi_sectors)
    kosdaq = top_sector_changes(kosdaq_sectors)
    is_unified = {sector.get("name") for sector in kospi_sectors} == {sector.get("name") for sector in kosdaq_sectors}
    sectors = kospi if is_unified else top_sector_changes([*kospi_sectors, *kosdaq_sectors])
    return {
        "source": "finance.naver.com",
        "updatedAt": datetime.utcnow().isoformat() + "Z",
        "basis": "Naver Finance 업종별 시세 · 모바일 시총 API",
        "unifiedSectorTable": is_unified,
        "sectors": sectors,
        "kospi": kospi,
        "kosdaq": kosdaq,
        "breadth": breadth,
    }


def cnn_fear_and_greed():
    data = fetch_json(
        "https://production.dataviz.cnn.io/index/fearandgreed/graphdata",
        timeout=8,
        extra_headers={
            "User-Agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148"
            ),
            "Referer": "https://www.cnn.com/markets/fear-and-greed",
        },
    )
    item = data.get("fear_and_greed") or {}
    score = item.get("score")
    if not isinstance(score, (int, float)):
        return None
    return {
        "score": score,
        "rating": item.get("rating") or "",
        "previousClose": item.get("previous_close"),
        "previousWeek": item.get("previous_1_week"),
        "previousMonth": item.get("previous_1_month"),
        "previousYear": item.get("previous_1_year"),
        "source": "CNN Fear & Greed",
    }


def parse_first_number(value):
    match = re.search(r"-?\d+(?:\.\d+)?", str(value or "").replace(",", ""))
    return float(match.group(0)) if match else None


def parse_naver_market_cap(value):
    total = 0.0
    for amount, unit in re.findall(r"([\d,]+(?:\.\d+)?)\s*(조|억)", str(value or "")):
        number = float(amount.replace(",", ""))
        total += number * (1_000_000_000_000 if unit == "조" else 100_000_000)
    return round(total) if total > 0 else None


def naver_domestic_fundamentals(ticker: str):
    url = f"https://m.stock.naver.com/api/stock/{urllib.parse.quote(ticker)}/integration"
    data = fetch_json(
        url,
        extra_headers={"Referer": "https://m.stock.naver.com", "Accept": "application/json"},
    )
    total_infos = data.get("totalInfos") or []
    values = {
        str(item.get("code") or ""): item.get("value")
        for item in total_infos
        if isinstance(item, dict)
    }
    result = {
        "per": parse_first_number(values.get("per")),
        "pbr": parse_first_number(values.get("pbr")),
        "bps": parse_first_number(values.get("bps")),
        "marketCap": parse_naver_market_cap(values.get("marketValue")),
        "forwardPer": parse_first_number(values.get("cnsPer")),
        "source": "Naver Finance",
    }
    return result if any(value is not None for key, value in result.items() if key != "source") else None


def yahoo_fundamentals(symbol: str):
    encoded = urllib.parse.quote(symbol, safe="")
    url = (
        f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{encoded}"
        "?modules=summaryDetail,defaultKeyStatistics"
    )
    data = fetch_json(url)
    item = (((data.get("quoteSummary") or {}).get("result") or [None])[0]) or {}
    summary = item.get("summaryDetail") or {}
    stats = item.get("defaultKeyStatistics") or {}

    def raw(source, key):
        value = (source.get(key) or {}).get("raw")
        return value if isinstance(value, (int, float)) else None

    result = {
        "per": raw(summary, "trailingPE"),
        "pbr": raw(stats, "priceToBook"),
        "marketCap": raw(summary, "marketCap"),
        "forwardPer": raw(summary, "forwardPE") or raw(stats, "forwardPE"),
        "source": "Yahoo Finance",
    }
    return result if any(value is not None for key, value in result.items() if key != "source") else None


def fetch_fundamentals(ticker: str, market: str):
    if market in {"KS", "KQ"}:
        return naver_domestic_fundamentals(ticker)
    return yahoo_fundamentals(market_symbol(ticker, market))


def google_news_search(query_text: str, locale: str = "ko"):
    query = urllib.parse.quote(query_text)
    if locale == "en":
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"
    else:
        url = f"https://news.google.com/rss/search?q={query}&hl=ko&gl=KR&ceid=KR:ko"
    root = ElementTree.fromstring(fetch_text(url, extra_headers={"User-Agent": "Mozilla/5.0"}))
    items = []
    for item in root.findall("./channel/item")[:5]:
        title = html.unescape(item.findtext("title") or "").strip()
        title = re.sub(r"\s*-\s*[^-]+$", "", title).strip()
        link = (item.findtext("link") or "").strip()
        source = (item.findtext("source") or "").strip()
        published = (item.findtext("pubDate") or "").strip()
        if not title or not link:
            continue
        try:
            published_at = parsedate_to_datetime(published).isoformat()
        except (TypeError, ValueError):
            published_at = ""
        items.append({"title": title, "url": link, "publisher": source, "publishedAt": published_at})
    return items


def google_news_kr(name: str):
    return google_news_search(f"{name} 주식", "ko")


def google_news_us(ticker: str, name: str):
    query = f"{name or ticker} stock"
    return google_news_search(query, "en")


def yahoo_news(ticker: str, market: str):
    symbol = market_symbol(ticker, market)
    url = "https://query1.finance.yahoo.com/v1/finance/search?" + urllib.parse.urlencode(
        {"q": symbol, "quotesCount": "0", "newsCount": "5"}
    )
    data = fetch_json(url)
    items = []
    for item in data.get("news") or []:
        title = str(item.get("title") or "")
        link = str(item.get("link") or "")
        if not title or not link:
            continue
        timestamp = item.get("providerPublishTime")
        items.append({
            "title": title,
            "url": link,
            "publisher": item.get("publisher") or "",
            "publishedAt": datetime.fromtimestamp(timestamp).isoformat() if isinstance(timestamp, (int, float)) else "",
        })
    return items


def fetch_news(ticker: str, market: str, name: str):
    if market != "US" and name:
        return google_news_kr(name)
    try:
        return yahoo_news(ticker, market)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
        return google_news_us(ticker, name)


def pct_label(value):
    try:
        number = float(value)
    except (TypeError, ValueError):
        number = 0.0
    return f"{number:+.2f}%"


def quote_or_none(ticker: str, market: str):
    try:
        return fetch_quote(ticker, market)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError, OSError):
        return None


def market_news_headlines():
    seen = set()
    items = []
    for query in ("코스피 증시 주식", "한국 경제 금융", "미국 증시 나스닥 S&P500"):
        try:
            for item in google_news_search(query, "ko"):
                title = item.get("title") or ""
                if title and title not in seen:
                    seen.add(title)
                    items.append(item)
                if len(items) >= 8:
                    return items
        except (urllib.error.URLError, TimeoutError, ElementTree.ParseError, ValueError, OSError):
            continue
    return items


def build_market_brief():
    def safe_call(fn):
        try:
            return fn()
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ElementTree.ParseError, ValueError, SyntaxError, OSError):
            return None

    jobs = {
        "kospi": lambda: quote_or_none("^KS11", "US"),
        "kosdaq": lambda: quote_or_none("^KQ11", "US"),
        "sp500": lambda: quote_or_none("^GSPC", "US"),
        "nasdaq": lambda: quote_or_none("^IXIC", "US"),
        "usdkrw": lambda: quote_or_none("KRW=X", "US"),
        "nasdaqFutures": lambda: quote_or_none("NQ=F", "US"),
        "sentiment": cnn_fear_and_greed,
        "flow": collect_investor_flow,
        "sectors": collect_market_sectors,
        "news": market_news_headlines,
    }
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(safe_call, job): key for key, job in jobs.items()}
        results = {futures[future]: future.result() for future in as_completed(futures)}
    quotes = {key: results.get(key) for key in ("kospi", "kosdaq", "sp500", "nasdaq", "usdkrw", "nasdaqFutures")}
    sentiment = results.get("sentiment")
    flow = results.get("flow")
    sector_data = results.get("sectors")
    news = results.get("news") or []

    kospi = quotes.get("kospi") or {}
    kosdaq = quotes.get("kosdaq") or {}
    nasdaq = quotes.get("nasdaq") or {}
    usdkrw = quotes.get("usdkrw") or {}
    futures = quotes.get("nasdaqFutures") or {}
    kospi_rate = float(kospi.get("changeRate") or 0)
    kosdaq_rate = float(kosdaq.get("changeRate") or 0)
    lead_index = "KOSPI" if abs(kospi_rate) >= abs(kosdaq_rate) else "KOSDAQ"
    lead_rate = kospi_rate if lead_index == "KOSPI" else kosdaq_rate
    tone = "상승 우위" if lead_rate > 0.2 else ("조정 압력" if lead_rate < -0.2 else "보합권")

    flow_bullets = []
    if isinstance(flow, dict):
        for market_key, label in (("kospi", "KOSPI"), ("kosdaq", "KOSDAQ")):
            market_flow = flow.get(market_key) or {}
            foreign = (market_flow.get("foreignTop5") or [])[:2]
            institution = (market_flow.get("institutionTop5") or [])[:2]
            if foreign:
                flow_bullets.append(f"{label} 외국인 순매수 상위는 {', '.join(item.get('name') or item.get('ticker') or '' for item in foreign if item)}입니다.")
            if institution:
                flow_bullets.append(f"{label} 기관 순매수 상위는 {', '.join(item.get('name') or item.get('ticker') or '' for item in institution if item)}입니다.")
    headline = news[0]["title"] if news else ""
    sentiment_text = ""
    if isinstance(sentiment, dict) and sentiment.get("score") is not None:
        sentiment_text = f"CNN Fear & Greed {round(float(sentiment.get('score') or 0))}점"

    summary_parts = [
        f"{lead_index}가 {pct_label(lead_rate)}로 {tone} 흐름을 보입니다.",
        f"KOSPI {pct_label(kospi.get('changeRate'))}, KOSDAQ {pct_label(kosdaq.get('changeRate'))}를 함께 확인했습니다.",
    ]
    if nasdaq:
        summary_parts.append(f"미국 NASDAQ은 {pct_label(nasdaq.get('changeRate'))}, 나스닥100 선물은 {pct_label(futures.get('changeRate'))}입니다.")
    if usdkrw:
        summary_parts.append(f"USD/KRW는 {round(float(usdkrw.get('price') or 0), 2):,}원 부근입니다.")
    if sentiment_text:
        summary_parts.append(f"{sentiment_text}으로 위험 선호를 점검합니다.")
    sector_changes = (sector_data or {}).get("sectors") or {}
    sector_up = sector_changes.get("up") or []
    sector_down = sector_changes.get("down") or []
    breadth = (sector_data or {}).get("breadth") or {}
    if sector_up:
        summary_parts.append(f"상승 업종은 {', '.join(item.get('name') or '' for item in sector_up[:2])} 중심입니다.")
    if sector_down:
        summary_parts.append(f"약세 업종은 {', '.join(item.get('name') or '' for item in sector_down[:2])}입니다.")
    kospi_breadth = breadth.get("kospi") or {}
    kosdaq_breadth = breadth.get("kosdaq") or {}
    if kospi_breadth or kosdaq_breadth:
        summary_parts.append(
            "ETF/ETN 제외 시장 폭은 "
            f"KOSPI 상승 {int(kospi_breadth.get('up') or 0)}개·하락 {int(kospi_breadth.get('down') or 0)}개, "
            f"KOSDAQ 상승 {int(kosdaq_breadth.get('up') or 0)}개·하락 {int(kosdaq_breadth.get('down') or 0)}개입니다."
        )
    if headline:
        summary_parts.append(f"최근 헤드라인은 '{headline}'입니다.")
    summary = " ".join(summary_parts)

    breadth_bullet = (
        "시장 폭은 "
        f"KOSPI {int(kospi_breadth.get('up') or 0)}:{int(kospi_breadth.get('down') or 0)}, "
        f"KOSDAQ {int(kosdaq_breadth.get('up') or 0)}:{int(kosdaq_breadth.get('down') or 0)}의 상승·하락 종목 수로 확인합니다."
        if kospi_breadth or kosdaq_breadth
        else ""
    )
    bullets = [
        f"국내 지수는 {lead_index} {tone}을 기준으로 대형주 수급 지속 여부를 확인합니다.",
        breadth_bullet,
        flow_bullets[0] if flow_bullets else "마감 수급 TOP5가 비어 있으면 다음 장 시작 전 재조회가 필요합니다.",
        headline or "뉴스 헤드라인이 비어 있으면 지수와 환율, 선물 방향을 우선 확인합니다.",
    ][:3]
    return {
        "id": "latest",
        "title": "AI 시장 브리프",
        "summary": summary,
        "brief": "\n\n".join([summary, *bullets]),
        "bullets": bullets,
        "slotLabel": "서버 자동 브리프",
        "generatedAt": kst_now().isoformat(),
        "source": "서버 시장 브리프",
        "market": quotes,
        "sentiment": sentiment,
        "sectors": sector_changes,
        "breadth": breadth,
        "investorFlowDate": flow.get("marketDate") if isinstance(flow, dict) else "",
        "news": news[:5],
    }


def normalized_fmkorea_text(value: str):
    return re.sub(r"\s+", "", str(value or "")).lower()


def fmkorea_date_key(value: str, today: datetime):
    text = str(value or "").strip()
    if re.match(r"^\d{2}:\d{2}$", text):
        return today.strftime("%Y.%m.%d")
    if re.match(r"^\d{2}\.\d{2}$", text):
        month, day = (int(part) for part in text.split("."))
        year = today.year - 1 if month > today.month + 1 else today.year
        try:
            return datetime(year, month, day).strftime("%Y.%m.%d")
        except ValueError:
            return ""
    if re.match(r"^\d{4}\.\d{2}\.\d{2}$", text):
        return text
    return ""


def parse_fmkorea_pages(pages: list[str], today: datetime | None = None):
    today = today or kst_now()
    today_key = today.strftime("%Y.%m.%d")
    cutoff = today - timedelta(days=7)
    counts = {}
    mentions = {}
    seen_posts = set()
    for text in pages:
        hit_old = False
        for row_html in re.findall(r"<tr\b[^>]*>.*?</tr>", text, flags=re.I | re.S):
            time_match = re.search(
                r"<td\b[^>]*class=[\"'][^\"']*\btime\b[^\"']*[\"'][^>]*>(.*?)</td>",
                row_html,
                flags=re.I | re.S,
            )
            title_match = re.search(
                r"<td\b[^>]*class=[\"'][^\"']*\btitle\b[^\"']*[\"'][^>]*>(.*?)</td>",
                row_html,
                flags=re.I | re.S,
            )
            if not time_match or not title_match:
                continue
            category_match = re.search(
                r"<td\b[^>]*class=[\"'][^\"']*\bcate\b[^\"']*[\"'][^>]*>(.*?)</td>",
                row_html,
                flags=re.I | re.S,
            )
            category = clean_html_text(category_match.group(1)) if category_match else ""
            if "공지" in category:
                continue
            time_text = clean_html_text(time_match.group(1))
            date_key = fmkorea_date_key(time_text, today)
            if not date_key:
                continue
            try:
                date_value = datetime.strptime(date_key, "%Y.%m.%d")
            except ValueError:
                continue
            if date_value < datetime(cutoff.year, cutoff.month, cutoff.day):
                hit_old = True
                continue
            title = clean_html_text(title_match.group(1))
            link_match = re.search(r"<a\b[^>]*href=[\"']([^\"']+)[\"']", title_match.group(1), flags=re.I | re.S)
            post_key = html.unescape(link_match.group(1)) if link_match else f"{date_key}:{time_text}:{title}"
            if not title or post_key in seen_posts:
                continue
            seen_posts.add(post_key)
            counts[date_key] = counts.get(date_key, 0) + 1
            if date_key != today_key:
                continue
            normalized_title = normalized_fmkorea_text(title)
            for stock in FMKOREA_STOCK_ALIASES:
                matched_aliases = {
                    alias
                    for alias in stock["aliases"]
                    if normalized_fmkorea_text(alias) in normalized_title
                }
                if not matched_aliases:
                    continue
                entry = mentions.setdefault(stock["ticker"], {
                    "ticker": stock["ticker"],
                    "name": stock["name"],
                    "market": stock["market"],
                    "mentionCount": 0,
                    "postCount": 0,
                })
                entry["mentionCount"] += len(matched_aliases)
                entry["postCount"] += 1
        if hit_old:
            break
    series = [
        {"id": date_key, "date": date_key, "count": count}
        for date_key, count in sorted(counts.items())
    ]
    latest_count = counts.get(today_key, 0)
    peak = max([item["count"] for item in series] or [1])
    top_mentions = sorted(
        mentions.values(),
        key=lambda item: (-item["mentionCount"], -item["postCount"], item["ticker"]),
    )[:10]
    for index, item in enumerate(top_mentions):
        item["rank"] = index + 1
    return {
        "dateKey": today.strftime("%Y-%m-%d"),
        "mode": "server-scrape",
        "source": "fmkorea.com/stock",
        "updatedAt": today.isoformat(),
        "latestCount": latest_count,
        "score": round(latest_count / max(1, peak) * 100),
        "label": f"{latest_count:,}글 · 공개 게시판 집계",
        "series": series,
        "topMentions": top_mentions,
        "pagesScraped": len(pages),
        "available": bool(pages),
    }


def unavailable_fmkorea_snapshot(reason: str):
    global FMKOREA_LAST_SNAPSHOT
    now = kst_now()
    if FMKOREA_LAST_SNAPSHOT:
        return {
            **FMKOREA_LAST_SNAPSHOT,
            "available": False,
            "stale": True,
            "error": reason,
            "updatedAt": now.isoformat(),
        }
    return {
        "dateKey": now.strftime("%Y-%m-%d"),
        "mode": "server-scrape-unavailable",
        "source": "fmkorea.com/stock",
        "updatedAt": now.isoformat(),
        "latestCount": 0,
        "score": 0,
        "label": "공개 게시판 연결 제한",
        "series": [],
        "topMentions": [],
        "pagesScraped": 0,
        "available": False,
        "stale": True,
        "error": reason,
    }


def scrape_fmkorea():
    global FMKOREA_LAST_SNAPSHOT, FMKOREA_RETRY_AFTER
    if time() < FMKOREA_RETRY_AFTER:
        return unavailable_fmkorea_snapshot("공개 게시판 재시도 대기 중")
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept-Language": "ko-KR,ko;q=0.9",
        "Accept": "text/html,application/xhtml+xml",
    }
    pages = []
    last_error = ""
    for page in range(1, 4):
        try:
            text = fetch_text(f"https://www.fmkorea.com/stock?page={page}", timeout=10, extra_headers=headers)
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            last_error = str(exc)
            break
        if "에펨코리아 보안 시스템" in text:
            last_error = "에펨코리아 보안 시스템 응답"
            break
        pages.append(text)
    if not pages:
        FMKOREA_RETRY_AFTER = time() + 300
        return unavailable_fmkorea_snapshot(last_error or "공개 게시판 응답 없음")
    snapshot = parse_fmkorea_pages(pages)
    if not snapshot["series"]:
        FMKOREA_RETRY_AFTER = time() + 300
        return unavailable_fmkorea_snapshot("파싱 가능한 게시글 없음")
    FMKOREA_LAST_SNAPSHOT = snapshot
    return snapshot


def naver_discussions(ticker: str, market: str):
    if market not in {"KS", "KQ"} or not IS_NUMERIC_CODE.match(ticker):
        return []
    url = "https://finance.naver.com/item/board.nhn?" + urllib.parse.urlencode(
        {"code": ticker, "ordertype": "", "searchtype": "", "page": "1"}
    )
    text = fetch_euckr_text(
        url,
        timeout=10,
        extra_headers={
            "Referer": "https://finance.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    posts = []
    for row_html in re.findall(r"<tr\b[^>]*onMouseOver\b.*?</tr>", text, flags=re.I | re.S):
        link_match = re.search(r"<a\b[^>]*href=[\"'][^\"']*board_read\.naver\?[^>]*>.*?</a>", row_html, flags=re.I | re.S)
        if not link_match:
            continue
        link_tag = link_match.group(0)
        href = html.unescape(html_attr(link_tag, "href"))
        nid_match = re.search(r"(?:\?|&)nid=(\d+)", href)
        title = html_attr(link_tag, "title") or clean_html_text(link_tag)
        date_match = re.search(
            r"<span\b[^>]*class=[\"'][^\"']*tah p10 gray03[^\"']*[\"'][^>]*>(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2})</span>",
            row_html,
            flags=re.I | re.S,
        )
        gray_cells = [
            clean_html_text(match)
            for match in re.findall(
                r"<span\b[^>]*class=[\"'][^\"']*tah p10 gray03[^\"']*[\"'][^>]*>(.*?)</span>",
                row_html,
                flags=re.I | re.S,
            )
        ]
        views = next((investor_number(cell) for cell in reversed(gray_cells) if re.match(r"^[\d,]+$", cell or "")), None)
        if not nid_match or not title:
            continue
        nid = nid_match.group(1)
        posts.append({
            "nid": nid,
            "title": title,
            "date": date_match.group(1).strip() if date_match else "",
            "viewCount": int(views or 0),
            "url": f"https://finance.naver.com/item/board_read.naver?code={ticker}&nid={nid}&page=1",
            "mobileUrl": f"https://m.stock.naver.com/discussion/domestic/{ticker}/posts/{nid}",
        })
        if len(posts) >= 10:
            break
    return posts


def naver_disclosures(ticker: str, market: str):
    if market not in {"KS", "KQ"} or not IS_NUMERIC_CODE.match(ticker):
        return []
    url = "https://finance.naver.com/item/news_notice.naver?" + urllib.parse.urlencode(
        {"code": ticker, "page": "1"}
    )
    text = fetch_euckr_text(
        url,
        timeout=10,
        extra_headers={
            "Referer": "https://finance.naver.com/",
            "Accept-Language": "ko-KR,ko;q=0.9",
            "Accept": "text/html,application/xhtml+xml",
        },
    )
    items = []
    for row_html in re.findall(r"<tr\b[^>]*>.*?</tr>", text, flags=re.I | re.S):
        link_match = re.search(r"<a\b[^>]*href=[\"'][^\"']*news_notice_read\.naver\?[^>]*>.*?</a>", row_html, flags=re.I | re.S)
        if not link_match:
            continue
        link_tag = link_match.group(0)
        href = html.unescape(html_attr(link_tag, "href"))
        no_match = re.search(r"(?:\?|&)no=(\d+)", href)
        title = html_attr(link_tag, "title") or clean_html_text(link_tag)
        cells = re.findall(r"<td\b[^>]*>(.*?)</td>", row_html, flags=re.I | re.S)
        submitter = clean_html_text(cells[1]) if len(cells) > 1 else ""
        date = clean_html_text(cells[2]) if len(cells) > 2 else ""
        if not title:
            continue
        absolute_url = urllib.parse.urljoin("https://finance.naver.com", href)
        items.append({
            "id": no_match.group(1) if no_match else "",
            "title": title,
            "date": date,
            "submitter": submitter,
            "url": absolute_url,
            "source": "Naver Finance Notice",
        })
        if len(items) >= 10:
            break
    return items


def dart_api_key() -> str:
    return (os.environ.get("DART_API_KEY") or os.environ.get("WOOGI_DART_API_KEY") or "").strip()


def load_dart_corp_codes() -> dict[str, str]:
    global DART_CORP_CODE_CACHE
    if DART_CORP_CODE_CACHE is not None:
        return DART_CORP_CODE_CACHE
    key = dart_api_key()
    if not key:
        DART_CORP_CODE_CACHE = {}
        return DART_CORP_CODE_CACHE
    url = "https://opendart.fss.or.kr/api/corpCode.xml?" + urllib.parse.urlencode({"crtfc_key": key})
    try:
        raw = fetch_raw(url, timeout=20)
        with zipfile.ZipFile(io.BytesIO(raw)) as archive:
            xml_name = archive.namelist()[0]
            xml_text = archive.read(xml_name).decode("utf-8", errors="replace")
        root = ElementTree.fromstring(xml_text)
    except (urllib.error.URLError, TimeoutError, zipfile.BadZipFile, ElementTree.ParseError, OSError, IndexError):
        DART_CORP_CODE_CACHE = {}
        return DART_CORP_CODE_CACHE
    codes = {}
    for item in root.findall(".//list"):
        stock_code = (item.findtext("stock_code") or "").strip()
        corp_code = (item.findtext("corp_code") or "").strip()
        if stock_code and corp_code:
            codes[stock_code.upper()] = corp_code
    DART_CORP_CODE_CACHE = codes
    return DART_CORP_CODE_CACHE


def dart_disclosures(ticker: str, market: str):
    if market not in {"KS", "KQ"} or not IS_NUMERIC_CODE.match(ticker):
        return []
    key = dart_api_key()
    if not key:
        return []
    corp_code = load_dart_corp_codes().get(ticker.upper())
    if not corp_code:
        return []
    today = kst_now()
    url = "https://opendart.fss.or.kr/api/list.json?" + urllib.parse.urlencode({
        "crtfc_key": key,
        "corp_code": corp_code,
        "bgn_de": (today - timedelta(days=180)).strftime("%Y%m%d"),
        "end_de": today.strftime("%Y%m%d"),
        "page_count": "10",
    })
    try:
        data = fetch_json(url, timeout=12)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, OSError):
        return []
    if str(data.get("status") or "") not in {"000", ""}:
        return []
    items = []
    for item in data.get("list") or []:
        report_name = str(item.get("report_nm") or "").strip()
        receipt_no = str(item.get("rcept_no") or "").strip()
        if not report_name or not receipt_no:
            continue
        items.append({
            "id": receipt_no,
            "title": report_name,
            "date": str(item.get("rcept_dt") or ""),
            "submitter": str(item.get("corp_name") or ""),
            "url": f"https://dart.fss.or.kr/dsaf001/main.do?rcpNo={urllib.parse.quote(receipt_no)}",
            "source": "OpenDART",
        })
    return items


def fetch_disclosures(ticker: str, market: str):
    dart_items = dart_disclosures(ticker, market)
    if dart_items:
        return {"items": dart_items, "source": "OpenDART"}
    return {"items": naver_disclosures(ticker, market), "source": "Naver Finance Notice"}


def yahoo_history(symbol: str, range_value: str, interval: str):
    encoded = urllib.parse.quote(symbol, safe="")
    url = (
        f"https://query1.finance.yahoo.com/v8/finance/chart/{encoded}"
        f"?interval={urllib.parse.quote(interval)}&range={urllib.parse.quote(range_value)}"
    )
    data = fetch_json(url, timeout=10)
    result = ((data.get("chart") or {}).get("result") or [None])[0] or {}
    timestamps = result.get("timestamp") or []
    quote = (((result.get("indicators") or {}).get("quote") or [None])[0]) or {}
    closes = quote.get("close") or []
    opens = quote.get("open") or []
    highs = quote.get("high") or []
    lows = quote.get("low") or []
    volumes = quote.get("volume") or []
    points = []
    for idx, timestamp in enumerate(timestamps):
        close = closes[idx] if idx < len(closes) else None
        if not isinstance(close, (int, float)):
            continue
        points.append({
            "date": timestamp,
            "open": opens[idx] if idx < len(opens) and isinstance(opens[idx], (int, float)) else close,
            "high": highs[idx] if idx < len(highs) and isinstance(highs[idx], (int, float)) else close,
            "low": lows[idx] if idx < len(lows) and isinstance(lows[idx], (int, float)) else close,
            "close": close,
            "volume": volumes[idx] if idx < len(volumes) and isinstance(volumes[idx], (int, float)) else 0,
        })
    return {"symbol": symbol, "points": points, "source": "Yahoo Finance"}


def aggregate_history_points(points: list[dict], interval: str) -> list[dict]:
    bucket_seconds = {"5m": 5 * 60, "60m": 60 * 60}.get(str(interval or "").lower())
    if not bucket_seconds:
        return points
    buckets: dict[int, dict] = {}
    for point in points:
        try:
            timestamp = int(float(point.get("date")))
            bucket = timestamp - (timestamp % bucket_seconds)
            open_value = float(point.get("open", point.get("close")))
            high_value = float(point.get("high", point.get("close")))
            low_value = float(point.get("low", point.get("close")))
            close_value = float(point.get("close"))
            volume_value = float(point.get("volume", 0) or 0)
        except (TypeError, ValueError):
            continue
        existing = buckets.get(bucket)
        if not existing:
            buckets[bucket] = {
                "date": bucket,
                "open": open_value,
                "high": high_value,
                "low": low_value,
                "close": close_value,
                "volume": volume_value,
            }
            continue
        existing["high"] = max(existing["high"], high_value)
        existing["low"] = min(existing["low"], low_value)
        existing["close"] = close_value
        existing["volume"] = existing.get("volume", 0) + volume_value
    return [buckets[key] for key in sorted(buckets)]


def parse_money(value):
    number = parse_first_number(str(value or "").replace("$", ""))
    return number if number is not None else None


def history_range_days(range_value: str):
    return {
        "1d": 2,
        "5d": 8,
        "1mo": 45,
        "3mo": 120,
        "6mo": 210,
        "1y": 420,
        "2y": 780,
        "3y": 1160,
        "5y": 1900,
    }.get(str(range_value or "").lower(), 420)


def nasdaq_history(ticker: str, range_value: str = "6mo"):
    if not re.match(r"^[A-Z.\-]{1,12}$", ticker):
        return None
    end = datetime.now()
    start = end - timedelta(days=history_range_days(range_value))
    url = (
        f"https://api.nasdaq.com/api/quote/{urllib.parse.quote(ticker)}/historical?"
        + urllib.parse.urlencode({
            "assetclass": "stocks",
            "fromdate": start.strftime("%Y-%m-%d"),
            "todate": end.strftime("%Y-%m-%d"),
            "limit": "9999",
        })
    )
    data = fetch_json(
        url,
        timeout=10,
        extra_headers={
            "Accept": "application/json, text/plain, */*",
            "Origin": "https://www.nasdaq.com",
            "Referer": f"https://www.nasdaq.com/market-activity/stocks/{ticker.lower()}/historical",
        },
    )
    rows = (((data.get("data") or {}).get("tradesTable") or {}).get("rows") or [])
    points = []
    for row in rows:
        try:
            close = parse_money(row.get("close"))
            if close is None:
                continue
            date = datetime.strptime(str(row.get("date")), "%m/%d/%Y").timestamp()
            points.append({
                "date": date,
                "open": parse_money(row.get("open")) or close,
                "high": parse_money(row.get("high")) or close,
                "low": parse_money(row.get("low")) or close,
                "close": close,
            })
        except (TypeError, ValueError):
            continue
    points.sort(key=lambda point: point["date"])
    return {"symbol": ticker, "points": points, "source": "Nasdaq"} if points else None


def fetch_history(ticker: str, market: str, range_value: str, interval: str):
    history = None
    normalized_interval = str(interval or "1d").lower()
    if normalized_interval != "1d":
        try:
            history = yahoo_history(market_symbol(ticker, market), range_value, normalized_interval)
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
            history = None
        if history and history.get("points"):
            return history
        if normalized_interval in {"5m", "60m"}:
            try:
                history = yahoo_history(market_symbol(ticker, market), "1d", "1m")
            except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
                history = None
            if history and history.get("points"):
                return {
                    **history,
                    "points": aggregate_history_points(history["points"], normalized_interval),
                    "source": "Yahoo Finance",
                }
        return None
    if ticker in NAVER_INDEX_SYMBOLS:
        history = naver_history(NAVER_INDEX_SYMBOLS[ticker], range_value)
    elif market in {"KS", "KQ"}:
        history = naver_history(ticker, range_value)
    if history and history.get("points"):
        return history
    try:
        history = yahoo_history(market_symbol(ticker, market), range_value, interval)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
        history = None
    if history and history.get("points"):
        return history
    if market == "US":
        return nasdaq_history(ticker, range_value)
    return history


def naver_history(ticker: str, range_value: str = "1y"):
    end = datetime.now()
    start = end - timedelta(days=history_range_days(range_value))
    url = (
        "https://api.finance.naver.com/siseJson.naver?"
        + urllib.parse.urlencode(
            {
                "symbol": ticker,
                "requestType": "1",
                "startTime": start.strftime("%Y%m%d"),
                "endTime": end.strftime("%Y%m%d"),
                "timeframe": "day",
            }
        )
    )
    text = fetch_text(url, timeout=10, extra_headers={"Referer": "https://finance.naver.com"})
    rows = ast.literal_eval(text.strip())
    points = []
    for row in rows[1:]:
        if not isinstance(row, list) or len(row) < 5:
            continue
        try:
            points.append({
                "date": datetime.strptime(str(row[0]), "%Y%m%d").timestamp(),
                "open": float(row[1]),
                "high": float(row[2]),
                "low": float(row[3]),
                "close": float(row[4]),
                "volume": float(row[5]) if len(row) > 5 else 0,
            })
        except (TypeError, ValueError):
            continue
    return {"symbol": ticker, "points": points, "source": "Naver Finance"}


def search_stocks(query: str):
    query = query.strip()
    if not query:
        return []
    if HAS_KOREAN.search(query) or IS_NUMERIC_CODE.match(query):
        url = (
            "https://ac.stock.naver.com/ac?"
            + urllib.parse.urlencode(
                {"q": query, "target": "stock,index,etf,fund,exchange", "type": "main"}
            )
        )
        data = fetch_json(url, extra_headers={"Referer": "https://finance.naver.com"})
        out = []
        for item in data.get("items") or []:
            if not isinstance(item, dict):
                continue
            code = str(item.get("code") or "")
            name = str(item.get("name") or "")
            type_code = str(item.get("typeCode") or "").upper()
            if not code or not name:
                continue
            market = "KQ" if type_code == "KOSDAQ" else "KS" if type_code == "KOSPI" else ""
            if market:
                out.append({"ticker": code, "name": name, "market": market, "exchange": item.get("typeName") or type_code})
        return out[:12]

    url = "https://query2.finance.yahoo.com/v1/finance/search?" + urllib.parse.urlencode(
        {"q": query, "quotesCount": "12", "newsCount": "0"}
    )
    try:
        data = fetch_json(url)
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
        return direct_us_search_fallback(query)
    out = []
    for item in data.get("quotes") or []:
        if item.get("quoteType") != "EQUITY":
            continue
        symbol = str(item.get("symbol") or "")
        if not symbol:
            continue
        if symbol.endswith(".KS"):
            ticker, market = symbol[:-3], "KS"
        elif symbol.endswith(".KQ"):
            ticker, market = symbol[:-3], "KQ"
        elif "." not in symbol:
            ticker, market = symbol, "US"
        else:
            continue
        out.append({
            "ticker": ticker,
            "name": item.get("longname") or item.get("shortname") or symbol,
            "market": market,
            "exchange": item.get("exchDisp") or ""
        })
    return out[:12] or direct_us_search_fallback(query)


def direct_us_search_fallback(query: str):
    ticker = query.strip().upper()
    if not IS_US_TICKER.match(ticker):
        return []
    try:
        quote = fetch_quote(ticker, "US")
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ValueError, SyntaxError):
        quote = None
    if not quote:
        return []
    return [{"ticker": ticker, "name": ticker, "market": "US", "exchange": quote.get("source") or "US"}]


class Handler(SimpleHTTPRequestHandler):
    server_version = "WoogiStock"
    sys_version = ""

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; "
            "base-uri 'self'; "
            "object-src 'none'; "
            "frame-ancestors 'none'; "
            "script-src 'self' https://www.gstatic.com; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https: wss:; "
            "frame-src https:; "
            "manifest-src 'self'; "
            "worker-src 'self' blob:"
        )
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_HEAD(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/healthz":
            body = json.dumps({"ok": True}).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return
        if parsed.path == "/config.local.js":
            local_config = ROOT / "config.local.js"
            body = local_config.read_bytes() if local_config.exists() else browser_config_script()
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return
        super().do_HEAD()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)
        try:
            if parsed.path == "/api/quote":
                ticker = (params.get("ticker") or [""])[0].strip().upper()
                market = (params.get("market") or ["US"])[0].strip().upper()
                if not ticker:
                    json_response(self, 400, {"error": "ticker is required"})
                    return
                quote = fetch_quote(ticker, market)
                if not quote:
                    json_response(self, 404, {"error": "quote not found"})
                    return
                json_response(self, 200, quote)
                return
            if parsed.path == "/api/history":
                ticker = (params.get("ticker") or [""])[0].strip().upper()
                market = (params.get("market") or ["US"])[0].strip().upper()
                range_value = (params.get("range") or ["6mo"])[0]
                interval = (params.get("interval") or ["1d"])[0]
                if not ticker:
                    json_response(self, 400, {"error": "ticker is required"})
                    return
                history = fetch_history(ticker, market, range_value, interval)
                if not history or not history.get("points"):
                    json_response(self, 404, {"error": "history not found"})
                    return
                json_response(self, 200, history)
                return
            if parsed.path == "/api/sentiment":
                sentiment = cnn_fear_and_greed()
                if not sentiment:
                    json_response(self, 404, {"error": "sentiment not found"})
                    return
                json_response(self, 200, sentiment)
                return
            if parsed.path == "/api/investor-flow":
                flow = collect_investor_flow()
                if not any(
                    flow[market][key]
                    for market in ("kospi", "kosdaq")
                    for key in ("foreignTop5", "institutionTop5")
                ):
                    json_response(self, 404, {"error": "investor flow not found", "sources": flow.get("sources", {})})
                    return
                json_response(self, 200, flow)
                return
            if parsed.path == "/api/market-sectors":
                sectors = collect_market_sectors()
                if not sectors.get("sectors") or not sectors.get("breadth"):
                    json_response(self, 404, {"error": "market sectors not found"})
                    return
                json_response(self, 200, sectors)
                return
            if parsed.path == "/api/night-futures":
                json_response(self, 200, collect_night_futures())
                return
            if parsed.path == "/api/market-brief":
                json_response(self, 200, build_market_brief())
                return
            if parsed.path == "/api/fmkorea":
                json_response(self, 200, scrape_fmkorea())
                return
            if parsed.path == "/api/fundamentals":
                ticker = (params.get("ticker") or [""])[0].strip().upper()
                market = (params.get("market") or ["US"])[0].strip().upper()
                if not ticker:
                    json_response(self, 400, {"error": "ticker is required"})
                    return
                fundamentals = fetch_fundamentals(ticker, market)
                if not fundamentals:
                    json_response(self, 404, {"error": "fundamentals not found"})
                    return
                json_response(self, 200, fundamentals)
                return
            if parsed.path == "/api/news":
                ticker = (params.get("ticker") or [""])[0].strip().upper()
                market = (params.get("market") or ["US"])[0].strip().upper()
                name = (params.get("name") or [""])[0].strip()
                if not ticker:
                    json_response(self, 400, {"error": "ticker is required"})
                    return
                json_response(self, 200, {"items": fetch_news(ticker, market, name)})
                return
            if parsed.path == "/api/disclosures":
                ticker = (params.get("ticker") or [""])[0].strip().upper()
                market = (params.get("market") or ["US"])[0].strip().upper()
                if not ticker:
                    json_response(self, 400, {"error": "ticker is required"})
                    return
                json_response(self, 200, fetch_disclosures(ticker, market))
                return
            if parsed.path == "/api/discussions":
                ticker = (params.get("ticker") or [""])[0].strip().upper()
                market = (params.get("market") or ["US"])[0].strip().upper()
                if not ticker:
                    json_response(self, 400, {"error": "ticker is required"})
                    return
                json_response(self, 200, {
                    "items": naver_discussions(ticker, market),
                    "source": "Naver Finance Board",
                })
                return
            if parsed.path == "/api/search":
                query = (params.get("q") or [""])[0]
                json_response(self, 200, {"items": search_stocks(query)})
                return
            if parsed.path == "/api/scanner":
                market = (params.get("market") or ["ALL"])[0].strip().upper()
                limit = int((params.get("limit") or ["20"])[0])
                universe_limit = int((params.get("universe") or ["30"])[0])
                json_response(self, 200, scan_market_opportunities(market, limit, universe_limit))
                return
            if parsed.path == "/healthz":
                json_response(self, 200, {"ok": True})
                return
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, ElementTree.ParseError, ValueError, SyntaxError, OSError) as exc:
            json_response(self, 502, {"error": str(exc)})
            return

        path = parsed.path.lstrip("/") or "index.html"
        safe_path = (ROOT / path).resolve()
        if ROOT not in safe_path.parents and safe_path != ROOT:
            self.send_error(403)
            return
        if safe_path.is_dir():
            safe_path = safe_path / "index.html"
        if not safe_path.exists():
            if path == "config.local.js":
                body = browser_config_script()
                self.send_response(200)
                self.send_header("Content-Type", "application/javascript; charset=utf-8")
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                try:
                    self.wfile.write(body)
                except (BrokenPipeError, ConnectionResetError):
                    return
                return
            if "." in Path(path).name:
                self.send_error(404)
                return
            safe_path = ROOT / "index.html"
        content_type = mimetypes.guess_type(str(safe_path))[0] or "application/octet-stream"
        body = safe_path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            return

    def log_message(self, format, *args):
        try:
            sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))
        except (BrokenPipeError, ConnectionResetError, OSError):
            return


def main():
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    display_host = "127.0.0.1" if HOST in {"", "0.0.0.0"} else HOST
    print(f"우기의 주식 server running at http://{display_host}:{PORT}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
