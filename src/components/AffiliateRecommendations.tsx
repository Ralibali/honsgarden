import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Sparkles, ShoppingBag, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AffiliateProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  image: string;
  affiliateUrl: string;
  category: 'foder' | 'hälsa' | 'utrustning' | 'kläckning' | 'böcker';
  reason: string;
  badge?: string;
}

// Smart product catalog – matched to farm signals
const productCatalog: AffiliateProduct[] = [
  // Foder
  {
    id: 'foder-premium',
    name: 'Granngården Premium Hönsfoder',
    description: 'Ekologiskt hönsfoder med optimal kalcium- och proteinhalt för maximal äggproduktion.',
    price: '189 kr / 15 kg',
    image: '🌾',
    affiliateUrl: '#',
    category: 'foder',
    reason: 'Baserat på din förbrukning',
    badge: 'Populärast',
  },
  {
    id: 'foder-vinter',
    name: 'Vinterblandning Extra Energi',
    description: 'Hög fetthalt för kalla vintermånader. Hjälper dina hönor hålla värmen.',
    price: '219 kr / 10 kg',
    image: '❄️',
    affiliateUrl: '#',
    category: 'foder',
    reason: 'Rekommenderat för säsongen',
  },
  {
    id: 'kalcium-skal',
    name: 'Ostronskal Kalciumtillskott',
    description: 'Starkare äggskal och friskare höns. Fri utfodring vid sidan av vanligt foder.',
    price: '79 kr / 2 kg',
    image: '🦪',
    affiliateUrl: '#',
    category: 'foder',
    reason: 'Förbättrar äggskalskvalitén',
  },
  // Hälsa
  {
    id: 'avmask-flubenol',
    name: 'Flubenol Avmaskningsmedel',
    description: 'Licensfritt avmaskningsmedel för höns. Enkel dosering i fodret.',
    price: '149 kr',
    image: '💊',
    affiliateUrl: '#',
    category: 'hälsa',
    reason: 'Dags för avmaskning snart',
    badge: 'Viktigt',
  },
  {
    id: 'kvalster-pulver',
    name: 'Diatom Kvalsterpulver',
    description: 'Naturligt skydd mot kvalster och löss. Strö i hönshuset regelbundet.',
    price: '99 kr / 1 kg',
    image: '🛡️',
    affiliateUrl: '#',
    category: 'hälsa',
    reason: 'Förebygg kvalster i hönshuset',
  },
  // Utrustning
  {
    id: 'auto-lucka',
    name: 'Automatisk Hönslucka',
    description: 'Öppnar och stänger baserat på ljus. Slipp oroa dig för räven!',
    price: '1 490 kr',
    image: '🚪',
    affiliateUrl: '#',
    category: 'utrustning',
    reason: 'Spara tid varje dag',
    badge: 'Favorit',
  },
  {
    id: 'varme-vatten',
    name: 'Värmeplatta Vattenskål',
    description: 'Hindrar vattnet från att frysa. Termostatreglerad, energisnål.',
    price: '349 kr',
    image: '🔥',
    affiliateUrl: '#',
    category: 'utrustning',
    reason: 'Perfekt för vintern',
  },
  // Kläckning
  {
    id: 'klackmaskin',
    name: 'Brinsea Mini II Kläckmaskin',
    description: 'Automatisk vändning och temperaturkontroll. Plats för 7 ägg.',
    price: '2 490 kr',
    image: '🐣',
    affiliateUrl: '#',
    category: 'kläckning',
    reason: 'Perfekt för nybörjare',
  },
  {
    id: 'lyslampa',
    name: 'Ägglampa / Candling Light',
    description: 'Kontrollera embryots utveckling under ruvningen. LED, stark och smidig.',
    price: '129 kr',
    image: '🔦',
    affiliateUrl: '#',
    category: 'kläckning',
    reason: 'Kläckningssäsongen närmar sig',
  },
  // Böcker
  {
    id: 'bok-hons',
    name: 'Boken om Höns – Allt du behöver veta',
    description: 'Komplett guide till hönsägande. Raser, skötsel, hälsa och äggproduktion.',
    price: '249 kr',
    image: '📖',
    affiliateUrl: '#',
    category: 'böcker',
    reason: 'Bästsäljare bland hönsägare',
  },
];

interface FarmSignals {
  henCount?: number;
  eggAverage?: number;
  season?: 'spring' | 'summer' | 'autumn' | 'winter';
  hasHatching?: boolean;
  feedCostHigh?: boolean;
  isPremium?: boolean;
}

