"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { SITE_CTA, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { AtmosphericBackground } from "@/components/hero/atmospheric-background";

export function CinematicHero() {
  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-4 py-20 sm:px-6 sm:py-24">
      <AtmosphericBackground />
      <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="mb-8"
        >
          <BrandMark variant="hero" priority />
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6 text-xs uppercase tracking-[0.35em] text-bone/50"
        >
          {SITE_NAME}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1 }}
          className="text-balance text-4xl font-light leading-[1.05] text-bone sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {SITE_TAGLINE}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="mt-8 max-w-2xl text-balance text-base leading-relaxed text-bone/70 sm:text-lg"
        >
          Un sistema de archivos clasificados donde cada registro es una pieza de una
          realidad oculta.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-12 flex w-full justify-center sm:w-auto"
        >
          <Button asChild size="lg" className="w-full rounded-full px-8 sm:min-w-56 sm:w-auto">
            <Link href="/archive">{SITE_CTA}</Link>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 1 }}
          className="mt-20 text-bone/40"
        >
          <ArrowDown className="mx-auto h-5 w-5 animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
