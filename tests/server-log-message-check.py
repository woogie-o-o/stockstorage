import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import Handler


class BrokenStderr:
    def write(self, _message):
        raise BrokenPipeError("closed stderr")


class DummyHandler:
    def address_string(self):
        return "127.0.0.1"


original_stderr = sys.stderr
try:
    sys.stderr = BrokenStderr()
    Handler.log_message(DummyHandler(), "%s", "GET /healthz HTTP/1.1")
finally:
    sys.stderr = original_stderr

print("server log message checks passed")
