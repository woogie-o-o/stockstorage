from __future__ import annotations

import math
from statistics import mean, pstdev


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, float(value)))


def _return_pct(current: float, previous: float) -> float:
    return (current / previous - 1.0) * 100.0 if previous > 0 else 0.0


def _average(values: list[float]) -> float:
    return mean(values) if values else 0.0


def _atr(points: list[dict], period: int = 14) -> float:
    recent = points[-(period + 1):]
    if len(recent) < 2:
        return 0.0
    true_ranges = []
    for previous, current in zip(recent, recent[1:]):
        close = float(previous.get("close") or 0)
        high = float(current.get("high") or current.get("close") or 0)
        low = float(current.get("low") or current.get("close") or 0)
        true_ranges.append(max(high - low, abs(high - close), abs(low - close)))
    return _average(true_ranges)


def _ema_values(values: list[float], span: int) -> list[float]:
    if not values:
        return []
    alpha = 2 / (span + 1)
    out = [values[0]]
    for value in values[1:]:
        out.append(value * alpha + out[-1] * (1 - alpha))
    return out


def _rsi_latest(closes: list[float], period: int = 14) -> float:
    if len(closes) < period + 1:
        return 50.0
    gains: list[float] = []
    losses: list[float] = []
    for previous, current in zip(closes[-(period + 1):], closes[-period:]):
        change = current - previous
        gains.append(max(0.0, change))
        losses.append(max(0.0, -change))
    avg_loss = _average(losses)
    if avg_loss <= 0:
        return 100.0
    rs = _average(gains) / avg_loss
    return 100 - 100 / (1 + rs)


def _macd_snapshot(closes: list[float]) -> dict:
    if len(closes) < 35:
        return {"hist": 0.0, "prevHist": 0.0, "aboveSignal": False, "turnUp": False}
    fast = _ema_values(closes, 12)
    slow = _ema_values(closes, 26)
    macd = [a - b for a, b in zip(fast, slow)]
    signal = _ema_values(macd, 9)
    hist = [a - b for a, b in zip(macd, signal)]
    current = hist[-1]
    previous = hist[-2] if len(hist) >= 2 else 0.0
    return {
        "hist": current,
        "prevHist": previous,
        "aboveSignal": macd[-1] > signal[-1],
        "turnUp": current > previous and current >= 0,
    }


def _bollinger_widths(closes: list[float], period: int = 20) -> list[float]:
    widths: list[float] = []
    for idx in range(period, len(closes) + 1):
        window = closes[idx - period:idx]
        mid = _average(window)
        if mid <= 0:
            widths.append(0.0)
            continue
        widths.append((pstdev(window) * 4) / mid)
    return widths


def _obv_slope(closes: list[float], volumes: list[float], period: int = 20) -> float:
    if len(closes) < 3:
        return 0.0
    obv = [0.0]
    for previous, current, volume in zip(closes[:-1], closes[1:], volumes[1:]):
        direction = 1 if current > previous else -1 if current < previous else 0
        obv.append(obv[-1] + direction * volume)
    sample = obv[-period:]
    if len(sample) < 2:
        return 0.0
    x_mean = (len(sample) - 1) / 2
    y_mean = _average(sample)
    denom = sum((idx - x_mean) ** 2 for idx in range(len(sample)))
    if denom <= 0:
        return 0.0
    return sum((idx - x_mean) * (value - y_mean) for idx, value in enumerate(sample)) / denom


def _vwap(points: list[dict], period: int = 20) -> float:
    recent = points[-period:]
    pv = 0.0
    volume_sum = 0.0
    for point in recent:
        close = float(point.get("close") or 0)
        high = float(point.get("high") or close)
        low = float(point.get("low") or close)
        volume = float(point.get("volume") or 0)
        typical = (high + low + close) / 3
        pv += typical * volume
        volume_sum += volume
    return pv / volume_sum if volume_sum > 0 else 0.0


