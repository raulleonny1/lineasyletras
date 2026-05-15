"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function AtmosphericBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <motion.div className="absolute inset-0 bg-carbon" />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(92,26,46,0.35),transparent_55%)]"
        animate={{ opacity: [0.45, 0.7, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(26,37,56,0.8),transparent_40%)]"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(240,237,232,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(240,237,232,0.03)_1px,transparent_1px)] [background-size:64px_64px]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-carbon via-carbon/80 to-transparent" />
      {Array.from({ length: 48 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute h-16 w-px bg-gradient-to-b from-transparent via-bone/20 to-transparent"
          style={{
            left: `${(index * 17) % 100}%`,
            top: `${(index * 11) % 100}%`,
          }}
          animate={{ y: [0, 120], opacity: [0, 0.5, 0] }}
          transition={{
            duration: 4 + (index % 5),
            repeat: Infinity,
            delay: index * 0.12,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
