from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from server import parse_fmkorea_pages


html = """
<table>
  <tr><td class="cate">공지</td><td class="title"><a href="/notice">공지</a></td><td class="time">15:08</td></tr>
  <tr><td class="cate">국내주식</td><td class="title"><a href="/100">삼전 오르고 네이버도 강하네</a></td><td class="time">15:08</td></tr>
  <tr><td class="cate">국내주식</td><td class="title"><a href="/101">에코프로 수급 체크</a></td><td class="time">15:07</td></tr>
  <tr><td class="cate">국내주식</td><td class="title"><a href="/102">하이닉스도 같이 보자</a></td><td class="time">05.31</td></tr>
</table>
"""

payload = parse_fmkorea_pages([html], datetime(2026, 6, 1, 15, 9))
assert payload["available"] is True
assert payload["latestCount"] == 2
assert payload["series"] == [
    {"id": "2026.05.31", "date": "2026.05.31", "count": 1},
    {"id": "2026.06.01", "date": "2026.06.01", "count": 2},
]
assert [item["ticker"] for item in payload["topMentions"]] == ["005930", "035420", "086520"]
assert payload["topMentions"][2]["market"] == "KQ"
print("fmkorea parser checks passed")