def _label_score(score: float) -> str:
    if score >= 78:
        return "강함"
    if score >= 62:
        return "보통"
    return "약함"


def _risk_label(score: float) -> str:
    if score >= 72:
        return "높음"
    if score >= 48:
        return "확인 필요"
    if score >= 28:
        return "보통"
    return "낮음"


def _priority_label(score: float, rr: float, false_breakout_score: float, chase_risk_score: float) -> str:
    if score >= 78 and rr >= 2.0 and false_breakout_score < 45 and chase_risk_score < 62:
        return "A"
    if score >= 65 and rr >= 1.6 and false_breakout_score < 65:
        return "B"
    return "C"


def _axis_stars(score: float) -> int:
    score = _clamp(score)
    if score >= 82:
        return 5
    if score >= 64:
        return 4
    if score >= 46:
        return 3
    if score >= 28:
        return 2
    if score > 0:
        return 1
    return 0


def _axis_label(stars: int) -> str:
    labels = {
        5: "강한 컨펌",
        4: "우호",
        3: "중립",
        2: "약함",
        1: "위험",
        0: "판단 불가",
    }
    return labels.get(stars, "판단 불가")


def _axis_payload(name: str, score: float, verdict: str, evidence: list[str]) -> dict:
    stars = _axis_stars(score)
    return {
        "name": name,
        "score": stars,
        "scorePct": round(_clamp(score), 1),
        "label": _axis_label(stars),
        "verdict": verdict,
        "evidence": evidence[:3],
    }


