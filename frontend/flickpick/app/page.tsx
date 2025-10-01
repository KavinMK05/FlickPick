"use client"
import Image from "next/image";
import { SetStateAction, useState } from "react";

export default function Home() {
  const movies = [
    {
      id: 1,
      poster: "https://via.placeholder.com/200x300/333/fff?text=Movie+1",
    },
    {
      id: 2,
      poster: "https://via.placeholder.com/200x300/333/fff?text=Movie+2",
    },
    {
      id: 3,
      poster: "https://via.placeholder.com/200x300/333/fff?text=Movie+3",
    },
    {
      id: 4,
      poster: "https://via.placeholder.com/200x300/333/fff?text=Movie+4",
    },
    {
      id: 5,
      poster: "https://via.placeholder.com/200x300/333/fff?text=Movie+5",
    },
  ];

  const series = [
    {
      id: 1,
      poster: "https://via.placeholder.com/200x300/666/fff?text=Series+1",
    },
    {
      id: 2,
      poster: "https://via.placeholder.com/200x300/666/fff?text=Series+2",
    },
    {
      id: 3,
      poster: "https://via.placeholder.com/200x300/666/fff?text=Series+3",
    },
    {
      id: 4,
      poster: "https://via.placeholder.com/200x300/666/fff?text=Series+4",
    },
    {
      id: 5,
      poster: "https://via.placeholder.com/200x300/666/fff?text=Series+5",
    },
  ];
  const [activeTab, setActiveTab] = useState("movies");
  const [currentIndex, setCurrentIndex] = useState(0);

  const data = activeTab === "movies" ? movies : series;
  const totalItems = data.length;

  // Handle previous button
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalItems - 1 : prev - 1));
  };

  // Handle next button
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalItems - 1 ? 0 : prev + 1));
  };

  // Handle tab switch
  const handleTabSwitch = (tab: SetStateAction<string>) => {
    setActiveTab(tab);
    setCurrentIndex(0); // Reset carousel on tab change
  };

  // Carousel transform style (Tailwind doesn't support dynamic transforms easily, so keep inline style)
  const carouselStyle = {
    transform: `translateX(-${currentIndex * (100 / 5)}%)`, // Assuming 5 items visible, adjust width as needed
    transition: "transform 0.3s ease",
  };
  return (
    <div className="h-screen w-screen ">
      <div className="bg-black text-white min-h-screen flex flex-col p-5 font-sans">
        {/* Top Navigation */}
        <header className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold">FlickPick</h1>
          <div className="flex space-x-2">
            <button
              className={`px-5 py-2 rounded-full cursor-pointer transition-colors ${
                activeTab === "movies"
                  ? "bg-gray-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => handleTabSwitch("movies")}
            >
              Movies
            </button>
            <button
              className={`px-5 py-2 rounded-full cursor-pointer transition-colors ${
                activeTab === "series"
                  ? "bg-gray-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
              onClick={() => handleTabSwitch("series")}
            >
              TV series
            </button>
          </div>
        </header>

        {/* Carousel Middle Area */}
        <main className="flex-1 overflow-hidden my-5">
          <div className="w-full overflow-hidden">
            <div
              className="flex w-[500%] h-80 transition-transform duration-300 ease-in-out"
              style={carouselStyle}
            >
              {data.map((item) => (
                <div key={item.id} className="flex-0 flex-[20%] p-2.5">
                  <img
                    src={item.poster}
                    alt={`${activeTab} ${item.id}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Bottom Buttons */}
        <footer className="flex justify-center items-center gap-5 py-5">
          <button
            onClick={handlePrevious}
            className="w-12 h-12 bg-gray-600 text-white rounded-full cursor-pointer text-xl flex items-center justify-center hover:bg-gray-500 transition-colors"
          >
            ←
          </button>
          <button className="w-12 h-12 bg-gray-500 text-white rounded-full cursor-pointer text-xl flex items-center justify-center hover:bg-gray-400 transition-colors">
            +
          </button>
          <button className="w-12 h-12 bg-gray-500 text-white rounded-full cursor-pointer text-xl flex items-center justify-center hover:bg-gray-400 transition-colors">
            👍
          </button>
          <button
            onClick={handleNext}
            className="w-12 h-12 bg-gray-600 text-white rounded-full cursor-pointer text-xl flex items-center justify-center hover:bg-gray-500 transition-colors"
          >
            →
          </button>
        </footer>
      </div>
    </div>
  );
}
