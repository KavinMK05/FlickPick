"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

interface MovieRecommendation {
  movie_id: number;
  movie_name: string;
  backdrop_path: string;
  cosine_score: number;
}

interface WatchlistMovie {
  movie_id: number;
  movie_name: string;
  backdrop_path: string;
}

export default function MovieCarousel() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<MovieRecommendation[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"watchlist" | "watched">(
    "watchlist"
  );
  const [watchlistData, setWatchlistData] = useState<{
    movies: WatchlistMovie[];
    watched: WatchlistMovie[];
  }>({ movies: [], watched: [] });

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % recommendations.length);
  };

  const handlePrev = () => {
    setActiveIndex(
      (prevIndex) =>
        (prevIndex - 1 + recommendations.length) % recommendations.length
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("user_id");
    localStorage.removeItem("username");
    localStorage.removeItem("has_embedding");
    router.push("/login");
  };

  const handleLike = async () => {
    const userId = localStorage.getItem("user_id");
    const currentMovie = recommendations[activeIndex];
    if (!userId || !currentMovie) return;

    try {
      await axios.post("http://127.0.0.1:8000/updateEmbedding", {
        user_id: userId,
        movie_id: currentMovie.movie_id,
        action: "like",
      });
      localStorage.setItem("has_embedding", "true");
    } catch (e) {
      console.error("Failed to update embedding:", e);
    }
  };

  const handleDislike = async () => {
    const userId = localStorage.getItem("user_id");
    const currentMovie = recommendations[activeIndex];
    if (!userId || !currentMovie) return;

    try {
      await axios.post("http://127.0.0.1:8000/updateEmbedding", {
        user_id: userId,
        movie_id: currentMovie.movie_id,
        action: "dislike",
      });
      localStorage.setItem("has_embedding", "true");
      // Move to next movie
      handleNext();
    } catch (e) {
      console.error("Failed to update embedding:", e);
    }
  };

  const handleWatched = async () => {
    const userId = localStorage.getItem("user_id");
    const currentMovie = recommendations[activeIndex];
    if (!userId || !currentMovie) return;

    try {
      await axios.post("http://127.0.0.1:8000/markWatched", {
        user_id: userId,
        movie_id: currentMovie.movie_id,
      });
    } catch (e) {
      console.error("Failed to mark as watched:", e);
    }
  };

  const handleAddToWatchlist = async () => {
    const userId = localStorage.getItem("user_id");
    const currentMovie = recommendations[activeIndex];
    if (!userId || !currentMovie) return;

    try {
      await axios.post("http://127.0.0.1:8000/addToWatchlist", {
        user_id: userId,
        movie_id: currentMovie.movie_id,
      });
    } catch (e) {
      console.error("Failed to add to watchlist:", e);
    }
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

    return "hidden";
  };

  const cardVariants = {
    preFarLeft: { x: "-600px", scale: 0.2, opacity: 0, zIndex: 0 },
    preFarRight: { x: "600px", scale: 0.2, opacity: 0, zIndex: 0 },

    center: { x: 0, scale: 1, zIndex: 5, opacity: 1 },
    left: { x: "-150px", scale: 0.8, zIndex: 4, opacity: 1 },
    right: { x: "150px", scale: 0.8, zIndex: 4, opacity: 1 },
    farLeft: { x: "-300px", scale: 0.6, zIndex: 2, opacity: 1 },
    farRight: { x: "300px", scale: 0.6, zIndex: 2, opacity: 1 },
    hidden: { scale: 0, opacity: 0, zIndex: 0, x: 0 },
  };

  useEffect(() => {
    // Check for user session
    const userId = localStorage.getItem("user_id");
    const storedUsername = localStorage.getItem("username");

    if (!userId) {
      router.push("/login");
      return;
    }

    setUsername(storedUsername);

    // Fetch recommendations for user
    async function fetchRecommendations() {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/generateRecommendations?user_id=${userId}`
        );
        setRecommendations(response.data);
      } catch (e) {
        console.error("Failed to fetch movies:", e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white items-center justify-center">
        <div className="w-10 h-10 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
        <p className="mt-4 text-neutral-400 text-sm">Loading your picks...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-white overflow-hidden">
      {/* Header */}
      <div className="flex w-full h-auto py-4 px-6 justify-between items-center">
        <h1 className="text-xl font-bold text-white">FlickPick</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setSidebarOpen(true);
              const userId = localStorage.getItem("user_id");
              if (userId) {
                try {
                  const res = await axios.get(
                    `http://127.0.0.1:8000/getWatchlist?user_id=${userId}`
                  );
                  setWatchlistData(res.data);
                } catch (e) {
                  console.error("Failed to fetch watchlist:", e);
                }
              }
            }}
            className="p-2 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-300 hover:bg-neutral-800 transition-colors"
            title="My Watchlist"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
          <span className="text-neutral-400 text-sm">Hey, {username}</span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Watchlist Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            {/* Sidebar */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-neutral-900 border-l border-neutral-800 z-50 flex flex-col"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <h2 className="text-lg font-semibold">My Lists</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Tab Bar */}
              <div className="flex border-b border-neutral-800">
                <button
                  onClick={() => setSidebarTab("watchlist")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    sidebarTab === "watchlist"
                      ? "text-white border-b-2 border-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Watchlist ({watchlistData.movies.length})
                </button>
                <button
                  onClick={() => setSidebarTab("watched")}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    sidebarTab === "watched"
                      ? "text-white border-b-2 border-white"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  Watched ({watchlistData.watched.length})
                </button>
              </div>

              {/* Movie List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {(sidebarTab === "watchlist"
                  ? watchlistData.movies
                  : watchlistData.watched
                ).length === 0 ? (
                  <p className="text-neutral-500 text-sm text-center py-8">
                    {sidebarTab === "watchlist"
                      ? "No movies in your watchlist yet"
                      : "No watched movies yet"}
                  </p>
                ) : (
                  (sidebarTab === "watchlist"
                    ? watchlistData.movies
                    : watchlistData.watched
                  ).map((movie) => (
                    <div
                      key={movie.movie_id}
                      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                    >
                      <div
                        className="w-12 h-16 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{
                          backgroundImage: `url(https://image.tmdb.org/t/p/w92${movie.backdrop_path})`,
                        }}
                      />
                      <span className="text-sm font-medium truncate flex-1">
                        {movie.movie_name}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const userId = localStorage.getItem("user_id");
                          if (!userId) return;
                          try {
                            await axios.post(
                              "http://127.0.0.1:8000/removeFromList",
                              {
                                user_id: userId,
                                movie_id: movie.movie_id,
                                list_type: sidebarTab,
                              }
                            );
                            // Update local state
                            if (sidebarTab === "watchlist") {
                              setWatchlistData((prev) => ({
                                ...prev,
                                movies: prev.movies.filter(
                                  (m) => m.movie_id !== movie.movie_id
                                ),
                              }));
                            } else {
                              setWatchlistData((prev) => ({
                                ...prev,
                                watched: prev.watched.filter(
                                  (m) => m.movie_id !== movie.movie_id
                                ),
                              }));
                            }
                          } catch (err) {
                            console.error("Failed to remove:", err);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded transition-all"
                        title="Remove"
                      >
                        <svg
                          className="w-4 h-4 text-neutral-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Carousel */}
      <div className="relative flex-1 flex justify-center items-center">
        <div className="relative h-[400px] w-full">
          <AnimatePresence initial={false}>
            {recommendations.map((movie, index) => {
              const position = getCardPosition(index);

              if (position === "hidden") return null;

              return (
                <motion.div
                  key={movie.movie_id}
                  className={`absolute top-0 left-0 right-0 mx-auto h-[400px] w-[280px] rounded-3xl bg-cover bg-center flex flex-col justify-end overflow-hidden border border-neutral-800 shadow-xl`}
                  style={{
                    backgroundImage: `url(https://image.tmdb.org/t/p/w220_and_h330_face${movie.backdrop_path})`,
                  }}
                  variants={cardVariants}
                  initial={
                    position === "farLeft"
                      ? "preFarLeft"
                      : position === "farRight"
                      ? "preFarRight"
                      : "hidden"
                  }
                  animate={position}
                  exit={
                    position === "farLeft"
                      ? "preFarLeft"
                      : position === "farRight"
                      ? "preFarRight"
                      : "hidden"
                  }
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                >
                  {/* Movie title overlay for center card */}
                  {position === "center" && (
                    <div className="bg-gradient-to-t from-neutral-950 via-neutral-950/80 to-transparent p-4">
                      <p className="text-base font-medium truncate">
                        {movie.movie_name}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* Controls */}
      <div className="flex w-full h-auto py-8 justify-center items-center gap-6">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-700 hover:bg-neutral-800 transition-colors"
        >
          <svg
            className="w-5 h-5 text-neutral-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* Dislike Button */}
        <button
          onClick={handleDislike}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-red-500/50 transition-all active:scale-95"
        >
          <svg
            className="w-6 h-6 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Dot Indicator */}
        <div className="flex items-center gap-2 px-4">
          {recommendations
            .slice(0, Math.min(5, recommendations.length))
            .map((_, index) => {
              const isActive =
                index === activeIndex % Math.min(5, recommendations.length);
              return (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive ? "w-6 bg-red-500" : "w-2 bg-neutral-600"
                  }`}
                />
              );
            })}
        </div>

        {/* Like Button */}
        <button
          onClick={handleLike}
          className="w-14 h-14 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-green-500/50 transition-all active:scale-95"
        >
          <svg
            className="w-6 h-6 text-red-500"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>

        {/* Already Watched Button */}
        <button
          onClick={handleWatched}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-blue-500/50 transition-all active:scale-95"
          title="Already Watched"
        >
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>

        {/* Add to Watchlist Button */}
        <button
          onClick={handleAddToWatchlist}
          className="w-12 h-12 flex items-center justify-center rounded-full bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 hover:border-yellow-500/50 transition-all active:scale-95"
          title="Add to Watchlist"
        >
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-700 hover:bg-neutral-800 transition-colors"
        >
          <svg
            className="w-5 h-5 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
