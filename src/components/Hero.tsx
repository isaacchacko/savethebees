import TextCycler from './TextCycler'

// hero text
import HeroAtLink from '@/components/HeroAtLink';

// glyphs
import IconLink from '@/components/IconLink';
import ColorPaletteEditor from "@/components/ColorPaletteEditor"
import {
  BiFile,          // Resume/file text
  BiMailSend,      // Mail/envelope
  BiRun,           // Running man
  BiDisc,          // CD/disc
  BiSun,
  BiMoon
} from 'react-icons/bi';
import { FiGithub } from "react-icons/fi";
import { AiOutlineLinkedin } from "react-icons/ai";

export default function Home() {
  return (
    <div className='fixed sm:p-none flex flex-col items-center justify-center w-screen h-screen'>
      <div className="w-full sm:w-1/2 flex flex-col items-center gap-3">
        <h1 className=" text-center text-2xl sm:text-4xl md:text-6xl title-slide-down-fade-in font-bold">
          Howdy! I&apos;m a<br></br>
          <TextCycler
            texts={[
              "Half-Marathon Runner",
              "Software Developer",
              "CD Enthusiast",
              "Star Wars Fan",
              "Data Engineer",
              "Linux user"
            ]}
            hrefs={[
              "/tracking",
              "/projects",
              "/tracking",
              "/projects",
              "/arch"
            ]}
            isNewTabs={[
              false,
              false,
              false,
              false,
              false
            ]}

            divClassName=" title-slide-down-fade-in inline-block "
            textClassName=" text-center text-2xl sm:text-4xl md:text-6xl font-bold underline text-(--primary-color) "
          />

        </h1>
        <div className=" text-center text-md sm:text-xl md:text-2xl lg:text-4xl slide-down-fade-in font-light">
          I&apos;m currently studying CS{' '}
          <HeroAtLink text="TAMU" href="https://www.tamu.edu" />{' '}
          and interning{' '}
          <HeroAtLink text="SISO" href="https://www.siso-eng.com" />. Previously at{' '}
          <HeroAtLink text="LUMINARE" href="https://luminare.io/" />.
        </div>

        <div className="mb-10 slide-down-fade-in flex sm:flex-row flex-col items-center justify-center w-full ">
          <div className='flex'>

            <IconLink IconComponent={AiOutlineLinkedin} href='https://www.linkedin.com/in/isaacchacko' isNewTab={true} />
            <IconLink IconComponent={BiFile} href='/Isaac_Chacko.pdf' isNewTab={true} />
            <IconLink IconComponent={FiGithub} href='https://www.github.com/isaacchacko' isNewTab={true} />
            <IconLink IconComponent={BiMailSend} href='mailto:isaac.chacko05@tamu.edu' isNewTab={true} />
          </div>
          <div className='hidden sm:block bg-white w-1 h-10 rounded-full mx-1'></div>
          <div className='block sm:hidden bg-white w-1/3 h-1 rounded-full my-1'></div>
          <div className='flex'>

            <IconLink IconComponent={BiRun} href='/tracking' isNewTab={false} />
            <IconLink IconComponent={BiDisc} href='/tracking' isNewTab={false} />
            <button
              aria-label="Toggle theme"
              onClick={() =>
                localStorage.setItem(
                  'theme',
                  document.documentElement.classList.toggle('dark')
                    ? 'dark'
                    : 'light'
                )
              }
            >
              <BiMoon className="hidden dark:block visible w-10 h-10 cursor-pointer scale-80 hover:scale-100 duration-300" />
              <BiSun className="dark:hidden block w-10 h-10 cursor-pointer scale-80 hover:scale-100 duration-300" />
            </button>
            <ColorPaletteEditor />
          </div>
        </div>
      </div>

      {/*
          <SpotifyStatus className="my-10"/>
        <Glyphs />
          */}
    </div>
  );
}
