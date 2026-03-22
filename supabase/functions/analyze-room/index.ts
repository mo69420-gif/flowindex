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

    const reqBody = await req.json();
    const { mode, images, sectorName, elapsedMin, timeEstimate, sectorTargets } = reqBody;

    // Boot message mode — no images needed
    if (mode === "boot_message") {
      const prompt = `You are the boot screen of FlowIndex OS — a hostile military AI cleaning app with absurdist humor.

Generate ONE completely unique boot prompt asking the user to enter their name/callsign.

Rules:
- Max 15 words
- Absurdist, dry, hostile but genuinely funny
- Must reference the fact that they're about to clean something
- Must ask for or reference their name/identity in some way
- Never generic. Always surprising. Always different.
- Vibe: drill sergeant meets absurdist comedian meets disappointed parent
- No quotation marks in your response

Return ONLY the one-liner. Nothing else.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        return new Response(JSON.stringify({ message: "Identify yourself. The chaos already knows you're here." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const msg = (data.choices?.[0]?.message?.content || "").trim().replace(/^["']|["']$/g, "");
      return new Response(JSON.stringify({ message: msg || "Identify yourself. The chaos already knows you're here." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!images || !images.length) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "panoramic") {
      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality.

You received ONE panoramic photo of a space. Analyze it to understand the overall layout.

Issue 2-4 DIRECTIVES — specific follow-up shots you need for full analysis.
Each directive targets a specific zone or problem area you noticed.
Be specific and hostile. Name what you actually see.

IMPORTANT: Focus on ACTIONABLE CLUTTER — items that can be moved, sorted, trashed, or organized.
IGNORE: Stickers, decorations permanently attached to surfaces, wall art, paint colors, architectural features.
Focus on: Items on surfaces, floor clutter, disorganized storage, stuff that doesn't belong.

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
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Add funds at Settings > Workspace > Usage." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      const photoContext = images.map((img: any, i: number) => `  Photo ${i + 1} [${img.label}]`).join("\n");

      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality. Dry humor. Brutally honest. Absurdist military comedy energy.

${images.length} photos of a real space. Cross-reference all.

${photoContext}

CRITICAL RULES:
- Focus ONLY on actionable clutter: items that can be moved, sorted, trashed, donated, or reorganized
- IGNORE permanently attached decorative elements: stickers, wall art, paint, architectural features, mounted shelves
- Focus on: loose items on surfaces, floor clutter, disorganized storage, items that don't belong where they are
- If you see a toolbox, focus on the STUFF ON TOP OF IT or around it, not stickers on it

FENG SHUI + ERGONOMICS + PSYCHOLOGY:
- Order sectors by flow impact — clear pathway blockers first
- Factor in psychological burden and ergonomic hazards

For EACH sector return:

INVENTORY — every single visible LOOSE/MOVEABLE item, numbered, with category.
Categories: CLEANING_SUPPLIES, PERSONAL_CARE, ELECTRONICS, FURNITURE_STORAGE, TEXTILES, FOOD_DRINK, TOOLS, DECOR, MISC

IMPACT SCORES 1-5:
  flow_impact, psych_impact, ergonomic_risk

WHY_IT_MATTERS: 2-3 sentences. Psychology, cortisol, decision fatigue, visual clutter science.

FINAL_ANALYSIS: 2-3 hostile motivating sentences about what clearing this does.

TARGETS: 2-5 actionable items with tier (1=critical, 2=sort, 3=low), why (one-line reason), label, trash 5-25, loot 0-15.

Sector COUNT min 3 max 7.

NICKNAME: Absurdist hostile military codename 2-4 words ALL CAPS. Be CREATIVE and FUNNY.
Good examples: FORGOTTEN LAUNDRY INSURGENCY, CABLE SPAGHETTI TRIBUNAL, EXPIRED CONDIMENT CEMETERY, DUST BUNNY SOVEREIGNTY, CHAIR WARDROBE CRISIS, COUNTERTOP ANARCHY ZONE, FLOOR LAVA PROTOCOL
Bad examples: ZONE A, SECTOR 1, NORTH WALL (too boring)

DESC: one hostile, funny sentence about the zone.

TIME: realistic minutes.

Also generate ONE unique operation name for the entire mission.
Format: OPERATION: [NAME] — 2-4 words ALL CAPS, absurdist hostile military naming convention.
Examples of the VIBE (do NOT reuse): OPERATION: CRIMSON TOWEL INCIDENT / OPERATION: FORGOTTEN FLOOR PROTOCOL / OPERATION: DOMESTIC ENTROPY CRISIS / OPERATION: SURFACE AREA RECLAMATION

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
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Credits exhausted. Add funds at Settings > Workspace > Usage." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      const name = sectorName || "UNKNOWN SECTOR";

      let timingContext = "";
      if (elapsedMin != null && timeEstimate != null) {
        const over = elapsedMin - timeEstimate;
        if (over > timeEstimate) timingContext = `\nOperator took ${elapsedMin}min. ${over}min over. Unacceptable.`;
        else if (over > 0) timingContext = `\nOperator took ${elapsedMin}min vs ${timeEstimate}. Slow.`;
        else timingContext = `\nOperator finished in ${elapsedMin}min vs ${timeEstimate}. Ahead of schedule.`;
      }

      // Build target context for cross-referencing
      let targetContext = "";
      if (sectorTargets && sectorTargets.length > 0) {
        const targetList = sectorTargets.map((t: any) => `- ${t.label} (${t.action})`).join("\n");
        targetContext = `\n\nThe operator was supposed to handle these targets in this sector:\n${targetList}\n\nThe photo should show an INDOOR space consistent with these items. If the photo shows something completely unrelated (different room, outdoor scene, random objects that have NOTHING to do with the targets above), it should FAIL verification.`;
      }

      const prompt = `Hostile tactical AI of FlowIndex OS. Confirmation photo for sector: ${name}.${timingContext}${targetContext}

CRITICAL VERIFICATION RULES:
1. The photo MUST show an indoor space that is PLAUSIBLY the same type of area where the listed targets would exist
2. If the photo shows a completely DIFFERENT room type (e.g., bathroom photo for a workshop sector, outdoor scene for indoor sector), REJECT IT — verified=false, tone=hostile, roast the operator for trying to cheat
3. If the photo shows the right kind of space but messy, still pass it — the OS is lenient on cleanliness but NOT on cheating
4. Selfies, food photos, pets, memes, outdoor landscapes = INSTANT FAIL with maximum hostility
5. If it looks like the right space and shows some effort: verified=true

Respond ONLY with valid JSON:
{"verified":true,"tone":"reward","message":"One punchy OS line max 20 words."}

tone options: "hostile" (failed/over time/cheating), "reward" (passed + good job), "neutral" (passed but meh)`;

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

    if (mode === "final_review") {
      // End-of-operation review with follow-up photo
      const { operationName: opName, stats } = reqBody;

      const prompt = `You are the hostile tactical AI of FlowIndex OS. The operator just finished an operation.

Operation: ${opName || "UNKNOWN"}
Stats: ${stats ? JSON.stringify(stats) : "unknown"}

The operator submitted a final photo of the space AFTER completing all sectors.

ASSESS the photo:
1. Does it look like a space that's been cleaned/organized compared to what a messy room would look like?
2. Rate the overall effort on a scale

Respond ONLY with valid JSON:
{"rating":1-10,"mood":"MOOD_STRING","roast":"2-3 sentences. If they did well: begrudging respect with backhanded compliments. If they didn't: savage but motivating. Either way be FUNNY and specific about what you see.","verdict":"One-liner summary of the operation outcome."}

MOOD options (pick one based on effort quality):
- "MAXIMUM RESPECT UNLOCKED" (8-10 rating, place looks great)
- "BEGRUDGINGLY PROUD" (6-7, decent effort)
- "CAUTIOUSLY OPTIMISTIC" (4-5, some improvement visible)
- "JUDGING YOU HEAVILY" (2-3, barely tried)
- "HOSTILE BUT HELPFUL" (1, did they even do anything?)

Be funny. Be specific about what you see in the photo. Reference the operation name.`;

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
        return new Response(JSON.stringify({
          rating: 5, mood: "CAUTIOUSLY OPTIMISTIC",
          roast: "Verification unavailable. The AI assumes you did... something.",
          verdict: "Inconclusive. Benefit of the doubt granted.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      try {
        const parsed = parseAiJson(text);
        return new Response(JSON.stringify({
          rating: Math.min(10, Math.max(1, Number(parsed.rating) || 5)),
          mood: String(parsed.mood || "CAUTIOUSLY OPTIMISTIC"),
          roast: String(parsed.roast || "The AI has no comment. Suspicious."),
          verdict: String(parsed.verdict || "Operation status: unclear."),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({
          rating: 5, mood: "CAUTIOUSLY OPTIMISTIC",
          roast: "AI couldn't parse its own thoughts. That's how confusing your space is.",
          verdict: "Operation complete. Probably.",
        }), {
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
