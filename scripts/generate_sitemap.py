#!/usr/bin/env python3
"""Generate public/sitemap.xml from a structured page list."""
import os

LASTMOD = "2026-04-15"
BASE = "https://owedhq.com"

# (path, priority)
STATIC_PAGES = [
    ("/", "1.0"),
    ("/pricing.html", "0.9"),
    ("/for-accountants.html", "0.9"),
    ("/compare/owed-vs-chaser.html", "0.8"),
    ("/compare/owed-vs-satago.html", "0.8"),
    ("/compare/owed-vs-equisettle.html", "0.8"),
    ("/compare/best-invoice-chasing-software-uk.html", "0.8"),
    ("/compare/chaser-alternatives-uk.html", "0.8"),
    ("/partners.html", "0.9"),
    ("/late-payments/", "0.8"),
    ("/calculator.html", "0.7"),
    ("/blog/late-payment-act-guide.html", "0.7"),
    ("/blog/how-to-chase-invoices-uk.html", "0.7"),
    ("/blog/late-payment-act-2026.html", "0.7"),
    ("/blog/invoice-chasing-email-templates.html", "0.7"),
    ("/blog/xero-invoice-chasing.html", "0.7"),
    ("/blog/freelancer-late-payment-guide.html", "0.7"),
    ("/privacy", "0.5"),
    ("/terms", "0.5"),
    ("/support", "0.5"),
    ("/unsubscribe.html", "0.3"),
]

CITIES = [
    "london", "manchester", "birmingham", "leeds", "sheffield", "bristol",
    "newcastle", "liverpool", "edinburgh", "glasgow", "cardiff", "nottingham",
    "leicester", "brighton", "oxford", "cambridge", "exeter", "york",
    "norwich", "southampton", "reading", "coventry", "derby", "ipswich",
    "plymouth", "wolverhampton", "sunderland", "hull", "stoke",
    "middlesbrough", "bolton", "huddersfield", "swansea", "newport",
    "aberdeen", "dundee", "inverness", "stirling", "perth", "bath",
    "cheltenham", "gloucester", "worcester", "shrewsbury", "lincoln",
    "peterborough", "luton", "milton-keynes", "guildford", "winchester",
]

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "sitemap.xml")


def url_block(loc: str, priority: str) -> str:
    return (
        "  <url>\n"
        f"    <loc>{BASE}{loc}</loc>\n"
        f"    <lastmod>{LASTMOD}</lastmod>\n"
        "    <changefreq>monthly</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        "  </url>\n"
    )


def main() -> None:
    parts = ['<?xml version="1.0" encoding="UTF-8"?>\n']
    parts.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n')
    for path, prio in STATIC_PAGES:
        parts.append(url_block(path, prio))
    for city in CITIES:
        parts.append(url_block(f"/locations/{city}.html", "0.7"))
    parts.append("</urlset>\n")
    with open(OUT, "w") as f:
        f.write("".join(parts))
    total = len(STATIC_PAGES) + len(CITIES)
    print(f"wrote {OUT} ({total} URLs)")


if __name__ == "__main__":
    main()
