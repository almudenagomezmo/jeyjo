"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Input } from "@/components/ui/Input";
import { SearchIcon } from "@/components/ui/icons";
import {
  countSuggestOptions,
  SearchSuggestPanel,
} from "@/components/layout/SearchSuggestPanel";
import { MIN_QUERY_LENGTH, usePredictiveSearch } from "@/lib/hooks/usePredictiveSearch";
import { useUiStore } from "@/lib/store/ui-store";
import { useHydrated } from "@/lib/hooks/useHydrated";

export function SearchBar() {
  const router = useRouter();
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();
  const priceMode = useUiStore((s) => s.priceMode);
  const mode = hydrated ? priceMode : "b2c";

  const trimmed = query.trim();
  const showResults = open && trimmed.length >= MIN_QUERY_LENGTH;
  const { loading, error, data } = usePredictiveSearch(query);

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];
  const optionCount = countSuggestOptions(products, categories);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, products.length, categories.length]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const submit = () => {
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setOpen(false);
  };

  const navigateActive = () => {
    if (activeIndex < 0 || !data) return;
    let i = 0;
    for (const c of categories) {
      if (i === activeIndex) {
        router.push(c.href);
        setOpen(false);
        return;
      }
      i += 1;
    }
    for (const p of products) {
      if (i === activeIndex) {
        router.push(p.href);
        setOpen(false);
        return;
      }
      i += 1;
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (activeIndex >= 0 && showResults) {
        e.preventDefault();
        navigateActive();
      } else {
        submit();
      }
      return;
    }

    if (!showResults || optionCount === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? optionCount - 1 : prev - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const activeDescendant =
    activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Busca por nombre, referencia o EAN…"
        iconStart={<SearchIcon size={16} />}
        className="h-11"
        role="combobox"
        aria-expanded={showResults}
        aria-controls={showResults ? listboxId : undefined}
        aria-activedescendant={activeDescendant}
        aria-autocomplete="list"
        aria-label="Buscar productos"
      />

      {showResults && (
        <div
          id={listboxId}
          className="animate-fade-up absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[70vh] overflow-auto rounded-lg border border-border bg-surface shadow-xl"
        >
          <SearchSuggestPanel
            query={trimmed}
            products={products}
            categories={categories}
            loading={loading}
            error={error}
            priceMode={mode}
            activeIndex={activeIndex}
            onSelect={() => setOpen(false)}
            onViewAll={submit}
            optionIdPrefix={listboxId}
          />
        </div>
      )}
    </div>
  );
}
