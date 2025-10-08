"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const MOVIES = [
  { title: "Inception" },
  { title: "The Dark Knight" },
  { title: "Interstellar" },
  { title: "Parasite" },
  { title: "The Godfather" },
  { title: "Pulp Fiction" },
  { title: "Forrest Gump" },
  { title: "The Matrix" },
  { title: "Goodfellas" },
  { title: "Se7en" },
];

export default function MovieCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % MOVIES.length);
  };

  const handlePrev = () => {
    setActiveIndex(
      (prevIndex) => (prevIndex - 1 + MOVIES.length) % MOVIES.length
    );
  };

  const getCardPosition = (index: number) => {
    const offset = index - activeIndex;
    const total = MOVIES.length;

    // Handle wrapping for positive and negative offsets
    let normalizedOffset = offset;
    if (offset > total / 2) {
      normalizedOffset -= total;
    } else if (offset < -total / 2) {
      normalizedOffset += total;
    }

    if (normalizedOffset === 0) return "center";
    if (normalizedOffset === 1) return "right";
    if (normalizedOffset === -1) return "left";
    if (normalizedOffset === 2) return "farRight";
    if (normalizedOffset === -2) return "farLeft";
    
    // For cards further out, we determine if they are entering from 'preFarLeft' or 'preFarRight'
    // This is the key change to control their entry point
    if (normalizedOffset === -3) return "preFarLeft"; // When moving left, this will become farLeft
    if (normalizedOffset === 3) return "preFarRight"; // When moving right, this will become farRight

    return "hidden"; // Default for all other states
  };

  const cardVariants = {
    // New states for entry/exit
    preFarLeft: { x: "-600px", scale: 0.1, opacity: 0, zIndex: 0 }, // Starts far left, off-screen
    preFarRight: { x: "600px", scale: 0.1, opacity: 0, zIndex: 0 }, // Starts far right, off-screen
    
    center: { x: 0, scale: 1, zIndex: 5, opacity: 1 },
    left: { x: "-150px", scale: 0.8, zIndex: 3, opacity: 1 },
    right: { x: "150px", scale: 0.8, zIndex: 3, opacity: 1 },
    farLeft: { x: "-300px", scale: 0.6, zIndex: 1, opacity: 1},
    farRight: { x: "300px", scale: 0.6, zIndex: 1, opacity: 1},
    hidden: { scale: 0, opacity: 0, zIndex: 0, x: 0 }, // Default hidden state
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      <div className="flex w-full h-auto py-6 font-bold text-xl justify-center items-center">
        FlickPick
      </div>

      <div className="relative flex-1 flex justify-center items-center">
        <div className="relative h-[400px] w-full">
          <AnimatePresence initial={false}> {/* initial={false} prevents initial animation on mount */}
            {MOVIES.map((movie, index) => {
              const position = getCardPosition(index);
              
              // Only render visible cards to optimize performance and prevent unnecessary DOM elements
              if (position === "hidden") return null;

              return (
                <motion.div
                  key={movie.title}
                  className="absolute top-0 left-0 right-0 mx-auto h-[400px] w-[280px] rounded-3xl bg-neutral-800 border border-neutral-700 flex justify-center items-center text-2xl font-semibold"
                  variants={cardVariants}
                  initial={position === "farLeft" ? "preFarRight" : position === "farRight" ? "preFarLeft" : position === "preFarLeft" ? "preFarLeft" : position === "preFarRight" ? "preFarRight" : "hidden"} // This is the crucial part for initial entry point
                  animate={position}
                  exit={
                    (position === "farLeft" || position === "preFarLeft") ? "preFarLeft" : 
                    (position === "farRight" || position === "preFarRight") ? "preFarRight" : 
                    "hidden" // Default exit to hidden
                  }
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  {movie.title}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex w-full h-auto mt-auto py-10 justify-center items-center space-x-5">
        <button
          onClick={handlePrev}
          className="px-6 py-3 bg-neutral-700 rounded-full text-lg font-bold hover:bg-neutral-600 transition-colors"
        >
          Previous
        </button>
        <div className="w-18 h-12 bg-gray-100 rounded-[14px]"></div>

        <div className="w-18 h-12 bg-gray-100 rounded-[14px]"></div> 
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-neutral-700 rounded-full text-lg font-bold hover:bg-neutral-600 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}