import TextCycler from './TextCycler'
import SpotifyStatus from '../components/SpotifyStatus';
import Glyphs from '../components/Glyphs'
import InfoModal from "@/components/InfoModal"

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="slide-down-fade-in flex flex-col max-w-[50%] justify-center items-center">
        <div className="grid grid-row 2xl:grid-flow-col 2xl:auto-cols-max justify-center items-center gap-3">
          <span className="text-lg 2xl:text-4xl font-light text-gray-500 whitespace-nowrap">
            Howdy! I&apos;m a
          </span>

          {/* TextCycler Container */}
          <div className="min-w-max">
            <TextCycler
              texts={[
                "Software Developer",
                "Redbull Zealot",
                "Half-Marathon Runner",
                "Hackathon Addict",
                "CS Student",
                "i3 User",
                "Data Engineer",
              ]}
              interval={5000}
              className="text-2xl lg:text-4xl 2xl:text-6xl font-bold"
            />
          </div>

          {/* Wrapping text container */}
          <div className="text-lg 2xl:text-4xl font-light text-gray-500 max-w">
            from Texas A&amp;M University and
          </div>

        </div>

          <SpotifyStatus className="m-10"/>
        <Glyphs />
        <InfoModal />
      </div>
    </div>
  );
}
