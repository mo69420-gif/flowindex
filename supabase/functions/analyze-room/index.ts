import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SECTOR_POOL = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GHOST"];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { mode, images } = await req.json();
    // mode: "panoramic" | "full_scan"
    // images: Array<{ label: string, dataUrl: string }>

    if (!images || !images.length) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "panoramic") {
      // Analyze panoramic and return directives
      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality.

You received ONE panoramic photo of a space. Analyze it to understand the overall layout.

Issue 2-4 DIRECTIVES — specific follow-up shots you need for full analysis.
Each directive targets a specific zone or problem area you noticed.
Be specific and hostile. Name what you actually see.

Respond ONLY with valid JSON:
{"directives":[{"id":"D1","label":"DIRECTIVE 1 — ZONE NAME","instruction":"Specific hostile instruction telling operator exactly where to stand and what to shoot. Name what you see there."}]}`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content }],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const parsed = parseAiJson(text);
      
      return new Response(JSON.stringify({ directives: parsed.directives || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "full_scan") {
      // Full room analysis
      const photoContext = images.map((img: any, i: number) => `  Photo ${i + 1} [${img.label}]`).join("\n");

      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality. Dry humor. Brutally honest.

${images.length} photos of a real space. Cross-reference all.

${photoContext}

FENG SHUI + ERGONOMICS + PSYCHOLOGY:
- Order sectors by flow impact — clear pathway blockers first
- Factor in psychological burden and ergonomic hazards

For EACH sector return:

INVENTORY — every single visible item, numbered, with category.
Categories: CLEANING_SUPPLIES, PERSONAL_CARE, ELECTRONICS, FURNITURE_STORAGE, TEXTILES, FOOD_DRINK, TOOLS, DECOR, MISC

IMPACT SCORES 1-5:
  flow_impact, psych_impact, ergonomic_risk

WHY_IT_MATTERS: 2-3 sentences. Psychology, cortisol, decision fatigue, visual clutter science.

FINAL_ANALYSIS: 2-3 hostile motivating sentences about what clearing this does.

TARGETS: 2-5 items with tier (1=critical, 2=sort, 3=low), why (one-line reason), label, trash 5-25, loot 0-15.

Sector COUNT min 3 max 7. NICKNAME: hostile military codename 2-4 words ALL CAPS.
DESC: one hostile sentence. TIME: realistic minutes.

Also generate ONE unique operation name for the entire mission.
Format: OPERATION: [NAME] — 2-4 words ALL CAPS, absurdist hostile military naming convention.

Respond ONLY with valid JSON no markdown:
{"operation_name":"OPERATION: NAME HERE","sectors":[{"nickname":"NAME","desc":"Sentence.","time_estimate_minutes":10,"flow_impact":4,"psych_impact":5,"ergonomic_risk":3,"why_it_matters":"Explanation.","final_analysis":"Conclusion.","inventory":[{"number":"001","label":"Item","category":"CATEGORY"}],"targets":[{"label":"Item","tier":1,"why":"Reason.","trash":10,"loot":5}]}]}`;

      const contentParts: any[] = images.map((img: any) => ({
        type: "image_url",
        image_url: { url: img.dataUrl },
      }));
      contentParts.push({ type: "text", text: prompt });

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: contentParts }],
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const parsed = parseAiJson(text);

      const sectorsRaw = (parsed.sectors || []).slice(0, 7);
      if (sectorsRaw.length < 2) {
        return new Response(JSON.stringify({ error: `AI only found ${sectorsRaw.length} sector(s). Try better photos.` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const sectors: Record<string, any> = {};
      const sectorOrder: string[] = [];

      for (let idx = 0; idx < sectorsRaw.length; idx++) {
        const s = sectorsRaw[idx];
        const key = SECTOR_POOL[idx];
        const nickname = String(s.nickname || `ZONE ${idx + 1}`).toUpperCase().trim();
        const targets = (s.targets || []).map((t: any, ti: number) => ({
          id: `${key[0]}${ti + 1}`,
          label: String(t.label || `Item ${ti + 1}`),
          tier: Math.min(3, Math.max(1, Number(t.tier) || 2)),
          why: String(t.why || "Needs attention."),
          trash: Number(t.trash) || 10,
          loot: Number(t.loot) || 5,
        }));

        sectors[key] = {
          name: `${key}: ${nickname}`,
          desc: String(s.desc || "Sector awaiting assessment."),
          stage: idx + 1,
          timeEstimate: Math.max(1, Number(s.time_estimate_minutes) || 10),
          flowImpact: Math.min(5, Math.max(1, Number(s.flow_impact) || 3)),
          psychImpact: Math.min(5, Math.max(1, Number(s.psych_impact) || 3)),
          ergonomicRisk: Math.min(5, Math.max(1, Number(s.ergonomic_risk) || 2)),
          whyItMatters: String(s.why_it_matters || "This zone needs attention."),
          finalAnalysis: String(s.final_analysis || "Clear it."),
          inventory: (s.inventory || []).map((item: any, i: number) => ({
            number: String(item.number || `${i + 1}`.padStart(3, "0")),
            label: String(item.label || `Item ${i + 1}`),
            category: String(item.category || "MISC"),
          })),
          targets,
        };
        sectorOrder.push(key);
      }

      const operationName = String(parsed.operation_name || "OPERATION: UNKNOWN").toUpperCase();

      return new Response(JSON.stringify({ sectors, sectorOrder, operationName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "verify") {
      const body = await req.json().catch(() => ({}));
      const sectorName = body.sectorName || "UNKNOWN SECTOR";
      const elapsedMin = body.elapsedMin;
      const timeEst = body.timeEstimate;

      let timingContext = "";
      if (elapsedMin != null && timeEst != null) {
        const over = elapsedMin - timeEst;
        if (over > timeEst) timingContext = `\nOperator took ${elapsedMin}min. ${over}min over. Unacceptable.`;
        else if (over > 0) timingContext = `\nOperator took ${elapsedMin}min vs ${timeEst}. Slow.`;
        else timingContext = `\nOperator finished in ${elapsedMin}min vs ${timeEst}. Ahead of schedule.`;
      }

      const prompt = `Hostile tactical AI of FlowIndex OS. Confirmation photo for: ${sectorName}.${timingContext}
ASSESS: Indoor space with visible improvement? Or irrelevant (selfie, food, outdoors)?
Respond ONLY with valid JSON:
{"verified":true,"tone":"reward","message":"One punchy OS line max 20 words."}
Irrelevant: verified=false tone=hostile. Cleaner: verified=true. Beat clock: tone=reward. Over: tone=hostile. Ambiguous room: verified=true.`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content }],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ verified: true, tone: "neutral", message: "Verification unavailable — passing you through." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      try {
        const parsed = parseAiJson(text);
        return new Response(JSON.stringify({
          verified: parsed.verified !== false,
          tone: String(parsed.tone || "neutral"),
          message: String(parsed.message || "Acknowledged."),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ verified: true, tone: "neutral", message: "Verification unavailable — passing you through." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-room error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseAiJson(text: string): any {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}") + 1;
    if (start === -1 || end === 0) throw new Error("No JSON found");
    return JSON.parse(cleaned.substring(start, end));
  } catch (e) {
    console.error("Failed to parse AI JSON:", text.substring(0, 200));
    throw new Error("AI returned malformed response. Try again.");
  }
}
