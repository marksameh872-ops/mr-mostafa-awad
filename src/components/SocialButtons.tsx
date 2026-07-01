import { motion } from "framer-motion";
import { ArrowUpRight, Youtube, Facebook, Instagram, Send } from "lucide-react";
import type { ReactNode } from "react";

type Social = {
  name: string;
  href: string;
  bg: string;
  fg: string;
  icon: ReactNode;
};

// TikTok icon (inline SVG — lucide has no tiktok)
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M16.6 5.82s.51.5 0 0A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5c-1.42 0-2.6-1.16-2.6-2.6c0-1.72 1.66-3.05 3.37-2.51V9.66c-3.45-.46-6.47 2.22-6.47 5.64a5.72 5.72 0 0 0 11.44 0V9.01a7.33 7.33 0 0 0 4.25 1.36V7.3s-1.88.09-3.25-1.48Z" />
  </svg>
);

const socials: Social[] = [
  { name: "YouTube", href: "http://www.youtube.com/@MostafaAwad", bg: "#FF0000", fg: "#fff", icon: <Youtube className="h-5 w-5" /> },
  { name: "Facebook", href: "https://facebook.com/MrMostafaAwad", bg: "#1877F2", fg: "#fff", icon: <Facebook className="h-5 w-5" /> },
  { name: "TikTok", href: "https://vm.tiktok.com/ZMFV8eDsE", bg: "#000000", fg: "#fff", icon: <TikTokIcon /> },
  { name: "Instagram", href: "https://instagram.com/mistermostafaawad", bg: "linear-gradient(135deg,#F58529,#DD2A7B,#8134AF,#515BD4)", fg: "#fff", icon: <Instagram className="h-5 w-5" /> },
  { name: "Telegram", href: "https://t.me/mrmostafaawad", bg: "#229ED9", fg: "#fff", icon: <Send className="h-5 w-5" /> },
];

export function SocialButtons() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
      {socials.map((s, i) => (
        <motion.a
          key={s.name}
          href={s.href}
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`group flex items-center justify-between rounded-2xl px-5 py-3.5 shadow-soft transition ${s.name === "Telegram" ? "sm:col-span-2" : ""}`}
          style={{ background: s.bg, color: s.fg }}
        >
          <div className="flex items-center gap-3">
            <span className="grid place-items-center h-9 w-9 rounded-xl bg-white/15 backdrop-blur">
              {s.icon}
            </span>
            <span className="font-medium tracking-tight">{s.name}</span>
          </div>
          <ArrowUpRight className="h-5 w-5 opacity-70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </motion.a>
      ))}
    </div>
  );
}