def _four_axis_snapshot(
    *,
    current: float,
    ma20: float,
    ma60: float,
    ma120: float,
    ret_1m: float,
    ret_3m: float,
    volume_ratio: float,
    annual_volatility: float,
    trend_score: float,
    momentum_score: float,
    breakout_score: float,
    liquidity_score: float,
    chase_risk_score: float,
    false_breakout_score: float,
    pct_from_high: float,
    rsi: float,
    macd: dict,
    bb_width_rank: float,
    obv_slope: float,
    above_vwap: bool,
) -> dict:
    trend_verdict = "정배열 추세 우위" if ma20 > ma60 > ma120 and current > ma20 else "상승 추세 유지" if current > ma20 and ma20 >= ma60 else "방향 확인"
    momentum_verdict = "모멘텀 양호" if rsi >= 55 and macd.get("aboveSignal") else "과열 경계" if rsi >= 72 else "모멘텀 확인 중"
    volatility_score = _clamp(
        70
        - max(0.0, annual_volatility - 34.0) * 0.75
        - max(0.0, false_breakout_score - 55.0) * 0.35
        + (12 if bb_width_rank <= 25 and momentum_score >= 55 else 0)
        - (8 if bb_width_rank >= 88 and chase_risk_score >= 60 else 0)
    )
    volatility_verdict = "스퀴즈 후 방향 대기" if bb_width_rank <= 25 else "변동성 확장 경계" if annual_volatility >= 48 or bb_width_rank >= 82 else "변동성 관리 가능"
    volume_score = _clamp(
        liquidity_score * 0.35
        + breakout_score * 0.35
        + (15 if obv_slope > 0 else -8)
        + (10 if above_vwap else -8)
        + _clamp(volume_ratio - 1.0, -0.5, 3.0) * 8
    )
    volume_verdict = "거래량·수급 동시 컨펌" if volume_ratio >= 1.5 and obv_slope > 0 and above_vwap else "수급 확인 필요" if not above_vwap or obv_slope < 0 else "거래량 관찰"

    if bb_width_rank <= 22 and momentum_score >= 55:
        phase = f"브레이크아웃 대기 — BB폭 {bb_width_rank:.0f}% 분위, 방향 확인"
    elif pct_from_high >= -3 and trend_score >= 70:
        phase = f"신고가권 접근 — 52주 고점 대비 {pct_from_high:+.1f}%"
    elif chase_risk_score >= 70:
        phase = "고점 부근 경계 — 추격보다 눌림목 확인"
    elif trend_score >= 70 and momentum_score >= 65 and volume_score >= 65:
        phase = "강한 상승 — 추세·모멘텀·수급 동시 우위"
    elif trend_score >= 62 and momentum_score < 60:
        phase = "상승 추세 조정 — 모멘텀 재가속 확인"
    elif trend_score < 46:
        phase = "방향성 부족 — 신규 진입 보류"
    else:
        phase = "선별 관찰 — 조건 충족 여부 확인"

    axes = {
        "trend": _axis_payload("추세", trend_score, trend_verdict, [
            f"현재가/MA20 { _return_pct(current, ma20):+.1f}%",
            "MA20>MA60" if ma20 > ma60 else "MA20<=MA60",
            f"3개월 {ret_3m:+.1f}%",
        ]),
        "momentum": _axis_payload("모멘텀", momentum_score, momentum_verdict, [
            f"RSI {rsi:.1f}",
            "MACD 신호선 위" if macd.get("aboveSignal") else "MACD 신호 확인 중",
            f"1개월 {ret_1m:+.1f}%",
        ]),
        "volatility": _axis_payload("변동성", volatility_score, volatility_verdict, [
            f"연환산 변동성 {annual_volatility:.1f}%",
            f"BB폭 분위 {bb_width_rank:.0f}%",
            f"허위돌파 {false_breakout_score:.0f}점",
        ]),
        "volume": _axis_payload("거래량·수급", volume_score, volume_verdict, [
            f"거래량 {volume_ratio:.1f}배",
            "VWAP 위" if above_vwap else "VWAP 아래",
            "OBV 우상향" if obv_slope > 0 else "OBV 둔화",
        ]),
    }
    signal_stars = round(sum(axis["score"] for axis in axes.values()) / 4, 1)
    weak_axes = [axis["name"] for axis in axes.values() if axis["score"] <= 2]
    return {
        **axes,
        "phase": phase,
        "signalStars": signal_stars,
        "keyObservation": " · ".join([phase, f"4축 평균 {signal_stars:.1f}/5"]),
        "riskPoint": "취약 축: " + ", ".join(weak_axes) if weak_axes else "4축에서 큰 결함은 제한적",
    }


def _risk_gate(annual_volatility: float, chase_risk_score: float, false_breakout_score: float, rr: float) -> dict:
    risk_score = _clamp(
        annual_volatility * 0.65
        + chase_risk_score * 0.45
        + false_breakout_score * 0.35
        - max(0.0, rr - 1.5) * 8
    )
    if risk_score >= 68:
        regime, scale, label = "Risk-Off", 0.5, "신규 진입 보수적"
    elif risk_score >= 46:
        regime, scale, label = "Neutral", 0.75, "선별·축소 진입"
    else:
        regime, scale, label = "Risk-On", 1.0, "표준 리스크 가능"
    return {
        "regime": regime,
        "label": label,
        "riskScore": round(risk_score, 1),
        "riskScale": scale,
        "reason": (
            f"종목 변동성 {annual_volatility:.1f}%, 추격 위험 {chase_risk_score:.0f}점, "
            f"허위돌파 위험 {false_breakout_score:.0f}점 기준"
        ),
        "source": "scanner volatility gate",
    }


