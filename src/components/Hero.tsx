import TextCycler from './TextCycler'
import SpotifyStatus from '../components/SpotifyStatus';
import Glyphs from '../components/Glyphs'

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="flex flex-col max-w-[50%] justify-center items-center">
        <div className="slide-down-fade-in grid grid-row 2xl:grid-flow-col 2xl:auto-cols-max justify-center items-center gap-3">
          <span className="text-2xl 2xl:text-4xl font-light text-gray-500 whitespace-nowrap">
            Howdy! I&apos;m a
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
            from Texas A&amp;M University and
          </div>

        </div>

          <SpotifyStatus className="m-10"/>
        <Glyphs />
      </div>
    </div>
  );
}
