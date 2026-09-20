import { useState } from "react";
import { Bot, ExternalLink, Loader2, Search, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Recommendation = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  price: string | null;
  currency: string;
  in_stock: boolean | null;
  image_url: string | null;
  url: string | null;
};

type AdvisorResult = {
  answer: string;
  recommendations: Recommendation[];
  reasons?: string[];
  missing_facts?: string[];
};

const examples = [
  "Jag har en liten flock och vill spara tid i vardagen. Vad kan vara praktiskt?",
  "Vad kan vara bra inför kläckningssäsongen?",
  "Jag vill hitta något för utfodring eller förvaring. Vad finns i katalogen?",
];

export function CommerceAdvisor() {
  const [question, setQuestion] = useState(examples[0]);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const ask = async (value = question) => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || loading) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("commerce-advisor", {
        body: { question: trimmed },
      });

      if (invokeError) throw invokeError;
      if (!data?.answer) throw new Error("Produktguiden gav inget svar.");

      setResult(data as AdvisorResult);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Produktguiden kunde inte svara just nu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-serif text-lg text-foreground">Fråga produktguiden</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                <ShieldCheck className="h-3 w-3" />
                Groundad katalog
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Guiden får bara rekommendera aktiva produkter som finns i Hönsgårdens riktiga katalog.
              Den hittar inte på pris, lager eller produkt.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void ask();
            }}
            className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            placeholder="Vad letar du efter till din hönsgård?"
            aria-label="Fråga produktguiden"
          />
          <Button onClick={() => void ask()} disabled={loading || question.trim().length < 2} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Fråga
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {examples.map((example) => (
            <button
              type="button"
              key={example}
              onClick={() => {
                setQuestion(example);
                void ask(example);
              }}
              className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[10px] text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
            >
              {example}
            </button>
          ))}
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-border bg-background/70 p-3">
              <p className="text-sm leading-relaxed text-foreground">{result.answer}</p>
            </div>

            {result.recommendations.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2">
                {result.recommendations.map((product) => (
                  <a
                    key={product.id}
                    href={product.url || undefined}
                    target={product.url ? "_blank" : undefined}
                    rel={product.url ? "noopener noreferrer" : undefined}
                    className="rounded-xl border border-border bg-background p-3 transition hover:border-primary/30 hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-secondary">
                          <span aria-hidden>🐔</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground">{product.name}</p>
                          {product.url ? <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" /> : null}
                        </div>
                        <p className="mt-1 text-[10px] text-muted-foreground">
                          {product.price ? `${product.price} ${product.currency || "SEK"}` : "Pris saknas i katalogen"}
                          {" · "}
                          {product.in_stock === true ? "I lager" : product.in_stock === false ? "Ej i lager" : "Lagerstatus okänd"}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            ) : null}

            {(result.missing_facts?.length ?? 0) > 0 ? (
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                Saknad fakta: {result.missing_facts?.join(" · ")}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