def _position_guide(entry: float, stop: float, market: str, gate: dict | None = None, target: float | None = None) -> dict:
    equity = 10_000_000 if market in {"KS", "KQ"} else 10_000
    gate = gate or {}
    risk_scale = float(gate.get("riskScale") or 1.0)
    risk_pct = round(1.0 * risk_scale, 2)
    risk_amount = equity * risk_pct / 100
    per_share_risk = max(0.0, entry - stop)
    quantity = math.floor(risk_amount / per_share_risk) if per_share_risk > 0 else 0
    notional = quantity * entry
    rr = (target - entry) / per_share_risk if target and target > entry and per_share_risk > 0 else None
    return {
        "basis": f"가상 1회 리스크 {risk_pct:g}%",
        "assumedEquity": round(equity),
        "riskPct": risk_pct,
        "riskScale": risk_scale,
        "riskAmount": round(risk_amount),
        "quantity": quantity,
        "notional": round(notional),
        "perShareRisk": round(per_share_risk),
        "sizingGrade": gate.get("label") or "표준 리스크 가능",
        "sizingReason": gate.get("reason") or "기본 리스크 1% 기준",
        "rMultipleTarget": round(rr, 2) if rr is not None else None,
    }


def _market(stock: dict) -> str:
    exchange = stock.get("stockExchangeType") or {}
    market = str(exchange.get("code") or "").upper()
    if market in {"KS", "KQ"}:
        return market
    return "KQ" if str(stock.get("sosok") or "") == "1" else "KS"


def _raw_number(stock: dict, key: str, fallback: str = "") -> float:
    value = stock.get(key)
    if value in {None, ""}:
        value = stock.get(fallback) if fallback else 0
    try:
        return float(str(value or 0).replace(",", ""))
    except ValueError:
        return 0.0


