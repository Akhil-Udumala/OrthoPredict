'use client';
import React from "react";
import { Button } from "@/components/ui/button";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { cn } from "@/lib/utils";
import { Activity, Bone, ChevronRight, HeartPulse, Menu, ShieldCheck, X } from "lucide-react";
import { useScroll, motion } from "motion/react";

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
};

function Link({ href, children, ...props }: LinkProps) {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
}

export function HeroSection() {
  return (
    <>
      <HeroHeader />
      <main className="overflow-x-hidden bg-[#061115] text-slate-50">
        <section className="bg-[#061115]">
          <div className="relative min-h-[760px] py-24 md:min-h-[780px] md:pb-24 lg:min-h-[calc(100svh-0.5rem)] lg:pb-24 lg:pt-40">
            <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-12">
              <div className="mx-auto max-w-lg pt-24 text-center lg:ml-0 lg:max-w-full lg:pt-28 lg:text-left">
                <h1 className="max-w-2xl text-balance text-5xl font-bold tracking-tight md:text-6xl xl:text-7xl">
                  Predict fracture healing time with guided intake
                </h1>
                <p className="mt-8 max-w-2xl text-balance text-lg leading-8 text-slate-300">
                  OrthoPredict estimates recovery windows from patient measurements,
                  fracture details, nutrition habits, and rehab activity.
                </p>

                <div className="mt-12 flex flex-col items-center justify-center gap-2 sm:flex-row lg:justify-start">
                  <Button asChild size="lg" className="h-12 rounded-full pl-5 pr-3 text-base">
                    <Link href="/login">
                      <span className="text-nowrap">Start prediction</span>
                      <ChevronRight className="ml-1" />
                    </Link>
                  </Button>
                  <Button
                    key={2}
                    asChild
                    size="lg"
                    variant="ghost"
                    className="h-12 rounded-full px-5 text-base text-slate-100 hover:bg-teal-300/10"
                  >
                    <Link href="#how-it-works">
                      <span className="text-nowrap">How it works</span>
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="min-h-[320px] lg:min-h-[560px]" aria-hidden="true" />
            </div>
            <div className="absolute inset-1 overflow-hidden rounded-3xl border border-teal-100/10 bg-[radial-gradient(circle_at_72%_42%,rgba(20,184,166,0.18),transparent_30%),linear-gradient(135deg,rgba(7,27,35,0.98),rgba(11,45,52,0.82))] lg:rounded-[3rem]">
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#061115]/95 to-transparent" />
              <div
                className="pointer-events-none absolute -right-12 bottom-4 top-[22rem] w-[118%] overflow-hidden opacity-90 sm:top-[20rem] lg:-right-6 lg:bottom-4 lg:top-20 lg:w-[62%] lg:opacity-95"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 9%, black 25%, black 68%, rgba(0,0,0,0.08) 88%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 9%, black 25%, black 68%, rgba(0,0,0,0.08) 88%, transparent 100%)",
                }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    WebkitMaskImage:
                      "radial-gradient(ellipse at center, black 0%, black 36%, rgba(0,0,0,0.5) 60%, transparent 82%)",
                    maskImage:
                      "radial-gradient(ellipse at center, black 0%, black 36%, rgba(0,0,0,0.5) 60%, transparent 82%)",
                  }}
                >
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    aria-label="Human skeleton recovery visualization"
                    className="h-full w-full object-contain mix-blend-screen brightness-110 contrast-105 saturate-0"
                    src="/skeleton.mp4"
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-[62%] bg-gradient-to-r from-[#061115] via-[#061115]/88 to-transparent" />
            </div>
          </div>
        </section>
        <section className="bg-[#061115] pb-2">
          <div className="group relative m-auto max-w-7xl px-6">
            <div className="flex flex-col items-center md:flex-row">
              <div className="md:max-w-44 md:border-r md:pr-6">
                <p className="text-end text-sm">Built for clear recovery decisions</p>
              </div>
              <div className="relative py-6 md:w-[calc(100%-11rem)]">
                <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                  <LogoItem icon={<Bone className="h-5 w-5" />} label="Fracture Type" />
                  <LogoItem icon={<Activity className="h-5 w-5" />} label="Healing Window" />
                  <LogoItem icon={<HeartPulse className="h-5 w-5" />} label="Rehab Habits" />
                  <LogoItem icon={<ShieldCheck className="h-5 w-5" />} label="Advisory Use" />
                  <LogoItem icon={<Bone className="h-5 w-5" />} label="Patient Summary" />
                  <LogoItem icon={<Activity className="h-5 w-5" />} label="What-if Simulator" />
                </InfiniteSlider>

                <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#061115]"></div>
                <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#061115]"></div>
                <ProgressiveBlur
                  className="pointer-events-none absolute left-0 top-0 h-full w-20"
                  direction="left"
                  blurIntensity={1}
                />
                <ProgressiveBlur
                  className="pointer-events-none absolute right-0 top-0 h-full w-20"
                  direction="right"
                  blurIntensity={1}
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const menuItems = [
  { name: "Features", href: "#features" },
  { name: "Workflow", href: "#how-it-works" },
  { name: "Model", href: "#model" },
  { name: "About", href: "#about" },
];

const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollYProgress } = useScroll();

  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      setScrolled(latest > 0.05);
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  return (
    <header>
      <nav data-state={menuState && "active"} className="group fixed z-20 w-full pt-2">
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-3xl px-6 transition-all duration-300 lg:px-12",
            scrolled && "bg-[#0b1c22]/80 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.9)] backdrop-blur-2xl",
          )}
        >
          <motion.div
            key={1}
            className={cn(
              "relative flex flex-wrap items-center justify-between gap-6 py-3 duration-200 lg:gap-0 lg:py-6",
              scrolled && "lg:py-4",
            )}
          >
            <div className="flex w-full items-center justify-between gap-12 lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center space-x-2">
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="m-auto size-6 duration-200 group-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0" />
                <X className="absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200 group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100" />
              </button>

              <div className="hidden lg:block">
                <ul className="flex gap-8 text-sm">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="block text-slate-300 duration-150 hover:text-white"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-teal-100/10 bg-[#0b1c22] p-6 shadow-2xl shadow-black/30 group-data-[state=active]:block md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-4 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none lg:group-data-[state=active]:flex lg:bg-transparent">
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="block text-slate-300 duration-150 hover:text-white"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="border-teal-100/20 bg-teal-300/10 text-slate-100 hover:bg-teal-300/15"
                >
                  <Link href="#model">
                    <span>Model notes</span>
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link href="/login">
                    <span>Open app</span>
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </nav>
    </header>
  );
};

function LogoItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-slate-100">
      <span className="text-teal-300">{icon}</span>
      <span className="text-nowrap">{label}</span>
    </div>
  );
}

const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2 text-slate-50", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Bone className="h-5 w-5" />
      </span>
      <span className="text-base font-bold tracking-tight">OrthoPredict</span>
    </div>
  );
};
