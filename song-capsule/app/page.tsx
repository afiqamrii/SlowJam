'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Clock, Send, Heart, Headphones, Gift, Camera } from "lucide-react";
import SplitText from "./components/SplitText";
import CurvedLoop from "./components/CurvedLoop";
// Heart is kept for the feelings section

const steps = [
  { icon: Music, label: "Pick a Song", desc: "Search from millions of tracks on Spotify" },
  { icon: Clock, label: "Set a Date", desc: "Lock it until the perfect moment arrives" },
  { icon: Send, label: "Send the Link", desc: "Share it — they'll feel it when it opens" },
  { icon: Camera, label: "Save a Polaroid", desc: "Export a beautiful aesthetic card for your stories" },
];

const feelings = [
  { icon: Heart, label: "Love", color: "#d97757" },
  { icon: Headphones, label: "Nostalgia", color: "#8c9b78" },
  { icon: Gift, label: "Surprise", color: "#c4a77d" },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-screen overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] w-full px-6 text-center pb-20">
        {/* Ambient blobs */}
        <motion.div
          animate={{ scale: [1, 1.12, 1], rotate: [0, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-16 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: "radial-gradient(circle, #d97757, transparent)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1], rotate: [0, -10, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-24 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: "radial-gradient(circle, #8c9b78, transparent)" }}
        />

        {/* Spinning vinyl ring */}
        <motion.div
          className="relative mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 rounded-full border-4 border-dashed opacity-40"
            style={{ borderColor: "#d97757" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Music size={40} className="text-accent" />
          </div>
        </motion.div>

        {/* Title with SplitText */}
        <div className="mb-4 px-2 py-2">
          <SplitText
            text="Song Capsule"
            tag="h1"
            className="text-4xl sm:text-6xl lg:text-8xl font-bold py-10 leading-tight"
            style={{
              backgroundImage: "linear-gradient(135deg, #d97757 0%, #c4a77d 50%, #8c9b78 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            delay={55}
            duration={1.1}
            ease="easeOut"
            splitType="chars"
            from={{ opacity: 0, y: 50 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.2}
          />
        </div>

        {/* Subtitle with word-split */}
        <div className="mb-10 max-w-xl px-4">
          <SplitText
            text="Send a song. Lock it in time. Let it open when it matters most."
            tag="p"
            className="text-base sm:text-xl lg:text-2xl text-gray-500 leading-relaxed"
            delay={35}
            duration={0.9}
            ease="easeOut"
            splitType="words"
            from={{ opacity: 0, y: 24 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.15}
          />
        </div>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.9, ease: "easeOut" }}
        >
          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 12px 40px rgba(217,119,87,0.45)" }}
              whileTap={{ scale: 0.95 }}
              className="px-9 py-4 bg-[#d97757] hover:bg-[#c0684b] text-white rounded-full text-lg font-bold shadow-lg transition-colors flex items-center gap-2"
            >
              <Send size={20} />
              Create a Capsule
            </motion.button>
          </Link>
          <Link href="/browse">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-9 py-4 border-2 rounded-full text-lg font-bold transition-colors flex items-center gap-2"
              style={{ borderColor: "#d97757", color: "#d97757", background: "transparent" }}
            >
              <Music size={20} />
              Browse Capsules
            </motion.button>
          </Link>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-80"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-xs text-accent tracking-widest uppercase font-bold">Scroll</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
            <path
              d="M8 0v20M1 13l7 8 7-8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
            />
          </svg>
        </motion.div>
      </section>

      {/* ── CURVED MARQUEE ── */}
      <section className="w-full py-8 overflow-hidden" style={{ minHeight: "160px" }}>
        <CurvedLoop
          marqueeText="Song Capsule ✦ Lock a memory ✦ Send with love ✦ Open when ready ✦ "
          speed={1.5}
          curveAmount={220}
          direction="left"
          interactive={true}
          className="text-[5rem] font-bold uppercase fill-[#d97757] opacity-15"
        />
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="w-full max-w-5xl px-6 py-24">
        <div className="text-center mb-14">
          <SplitText
            text="How it works"
            tag="h2"
            className="text-4xl sm:text-5xl font-bold text-foreground"
            delay={60}
            duration={1.0}
            ease="easeOut"
            splitType="chars"
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.2}
          />
          <motion.p
            className="mt-3 text-gray-500 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          >
            Three simple steps to send a moment that lasts forever.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {steps.map(({ icon: Icon, label, desc }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
              whileHover={{ y: -6, boxShadow: "0 20px 50px rgba(0,0,0,0.08)" }}
              className="flex flex-col items-center gap-4 p-8 rounded-3xl text-center transition-shadow"
              style={{ background: "rgba(255,255,255,0.7)", border: "1px solid var(--border)", backdropFilter: "blur(8px)" }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2"
                style={{ background: "rgba(217,119,87,0.12)" }}
              >
                <Icon size={28} className="text-accent" />
              </div>
              <span className="text-sm font-bold uppercase tracking-widest text-accent">Step {i + 1}</span>
              <h3 className="text-xl font-bold text-foreground">{label}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEELINGS / VIBES ── */}
      <section
        className="w-full py-20 px-6"
        style={{ background: "linear-gradient(135deg, rgba(217,119,87,0.07) 0%, rgba(140,155,120,0.07) 100%)" }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <SplitText
            text="A capsule for every feeling."
            tag="h2"
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            delay={45}
            duration={1.0}
            ease="easeOut"
            splitType="words"
            from={{ opacity: 0, y: 25 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.2}
          />
          <motion.p
            className="text-gray-500 mb-12 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            Whether it&apos;s love, nostalgia, or a surprise — there&apos;s always a song for it.
          </motion.p>

          <div className="flex flex-wrap gap-6 justify-center">
            {feelings.map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: i * 0.15, ease: "easeOut" }}
                whileHover={{ scale: 1.08, rotate: 1.5 }}
                className="flex items-center gap-3 px-7 py-4 rounded-full font-semibold text-lg cursor-default"
                style={{
                  background: `${color}18`,
                  border: `2px solid ${color}40`,
                  color: color,
                }}
              >
                <Icon size={22} />
                {label}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="w-full py-28 px-6 text-center">
        <div className="max-w-xl mx-auto">
          <SplitText
            text="Ready to send a moment?"
            tag="h2"
            className="text-3xl sm:text-5xl font-bold text-foreground mb-6"
            delay={50}
            duration={1.0}
            ease="easeOut"
            splitType="words"
            from={{ opacity: 0, y: 30 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.2}
          />
          <motion.p
            className="text-gray-500 mb-10 text-lg"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          >
            It takes less than a minute. The feeling lasts much longer.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          >
            <Link href="/create">
              <motion.button
                whileHover={{ scale: 1.06, boxShadow: "0 14px 45px rgba(217,119,87,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-5 bg-[#d97757] hover:bg-[#c0684b] text-white rounded-full text-xl font-bold shadow-lg transition-colors inline-flex items-center gap-3"
              >
                <Send size={22} />
                Create Your Capsule
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer is global via layout.tsx */}
    </div>
  );
}
