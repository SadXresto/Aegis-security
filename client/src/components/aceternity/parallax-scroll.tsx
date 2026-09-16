// Aceternity UI — Parallax Scroll (https://ui.aceternity.com/components/parallax-scroll)
// Adapted for the Aegis landing: accepts React nodes instead of image URLs so the
// "How it works" steps can be rendered as content cards, and tracks page scroll.
"use client";
import { useScroll, useTransform, motion } from "framer-motion";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export const ParallaxScroll = ({
  cards,
  className,
}: {
  cards: ReactNode[];
  className?: string;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: gridRef,
    offset: ["start end", "end start"],
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -120]);

  const third = Math.ceil(cards.length / 3);

  const firstPart = cards.slice(0, third);
  const secondPart = cards.slice(third, 2 * third);
  const thirdPart = cards.slice(2 * third);

  return (
    <div className={cn("items-start w-full", className)} ref={gridRef}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start max-w-5xl mx-auto gap-10 py-10 px-4 md:px-10">
        <div className="grid gap-10">
          {firstPart.map((card, idx) => (
            <motion.div
              style={{ y: translateFirst }} // Apply the translateY motion value here
              key={"grid-1" + idx}
            >
              {card}
            </motion.div>
          ))}
        </div>
        <div className="grid gap-10">
          {secondPart.map((card, idx) => (
            <motion.div style={{ y: translateSecond }} key={"grid-2" + idx}>
              {card}
            </motion.div>
          ))}
        </div>
        <div className="grid gap-10">
          {thirdPart.map((card, idx) => (
            <motion.div style={{ y: translateThird }} key={"grid-3" + idx}>
              {card}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
