NGINX reverse-proxy for relay (quick deploy)
===========================================

This folder contains a ready-to-drop nginx snippet to reverse-proxy the `relay` WebSocket endpoint and an example proxy for the static dashboard.

Files:
- `relay.conf` — example server block and `map` for WebSocket `Upgrade` handling.

How to use
----------
1. Copy the `map` block into your global `http { ... }` section in your main `nginx.conf` (only once):

   map $http_upgrade $connection_upgrade {
     default upgrade;
     ''      close;
   }

2. Either include `relay.conf` from your main nginx config, or copy the `server { ... }` block into a file under `/etc/nginx/sites-available/` and symlink to `/etc/nginx/sites-enabled/`.

3. Test the config before reloading:

```bash
sudo nginx -t
```

4. Reload nginx to apply config (non-disruptive reload):

macOS (Homebrew):
```bash
# test first
sudo nginx -t
# reload config
brew services restart nginx
# or if nginx managed manually:
sudo nginx -s reload
```

Linux (systemd):
```bash
sudo nginx -t
sudo systemctl reload nginx
# or restart
sudo systemctl restart nginx
```

Verification
------------
- Open the dashboard in your browser and check DevTools → Network → WS for a `101 Switching Protocols` to `/relay`.
- Or use `wscat` to connect directly:

```bash
npm i -g wscat
wscat -c ws://your-nginx-host/relay
```

Notes
-----
- If the page is served over HTTPS, your browser will require `wss://`. Make sure nginx SSL termination is set up and `proxy_pass` targets an HTTP (non-SSL) backend.
- For best compatibility use the `map` + `$connection_upgrade` pattern rather than a literal `"upgrade"` value.
- Adjust `proxy_pass` upstreams (`127.0.0.1:4000` and `127.0.0.1:8001`) to match your relay and static server ports.