from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import count_market_breadth, parse_naver_sector_html, top_sector_changes


sector_html = """
<table class="type_1">
  <tbody>
    <tr><td><a href="/sise/sise_group_detail.nhn?type=upjong&no=1">전자제품</a></td><td><span class="tah p11 red01">+29.50%</span></td><td>12</td></tr>
    <tr><td><a href="/sise/sise_group_detail.nhn?type=upjong&no=2">창업투자</a></td><td><span class="tah p11 nv01">-5.98%</span></td><td>8</td></tr>
  </tbody>
</table>
"""
sectors = parse_naver_sector_html(sector_html)
assert sectors == [
    {"name": "전자제품", "rate": 29.5},
    {"name": "창업투자", "rate": -5.98},
]
assert top_sector_changes([*sectors, {"name": "전자제품", "rate": 29.48}]) == {
    "up": [{"name": "전자제품", "rate": 29.5}],
    "down": [{"name": "창업투자", "rate": -5.98}],
}

breadth = count_market_breadth([
    {"stockEndType": "stock", "stockName": "삼성전자", "fluctuationsRatio": "1.23", "compareToPreviousPrice": {"code": "2", "name": "RISING"}},
    {"stockEndType": "stock", "stockName": "에코프로", "fluctuationsRatio": "-2.34", "compareToPreviousPrice": {"code": "5", "name": "FALLING"}},
    {"stockEndType": "stock", "stockName": "보합종목", "fluctuationsRatio": "0", "compareToPreviousPrice": {"code": "3", "name": "UNCHANGED"}},
    {"stockEndType": "stock", "stockName": "KODEX 200", "fluctuationsRatio": "4.56", "compareToPreviousPrice": {"code": "2", "name": "RISING"}},
    {"stockEndType": "etf", "stockName": "테스트 ETF", "fluctuationsRatio": "7.89", "compareToPreviousPrice": {"code": "2", "name": "RISING"}},
])
assert breadth == {"up": 1, "down": 1, "flat": 1, "excludes": "ETF/ETN 제외"}
print("naver market sectors parser checks passed")
