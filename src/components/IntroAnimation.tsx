import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setShow(false);
      setTimeout(onDone, 700);
    }, 2200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="intro"
          exit={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          onClick={() => { setShow(false); setTimeout(onDone, 500); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{
              opacity: [0, 1, 1, 1],
              scale: [0.85, 1.02, 1, 1],
              y: [30, 0, -8, -20],
              filter: [
                "blur(10px) drop-shadow(0 0 0 rgba(0,0,0,0))",
                "blur(0px) drop-shadow(0 0 40px oklch(0.62 0.19 250 / 0.5))",
                "blur(0px) drop-shadow(0 0 60px oklch(0.62 0.19 250 / 0.4))",
                "blur(0px) drop-shadow(0 0 20px oklch(0.62 0.19 250 / 0.2))",
              ],
            }}
            transition={{ duration: 2, times: [0, 0.35, 0.7, 1], ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <div
              dir="rtl"
              style={{ fontFamily: "var(--font-arabic)" }}
              className="text-6xl md:text-8xl font-bold text-navy dark:text-foreground"
            >
              مستر انجليزي
            </div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.6, 0.6] }}
              transition={{ duration: 2, times: [0, 0.5, 0.8, 1] }}
              className="mt-4 text-sm tracking-[0.4em] text-muted-foreground uppercase"
            >
              Mr English
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
