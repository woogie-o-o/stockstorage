import os

from server import kis_night_futures_timeout


def assert_equal(actual, expected, message):
    if actual != expected:
        raise AssertionError(f"{message}: expected {expected}, got {actual}")


original_woogi = os.environ.get("WOOGI_KIS_NIGHT_FUTURES_TIMEOUT")
original_kis = os.environ.get("KIS_NIGHT_FUTURES_TIMEOUT")

try:
    os.environ.pop("WOOGI_KIS_NIGHT_FUTURES_TIMEOUT", None)
    os.environ.pop("KIS_NIGHT_FUTURES_TIMEOUT", None)
    assert_equal(kis_night_futures_timeout(), 6, "default timeout should keep API smoke fast")

    os.environ["WOOGI_KIS_NIGHT_FUTURES_TIMEOUT"] = "1"
    assert_equal(kis_night_futures_timeout(), 2, "timeout should clamp to minimum")

    os.environ["WOOGI_KIS_NIGHT_FUTURES_TIMEOUT"] = "99"
    assert_equal(kis_night_futures_timeout(), 18, "timeout should clamp to maximum")

    os.environ["WOOGI_KIS_NIGHT_FUTURES_TIMEOUT"] = "bad"
    assert_equal(kis_night_futures_timeout(), 6, "invalid timeout should fall back")

    os.environ.pop("WOOGI_KIS_NIGHT_FUTURES_TIMEOUT", None)
    os.environ["KIS_NIGHT_FUTURES_TIMEOUT"] = "5"
    assert_equal(kis_night_futures_timeout(), 5, "legacy env should work")

    print({
        "default": 6,
        "min": 2,
        "max": 18,
        "legacy": 5,
    })
finally:
    if original_woogi is None:
        os.environ.pop("WOOGI_KIS_NIGHT_FUTURES_TIMEOUT", None)
    else:
        os.environ["WOOGI_KIS_NIGHT_FUTURES_TIMEOUT"] = original_woogi
    if original_kis is None:
        os.environ.pop("KIS_NIGHT_FUTURES_TIMEOUT", None)
    else:
        os.environ["KIS_NIGHT_FUTURES_TIMEOUT"] = original_kis
