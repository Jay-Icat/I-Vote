"use client";

import { motion } from "framer-motion";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.02, filter: "blur(8px)" }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="flex-1 flex flex-col w-full h-full overflow-hidden"
    >
      {children}
    </motion.div>
  );
}
