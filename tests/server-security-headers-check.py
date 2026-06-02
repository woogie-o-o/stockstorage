import sys
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import Handler


class DummyHandler(Handler):
    def __init__(self):
        self.headers = {}

    def send_header(self, name, value):
        self.headers[name] = value


dummy = DummyHandler()
with patch.object(SimpleHTTPRequestHandler, "end_headers", lambda _self: None):
    Handler.end_headers(dummy)

expected = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Content-Security-Policy": "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; script-src 'self' https://www.gstatic.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https: wss:; frame-src https:; manifest-src 'self'; worker-src 'self' blob:",
}
assert dummy.headers == expected
assert Handler.server_version == "WoogiStock"
assert Handler.sys_version == ""

print("server security header checks passed")
