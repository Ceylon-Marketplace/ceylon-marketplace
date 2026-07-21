import Image from "next/image";
import Link from "next/link";

const PANEL_COPY: Record<"login" | "register", { title: string; body: string }> = {
  login: {
    title: "Pick up where you left off.",
    body: "Track your bids, saved finds, conversations, and listings in one place.",
  },
  register: {
    title: "Good finds. Great sellers. One marketplace.",
    body: "Discover pre-loved pieces, everyday essentials, and local businesses across Sri Lanka.",
  },
};

export function AuthShell({
  variant,
  footer,
  children,
  maxWidthClassName = "max-w-md",
}: {
  variant: "login" | "register";
  footer: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
}) {
  const panel = PANEL_COPY[variant];

  return (
    <main className="min-h-[100dvh] bg-white text-gray-950">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="flex min-w-0 flex-col px-5 py-5 sm:px-10 sm:py-7 lg:px-12 xl:px-20">
          <header className="flex min-h-10 items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-semibold tracking-[-0.02em] text-gray-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(232,76,61,0.9)]">
                C
              </span>
              <span className="text-lg">Ceylon Marketplace</span>
            </Link>

            <div className="hidden text-sm text-gray-600 sm:block">{footer}</div>
          </header>

          <div className="flex flex-1 items-center py-10 sm:py-14 lg:py-10">
            <div className={`mx-auto w-full ${maxWidthClassName}`}>{children}</div>
          </div>

          <div className="border-t border-gray-200 pt-5 text-center text-sm text-gray-600 sm:hidden">
            {footer}
          </div>
        </section>

        <aside className="relative m-3 hidden min-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-3xl bg-gray-900 lg:block">
          <Image
            src="/images/auth/marketplace-collection.jpg"
            alt="A camera, ceramic vase, trainers, woven bag, and wooden stool arranged as marketplace finds"
            fill
            sizes="(min-width: 1024px) 45vw, 0px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/5 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-8 text-white xl:p-12">
            <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.035em] xl:text-4xl">
              {panel.title}
            </h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80 xl:text-base">
              {panel.body}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
