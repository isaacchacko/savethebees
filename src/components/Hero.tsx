import { useState, useEffect } from "react";
import TextCycler from './TextCycler'
import SpotifyPlayer from '../components/SpotifyPlayer';

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="max-w-[50%] justify-center items-center">
        <div className="grid grid-row 2xl:grid-flow-col 2xl:auto-cols-max justify-center items-center gap-3">
          <span className="text-2xl 2xl:text-4xl font-light text-gray-500 whitespace-nowrap">
            Howdy! I'm a
          </span>

          {/* TextCycler Container */}
          <div className="min-w-max">
            <TextCycler
              texts={[
                "Software Developer",
                "Redbull Zealot",
                "Half-Marathon Runner",
                "Godot Developer",
                "Hackathon Addict",
                "CS Student",
                "i3 User",
                "Poker Junkie",
              ]}
              interval={5000}
              className="text-4xl 2xl:text-6xl font-bold"
            />
          </div>

          {/* Wrapping text container */}
          <div className="text-2xl 2xl:text-4xl font-light text-gray-500 max-w">
            from Texas A&amp;M University.
          </div>

        </div>

          <SpotifyPlayer />
      </div>
    </div>
  );
}
