user.service.ts:19	User+token creation should be a transaction
auth.controller.ts:46	Logout doesn't actually revoke JWT
webSocketMiddleware.ts:24	ORDER_FILLED notification may fail if coin not in RTK cache
useLivePrice.ts:22	Change should use 24h-ago price, not dayLow
Header.tsx:103	Auth modal closes even if login/register fails (and no feedback that it fails)
api/index.ts:50	Logout should manually clear private Redux state

No auto-reconnect	WebSocket doesn't reconnect on unexpected disconnect
No DB transactions	Order fills aren't wrapped in transactions

Server tsconfig.json cleanup
  Change moduleResolution: "node" → "nodenext" (modern Node ESM resolution).
  May require adding .js extensions to relative imports (standard for ESM Node).

Don't call /me if we're not logged in? (Client)

Fix/verify auth/perms checking on all routes
Remove lint ignores, find optimal solutions
Turn admin/auth helpers into Fastify plugins? Would like to remove typing hack