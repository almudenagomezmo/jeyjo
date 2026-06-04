import { getNavigationTree } from "@/lib/catalog/fetch-navigation-tree";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export async function NavigationShell({ children }: { children: React.ReactNode }) {
  const tree = await getNavigationTree();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:shadow-lg"
      >
        Ir al contenido
      </a>
      <Header tree={tree} />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer tree={tree} />
    </>
  );
}
