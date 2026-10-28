# DEPLOY — Work Scale Manager

Guia de deployment para produção (VPS/servidor com IP público) e desenvolvimento local.

---

## 1. Arquitetura de rede

```
Internet (HTTPS :443)
    │
    ▼
┌─────────────────────────────────────┐
│         VPS / Servidor              │
│                                     │
│  ┌──────────────┐   ┌────────────┐  │
│  │   nginx :80  │   │ nginx :443 │  │
│  │  (redirect)  │   │  (TLS)     │  │
│  └──────┬───────┘   └─────┬──────┘  │
│         │                 │          │
│         ▼                 ▼          │
│    ┌───────────────────────────┐    │
│    │  Docker network (bridge)  │    │
│    │                           │    │
│    │  ┌─────────┐   ┌───────┐  │    │
│    │  │ app:3500│   │db:5432│  │    │
│    │  └─────────┘   └───────┘  │    │
│    └───────────────────────────┘    │
└─────────────────────────────────────┘
```

- **nginx** termina TLS, faz redirect 80→443, proxy reverso para `app:3500`
- **app** só ouve na rede Docker interna (`3500`) + localhost do host (`127.0.0.1:3500` — dev only)
- **db** (PostgreSQL) só acessível dentro da rede Docker

---

## 2. Portas no firewall da VPS

Abra **apenas** estas portas no security group / ufw / iptables / cloud firewall:

| Porta | Protocolo | Uso | Origem permitida |
|-------|-----------|-----|------------------|
| **22** | TCP | SSH (admin) | Seu IP / CIDR da equipe |
| **80** | TCP | HTTP (ACME challenge + redirect) | 0.0.0.0/0 (qualquer) |
| **443** | TCP | HTTPS (tráfego da aplicação) | 0.0.0.0/0 (qualquer) |
| **5432** | TCP | PostgreSQL | **NÃO ABRIR** — só rede Docker interna |

Exemplo com `ufw`:
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## 3. Variáveis de ambiente (produção)

Crie `.env` no servidor (gitignored):

```env
NODE_ENV=production
DATABASE_URL=postgresql://workscale:<senha-forte>@postgres:5432/workscale
PORT=3500
TRUST_PROXY=true
JWT_SECRET=<gere-com-openssl-rand-base64-32>
```

> **Importante:** `TRUST_PROXY=true` é obrigatório para o app ler `X-Forwarded-For/Proto` vindos do nginx e o logger registrar IPs reais.

---

## 4. TLS — Let's Encrypt por IP (sem DNS)

