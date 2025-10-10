"use client";
import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CreateProfile() {
  // Interface for a single movie from the API
  interface Movie {
    movie_id: number;
    movie_name: string;
    backdrop_path: string;
    embeddings: number[];
  }

  // Interface for a selected movie (storing only what we need)
  interface SelectedMovie {
    movie_id: number;
    movie_name: string;
  }

  const [randomMovies, setRandomMovies] = useState<Movie[]>([]);
  // State to store the list of selected movies
  const [selectedMovies, setSelectedMovies] = useState<SelectedMovie[]>([]);
 

  // Fetches random movies from your API
  async function getRandomMovies() {
    try {
      let response = await axios.get("http://127.0.0.1:8000/getRandomMovies");
      setRandomMovies(response.data);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    }
  }

  async function createUserLike() {
    try {
      let response = await axios.post(
        "http://127.0.0.1:8000/createUserLikes",
        selectedMovies // Corrected data structure
      );
      console.log("Success:", response.data);
    } catch (error) {
      // This block will run if the request fails
      console.error(
        "Error creating user likes:",
        error
      );
    }
  }

  // --- New Function to Handle Selection ---
  const handleMovieSelect = (movie: Movie) => {
    setSelectedMovies((prevSelected) => {
      // Check if the movie is already in the selected list
      const isSelected = prevSelected.some(
        (selected) => selected.movie_id === movie.movie_id
      );

      if (isSelected) {
        // If it is selected, remove it from the list
        return prevSelected.filter(
          (selected) => selected.movie_id !== movie.movie_id
        );
      } else {
        // If it's not selected, add it to the list
        return [
          ...prevSelected,
          { movie_id: movie.movie_id, movie_name: movie.movie_name },
        ];
      }
    });
  };

  // Run on component mount
  useEffect(() => {
    getRandomMovies();
  }, []);

  // Optional: Log selected movies to the console when they change
  useEffect(() => {
    console.log("Selected movies:", selectedMovies);
  }, [selectedMovies]);

  return (
    <div className="flex flex-col items-center w-screen h-screen bg-black overflow-y-auto ">
      <div className="font-bold w-full flex justify-start text-white py-5 pl-5">
        FlickPick
      </div>
      <div className="flex flex-col justify-center items-center h-full mb-32">
        <div className="text-white font-bold text-2xl pb-10">
          Select the Movies You Like
        </div>
        <div className="grid grid-cols-5 gap-5 justify-items-center px-10">
          {randomMovies?.map((item) => {
            // Check if the current movie item is in our selectedMovies list
            const isSelected = selectedMovies.some(
              (movie) => movie.movie_id === item.movie_id
            );

            return (
              <div
                key={item.movie_id}
                // --- Add onClick handler ---
                onClick={() => handleMovieSelect(item)}
                // --- Apply styles based on whether it's selected ---
                className={`w-36 h-54 rounded-2xl bg-cover bg-center cursor-pointer transition-all duration-200 ease-in-out
                  ${
                    isSelected
                      ? "border-4 border-blue-500 scale-105" // Style for selected
                      : "border-2 border-transparent hover:scale-105" // Style for not selected
                  }
                `}
                style={{
                  backgroundImage: `url(https://image.tmdb.org/t/p/w220_and_h330_face${item.backdrop_path})`, // Fixed template literal typo
                }}
              ></div>
            );
          })}
        </div>
        {/* You can add a button here to submit the selection */}
        {selectedMovies.length > 0 && (
          <Link
            href="/"
            className="mt-8 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            onClick={() => {
              createUserLike();
            }}
          >
            Continue
          </Link>
        )}
      </div>
    </div>
  );
}
