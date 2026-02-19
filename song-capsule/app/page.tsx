'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Music, Clock, Send } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center sm:p-20 font-(--font-gloria)">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="flex flex-col items-center gap-8 max-w-2xl"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 bg-orange-200/50 rounded-full blur-xl"
          />
          <Music size={64} className="text-[var(--accent)] relative z-10" />
        </div>

        <h1 className="text-5xl sm:text-7xl font-bold bg-clip-text text-transparent bg-linear-to-r from-[#d97757] to-[#8c9b78] drop-shadow-sm">
          Song Capsule
        </h1>

        <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed">
          Send a song and a message to someone, <br />
          <span className="text-[var(--accent)] font-bold">locked</span> until the perfect moment.
        </p>

        <div className="flex gap-4 mt-8 flex-wrap justify-center">
          <Link href="/create">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-[#d97757] hover:bg-[#c0684b] text-white rounded-full text-xl font-bold shadow-lg transition-all flex items-center gap-2"
            >
              <Send size={24} />
              Create a Capsule
            </motion.button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-16 text-gray-500">
          <div className="flex flex-col items-center gap-2">
            <Music className="mb-2 text-[var(--accent)]" />
            <p>1. Pick a Song</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Clock className="mb-2 text-[var(--accent)]" />
            <p>2. Set a Date</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Send className="mb-2 text-[var(--accent)]" />
            <p>3. Send the Link</p>
          </div>
        </div>
      </motion.div>

      <footer className="absolute bottom-4 text-sm text-gray-600">
        <p>© {new Date().getFullYear()} Song Capsule</p>
      </footer>
    </div>
  );
}
