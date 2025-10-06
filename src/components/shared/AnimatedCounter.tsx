"use client";

import { motion, useInView, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  from?: number;
  to: number;
  animationOptions?: any;
  className?: string;
  prefix?: string;
  postfix?: string;
}

// Custom animate function to avoid Framer Motion's hook rules
const animate = (from: number, to: number, options: any) => {
    const controller = {
        stop: () => {},
    };
    const startTime = performance.now();
    const tick = (currentTime: number) => {
        let progress = (currentTime - startTime) / (options.duration * 1000);
        if (progress > 1) progress = 1;
        const currentValue = from + (to - from) * progress;
        options.onUpdate(currentValue);
        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };
    requestAnimationFrame(tick);
    return controller;
  }

function Counter({
  from,
  to,
  options,
}: {
  from: number;
  to: number;
  options?: any;
}) {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    const control = animate(from, to, {
      duration: 1.5,
      ...options,
      onUpdate(value: number) {
        node.textContent = Math.round(value).toLocaleString();
      },
    });

    return () => control.stop();
  }, [from, to, options]);

  return <span ref={nodeRef} />;
}


export function AnimatedCounter({
  from = 0,
  to,
  animationOptions,
  className,
  prefix,
  postfix,
}: AnimatedCounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({
        y: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 20,
          damping: 10,
        },
      });
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial={{ y: 20, opacity: 0 }}
      animate={controls}
      className={className}
    >
      {prefix}
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.2 }}
      >
        <Counter from={from} to={to} options={animationOptions} />
      </motion.span>
      {postfix}
    </motion.div>
  );
}