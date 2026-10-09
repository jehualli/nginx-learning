All files are in place. Here's the full picture:

  ---
  Project structure

  nginx-learning/
  ├── docker-compose.yml
  ├── nginx/
  │   ├── Dockerfile          ← generates self-signed cert at build time
  │   ├── nginx.conf          ← all the interesting nginx config
  │   └── html/index.html     ← static page with live demo button
  ├── backend1/
  │   ├── Dockerfile
  │   ├── package.json
  │   └── index.js            ← Express app that reveals proxy headers
  └── backend2/               ← identical to backend1, different name

  ---
  How to run it

  cd ~/nginx-learning
  docker compose up --build
  
  Then open https://localhost (accept the self-signed cert warning).

  ---
  What to experiment with
  
  ┌────────────────────────────────┬─────────────────────────────────────────────────────────────────┐
  │              Goal              │                               How                               │
  ├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ See load balancing             │ Click the button on the page repeatedly — server alternates     │
  ├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Watch live logs                │ docker compose logs -f nginx                                    │
  ├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Reload config without downtime │ Edit nginx.conf, then docker compose exec nginx nginx -s reload │
  ├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Try weighted load balancing    │ Uncomment the weight= lines in nginx.conf upstream block        │
  ├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Try least-connections strategy │ Uncomment least_conn; in the upstream block                     │
  ├────────────────────────────────┼─────────────────────────────────────────────────────────────────┤
  │ Hit backends directly via curl │ curl -k https://localhost/health/b1 vs /health/b2               │
  └────────────────────────────────┴─────────────────────────────────────────────────────────────────┘

  ---
  Key concepts in nginx.conf to read
  
  - upstream node_backends — defines the pool; round-robin is the default
  - location /api/ with proxy_pass — this is the reverse proxy
  - proxy_set_header X-Real-IP — passes the client IP through; you'll see it echoed back by the Node
  apps
  - return 302 https://... — HTTP-to-HTTPS redirect
  - ssl_certificate / ssl_certificate_key — TLS termination; backends never see HTTPS

✻ Crunched for 1m 49s

※ recap: Built an nginx learning lab at ~/nginx-learning with Docker Compose, two Node backends, and 
  nginx handling reverse proxy, load balancing, static files, and SSL. Run it with: cd ~/nginx-learning 
  && docker compose up --build (disable recaps in /config)
  
────────────────────────────────────────────────────────────────────────────────────────────────────────
❯ what serves as an api gateway 
────────────────────────────────────────────────────────────────────────────────────────────────────────
  ⏵⏵ accept edits on (shift+tab to cycle)
what serves as an api gateway?                                                                        

⏺ In this setup, nginx itself acts as the API gateway.

  When a client hits https://localhost/api/, nginx is doing exactly what an API gateway does:

  - Single entry point — clients talk to one address; nginx decides where the request goes
  - TLS termination — HTTPS ends at nginx; backends use plain HTTP internally
  - Routing — location /api/ rules map URL paths to specific backend services
  - Load balancing — distributes traffic across backend instances
  - Header injection — adds X-Real-IP, X-Forwarded-For, etc. before forwarding

  The difference between a "reverse proxy" and an "API gateway" is mostly about what features you add on
   top. A bare reverse proxy just forwards. An API gateway typically adds:

  ┌─────────────────────────────────┬──────────────────────────────────────────┐
  │             Feature             │             nginx can do it?             │
  ├─────────────────────────────────┼──────────────────────────────────────────┤
  │ Routing by path/method          │ Yes (built-in location blocks)           │
  ├─────────────────────────────────┼──────────────────────────────────────────┤
  │ Load balancing                  │ Yes (built-in upstream)                  │
  ├─────────────────────────────────┼──────────────────────────────────────────┤
  │ Rate limiting                   │ Yes (limit_req module)                   │
  ├─────────────────────────────────┼──────────────────────────────────────────┤
  │ Auth (JWT, API keys)            │ Partial — needs lua module or nginx-plus │
  ├─────────────────────────────────┼──────────────────────────────────────────┤
  │ Request/response transformation │ Partial — needs lua or a plugin          │
  ├─────────────────────────────────┼──────────────────────────────────────────┤
  │ Analytics / tracing             │ Partial — needs a sidecar or plugin      │
  └─────────────────────────────────┴──────────────────────────────────────────┘

  So nginx covers ~70% of API gateway use cases out of the box. For the full feature set (auth,
  transformations, developer portal), projects typically reach for Kong (which is nginx + Lua under the
  hood), Traefik, or a managed gateway like AWS API Gateway.
  
  In production you'd often see: client → nginx (gateway) → microservice A / microservice B / 
  microservice C, which is exactly the pattern your docker-compose is modeling.

✻ Sautéed for 11s

❯ WHAT ABOUT FORWARD PROXY                                                                              

⏺ A forward proxy is the opposite direction from what nginx is doing in your setup.

  REVERSE PROXY          FORWARD PROXY
  (what you have)        (what you're asking about)

  client → nginx → server    client → nginx → internet
           ↑                          ↑
     server doesn't           server (google.com etc.)
     know the real client     doesn't know the real client

  Reverse proxy — nginx acts on behalf of the server. The client doesn't know which backend it's talking
   to.

  Forward proxy — nginx acts on behalf of the client. The destination server doesn't know who the real
  client is. You configure it in your browser or system ("use proxy localhost:8888").

  Use cases for a forward proxy:
  - Corporate networks filtering what employees can access
  - Caching outbound requests (save bandwidth)
  - Anonymizing client IPs
  - Intercepting HTTPS traffic for inspection (needs cert injection)

  ---
  The catch with nginx as a forward proxy: nginx is mediocre at it. It can handle plain HTTP forward
  proxying, but HTTPS tunneling (CONNECT method) requires the ngx_http_proxy_connect_module, which is
  not in the standard nginx build — you have to patch and recompile it.
  
  For a real forward proxy, Squid or mitmproxy are the go-to tools. Squid is battle-tested for corporate
   filtering; mitmproxy is great for learning because it lets you inspect every request interactively.

  ---
  Want me to add a forward proxy container to the setup? I can add mitmproxy — it's the most educational
   option because it has a web UI where you watch all proxied traffic live. Or Squid if you want the
  production-realistic version.

✻ Churned for 13s

