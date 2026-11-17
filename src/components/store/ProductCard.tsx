import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import { formatDZD } from "@/lib/format";

export type ProductSummary = {
  id: string;
  name_ar: string;
  name_fr: string | null;
  name_en: string | null;
  price: number;
  compare_at_price: number | null;
  images: string[];
};

export function ProductCard({ product, index = 0 }: { product: ProductSummary; index?: number }) {
  const { pick, lang } = useI18n();
  const img = product.images?.[0];
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group block animate-rise-in"
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <div className="relative aspect-[4/5] overflow-hidden arch bg-sand shadow-soft transition-shadow duration-500 group-hover:shadow-lift">
        {img && (
          <img
            src={img}
            alt={pick(product, "name")}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}
        {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
          <span className="absolute top-6 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 rounded-full bg-card/90 px-3 py-1 text-xs font-medium text-primary">
            −{Math.round((1 - Number(product.price) / Number(product.compare_at_price)) * 100)}%
          </span>
        )}
      </div>
      <div className="mt-4 text-center">
        <h3 className="font-display text-xl text-foreground transition-colors group-hover:text-primary">{pick(product, "name")}</h3>
        <p className="mt-1 text-sm">
          <span className="font-semibold text-primary">{formatDZD(product.price, lang)}</span>
          {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
            <span className="ms-2 text-muted-foreground line-through">{formatDZD(product.compare_at_price, lang)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
