'use client';
import { useReducedMotion, useInView, animate } from 'motion/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { once: true, amount: 0.08 });
  useEffect(() => {
    if (!visible || reduced || !ref.current) return;
    const animation = animate(
      ref.current,
      { opacity: [0, 1], transform: ['translateY(18px)', 'translateY(0px)'] },
      { duration: 0.45, delay },
    );
    return () => animation.stop();
  }, [visible, reduced, delay]);
  return (
    <div ref={ref} className={'reveal ' + (className ?? '')}>
      {children}
    </div>
  );
}
export function Counter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const visible = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [n, setN] = useState(value);
  useEffect(() => {
    if (!visible || reduced) return;
    const c = animate(0, value, { duration: 1, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [visible, value, reduced]);
  return <span ref={ref}>{n.toLocaleString('vi-VN')}</span>;
}
