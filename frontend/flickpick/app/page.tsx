"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface MovieRecommendation {
  movie_id: number;
  movie_name: string;
  backdrop_path: string;
  cosine_score: number;
}

export default function MovieCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>(
    []
  );
  const [getNewRecommendations, setGetNewRecommendations] = useState(false);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % recommendations.length);
  };

  const handlePrev = () => {
    setActiveIndex(
      (prevIndex) =>
        (prevIndex - 1 + recommendations.length) % recommendations.length
    );
    
  };

  const getCardPosition = (index: number) => {
    const offset = index - activeIndex;
    const total = recommendations.length;

    // Normalize offset to smallest distance
    let normalizedOffset = offset;
    if (Math.abs(offset) > total / 2) {
      normalizedOffset = offset > 0 ? offset - total : offset + total;
    }

    if (normalizedOffset === 0) return "center";
    if (normalizedOffset === 1) return "right";
    if (normalizedOffset === -1) return "left";
    if (normalizedOffset === 2) return "farRight";
    if (normalizedOffset === -2) return "farLeft";

    // Entry positions for navigation
    if (normalizedOffset === -3) return "preFarLeft";
    if (normalizedOffset === 3) return "preFarRight";

    return "hidden";
  };

  const cardVariants = {
    preFarLeft: { x: "-600px", scale: 0.2, opacity: 0.1, zIndex: 2 }, // Elevated zIndex during entry
    preFarRight: { x: "600px", scale: 0.2, opacity: 0.1, zIndex: 2 }, // Elevated zIndex during entry

    center: { x: 0, scale: 1, zIndex: 5, opacity: 1 },
    left: { x: "-150px", scale: 0.8, zIndex: 3, opacity: 1 },
    right: { x: "150px", scale: 0.8, zIndex: 3, opacity: 1 },
    farLeft: { x: "-300px", scale: 0.6, zIndex: 1, opacity: 1 }, // Reduced to allow entry override if needed
    farRight: { x: "300px", scale: 0.6, zIndex: 1, opacity: 1 }, // Consistent with farLeft
    hidden: { scale: 0, opacity: 0, zIndex: 0, x: 0 },
  };

  async function getRecommendations() {
    try {
      let recommendations = await axios.get(
        "http://127.0.0.1:8000/generateRecommendations"
      );
      setRecommendations(recommendations.data);
    } catch (e) {
      console.error("Failed to fetch movies:", e);
    }
  }

  useEffect(() => {
    getRecommendations();
  }, [getNewRecommendations]);

  return (
    <div className="flex flex-col h-screen w-screen bg-black text-white overflow-hidden">
      <div className="flex w-full h-auto py-6 font-bold text-xl justify-center items-center">
        FlickPick
      </div>

      <div className="relative flex-1 flex justify-center items-center">
        <div className="relative h-[400px] w-full">
          <AnimatePresence initial={false}>
            {recommendations.map((movie, index) => {
              
              const position = getCardPosition(index);

              if (position === "hidden") return null;

              return (
                <motion.div
                  key={movie.movie_name}
                  className={`absolute top-0 left-0 right-0 mx-auto h-[400px] w-[280px] rounded-3xl bg-cover bg-center flex justify-center items-center text-2xl font-semibold`}
                  style={{
                    backgroundImage: `url(https://image.tmdb.org/t/p/w220_and_h330_face${movie.backdrop_path})`,
                  }}
                  variants={cardVariants}
                  initial={
                    position === "farLeft"
                      ? "preFarRight"
                      : position === "farRight"
                      ? "preFarLeft"
                      : position === "preFarLeft"
                      ? "preFarLeft"
                      : position === "preFarRight"
                      ? "preFarRight"
                      : "hidden"
                  }
                  animate={position}
                  exit={
                    position === "farLeft" || position === "preFarLeft"
                      ? "preFarLeft"
                      : position === "farRight" || position === "preFarRight"
                      ? "preFarRight"
                      : "hidden"
                  }
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                ></motion.div>
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
        <div
          className="w-18 h-12 bg-red-100 rounded-[14px]"
          onClick={() => {
            setGetNewRecommendations(!getNewRecommendations);
          }}

        >
          
        </div>

        <div className="flex justify-center items-center w-18 h-12 bg-gray-100 rounded-[14px]">
          <img className="shrink-0 w-auto h-6" src={"like-1-svgrepo-com.svg"}/>
        </div>
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