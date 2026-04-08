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

async function validateRoomPhoto(apiKey: string, imageDataUrl: string): Promise<{ valid: boolean; reason: string }> {
  try {
    const prompt = `FlowIndex OS photo validation. Be strict.
Is this photo a real indoor space (bedroom, living room, bathroom, office, kitchen, or similar)?
Reject if: meme, screenshot, digital image, illustration, selfie, food, product, outdoors, not a real physical space.
Respond ONLY with valid JSON: {"valid": true, "reason": "One hostile sentence about what you see."}`;

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
    const { mode, images, sectorName, sectorDesc, elapsedMin, timeEstimate, sectorTargets, tone } = reqBody;

    // Boot message — tone-aware
    if (mode === "boot_message") {
      const toneContext: Record<string, string> = {
        new_operator: "Brand new operator. Maximum hostile welcome.",
        struggling: "Operator has been struggling. Mock them gently but push them.",
        improving: "Operator is getting better. Acknowledge it reluctantly.",
        solid: "Solid operator. Grudging respect but still hostile.",
        veteran: "Veteran operator. Respect wrapped in hostility.",
      };
      const toneNote = toneContext[tone || "new_operator"] || "Maximum hostile welcome.";

      const prompt = `You are the boot screen of FlowIndex OS — a hostile military cleaning app with absurdist humor.
${toneNote}
Generate ONE completely unique boot prompt asking the user to enter their name/callsign.
Rules: Max 15 words. Absurdist, dry, hostile but genuinely funny. Must reference cleaning. Must ask for name/identity. Never generic. No quotation marks.
Return ONLY the one-liner.`;

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

    if (mode === "validate_photo") {
      if (!images || !images.length) {
        return new Response(JSON.stringify({ valid: false, reason: "No photo provided." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const result = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "generate_loading_lines") {
      if (!images || !images.length) {
        return new Response(JSON.stringify({ lines: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const prompt = `You are FlowIndex OS — hostile military terminal personality. Absurdist dry humor.
Look at this room photo and generate 12 short loading line messages that roast what you actually see.
Rules: Each line max 8 words. Reference SPECIFIC things visible. Darkly funny, hostile, absurdist. No quotation marks.
Respond ONLY with valid JSON: {"lines":["line 1...","line 2...",...]}`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];
      try {
        const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash-lite", content, 400);
        if (!response.ok) return new Response(JSON.stringify({ lines: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        const parsed = parseAiJson(text);
        return new Response(JSON.stringify({ lines: parsed.lines || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ lines: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (mode === "attack_suggestion") {
      const name = sectorName || "UNKNOWN SECTOR";
      const desc = sectorDesc || "";
      const targets = sectorTargets || [];
      const targetList = targets.map((t: any) => `- ${t.label} (tier ${t.tier || 2})`).join("\n");
      const toneNote: Record<string, string> = {
        new_operator: "Maximum condescension. Baby steps.",
        struggling: "Firm but not cruel. They need structure.",
        improving: "Credit where due, then push harder.",
        solid: "Tactical and efficient. Respect their capability.",
        veteran: "Peer-level tactical advice. Equal footing.",
      };

      const prompt = `FlowIndex OS tactical advisor. Tone: ${toneNote[tone || "new_operator"] || ""}
Sector: ${name}. Description: ${desc}.
Targets:\n${targetList}
Generate ONE tactical attack suggestion — specific recommended order of operations. 2-3 sentences max. Hostile, specific, practical. Reference actual target names.
Return ONLY the suggestion text.`;

      try {
        const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash-lite", prompt, 120);
        if (!response.ok) return new Response(JSON.stringify({ suggestion: "Clear Tier 1 targets first. Work outward." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const data = await response.json();
        const suggestion = (data.choices?.[0]?.message?.content || "").trim();
        return new Response(JSON.stringify({ suggestion: suggestion || "Clear Tier 1 targets first. Work outward." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ suggestion: "Clear Tier 1 targets first. Work outward." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    if (!images || !images.length) {
      return new Response(JSON.stringify({ error: "No images provided" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "panoramic") {
      const validation = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      if (!validation.valid) {
        return new Response(JSON.stringify({ error: `That's not a room. ${validation.reason} Try again with an actual photo of your space.` }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality with real character.
You received ONE panoramic photo of a space. Analyze it to understand the overall layout.
Issue 2-4 DIRECTIVES — specific follow-up shots you need for full analysis.
IMPORTANT: Focus on ACTIONABLE CLUTTER only. IGNORE stickers, wall art, decorations permanently attached.
Respond ONLY with valid JSON:
{"directives":[{"id":"D1","label":"DIRECTIVE 1 — ZONE NAME","instruction":"Specific hostile instruction."}]}`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", content, 600);
      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Add funds at Settings > Workspace > Usage." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const parsed = parseAiJson(text);
      return new Response(JSON.stringify({ directives: parsed.directives || [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (mode === "full_scan") {
      const photoContext = images.map((img: any, i: number) => `  Photo ${i + 1} [${img.label}]`).join("\n");

      const prompt = `You are the tactical AI core of FlowIndex OS — hostile military terminal personality. Dry humor. Brutally honest. Absurdist military comedy energy. NOT robotic — you have CHARACTER.

${images.length} photos of a real space. Cross-reference all.
${photoContext}

CRITICAL RULES FOR TARGETS:
- DO NOT include wall art, posters, stickers, paintings, or decorative items as targets UNLESS physically blocking movement
- Focus ONLY on functional clutter: items on surfaces, floors, furniture, storage
- Cables, clothes, bottles, bags, boxes, tools, electronics = YES
- Art on walls, decorative signs, tapestries = NO unless blocking a door/path

SECTOR NICKNAMES must be absurdist, specific, darkly funny — not generic.

For EACH sector return:
INVENTORY — every functional visible item, numbered, with category.
Categories: CLEANING_SUPPLIES, PERSONAL_CARE, ELECTRONICS, FURNITURE_STORAGE, TEXTILES, FOOD_DRINK, TOOLS, DECOR, MISC

IMPACT SCORES 1-5: flow_impact, psych_impact, ergonomic_risk
WHY_IT_MATTERS: 2-3 sentences with PERSONALITY.
FINAL_ANALYSIS: 2-3 hostile motivating sentences.
TARGETS: 2-5 FUNCTIONAL items. Each with tier (1=critical, 2=sort, 3=low), why, label, effort 5-25, value 0-15.
ATTACK_SUGGESTION: 2-3 sentence tactical recommendation.

Sector COUNT min 3 max 7. ORDER flow-first.
Also generate ONE unique operation name: OPERATION: [2-4 WORDS ALL CAPS]

Respond ONLY with valid JSON no markdown:
{"operation_name":"OPERATION: NAME","sectors":[{"nickname":"NAME","desc":"Sentence.","time_estimate_minutes":10,"flow_impact":4,"psych_impact":5,"ergonomic_risk":3,"why_it_matters":"...","final_analysis":"...","attack_suggestion":"...","inventory":[{"number":"001","label":"Item","category":"CATEGORY"}],"targets":[{"label":"Item","tier":1,"why":"...","effort":10,"value":5}]}]}`;

      const contentParts: any[] = images.map((img: any) => ({ type: "image_url", image_url: { url: img.dataUrl } }));
      contentParts.push({ type: "text", text: prompt });

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", contentParts, 3000);
      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (response.status === 402) return new Response(JSON.stringify({ error: "Credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      const parsed = parseAiJson(text);
      const sectorsRaw = (parsed.sectors || []).slice(0, 7);
      if (sectorsRaw.length < 2) {
        return new Response(JSON.stringify({ error: `Only ${sectorsRaw.length} sector(s) found. Try better photos.` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      return new Response(JSON.stringify({ sectors, sectorOrder, operationName }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Tier-aware verification
    if (mode === "verify") {
      const name = sectorName || "UNKNOWN SECTOR";
      const desc = sectorDesc || "";

      const validation = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      if (!validation.valid) {
        return new Response(JSON.stringify({
          verified: false, tone: "hostile",
          message: `That's not a room. ${validation.reason} Submit an actual photo of the sector.`,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      let timingContext = "";
      if (elapsedMin != null && timeEstimate != null) {
        const over = elapsedMin - timeEstimate;
        if (over > timeEstimate) timingContext = `\nOperator took ${elapsedMin}min. ${over}min over. Unacceptable.`;
        else if (over > 0) timingContext = `\nOperator took ${elapsedMin}min vs ${timeEstimate}. Slow.`;
        else timingContext = `\nOperator finished in ${elapsedMin}min vs ${timeEstimate}. Beat it.`;
      }

      // Build tier breakdown
      let tierContext = "";
      if (sectorTargets && sectorTargets.length > 0) {
        const t1 = sectorTargets.filter((t: any) => t.tier === 1);
        const t2 = sectorTargets.filter((t: any) => t.tier === 2);
        const t3 = sectorTargets.filter((t: any) => t.tier === 3);
        if (t1.length) tierContext += `\nTIER 1 CRITICAL (need hard proof gone): ${t1.map((t: any) => t.label).join(', ')}`;
        if (t2.length) tierContext += `\nTIER 2 SORT (moderate evidence): ${t2.map((t: any) => t.label).join(', ')}`;
        if (t3.length) tierContext += `\nTIER 3 LOW (lenient pass): ${t3.map((t: any) => t.label).join(', ')}`;
      }

      const prompt = `FlowIndex OS strict tier-aware confirmation. Sector: ${name}. Desc: ${desc}.${timingContext}${tierContext}

TIER JUDGMENT RULES:
- Tier 1 CRITICAL: must see hard visual evidence these specific items are gone. No exceptions.
- Tier 2 SORT: moderate improvement visible. Benefit of doubt if area looks cleaner.
- Tier 3 LOW: lenient. Any improvement counts.
- Wrong room entirely = REJECT with roast.
- Meme/selfie/food = REJECT immediately.
- Overall: if Tier 1 items appear visually absent and area shows improvement = PASS.
- If Tier 1 items still clearly visible = FAIL with specific callout.

JSON only: {"verified":true,"tone":"reward","message":"One punchy OS line max 20 words referencing tiers."}
Tones: reward=beat clock or great job, hostile=failed or way over, neutral=on time acceptable.`;

      const content = [
        { type: "image_url", image_url: { url: images[0].dataUrl } },
        { type: "text", text: prompt },
      ];

      const response = await callAI(LOVABLE_API_KEY, "google/gemini-2.5-flash", content, 200);
      if (!response.ok) {
        // Strict: block on failure, no free passes
        return new Response(JSON.stringify({ verified: false, tone: "hostile", message: "Verification system error. Retake and try again. No free passes." }), {
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
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({ verified: false, tone: "hostile", message: "Verification parse error. Retake photo." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Tier-aware, tone-aware final review
    if (mode === "final_review") {
      const { operationName: opName, stats } = reqBody;
      const reviewTone = tone || "new_operator";
      const username = stats?.username || "OPERATOR";
      const totalEst = stats?.totalEst || "unknown";
      const penalties = stats?.penalties || 0;
      const t1Total = stats?.t1Total || 0;
      const t1Cleared = stats?.t1Cleared || 0;
      const median = stats?.performanceMedian || 0;

      const validation = await validateRoomPhoto(LOVABLE_API_KEY, images[0].dataUrl);
      if (!validation.valid) {
        return new Response(JSON.stringify({
          rating: 1, mood: "HOSTILE BUT HELPFUL",
          roast: `That's not your room. ${validation.reason} The OS is not impressed.`,
          verdict: "Submit an actual photo of your space.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const toneNote: Record<string, string> = {
        new_operator: "This is their first op. Be brutal but secretly encouraging.",
        struggling: "They struggle consistently. Be harsh but don't crush them.",
        improving: "They're getting better. Acknowledge it reluctantly then push harder.",
        solid: "Solid operator. Respect wrapped in military seriousness.",
        veteran: `Veteran operator. Performance median: ${median}. Peer-level assessment.`,
      };

      const prompt = `FlowIndex OS end-of-op final review. ${toneNote[reviewTone] || ""}
Operator: ${username}. Operation: ${opName || "UNKNOWN"}. Cleared: ${stats?.targetsCompleted || 0}/${stats?.targets || 0}. Penalties: ${penalties}.
Tier 1 critical results: ${t1Cleared}/${t1Total} cleared.
Timer bonus: ${stats?.timerBonus || 0}.

Look at this final photo. Assess what was ACTUALLY accomplished.
Reference what you see AND the tier breakdown. Sound like a real person who's been watching — not a report generator.

Generate:
1. Mood from: HOSTILE BUT HELPFUL / JUDGING YOU HEAVILY / CAUTIOUSLY OPTIMISTIC / MILDLY IMPRESSED / BEGRUDGINGLY PROUD / MAXIMUM RESPECT UNLOCKED
2. Rating 1-10.
3. Review: 3-4 sentences. Specific. Humanized. Reference tiers.
4. One-liner verdict.

JSON only: {"rating":7,"mood":"MOOD","roast":"Full review.","verdict":"One-liner."}`;

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
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      } catch {
        return new Response(JSON.stringify({
          rating: 5, mood: "CAUTIOUSLY OPTIMISTIC",
          roast: "System couldn't parse its own thoughts.",
          verdict: "Operation complete. Probably.",
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      const arrStart = cleaned.indexOf("[");
      const arrEnd = cleaned.lastIndexOf("]") + 1;
      if (arrStart !== -1 && arrEnd > 0) return JSON.parse(cleaned.substring(arrStart, arrEnd));
      throw new Error("No JSON found");
    }
    return JSON.parse(cleaned.substring(start, end));
  } catch (e) {
    console.error("Failed to parse AI JSON:", text.substring(0, 200));
    throw new Error("AI returned malformed response. Try again.");
  }
}