function getSmartRecommendations(signals: FarmSignals): AffiliateProduct[] {
  const month = new Date().getMonth();
  const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';

  const picks: AffiliateProduct[] = [];

  // Always recommend based on season
  if (season === 'winter') {
    picks.push(productCatalog.find(p => p.id === 'foder-vinter')!);
    picks.push(productCatalog.find(p => p.id === 'varme-vatten')!);
  }
  if (season === 'spring') {
    picks.push(productCatalog.find(p => p.id === 'klackmaskin')!);
    picks.push(productCatalog.find(p => p.id === 'kvalster-pulver')!);
  }
  if (season === 'summer') {
    picks.push(productCatalog.find(p => p.id === 'kvalster-pulver')!);
    picks.push(productCatalog.find(p => p.id === 'kalcium-skal')!);
  }
  if (season === 'autumn') {
    picks.push(productCatalog.find(p => p.id === 'foder-premium')!);
    picks.push(productCatalog.find(p => p.id === 'avmask-flubenol')!);
  }

  // Always push the automatic door – high value
  if (!picks.find(p => p.id === 'auto-lucka')) {
    picks.push(productCatalog.find(p => p.id === 'auto-lucka')!);
  }

  // Cap at 3 for widget, 6 for full page
  return picks.filter(Boolean).slice(0, 6);
}

// Compact widget for daily summary / dashboard
export function AffiliateWidget({ maxItems = 2 }: { maxItems?: number }) {
  const picks = getSmartRecommendations({});

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <ShoppingBag className="h-3.5 w-3.5 text-accent" />
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rekommenderat för dig</span>
      </div>
      {picks.slice(0, maxItems).map((product) => (
        <a
          key={product.id}
          href={product.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors group"
        >
          <span className="text-xl shrink-0">{product.image}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
            <p className="text-[10px] text-muted-foreground">{product.price}</p>
          </div>
          <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </a>
      ))}
    </div>
  );
}

// Premium upsell banner – used in daily summary and dashboard
export function PremiumUpsellBanner({ variant = 'compact' }: { variant?: 'compact' | 'full' }) {
  const navigate = useNavigate();

  if (variant === 'compact') {
    return (
      <button
        onClick={() => navigate('/app/premium')}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-warning/10 border border-primary/20 hover:border-primary/40 transition-all group"
      >
        <div className="w-8 h-8 rounded-lg bg-warning/15 flex items-center justify-center shrink-0">
          <Crown className="h-4 w-4 text-warning" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-semibold text-foreground">Lås upp hela potentialen</p>
          <p className="text-[10px] text-muted-foreground">Premium från bara 19 kr/mån</p>
        </div>
        <Sparkles className="h-4 w-4 text-warning group-hover:scale-110 transition-transform shrink-0" />
      </button>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/30 shadow-md bg-gradient-to-br from-card via-card to-primary/5">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-warning/20 to-primary/20 flex items-center justify-center shrink-0">
            <Crown className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-serif text-lg text-foreground mb-1">Din hönsgård förtjänar mer</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Med Premium får du smarta prognoser, avmaskningspåminnelser, kostnad per ägg och mycket mer.
            </p>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full font-medium">
                ✓ Sju dagar gratis
              </span>
              <span className="text-xs text-muted-foreground">sedan 19 kr/mån</span>
            </div>
            <Button
              onClick={() => navigate('/app/premium')}
              size="sm"
              className="gap-1.5 active:scale-95 transition-transform shadow-[0_2px_8px_0_hsl(var(--primary)/0.2)]"
            >
              <Crown className="h-3.5 w-3.5" />
              Prova Premium gratis
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Full affiliate page/section
export default function AffiliateRecommendations() {
  const picks = getSmartRecommendations({});

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ShoppingBag className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-lg text-foreground">Utvalt för din gård</h2>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Produkter baserade på din gårds behov och årstid. Vi kan få ersättning vid köp.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {picks.map((product) => (
          <a
            key={product.id}
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="h-full border-border hover:border-primary/30 hover:shadow-md transition-all group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{product.image}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                      {product.badge && (
                        <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                          {product.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{product.price}</span>
                      <span className="text-[10px] text-accent font-medium flex items-center gap-1">
                        {product.reason}
                        <ExternalLink className="h-2.5 w-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground text-center pt-2">
        * Affiliatelänkar – vi kan få en liten ersättning vid köp, utan extra kostnad för dig.
      </p>
    </div>
  );
}
