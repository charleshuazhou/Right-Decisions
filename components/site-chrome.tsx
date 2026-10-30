"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", zh: "问策", en: "Ask" },
  { href: "/profile", zh: "生辰", en: "Profile" },
  { href: "/dates", zh: "择日", en: "Dates" },
  { href: "/history", zh: "记录", en: "History" },
  { href: "/review", zh: "复盘", en: "Review" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { locale, setLocale, tx } = useI18n();
  return (
    <header className="border-b border-border/80 bg-card/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="seal text-lg">衡</span>
          <span>
            <span className="font-serif block text-lg leading-none">问衡</span>
            <span className="text-muted-foreground text-xs tracking-wide">Wenheng</span>
          </span>
        </Link>
        <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-sm",
                pathname === link.href ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted",
              )}
            >
              {tx(link.zh, link.en)}
            </Link>
          ))}
        </nav>
        <Button variant="outline" size="sm" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>
          {locale === "zh" ? "EN" : "中"}
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const { tx } = useI18n();
  return (
    <footer className="text-muted-foreground mx-auto w-full max-w-5xl px-4 py-8 text-xs leading-5 sm:px-6">
      {tx(
        "问衡把卦象、命盘和你自己的条件放在一起，供反省和娱乐。它不是财务、医疗或法律建议，也不代替你做决定。",
        "Wenheng puts a hexagram, a chart, and your own constraints side by side, for reflection and entertainment. It is not financial, medical, or legal advice, and it does not make the decision for you.",
      )}
    </footer>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">{children}</div>;
}