Esta aplicação suporta certificado **válido para IP público** (Let's Encrypt GA desde jan/2026).

### 4.1 Requisitos

- IP público IPv4 ou IPv6 roteável
- Portas **80 e 443** acessíveis da internet (firewall + security group)
- Docker Compose v2
- Certbot 5.4+ (já na imagem `certbot/certbot:latest`)

### 4.2 Como funciona

- Certificado **short-lived**: válido por **6 dias (160h)**
- Renovação **obrigatória a cada ~12h** (metade da vida útil, recomendação da LE)
- Challenge **apenas HTTP-01** (porta 80) ou TLS-ALPN-01 (porta 443)
- **NÃO** usa DNS challenge (não precisa de domínio)

### 4.3 Primeiro deploy (staging test)

```bash
# 1. Suba o stack com profile prod (cria volumes certbot)
docker compose --profile prod up -d

# 2. Dry-run no staging (não salva cert, valida desafio)
docker compose exec certbot certbot certonly \
  --dry-run \
  --webroot --webroot-path /var/www/certbot \
  --ip-address <SEU_IP_PUBLICO> \
  --preferred-profile shortlived \
  --server https://acme-staging-v02.api.letsencrypt.org/directory
```

Se passar, o staging validou que o challenge HTTP-01 chega no nginx (`/.well-known/acme-challenge/`) e retorna o token.

### 4.4 Emissão do certificado de produção

```bash
docker compose exec certbot certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  --ip-address <SEU_IP_PUBLICO> \
  --preferred-profile shortlived \
  --cert-name workscale-ip \
  --non-interactive --agree-tos --email <seu@email.com>
```

O certificado é salvo em `/etc/letsencrypt/live/workscale-ip/` dentro do container certbot. O **deploy hook** (abaixo) copia para `nginx/certs/` e recarrega o nginx.

### 4.5 Renovação automática (OBRIGATÓRIA)

Crie um script de renovação que roda via cron/systemd timer a cada 12h:

**Arquivo:** `/opt/workscale/renew-certs.sh` (no host)

```bash
#!/usr/bin/env bash
set -euo pipefail

cd /opt/workscale  # onde está o docker-compose.yml

# Renova se necessário (Certbot decide baseado em --preferred-profile shortlived)
docker compose exec -T certbot certbot renew \
  --webroot --webroot-path /var/www/certbot \
  --deploy-hook "/opt/workscale/deploy-hook.sh"

# Se renovou, deploy-hook copia os arquivos e dá reload no nginx
```

**Deploy hook:** `/opt/workscale/deploy-hook.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# Certbot passa estes envs: RENEWED_LINEAGE, RENEWED_DOMAINS
if [[ -n "${RENEWED_LINEAGE:-}" ]]; then
  cp "${RENEWED_LINEAGE}/fullchain.pem" /etc/nginx/certs/fullchain.pem
  cp "${RENEWED_LINEAGE}/privkey.pem" /etc/nginx/certs/privkey.pem
  # Reload nginx sem derrubar conexões
  docker compose exec -T nginx nginx -s reload
  echo "[$(date)] Certificado renovado e nginx reload"
fi
```

**Permissões + timer systemd:**

```bash
chmod +x /opt/workscale/renew-certs.sh /opt/workscale/deploy-hook.sh

# systemd timer (roda a cada 12h)
cat > /etc/systemd/system/workscale-certbot-renew.service <<'EOF'
[Unit]
Description=Renovação de certificado Let's Encrypt (short-lived)
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/workscale
ExecStart=/opt/workscale/renew-certs.sh
EOF

cat > /etc/systemd/system/workscale-certbot-renew.timer <<'EOF'
[Unit]
Description=Timer para renovação de certificado a cada 12h

[Timer]
OnCalendar=*-*-* 00/12:00:00
Persistent=true
RandomizedDelaySec=15min

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now workscale-certbot-renew.timer
```

> **Alternativa sem systemd:** no Docker Compose, adicione um sidecar container com `certbot renew --deploy-hook ...` em loop (`while true; do ... sleep 12h; done`). O systemd é mais robusto.

---

## 5. TLS — Let's Encrypt por domínio (com DNS)

Se você tiver um domínio apontando para o IP, o fluxo é idêntico, **sem** `--ip-address` e **sem** `--preferred-profile shortlived` (certificado padrão de 90 dias, renovação a cada 60 dias):

```bash
docker compose exec certbot certbot certonly \
  --webroot --webroot-path /var/www/certbot \
  -d api.seudominio.com \
  --cert-name workscale-domain \
  --non-interactive --agree-tos --email <seu@email.com>
```

Renovação padrão do Certbot já cobre (timer `certbot.timer` já vem na imagem).

---

## 6. docker-compose.yml — diferenças dev vs produção

### Dev local (`docker-compose.yml`)

```yaml
app:
  ports:
    - "127.0.0.1:3500:3500"  # só host local
nginx:
  ports:
    - "80:80"
    - "443:443"
certbot:
  profiles: [prod]  # não sobe em dev
```

### Produção (arquivo base recomendado: `docker-compose.prod.yml`)

```yaml
services:
  app:
    # SEM ports: - "127.0.0.1:3500:3500"
    # app fica só na rede Docker interna
  nginx:
    ports:
      - "80:80"
      - "443:443"
  certbot:
    # profile: prod (já sobe)
```

**Uso:**
```bash
# Dev
docker compose up -d

# Produção
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

> O arquivo `docker-compose.prod.yml` é um override que **remove** a porta do app e força o profile `prod` no certbot.

---

## 7. Docker Compose & Health Check

- **Health Check** no `docker-compose.yml` agora valida `/health` via proxy, não `/companies`.
- **Nginx** responde `/health` via proxy para o app, não diretamente.
- **Teste local:** `curl http://localhost/companies` (404 quando sem empresa) vs `curl https://localhost/health` (200, JSON do app).
- **Monitoramento:** o healthcheck do Docker usa o endpoint `/health` (via proxy), que reflete o estado real do app.
- **Nota:** `/companies` continua disponível via HTTP (200) e HTTPS (201/400/404), mas não é usado como healthcheck.

---

## 8. Checklist de go-live

- [ ] VPS com IP público e portas 80/443/22 abertas
- [ ] `.env` com segredos fortes (`JWT_SECRET`, `DATABASE_URL`)
- [ ] `docker compose --profile prod up -d` sobe nginx + app + db + certbot
- [ ] Dry-run staging passa (`--dry-run --server ...staging...`)
- [ ] Certificado de produção emitido (`certbot certonly ...`)
- [ ] `deploy-hook.sh` copia certs e faz `nginx -s reload`
- [ ] Timer systemd `workscale-certbot-renew.timer` ativo e testado
- [ ] Logs do app mostram IPs reais via `X-Forwarded-For` (logger)
- [ ] Health checks: `GET /health` (nginx proxy → app) e app healthy
- [ ] Backup do volume `pgdata` configurado (cron/pg_dump/s3)

---

## 9. Troubleshooting rápido

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| `certbot certonly` falha no challenge | Porta 80 bloqueada / nginx não servindo `/.well-known/` | Verifique firewall, `curl http://IP/.well-known/acme-challenge/test` |
| Certificado expirou no navegador | Renovação não rodou / deploy-hook falhou | `systemctl status workscale-certbot-renew.timer`, veja logs do hook |
| App não recebe IP real no logger | `TRUST_PROXY` não está `true` | Confirme env no container app: `docker compose exec app env | grep TRUST` |
| Erro 502 no nginx | App não healthy / porta errada no upstream | `docker compose ps`, `docker compose logs app` |

---

## 10. Segurança adicional recomendada

- **Fail2ban** no SSH (porta 22)
- **Rate limit** no nginx (`limit_req_zone`) para APIs sensíveis
- **Headers de segurança** no nginx:
  ```nginx
  add_header X-Frame-Options "DENY";
  add_header X-Content-Type-Options "nosniff";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
  ```
- **Backup offsite** do volume `pgdata` (diário + retenção)
- **Monitoramento**: uptime (health `/health`), cert expiry (Certbot expõe via `certbot certificates`), logs centralizados

---

## 11. Referências

- Let's Encrypt IP certificates: <https://letsencrypt.org/2026/01/15/6day-and-ip-general-availability.html>
- Certbot short-lived profile: <https://eff-certbot.readthedocs.io/en/stable/using.html#short-lived-certificates>
- Nginx TLS config (Mozilla SSL Config Generator): <https://ssl-config.mozilla.org/>