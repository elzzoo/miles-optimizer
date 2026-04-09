import cron from "node-cron";
import { supabaseAdmin, isSupabaseConfigured } from "./supabase.js";
import { sendAlertEmail } from "./emailAlerts.js";
import { scoreDeal } from "./dealScorer.js";
import { PROGRAMS } from "../data/programs.js";
import { haversine } from "../../src/utils/distance.js";
import { airportsMap } from "../data/airports.js";

/**
 * Simple miles estimator (mirrors useMilesCalculator logic)
 */
function estimateMilesNeeded(program, origin, dest, cabin) {
  const origA = airportsMap?.[origin];
  const destA  = airportsMap?.[dest];
  if (!origA || !destA) return null;

  const distMiles = haversine(origA.lat, origA.lon, destA.lat, destA.lon);
  const factor = cabin === 1 ? 2.5 : 1;

  let miles;
  if (program.chartType === "distance") {
    if (distMiles < 500)       miles = 8000;
    else if (distMiles < 1000) miles = 12000;
    else if (distMiles < 2000) miles = 20000;
    else if (distMiles < 4000) miles = 30000;
    else if (distMiles < 7000) miles = 50000;
    else                       miles = 70000;
  } else {
    // Zone-based estimate
    if (distMiles < 1500)      miles = 10000;
    else if (distMiles < 3500) miles = 25000;
    else if (distMiles < 6000) miles = 40000;
    else                       miles = 60000;
  }

  return Math.round(miles * factor);
}

export function startAlertChecker() {
  if (!isSupabaseConfigured) {
    console.log("[alertChecker] Supabase not configured — skipping cron");
    return;
  }

  // Run every 6 hours
  cron.schedule("0 */6 * * *", async () => {
    console.log("[alertChecker] Running alert check…");
    try {
      const { data: alerts, error } = await supabaseAdmin
        .from("alerts")
        .select("*, users:user_id(email)")
        .eq("is_active", true)
        .limit(100);

      if (error) { console.error("[alertChecker]", error); return; }
      if (!alerts?.length) return;

      for (const alert of alerts) {
        const email = alert.users?.email;
        if (!email) continue;

        for (const program of PROGRAMS) {
          const milesNeeded = estimateMilesNeeded(program, alert.origin, alert.destination, alert.cabin ?? 0);
          if (!milesNeeded) continue;
          if (milesNeeded > alert.max_miles) continue;

          const score = scoreDeal({
            program,
            milesNeeded,
            taxesUSD:     program.taxUSD ?? 60,
            cashPriceUSD: 800, // conservative estimate — real price used in full version
          });

          if (score.worthIt) {
            await sendAlertEmail(
              { email, origin: alert.origin, destination: alert.destination },
              program,
              milesNeeded,
              score
            );

            // Log hit
            await supabaseAdmin.from("alert_hits").insert({
              alert_id:    alert.id,
              program_id:  program.id,
              miles_found: milesNeeded,
              email_sent:  true,
            });
          }
        }

        // Update last_checked
        await supabaseAdmin
          .from("alerts")
          .update({ last_checked: new Date().toISOString() })
          .eq("id", alert.id);
      }

      console.log(`[alertChecker] Checked ${alerts.length} alerts`);
    } catch (err) {
      console.error("[alertChecker] Fatal:", err);
    }
  });

  console.log("[alertChecker] Cron scheduled (every 6h)");
}
