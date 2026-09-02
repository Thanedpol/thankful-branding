import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BuyPanel from "@/components/shop/BuyPanel";
import { getProductBySlug } from "@/lib/shop-queries";
import {
  billingLabel,
  billingSuffix,
  discountPercent,
  formatPrice,
  isBuyable,
  isSoldOut,
} from "@/lib/shop";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "ไม่พบสินค้า — Thank Thanedpol" };
  const description =
    p.tagline ?? p.description?.replace(/<[^>]*>/g, "").trim().slice(0, 200) ?? undefined;
  return {
    title: `${p.title} — ร้านค้า | Thank Thanedpol`,
    description,
    alternates: { canonical: `/shop/${slug}` },
    openGraph: {
      title: p.title,
      description,
      type: "website",
      url: `/shop/${slug}`,
      siteName: "Thank Thanedpol",
      locale: "th_TH",
      images: p.cover_image_url ? [p.cover_image_url] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: p.title,
      description,
      images: p.cover_image_url ? [p.cover_image_url] : undefined,
    },
  };
}

export default async function ShopProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ canceled?: string }>;
}) {
  const [{ slug }, { canceled }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const soldOut = isSoldOut(product);
  const buyable = isBuyable(product);
  const off = discountPercent(product);
  const images = [product.cover_image_url, ...product.gallery].filter(
    (u): u is string => !!u
  );

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="mx-auto max-w-6xl px-6 pb-24">
          <Link
            href="/shop"
            className="font-mono text-xs uppercase tracking-wider text-cyan hover:text-ink"
          >
            ← กลับไปหน้าร้านค้า
          </Link>

          {canceled === "1" && (
            <div className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
              ยกเลิกการชำระเงิน — ยังไม่มีการเรียกเก็บเงินใด ๆ
              สั่งซื้อใหม่ได้ทุกเมื่อด้านล่าง
            </div>
          )}

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
            <div className="min-w-0">
              {images.length > 0 && (
                <div className="space-y-3">
                  <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 768px"
                      priority
                    />
                  </div>
                  {images.length > 1 && (
                    <div className="grid grid-cols-4 gap-3">
                      {images.slice(1).map((src) => (
                        <div
                          key={src}
                          className="relative aspect-square overflow-hidden rounded-xl"
                        >
                          <Image
                            src={src}
                            alt={product.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 25vw, 180px"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-2">
                {product.badge && <span className="tag">{product.badge}</span>}
                <span className="tag">
                  {product.kind === "digital" ? "สินค้าดิจิทัล" : "บริการ"}
                </span>
                {soldOut && (
                  <span className="tag !border-line/20 !text-muted">สินค้าหมด</span>
                )}
              </div>

              <h1 className="mt-4 font-display text-3xl font-bold md:text-4xl">
                {product.title}
              </h1>
              {product.tagline && (
                <p className="mt-3 text-lg leading-relaxed text-muted">
                  {product.tagline}
                </p>
              )}

              {product.description && (
                <div
                  className="prose-cyber mt-10"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {product.features.length > 0 && (
                <ul className="mt-10 space-y-2.5">
                  {product.features.map((f) => (
                    <li key={f} className="flex gap-3 text-sm text-ink/90">
                      <span className="mt-0.5 shrink-0 text-cyan" aria-hidden>
                        ✓
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="lg:sticky lg:top-28 lg:self-start">
              {buyable ? (
                <BuyPanel product={product} />
              ) : (
                <div className="glass space-y-4 p-6">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-display text-3xl font-bold text-ink">
                      {formatPrice(product.price, product.currency)}
                    </span>
                    <span className="text-sm text-muted">
                      {billingSuffix(product.billing)}
                    </span>
                    {!!product.compare_at_price &&
                      product.compare_at_price > product.price && (
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
                  <p className="font-mono text-xs uppercase tracking-wider text-muted">
                    {billingLabel(product.billing)}
                  </p>

                  {product.external_url ? (
                    <a
                      href={product.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-neon w-full text-center"
                    >
                      สั่งซื้อที่ร้านค้าภายนอก →
                    </a>
                  ) : (
                    <button type="button" disabled className="btn-ghost w-full">
                      {soldOut ? "สินค้าหมด" : "ยังไม่เปิดขาย"}
                    </button>
                  )}
                </div>
              )}

              {product.delivery_note && (
                <p className="mt-4 rounded-lg border border-line/10 bg-surface/[0.03] px-4 py-3 text-sm text-muted">
                  {product.delivery_note}
                </p>
              )}
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
