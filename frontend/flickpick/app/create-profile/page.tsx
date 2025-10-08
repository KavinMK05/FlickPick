"use client";
import axios from "axios";
import { useEffect, useState } from "react";
export default function CreateProfile() {
  interface Movie {
    movie_id: number;
    movie_name: string;
    backdrop_path: string;
    embeddings: number[];
  }

  const [randomMovies, setRandomMovies] = useState<Movie[]>();

  async function getRandomMovies() {
    let response = await axios.get("http://127.0.0.1:8000/getRandomMovies");
    let data = response.data;
    console.log(data);
    setRandomMovies(data);
  }

  useEffect(() => {
    getRandomMovies();
  }, []);

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
          {randomMovies?.map((item) => (
            <div
              key={item.movie_id}
              className={`w-36 h-54 rounded-3xl bg-cover bg-center`}
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/w220_and_h330_face${item.backdrop_path}}`,
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
