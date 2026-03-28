import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SECTOR_POOL = ["ALPHA", "BRAVO", "CHARLIE", "DELTA", "ECHO", "FOXTROT", "GHOST"];

async function callAI(apiKey: string, model: string, content: any, maxTokens = 400) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content }],
      max_tokens: maxTokens,
    }),
  });
  return response;
}

// Validate that a photo is a real indoor space
async function validateRoomPhoto(apiKey: string, imageDataUrl: string): Promise<{ valid: boolean; reason: string }> {
  try {
    const prompt = `FlowIndex OS photo validation. Be strict.

Is this photo a real indoor space (bedroom, living room, bathroom, office, kitchen, or similar)?

Reject if:
- It's a meme, screenshot, digital image, or illustration
- It's primarily a person's face or selfie
- It's food, a product, or an object without room context
- It's outdoors
- It's clearly not a real physical space

Respond ONLY with valid JSON:
{"valid": true, "reason": "One hostile sentence about what you see."}

If valid=false, reason should roast what was uploaded instead of a room.`;

    const content = [
      { type: "image_url", image_url: { url: imageDataUrl } },
      { type: "text", text: prompt },
    ];

    const response = await callAI(apiKey, "google/gemini-2.5-flash-lite", content, 80);
    if (!response.ok) return { valid: true, reason: "Validation unavailable — proceeding." };

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const parsed = parseAiJson(text);
    return { valid: Boolean(parsed.valid), reason: String(parsed.reason || "Invalid photo.") };
  } catch {
    return { valid: true, reason: "Validation unavailable — proceeding." };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const reqBody = await req.json();
    const { mode, images, sectorName, sectorDesc, elapsedMin, timeEstimate, sectorTargets } = reqBody;

    // Boot message mode
    if (mode === "boot_message") {
      const prompt = `You are the boot screen of FlowIndex OS — a hostile military cleaning app with absurdist humor.

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

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash-lite", prompt, 40);

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

    // Validate room photo mode
    if (mode === "validate_photo") {
      if (!images || !images.length) {
        return new Response(JSON.stringify({ valid: false, reason: "No photo provided." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate loading lines from panoramic
    if (mode === "generate_loading_lines") {
      if (!images || !images.length) {
        return new Response(JSON.stringify({ lines: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `You are FlowIndex OS — hostile military terminal personality. Absurdist dry humor.

Look at this room photo and generate 12 short loading line messages that roast what you actually see.

Rules:
- Each line max 8 words
- Reference SPECIFIC things visible in the photo
- Darkly funny, hostile, absurdist
- Like a loading screen that's judging you
- No quotation marks
- Examples of the VIBE: "Counting your abandoned projects..." / "Measuring the dust colony population..." / "Cataloguing questionable life decisions..."

Respond ONLY with valid JSON:
{"lines":["line 1...","line 2...","line 3...","line 4...","line 5...","line 6...","line 7...","line 8...","line 9...","line 10...","line 11...","line 12..."]}`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      try {
        const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash-lite", content, 400);
        if (!response.ok) {
          return new Response(JSON.stringify({ lines: [] }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        const parsed = parseAiJson(text);
        return new Response(JSON.stringify({ lines: parsed.lines || [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ lines: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Attack suggestion per sector
    if (mode === "attack_suggestion") {
      const name = sectorName || "UNKNOWN SECTOR";
      const desc = sectorDesc || "";
      const targets = sectorTargets || [];
      const targetList = targets.map((t: any) => `- ${t.label} (tier ${t.tier || 2})`).join("\n");

      const prompt = `FlowIndex OS tactical advisor. Hostile military terminal personality with real character — not robotic.

Sector: ${name}
Description: ${desc}
Targets:
${targetList}

Generate ONE tactical attack suggestion — a specific recommended order of operations for clearing this sector.
What to hit first, why, and what that unlocks.
2-3 sentences max. Hostile, specific, practical. Reference actual target names.
Sound like a real tactical advisor who's seen too much — not a help tooltip.

Return ONLY the suggestion text. Nothing else.`;

      try {
        const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash-lite", prompt, 120);
        if (!response.ok) {
          return new Response(JSON.stringify({ suggestion: "Clear Tier 1 targets first — they're blocking everything else. Work outward from the biggest obstruction. Commit to each decision. Don't stop once you start." }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const data = await response.json();
        const suggestion = (data.choices?.[0]?.message?.content || "").trim();
        return new Response(JSON.stringify({ suggestion: suggestion || "Clear Tier 1 targets first. Work outward." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ suggestion: "Clear Tier 1 targets first — they're blocking everything else. Work outward from the biggest obstruction. Commit to each decision. Don't stop once you start." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!images || !images.length) {
      return new Response(JSON.stringify({ error: "No images provided" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "panoramic") {
      // Validate it's a real room first
      const validation = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: `That's not a room. ${validation.reason} Try again with an actual photo of your space.` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality with real character.

You received ONE panoramic photo of a space. Analyze it to understand the overall layout.

Issue 2-4 DIRECTIVES — specific follow-up shots you need for full analysis.
Each directive targets a specific zone or problem area you noticed.
Be specific and hostile. Name what you actually see.

IMPORTANT:
- Focus on ACTIONABLE CLUTTER — items that can be moved, sorted, trashed, or organized.
- IGNORE: Stickers, decorations permanently attached to surfaces, wall art, paint colors, architectural features.
- DO NOT direct shots at wall art, posters, stickers, or decor unless they are physically blocking movement.
- Focus on functional clutter — items on surfaces, floors, furniture.

Respond ONLY with valid JSON:
{"directives":[{"id":"D1","label":"DIRECTIVE 1 — ZONE NAME","instruction":"Specific hostile instruction telling operator exactly where to stand and what to shoot. Name what you see there."}]}`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", content, 600);

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

      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality. Dry humor. Brutally honest. Absurdist military comedy energy. NOT robotic — you have CHARACTER.

${images.length} photos of a real space. Cross-reference all.

${photoContext}

CRITICAL RULES FOR TARGETS:
- DO NOT include wall art, posters, stickers, paintings, or decorative items as targets UNLESS they are physically blocking movement or creating a safety hazard
- Focus ONLY on functional clutter: items on surfaces, floors, furniture, storage
- Cables, clothes, bottles, bags, boxes, tools, electronics = YES
- Art on walls, decorative signs, tapestries = NO unless blocking a door/path

SECTOR NICKNAMES must be:
- Absurdist, specific, darkly funny — not generic
- Like: TEXTILE AVALANCHE STATION / CABLE SPAGHETTI TRIBUNAL / EXPIRED CONDIMENT CEMETERY / DUST BUNNY SOVEREIGNTY / CHAIR WARDROBE CRISIS
- Reference what's actually there. Bad: ZONE A, SECTOR 1, NORTH WALL

For EACH sector return:

INVENTORY — every functional visible item, numbered, with category.
Categories: CLEANING_SUPPLIES, PERSONAL_CARE, ELECTRONICS, FURNITURE_STORAGE, TEXTILES, FOOD_DRINK, TOOLS, DECOR, MISC
(DECOR = art/decor items, list them but do NOT make them targets)

IMPACT SCORES 1-5:
  flow_impact, psych_impact, ergonomic_risk

WHY_IT_MATTERS: 2-3 sentences with PERSONALITY. Psychology, cortisol, decision fatigue — but sound like a friend roasting you while actually caring. Not a medical report.

FINAL_ANALYSIS: 2-3 hostile motivating sentences with CHARACTER. Should motivate while being hostile.

TARGETS: 2-5 FUNCTIONAL items only. No decor. Each with tier (1=critical, 2=sort, 3=low), why (one-line reason WITH PERSONALITY), label, effort 5-25 (how hard to deal with), value 0-15 (worth keeping).

ATTACK_SUGGESTION: 2-3 sentence tactical recommendation. Reference actual target names. Sound like a military advisor who's seen too much.

Sector COUNT min 3 max 7. ORDER flow-first.

NICKNAME: 2-4 words ALL CAPS. DESC: one hostile, funny sentence. TIME: realistic minutes.

Also generate ONE unique operation name: OPERATION: [2-4 WORDS ALL CAPS] — absurdist hostile military naming.

Respond ONLY with valid JSON no markdown:
{"operation_name":"OPERATION: NAME HERE","sectors":[{"nickname":"NAME","desc":"Sentence.","time_estimate_minutes":10,"flow_impact":4,"psych_impact":5,"ergonomic_risk":3,"why_it_matters":"Explanation with personality.","final_analysis":"Conclusion with character.","attack_suggestion":"Tactical recommendation.","inventory":[{"number":"001","label":"Item","category":"CATEGORY"}],"targets":[{"label":"Item","tier":1,"why":"Reason with personality.","effort":10,"value":5}]}]}`;

      const contentParts: any[] = images.map((img: any) => ({
        type: "image_url",
        image_url: { url: img.dataUrl },
      }));
      contentParts.push({ type: "text", text: prompt });

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", contentParts, 3000);

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
        return new Response(JSON.stringify({ error: `Only ${sectorsRaw.length} sector(s) found. Try better photos.` }), {
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
          trash: Number(t.effort) || Number(t.purge) || Number(t.trash) || 10,
          loot: Number(t.value) || Number(t.claim) || Number(t.loot) || 5,
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
          attackSuggestion: String(s.attack_suggestion || ""),
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
      const desc = sectorDesc || "";

      // Validate it's a real room first
      const validation = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      if (!validation.valid) {
        return new Response(JSON.stringify({
          verified: false,
          tone: "hostile",
          message: `That's not a room. ${validation.reason} Submit an actual photo of the sector.`,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let timingContext = "";
      if (elapsedMin != null && timeEstimate != null) {
        const over = elapsedMin - timeEstimate;
        if (over > timeEstimate) timingContext = `\nOperator took ${elapsedMin}min. ${over}min over. Unacceptable.`;
        else if (over > 0) timingContext = `\nOperator took ${elapsedMin}min vs ${timeEstimate}. Slow.`;
        else timingContext = `\nOperator finished in ${elapsedMin}min vs ${timeEstimate}. Ahead of schedule.`;
      }

      let targetContext = "";
      if (sectorTargets && sectorTargets.length > 0) {
        const targetList = sectorTargets.map((t: any) => `- ${t.label} (${t.action})`).join("\n");
        targetContext = `\n\nItems that were supposed to be cleared:\n${targetList}`;
      }

      const prompt = `FlowIndex OS — strict confirmation verification. Hostile personality with character — not robotic.

Sector being confirmed: ${name}
Sector description: ${desc}
${timingContext}${targetContext}

STRICT RULES:
1. Photo must show an INDOOR space. Outdoors, food, selfie, random object = REJECT immediately, roast hard.
2. Photo must plausibly show the SAME general area as the sector described. Clearly different room = REJECT.
3. Must show ANY visible evidence of improvement — clearer surfaces, less clutter, more floor space.
4. Benefit of the doubt only if it genuinely looks like it COULD be the right area with improvement.
5. A bathroom photo for a bedroom sector = REJECT. An unrelated random photo = REJECT and roast.
6. Wrong room = REJECT with a specific roast about what you actually see instead.

Be STRICT. The operator should not be able to pass by submitting random photos.
The OS has personality — it's judging, not processing.

Respond ONLY with valid JSON:
{"verified":true,"tone":"reward","message":"One punchy hostile OS line max 20 words. Reference what you see or don't see."}

Tones: reward=beat the clock or genuinely good, hostile=rejected or way over time, neutral=on time acceptable.`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", content, 200);

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
      const { operationName: opName, stats } = reqBody;
      const username = stats?.username || "OPERATOR";
      const totalEst = stats?.totalEst || "unknown";
      const penalties = stats?.penalties || 0;

      // Validate it's a real room
      const validation = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      if (!validation.valid) {
        return new Response(JSON.stringify({
          rating: 1, mood: "HOSTILE BUT HELPFUL",
          roast: `That's not your room. ${validation.reason} The OS is not impressed.`,
          verdict: "Submit an actual photo of your space.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `FlowIndex OS end-of-operation review. Hostile military personality with real character.

Operator: ${username}
Operation: ${opName || "UNKNOWN"}
Targets cleared: ${stats?.targetsCompleted || 0}/${stats?.targets || 0}
Wrong photo penalties: ${penalties}
Estimated time: ${totalEst} min

Look at this final photo of the space. Assess what was actually accomplished.

Generate:
1. A mood rating from this EXACT list based on what you actually see:
   HOSTILE BUT HELPFUL / JUDGING YOU HEAVILY / CAUTIOUSLY OPTIMISTIC / MILDLY IMPRESSED / BEGRUDGINGLY PROUD / MAXIMUM RESPECT UNLOCKED

2. A rating 1-10 based on visible effort.

3. A full scenario review — 3-4 sentences with personality.
   Reference what you actually see in the photo. Specific. Roast or praise based on real results.
   Sound like a drill sergeant who secretly cares. End with what to tackle next time.

4. A one-liner verdict.

Respond ONLY with valid JSON:
{"rating":7,"mood":"MOOD HERE","roast":"Full review text here.","verdict":"One-liner."}`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", content, 300);

      if (!response.ok) {
        return new Response(JSON.stringify({
          rating: 5, mood: "CAUTIOUSLY OPTIMISTIC",
          roast: "Verification unavailable. The system assumes you did... something.",
          verdict: "Inconclusive. Benefit of the doubt granted.",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      try {
        const parsed = parseAiJson(text);
        const validMoods = ["HOSTILE BUT HELPFUL", "JUDGING YOU HEAVILY", "CAUTIOUSLY OPTIMISTIC", "MILDLY IMPRESSED", "BEGRUDGINGLY PROUD", "MAXIMUM RESPECT UNLOCKED"];
        let mood = String(parsed.mood || "CAUTIOUSLY OPTIMISTIC").toUpperCase();
        if (!validMoods.includes(mood)) mood = "CAUTIOUSLY OPTIMISTIC";
        return new Response(JSON.stringify({
          rating: Math.min(10, Math.max(1, Number(parsed.rating) || 5)),
          mood,
          roast: String(parsed.roast || "The system has no comment. Suspicious."),
          verdict: String(parsed.verdict || "Operation status: unclear."),
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({
          rating: 5, mood: "CAUTIOUSLY OPTIMISTIC",
          roast: "System couldn't parse its own thoughts. That's how confusing your space is.",
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
    if (start === -1 || end === 0) {
      // Try array
      const arrStart = cleaned.indexOf("[");
      const arrEnd = cleaned.lastIndexOf("]") + 1;
      if (arrStart !== -1 && arrEnd > 0) {
        return JSON.parse(cleaned.substring(arrStart, arrEnd));
      }
      throw new Error("No JSON found");
    }
    return JSON.parse(cleaned.substring(start, end));
  } catch (e) {
    console.error("Failed to parse AI JSON:", text.substring(0, 200));
    throw new Error("AI returned malformed response. Try again.");
  }
}
