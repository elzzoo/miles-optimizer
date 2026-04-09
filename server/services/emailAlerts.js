import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = "Miles Optimizer <alerts@milesoptimizer.com>";
const BASE_URL = process.env.APP_URL || "https://miles-optimizer-next.onrender.com";

function scoreColor(label) {
  const map = { "Excellent": "#22C55E", "Très bon": "#22C55E", "Bon": "#2563EB", "Correct": "#F59E0B", "Faible": "#EF4444" };
  return map[label] || "#64748B";
}

export async function sendAlertEmail({ email, origin, destination }, program, milesNeeded, score) {
  const searchUrl = `${BASE_URL}/search?from=${origin}&to=${destination}`;
  const color = scoreColor(score.label);

  const { error } = await resend.emails.send({
    from: FROM,
    to: email,
    subject: `✈️ Deal ${score.label} : ${origin} → ${destination} — ${milesNeeded.toLocaleString()} miles`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Inter, system-ui, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; }
  .card { background: white; border-radius: 16px; padding: 32px; max-width: 480px; margin: 0 auto; box-shadow: 0 4px 16px rgba(0,0,0,.08); }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 700; color: white; }
  .btn { display: inline-block; background: #2563EB; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; margin-top: 20px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
  .label { color: #64748B; } .value { font-weight: 600; color: #0F172A; }
</style></head>
<body>
  <div class="card">
    <p style="color:#64748B;font-size:13px;margin-bottom:8px;">Alerte Miles Optimizer</p>
    <h2 style="margin:0 0 4px;font-size:22px;color:#0F172A;">${origin} → ${destination}</h2>
    <p style="color:#64748B;font-size:14px;margin-bottom:20px;">${program.name}</p>

    <span class="badge" style="background:${color};">${score.label} — ${score.centsPerMile}¢/mile</span>

    <div style="margin:20px 0;">
      <div class="row"><span class="label">Miles nécessaires</span><span class="value">${milesNeeded.toLocaleString()} miles</span></div>
      <div class="row"><span class="label">Taxes</span><span class="value">${score.taxesUSD ?? "~60"}$</span></div>
      ${score.savingsUSD > 0 ? `<div class="row"><span class="label">Économie estimée</span><span class="value" style="color:#22C55E;">+${score.savingsUSD}$ (${score.savingsPct}%)</span></div>` : ""}
    </div>

    <a href="${searchUrl}" class="btn">Voir le deal →</a>

    <p style="margin-top:24px;font-size:11px;color:#94A3B8;">
      Vous recevez cet email car vous avez créé une alerte sur Miles Optimizer.<br>
      <a href="${BASE_URL}/alerts" style="color:#2563EB;">Gérer mes alertes</a>
    </p>
  </div>
</body>
</html>
    `,
  });

  if (error) console.error("[emailAlerts] Resend error:", error);
  return !error;
}

export async function sendWelcomeEmail(email) {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "✈️ Bienvenue sur Miles Optimizer",
    html: `
<div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#fff;border-radius:16px;">
  <h2>Bienvenue ! ✈️</h2>
  <p>Votre compte Miles Optimizer est actif. Vous pouvez maintenant :</p>
  <ul>
    <li>Créer des alertes prix (miles)</li>
    <li>Accéder aux meilleurs deals</li>
    <li>Explorer des destinations</li>
  </ul>
  <a href="${BASE_URL}" style="display:inline-block;background:#2563EB;color:white;padding:12px 24px;border-radius:10px;font-weight:700;text-decoration:none;margin-top:16px;">
    Commencer →
  </a>
</div>
    `,
  });
}
