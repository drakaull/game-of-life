# Deployment checklist

The game is a static site: `npm run build` produces `dist/`, which is served as is from the
owner's VPS at **https://life.leonard-fontaine.com**. The server side (DNS record, Caddy block,
upload) lives in the `portfolio` repository (`deploy/Caddyfile`, `docs/deployment.md`) and is done
in a session opened on that repository. This file lists what that work must guarantee.

## 1. Build

- [ ] On `main`, at a release tag: `npm ci && npm run build`.
- [ ] `npm test`, `npm run lint`, `npm run format:check` pass on the same commit.
- [ ] `dist/` contains `index.html`, `theme-init.js`, `favicon.svg` and `assets/` (hashed JS,
      CSS and fonts).
      Nothing else needs to be served.

## 2. DNS

- [ ] `life` → `A` record to the VPS IPv4, and `AAAA` to its IPv6 (same values as the apex).
- [ ] Wait until `nslookup life.leonard-fontaine.com` answers with those addresses before
      reloading Caddy, so the Let's Encrypt certificate can be issued.

## 3. Caddy

- [ ] A site block for `life.leonard-fontaine.com` that serves the uploaded `dist/` with
      `file_server` (no `try_files`: the game is one page, other paths are a plain 404).
- [ ] `encode zstd gzip`.
- [ ] **No `log` directive**, like the portfolio: no access log, so no visitor IP is kept and the
      portfolio privacy page stays true.
- [ ] These headers, exactly (`npm run preview` sends the same ones, so the build is tested
      under them):

      Strict-Transport-Security: max-age=31536000; includeSubDomains
      Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
      Referrer-Policy: no-referrer
      X-Content-Type-Options: nosniff
      X-Frame-Options: DENY
      Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()
      -Server

- [ ] Cache: `/assets/*` → `Cache-Control: public, max-age=31536000, immutable` (hashed names);
      everything else (`/`, `/index.html`, `/theme-init.js`) → `Cache-Control: no-cache`, so a
      new release shows at once.

Sketch of the block, to adapt to the portfolio's Caddyfile conventions:

```caddy
life.leonard-fontaine.com {
	root * /srv/life
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		Content-Security-Policy "default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
		Referrer-Policy "no-referrer"
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
		-Server
	}
	@hashed path /assets/*
	header @hashed Cache-Control "public, max-age=31536000, immutable"
	@unhashed not path /assets/*
	header @unhashed Cache-Control "no-cache"
	file_server
}
```

## 4. Upload

- [ ] Decide in the portfolio session how `dist/` reaches the VPS (for example: build locally and
      copy it with `scp`/`rsync` into the folder mounted as `/srv/life` in the Caddy container).
- [ ] The upload replaces the whole folder, so files from an older release do not linger.

## 5. After deploying

- [ ] `curl -I https://life.leonard-fontaine.com` shows `200`, every header above and the cache
      rules (`curl -I` on one `/assets/…` file too).
- [ ] The page works in Chrome and Firefox, desktop and phone; the console shows no CSP error.
- [ ] Network panel: every request goes to `life.leonard-fontaine.com`, nothing else.
- [ ] "← Portfolio" opens `https://leonard-fontaine.com/<lang>`.

## 6. Portfolio integration (no code)

- [ ] GitHub repository `game-of-life`: **Website** field set to
      `https://life.leonard-fontaine.com`; description reviewed (it becomes the card summary).
- [ ] Portfolio admin: sync the repositories, then make the project visible.
