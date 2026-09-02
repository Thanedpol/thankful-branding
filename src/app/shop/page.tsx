import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/shop/ProductCard";
import { listPublishedProducts } from "@/lib/shop-queries";
import type { ShopProduct } from "@/lib/types";

// ISR like /blog: instant navigation from cache, refreshed at most once a
// minute so newly published products appear promptly.
export const revalidate = 60;

export const metadata = {
  title: "ร้านค้า — Thank Thanedpol",
  description: "สินค้าดิจิทัลและบริการจาก Thank Thanedpol",
};

export default async function ShopIndex() {
  const products = await listPublishedProducts();
  const digital = products.filter((p) => p.kind === "digital");
  const services = products.filter((p) => p.kind === "service");
  const split = digital.length > 0 && services.length > 0;

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-32">
        <div className="section-pad !py-0">
          <Reveal>
            <p className="eyebrow">// Shop</p>
            <h1 className="font-display text-4xl font-bold md:text-5xl text-gradient">
              ร้านค้า
            </h1>
            <p className="mt-4 max-w-2xl text-muted">
              สินค้าดิจิทัลและบริการที่ผมใช้ทำงานจริง ดาวน์โหลดได้ทันทีหลังชำระเงิน
            </p>
          </Reveal>

          <div className="pb-24">
            {products.length === 0 ? (
              <EmptyShop />
            ) : split ? (
              <>
                <Section title="สินค้าดิจิทัล" products={digital} />
                <Section title="บริการ" products={services} />
              </>
            ) : (
              <Grid products={products} className="mt-10" />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, products }: { title: string; products: ShopProduct[] }) {
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <Grid products={products} className="mt-6" />
    </section>
  );
}

function Grid({ products, className }: { products: ShopProduct[]; className?: string }) {
  return (
    <div className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${className ?? ""}`}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

function EmptyShop() {
  return (
    <div className="glass mt-10 p-12 text-center">
      <h2 className="font-display text-xl font-bold">ยังไม่มีสินค้าในร้าน</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        กำลังเตรียมของดีอยู่ แวะกลับมาดูใหม่อีกครั้งเร็ว ๆ นี้
      </p>
    </div>
  );
}
