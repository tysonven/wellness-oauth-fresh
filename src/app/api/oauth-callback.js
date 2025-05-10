// pages/api/oauth-callback.js (Next.js style)
export default function handler(req, res) {
  console.log("[OAUTH CALLBACK MINIMAL TEST] Function hit! Path: /api/oauth-callback");
  console.log("[OAUTH CALLBACK MINIMAL TEST] Request Query:", req.query);
  res.status(200).send("Minimal test OK from /api/oauth-callback. Check Vercel logs.");
}
