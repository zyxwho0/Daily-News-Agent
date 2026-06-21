# YZ News — Daily News Agent

YZ News combines trusted RSS feeds with Brave News Search, deduplicates and
categorizes the coverage, and uses OpenAI to write the daily briefing displayed
at the top of the site and concise summaries beneath every story title.
Each edition publishes 80 curated stories and initially displays 10.

## Run it

Requires Python 3.10+ and no third-party packages.

```bash
python3 app.py
```

Open [http://localhost:8000](http://localhost:8000).

The published site is configured for [news.yuxianzhang.com](https://news.yuxianzhang.com).

To fetch news once without starting the web server:

```bash
python3 app.py --refresh
```

## Configuration

- `PORT`: web server port (default `8000`)
- `NEWS_REFRESH_SECONDS`: cache lifetime (default `1800`, or 30 minutes)
- `BRAVE_API_KEY`: optional Brave Search API key for broader news discovery
- `OPENAI_API_KEY`: optional OpenAI API key for the generated daily briefing
- `OPENAI_MODEL`: optional model override (default `gpt-5.4-mini`)

Feed sources are configured in `FEEDS` near the top of `app.py`. The service keeps the last successful response in `data/news.json`, so the dashboard can continue using its cache during a temporary feed outage.

When either API key is unavailable or an API request fails, the agent continues
with RSS and a deterministic fallback briefing. For GitHub Pages, store the two
keys as repository Actions secrets named `BRAVE_API_KEY` and `OPENAI_API_KEY`.

## API

Local development server:

- `GET /api/news` — cached daily briefing and stories
- `GET /api/news?refresh=1` — force a fresh collection
- `GET /health` — service health check

The deployed GitHub Pages site also publishes a free, read-only static API:

- `GET /api/v1/index.json` — API metadata and endpoint discovery
- `GET /api/v1/news.json` — current curated edition
- `GET /api/v1/briefing.json` — current Top 5 briefing
- `GET /api/v1/topics.json` — current trending topics
- `GET /api/` — browser-friendly API documentation

Static endpoints are regenerated with each deployment. They do not support
query parameters, authentication, or server-side filtering.

For a real daily scheduled refresh, run `python3 app.py --refresh` from cron, a systemd timer, GitHub Actions, or your hosting provider’s scheduler. The running service also refreshes automatically when its cache expires.

## Refresh Schedule

The workflow collects and refresh news:

- after every push to `master`
- every day at 7:15 AM EDT / 6:15 AM EST (11:15 UTC)
- whenever it is started manually
