# Running MusicSeerr on ZimaOS

MusicSeerr ships as a Docker image and runs cleanly alongside Jellyseerr/Overseerr/Seerr because it listens on **port 5757** by default (Seerr uses 5055).

## 1. Get the image published

The repo includes a workflow at `.github/workflows/docker-publish.yml` that publishes a multi-arch image (`linux/amd64`, `linux/arm64`) to GitHub Container Registry on every push to `main` and on tags.

After the first successful run:

1. Go to https://github.com/Clarke117/musicseerr/pkgs/container/musicseerr
2. Click **Package settings** → **Change visibility** → **Public**.

The image is now pullable as `ghcr.io/clarke117/musicseerr:latest` without authentication.

> Don't want to use GHCR? You can also `docker build -t musicseerr:local .` directly on the Zima and replace `image:` with `musicseerr:local` in the compose file.

## 2. Install on ZimaOS

1. Open the ZimaOS web UI.
2. **App Store** → **+** (top right) → **Install a custom app**.
3. Paste the contents of [`docker-compose.zimaos.yml`](../docker-compose.zimaos.yml).
4. Adjust `TZ`, optional API keys, or the host port if you need to.
5. Click **Install**.
6. Visit `http://<zima-ip>:5757` and run the setup wizard.

## 3. Connect Lidarr

In MusicSeerr → **Settings** → **Services**, add a Lidarr server:

- If Lidarr is another container on the same Zima, use its container name (e.g. `lidarr`) as the hostname and Lidarr's internal port (`8686`).
- If Lidarr runs elsewhere, use its hostname/IP and exposed port.

## 4. Optional API keys

MusicSeerr enriches the UI with two optional services:

| Env var          | Purpose                                  | Get a key                              |
| ---------------- | ---------------------------------------- | -------------------------------------- |
| `FANART_API_KEY` | Artist photos and fanart on detail pages | https://fanart.tv/get-an-api-key/      |
| `LASTFM_API_KEY` | Artist biographies on artist pages       | https://www.last.fm/api/account/create |

Both are optional — the app works fine without them.

## 5. Updating

The workflow tags every push to `main` as `latest`. To pull a new build on the Zima:

```bash
docker compose -f docker-compose.zimaos.yml pull
docker compose -f docker-compose.zimaos.yml up -d
```

Or just hit "Update" in the ZimaOS app card.

## Port summary

| App                     | Default port |
| ----------------------- | ------------ |
| Jellyseerr / Seerr      | 5055         |
| **MusicSeerr**          | **5757**     |
| Lidarr                  | 8686         |
| Navidrome               | 4533         |

Override with the `PORT` env var if you need a different one — make sure the host-side mapping in the compose file matches.
