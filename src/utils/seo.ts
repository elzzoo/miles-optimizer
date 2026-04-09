export interface SeoMeta {
  title: string;
  description: string;
  canonicalUrl?: string;
  ogImage?: string;
}

const BASE_URL = "https://miles-optimizer-next.onrender.com";
const DEFAULT_OG = `${BASE_URL}/og-image.png`;

export function buildMeta(meta: Partial<SeoMeta> & { title: string }): SeoMeta {
  return {
    title:       `${meta.title} | Miles Optimizer`,
    description: meta.description ?? "Comparez les prix cash et miles pour trouver les meilleurs vols. Gratuit, sans inscription.",
    canonicalUrl: meta.canonicalUrl ? `${BASE_URL}${meta.canonicalUrl}` : undefined,
    ogImage:      meta.ogImage ?? DEFAULT_OG,
  };
}

export const defaultMeta: SeoMeta = {
  title:       "Miles Optimizer — Comparez cash vs miles",
  description: "Trouvez les meilleurs vols en cash ou en miles. Comparez 19 programmes de fidélité instantanément. Gratuit.",
  canonicalUrl: BASE_URL,
  ogImage:      DEFAULT_OG,
};
