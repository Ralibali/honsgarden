import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

function extractJson(raw: string) {
  const fence = String.fromCharCode(96).repeat(3);
  const cleaned = raw.replace(fence + "json", "").replaceAll(fence, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("ai_response_not_json");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function healthSensitive(question: string) {
  return /sjuk|sjukdom|symptom|symtom|medicin|läkemedel|avmask|kvalster|löss|behandl|dos|veterinär|antibiotika/i.test(question);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!supabaseUrl || !serviceKey) return json({ error: "backend_not_configured" }, 500);

  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const question = clean(body?.question, 1000);
  if (question.length < 2) return json({ error: "question_required" }, 400);

  if (healthSensitive(question)) {
    return json({
      answer:
        "Jag kan hjälpa dig hitta utrustning, foderrelaterade tillbehör, böcker och kläckningsutrustning, men jag ger inte behandlings- eller läkemedelsråd. Vid sjukdom, symtom eller frågor om medicinering bör du kontakta veterinär.",
      recommendations: [],
      missing_facts: ["Veterinär bedömning krävs för hälso- eller behandlingsfrågor."],
    });
  }

  const { data: products, error } = await admin
    .from("affiliate_products")
    .select("id,name,slug,category,short_description,description,price,currency,in_stock,affiliate_url,product_url,image_url,specs")
    .eq("is_active", true)
    .neq("category", "hälsa")
    .order("updated_at", { ascending: false })
    .limit(150);

  if (error) return json({ error: error.message }, 500);
  if (!products?.length) return json({ error: "catalog_empty" }, 409);

  const catalog = products.map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    description: product.short_description ?? product.description,
    price: product.price,
    currency: product.currency,
    inStock: product.in_stock,
    specs: product.specs,
  }));

  const apiKey = Deno.env.get("LOVABLE_API_KEY") ?? "";
  if (!apiKey) return json({ error: "ai_not_configured" }, 500);

  const prompt = [
    "Du är Hönsgårdens produktguide. Besvara frågan ENDAST med verifierad information från katalogen nedan.",
    "",
    "Regler:",
    "- Hitta aldrig på produkt, pris, lager, egenskap, rabatt eller leveranstid.",
    "- Rekommendera högst 4 produkter.",
    "- Produkter med inStock=false får inte rekommenderas som köpbara.",
    "- Om price saknas får du inte ange pris.",
    "- Ge inga veterinärmedicinska råd, diagnoser, doser eller behandlingsrekommendationer.",
    "- Om fakta saknas, säg tydligt att uppgiften saknas.",
    "- Returnera strikt JSON med nycklarna answer, recommendedProductIds, reasons och missingFacts.",
    "",
    "Fråga: " + question,
    "Katalog: " + JSON.stringify(catalog),
  ].join("\n");

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25_000),
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.1,
        max_tokens: 1800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!response.ok) return json({ error: "ai_gateway_" + response.status }, response.status === 429 ? 429 : 502);

    const completion = await response.json();
    const parsed = extractJson(String(completion?.choices?.[0]?.message?.content ?? ""));
    const map = new Map(products.map((product) => [product.id, product]));
    const ids = Array.isArray(parsed.recommendedProductIds)
      ? [...new Set(parsed.recommendedProductIds.map((id: unknown) => clean(id, 80)))]
          .filter((id) => map.has(id) && map.get(id)?.in_stock !== false)
          .slice(0, 4)
      : [];

    const recommendations = ids.map((id) => {
      const product = map.get(id)!;
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        description: product.short_description ?? product.description,
        price: product.price,
        currency: product.currency,
        in_stock: product.in_stock,
        image_url: product.image_url,
        url: product.affiliate_url || product.product_url,
      };
    });

    return json({
      answer: clean(parsed.answer, 2500),
      recommendations,
      reasons: Array.isArray(parsed.reasons)
        ? parsed.reasons.map((item: unknown) => clean(item, 400)).filter(Boolean).slice(0, 6)
        : [],
      missing_facts: Array.isArray(parsed.missingFacts)
        ? parsed.missingFacts.map((item: unknown) => clean(item, 400)).filter(Boolean).slice(0, 6)
        : [],
    });
  } catch (error) {
    return json({ error: (error instanceof Error ? error.message : String(error)).slice(0, 500) }, 500);
  }
});