def build_scanner_feature(stock: dict, points: list[dict]) -> dict | None:
    history = sorted(
        [point for point in points if float(point.get("close") or 0) > 0],
        key=lambda point: float(point.get("date") or 0),
    )
    if len(history) < 60:
        return None

    closes = [float(point.get("close") or 0) for point in history]
    volumes = [float(point.get("volume") or 0) for point in history]
    current = _raw_number(stock, "closePriceRaw", "closePrice") or closes[-1]
    trading_value = _raw_number(stock, "accumulatedTradingValueRaw")
    change_rate = _raw_number(stock, "fluctuationsRatio")
    ma5 = _average(closes[-5:])
    ma20 = _average(closes[-20:])
    ma60 = _average(closes[-60:])
    ma120 = _average(closes[-120:]) if len(closes) >= 120 else ma60
    ret_1m = _return_pct(current, closes[-21]) if len(closes) > 21 else 0.0
    ret_3m = _return_pct(current, closes[-61]) if len(closes) > 61 else ret_1m
    ret_6m = _return_pct(current, closes[-121]) if len(closes) > 121 else ret_3m
    high_52w = max(closes[-252:])
    pct_from_high = _return_pct(current, high_52w)
    previous_volumes = [volume for volume in volumes[-21:-1] if volume > 0]
    volume_ratio = volumes[-1] / _average(previous_volumes) if previous_volumes and volumes[-1] > 0 else 1.0
    daily_returns = [
        _return_pct(current_close, previous)
        for previous, current_close in zip(closes[-61:-1], closes[-60:])
        if previous > 0 and current_close > 0
    ]
    annual_volatility = pstdev(daily_returns) * math.sqrt(252) if len(daily_returns) >= 10 else 0.0
    atr = _atr(history)
    rsi = _rsi_latest(closes)
    macd = _macd_snapshot(closes)
    bb_widths = _bollinger_widths(closes)
    latest_bb_width = bb_widths[-1] * 100 if bb_widths else 0.0
    bb_rank_window = bb_widths[-60:] if len(bb_widths) >= 10 else bb_widths
    bb_width_rank = (
        sum(1 for width in bb_rank_window if width <= bb_widths[-1]) / len(bb_rank_window) * 100
        if bb_rank_window else 50.0
    )
    obv_slope = _obv_slope(closes, volumes)
    vwap20 = _vwap(history)
    above_vwap = current >= vwap20 if vwap20 > 0 else True

    trend_score = _clamp(
        28
        + (18 if current > ma20 else -12)
        + (18 if ma20 > ma60 else -8)
        + (12 if ma60 > ma120 else -5)
        + _clamp(ret_3m, -20, 30) * 0.8
    )
    momentum_score = _clamp(45 + ret_1m * 1.25 + ret_3m * 0.55 + ret_6m * 0.2)
    breakout_score = _clamp(
        32
        + _clamp(volume_ratio - 1.0, -0.5, 4.0) * 18
        + _clamp(15 + pct_from_high, 0, 18) * 2.0
        + (12 if ma5 > ma20 > ma60 else 0)
    )
    liquidity_score = _clamp(22 + math.log10(max(trading_value, 100_000_000) / 100_000_000) * 19)
    chase_risk_score = _clamp(
        18
        + max(0.0, ret_1m - 10.0) * 1.9
        + max(0.0, volume_ratio - 2.3) * 10.0
        + (12 if pct_from_high > -1.5 and ret_1m > 12 else 0)
        + max(0.0, annual_volatility - 42.0) * 0.45
    )
    false_breakout_score = _clamp(
        18
        + (24 if pct_from_high > -2 and volume_ratio < 1.35 else 0)
        + (18 if rsi >= 72 else 0)
        + (14 if macd["hist"] < macd["prevHist"] else 0)
        + (12 if obv_slope < 0 else 0)
        + (10 if not above_vwap else 0)
        + max(0.0, annual_volatility - 50) * 0.3
    )
    score = _clamp(
        trend_score * 0.30
        + momentum_score * 0.28
        + breakout_score * 0.24
        + liquidity_score * 0.18
        - max(0.0, chase_risk_score - 65.0) * 0.16
    )
    rr_boost = 0.0

    if trend_score >= 70 and breakout_score >= 67 and pct_from_high >= -12:
        group, pattern = "ai_capture", "돌파 감시"
    elif trend_score >= 62 and -3 <= _return_pct(current, ma20) <= 7 and ret_3m > 0:
        group, pattern = "ai_capture", "눌림목 후보"
    elif momentum_score >= 72 and chase_risk_score >= 58:
        group, pattern = "surge", "조건부 급등"
    else:
        group, pattern = "ai_capture", "수급 관찰"

    floor = max(current * 0.97, current - atr * 0.5)
    pullback = min(current, ma20 if ma20 > 0 else current, current - atr * 0.3)
    entry_price = max(floor, pullback)
    stop_price = max(0.0, entry_price - max(atr * 1.5, entry_price * 0.04))
    target_price = entry_price + (entry_price - stop_price) * 2.2
    risk_amount_per_share = max(0.0, entry_price - stop_price)
    rr = (target_price - entry_price) / risk_amount_per_share if risk_amount_per_share > 0 else 0.0
    rr_boost = min(12.0, max(0.0, (rr - 1.2) * 7))
    profit_score = _clamp(score * 0.62 + rr_boost + max(0.0, 70 - chase_risk_score) * 0.12 - false_breakout_score * 0.18)
    risk_level = "높음" if chase_risk_score >= 65 else "보통" if chase_risk_score >= 42 else "낮음"
    false_breakout_risk = _risk_label(false_breakout_score)
    candidate_priority = _priority_label(score, rr, false_breakout_score, chase_risk_score)
    four_axis = _four_axis_snapshot(
        current=current,
        ma20=ma20,
        ma60=ma60,
        ma120=ma120,
        ret_1m=ret_1m,
        ret_3m=ret_3m,
        volume_ratio=volume_ratio,
        annual_volatility=annual_volatility,
        trend_score=trend_score,
        momentum_score=momentum_score,
        breakout_score=breakout_score,
        liquidity_score=liquidity_score,
        chase_risk_score=chase_risk_score,
        false_breakout_score=false_breakout_score,
        pct_from_high=pct_from_high,
        rsi=rsi,
        macd=macd,
        bb_width_rank=bb_width_rank,
        obv_slope=obv_slope,
        above_vwap=above_vwap,
    )
    market_gate = _risk_gate(annual_volatility, chase_risk_score, false_breakout_score, rr)
    if chase_risk_score >= 70:
        response = "추격 금지, 눌림목 대기"
    elif false_breakout_score >= 65:
        response = "종가 재돌파 확인"
    elif score >= 76 and rr >= 2.0:
        response = "분할 진입 관찰"
    elif breakout_score >= 70:
        response = "거래량 유지 확인"
    else:
        response = "관찰 유지"
    ticker = str(stock.get("itemCode") or stock.get("reutersCode") or "")
    market = _market(stock)
    name = str(stock.get("stockName") or ticker)
    reason = (
        f"{pattern}: 추세 {trend_score:.0f}, 모멘텀 {momentum_score:.0f}, 돌파 {breakout_score:.0f}. "
        f"20일 대비 거래량 {volume_ratio:.1f}배, 52주 고점 대비 {pct_from_high:+.1f}%. "
        f"추격 위험 {risk_level}, 허위돌파 위험 {false_breakout_risk}. "
        f"{four_axis['phase']}. 대응은 {response}."
    )
    return {
        "id": f"scan_{market}_{ticker}",
        "ticker": ticker,
        "name": name,
        "market": market,
        "group": group,
        "pattern": pattern,
        "title": pattern,
        "reason": reason,
        "price": round(current),
        "currentPrice": round(current),
        "changeRate": round(change_rate, 2),
        "score": round(score),
        "tradingValue": round(trading_value),
        "volumeRatio": round(volume_ratio, 2),
        "source": "Naver Finance Scanner",
        "factors": {
            "trend": round(trend_score, 1),
            "momentum": round(momentum_score, 1),
            "breakout": round(breakout_score, 1),
            "liquidity": round(liquidity_score, 1),
            "chaseRisk": round(chase_risk_score, 1),
            "falseBreakoutRisk": round(false_breakout_score, 1),
            "finalBuy": round(score, 1),
            "profit": round(profit_score, 1),
            "riskReward": round(rr, 2),
            "rsi": round(rsi, 1),
            "macdHistogram": round(macd["hist"], 2),
            "macdTurnUp": bool(macd["turnUp"]),
            "bbWidth": round(latest_bb_width, 2),
            "bbWidthRank": round(bb_width_rank, 1),
            "obvSlope": round(obv_slope, 1),
            "aboveVwap": bool(above_vwap),
            "vwap20": round(vwap20),
            "volatility": round(annual_volatility, 1),
            "pctFrom52WeekHigh": round(pct_from_high, 1),
            "fourAxis": four_axis,
        },
        "tradePlan": {
            "entryPrice": round(entry_price),
            "stopPrice": round(stop_price),
            "targetPrice": round(target_price),
            "target1Price": round(entry_price + risk_amount_per_share),
            "target2Price": round(entry_price + risk_amount_per_share * 2),
            "target3Price": round(entry_price + risk_amount_per_share * 3),
            "riskReward": round(rr, 2),
            "stopPct": round((risk_amount_per_share / entry_price) * 100, 2) if entry_price > 0 else 0.0,
            "riskLevel": risk_level,
            "response": response,
            "marketGate": market_gate,
            "positionGuide": _position_guide(entry_price, stop_price, market, market_gate, target_price),
        },
        "marketGate": market_gate,
        "decision": {
            "priority": candidate_priority,
            "buyAttractiveness": _label_score(score),
            "profitPotential": _label_score(profit_score),
            "falseBreakoutRisk": false_breakout_risk,
            "summary": f"{candidate_priority}등급 후보 · 손익비 {rr:.1f}R · {response}",
            "confirmation": "거래량이 20일 평균 이상 유지되고 종가가 관찰가 위에서 마감하는지 확인",
            "fourAxisSummary": four_axis["keyObservation"],
        },
    }
