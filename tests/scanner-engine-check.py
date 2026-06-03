from scanner_engine import build_scanner_feature


def make_points():
    points = []
    price = 100_000
    for day in range(140):
        price *= 1.002
        points.append({
            "date": day,
            "open": price * 0.995,
            "high": price * 1.012,
            "low": price * 0.988,
            "close": price,
            "volume": 120_000 if day < 139 else 360_000,
        })
    return points


stock = {
    "itemCode": "005930",
    "stockName": "삼성전자",
    "sosok": "0",
    "closePriceRaw": "133000",
    "fluctuationsRatio": "2.15",
    "accumulatedTradingValueRaw": "348000000000",
}

feature = build_scanner_feature(stock, make_points())
assert feature is not None
assert feature["id"] == "scan_KS_005930"
assert feature["source"] == "Naver Finance Scanner"
assert feature["score"] >= 60
assert feature["volumeRatio"] >= 2.9
assert feature["tradePlan"]["stopPrice"] < feature["tradePlan"]["entryPrice"] < feature["tradePlan"]["targetPrice"]
assert feature["tradePlan"]["riskReward"] >= 2
assert feature["tradePlan"]["positionGuide"]["riskPct"] == 1.0
assert feature["tradePlan"]["response"]
assert 0 <= feature["factors"]["chaseRisk"] <= 100
assert 0 <= feature["factors"]["falseBreakoutRisk"] <= 100
assert 0 <= feature["factors"]["finalBuy"] <= 100
assert 0 <= feature["factors"]["profit"] <= 100
assert feature["factors"]["riskReward"] >= 2
assert feature["decision"]["priority"] in {"A", "B", "C"}
assert feature["decision"]["falseBreakoutRisk"] in {"낮음", "보통", "확인 필요", "높음"}

assert build_scanner_feature(stock, make_points()[:30]) is None

print({
    "id": feature["id"],
    "score": feature["score"],
    "pattern": feature["pattern"],
    "entry": feature["tradePlan"]["entryPrice"],
    "stop": feature["tradePlan"]["stopPrice"],
    "target": feature["tradePlan"]["targetPrice"],
    "rr": feature["tradePlan"]["riskReward"],
    "priority": feature["decision"]["priority"],
})
