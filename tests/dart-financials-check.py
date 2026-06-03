import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import merge_fundamental_snapshots, parse_dart_financial_statement


sample = {
    "status": "000",
    "list": [
        {
            "bsns_year": "2025",
            "reprt_code": "11011",
            "fs_div": "OFS",
            "sj_div": "IS",
            "account_nm": "매출액",
            "thstrm_amount": "210,000,000,000",
        },
        {
            "bsns_year": "2025",
            "reprt_code": "11011",
            "fs_div": "CFS",
            "sj_div": "IS",
            "account_nm": "매출액",
            "thstrm_amount": "258,935,494,000,000",
        },
        {
            "bsns_year": "2025",
            "reprt_code": "11011",
            "fs_div": "CFS",
            "sj_div": "IS",
            "account_nm": "영업이익",
            "thstrm_amount": "32,726,066,000,000",
        },
        {
            "bsns_year": "2025",
            "reprt_code": "11011",
            "fs_div": "CFS",
            "sj_div": "IS",
            "account_nm": "당기순이익",
            "thstrm_amount": "34,451,367,000,000",
        },
    ],
}

snapshot = parse_dart_financial_statement(sample)
assert snapshot["source"] == "OpenDART"
assert snapshot["fiscalYear"] == "2025"
assert snapshot["reportCode"] == "11011"
assert snapshot["revenue"] == 258_935_494_000_000
assert snapshot["operatingProfit"] == 32_726_066_000_000
assert snapshot["netIncome"] == 34_451_367_000_000

merged = merge_fundamental_snapshots(
    {"per": 28.17, "pbr": 4.85, "source": "Naver Finance"},
    snapshot,
)
assert merged["per"] == 28.17
assert merged["pbr"] == 4.85
assert merged["revenue"] == snapshot["revenue"]
assert merged["dartFinancials"]["source"] == "OpenDART"
assert merged["source"] == "Naver Finance · OpenDART"

print("DART financial parser checks passed")
