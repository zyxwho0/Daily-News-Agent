# Pulse — Daily News Agent

Pulse collects recent reporting from multiple RSS feeds, deduplicates and categorizes it, creates a short daily briefing, and presents everything in a responsive web dashboard.

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

Feed sources are configured in `FEEDS` near the top of `app.py`. The service keeps the last successful response in `data/news.json`, so the dashboard can continue using its cache during a temporary feed outage.

## Endpoints

- `GET /api/news` — cached daily briefing and stories
- `GET /api/news?refresh=1` — force a fresh collection
- `GET /health` — service health check

For a real daily scheduled refresh, run `python3 app.py --refresh` from cron, a systemd timer, GitHub Actions, or your hosting provider’s scheduler. The running service also refreshes automatically when its cache expires.

## GitHub Pages

The workflow in `.github/workflows/pages.yml` collects fresh news and deploys
`public/` to GitHub Pages:

- after every push to `master`
- every day at 11:15 UTC
- whenever it is started manually

In the repository's **Settings → Pages**, select **GitHub Actions** as the
publishing source and set the custom domain to `news.yuxianzhang.com`.

At the DNS provider for `yuxianzhang.com`, create:

| Type | Name | Value |
|---|---|---|
| CNAME | `news` | `zyxwho0.github.io` |

After DNS validation completes, enable **Enforce HTTPS** in the Pages settings.
