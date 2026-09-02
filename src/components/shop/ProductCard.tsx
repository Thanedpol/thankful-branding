import Image from "next/image";
import Link from "next/link";
import { billingSuffix, discountPercent, formatPrice, isSoldOut } from "@/lib/shop";
import type { ShopProduct } from "@/lib/types";

export default function ProductCard({ product }: { product: ShopProduct }) {
  const soldOut = isSoldOut(product);
  const off = discountPercent(product);
  const external = product.external_url;

  const inner = (
    <>
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden">
        {product.cover_image_url ? (
          <Image
            src={product.cover_image_url}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-grid-faint bg-grid" />
        )}
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-md border border-cyan/40 bg-cyan/15 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-cyan">
            {product.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 top-3 rounded-md border border-line/20 bg-space/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
            สินค้าหมด
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-lg font-bold leading-snug transition-colors group-hover:text-cyan">
          {product.title}
        </h3>
        {product.tagline && (
          <p className="mt-2 line-clamp-2 text-sm text-muted">{product.tagline}</p>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-2 gap-y-1 pt-4">
          <span className="font-display text-xl font-bold text-ink">
            {formatPrice(product.price, product.currency)}
            <span className="text-sm font-normal text-muted">
              {billingSuffix(product.billing)}
            </span>
          </span>
          {!!product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-sm text-muted line-through">
              {formatPrice(product.compare_at_price, product.currency)}
            </span>
          )}
          {off !== null && (
            <span className="rounded-md border border-cyan/40 bg-cyan/10 px-1.5 py-0.5 font-mono text-[10px] text-cyan">
              -{off}%
            </span>
          )}
        </div>
      </div>
    </>
  );

  const className = "glass glass-hover group flex h-full flex-col overflow-hidden";

  if (external) {
    return (
      <a href={external} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={`/shop/${product.slug}`} className={className}>
      {inner}
    </Link>
  );
}
