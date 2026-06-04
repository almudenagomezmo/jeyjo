import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { ProductGlyph } from "@/components/ui/ProductGlyph";

export default function NotFound() {
  return (
    <Container className="grid min-h-[60vh] place-items-center py-12">
      <div className="max-w-md text-center">
        <div className="relative grid h-40 place-items-center">
          <div className="absolute inset-0 grid place-items-center opacity-15">
            <ProductGlyph kind="box" size={160} primary="var(--green-400)" secondary="var(--green-400)" />
          </div>
          <span className="relative text-8xl font-black tracking-tighter text-text-brand">404</span>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Esta página se nos ha perdido</h1>
        <p className="mt-2 text-text-secondary">
          Puede que el enlace haya caducado, esté mal escrito o que el producto ya no esté en
          catálogo.
        </p>
        <Button size="lg" className="mt-6" asChild>
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </Container>
  );
}
