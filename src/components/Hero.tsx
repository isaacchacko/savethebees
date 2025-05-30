import TextCycler from './TextCycler'
import SpotifyStatus from '../components/SpotifyStatus';
import Glyphs from '../components/Glyphs'
import InfoModal from "@/components/InfoModal"

// hero text
import HeroLink from '@/components/HeroLink';

// glyphs
import IconLink from '@/components/IconLink';
import Link from 'next/link';
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
import { PiLineVerticalBold } from "react-icons/pi";

export default function Home() {
  return (
    <>
      <div className='px-8 sm:p-none flex flex-col items-center justify-center w-screen h-screen'>
        <div className="w-full sm:w-1/2 flex flex-col items-center gap-3">
          <h1 className=" text-center text-2xl sm:text-4xl md:text-6xl title-slide-down-fade-in font-bold">
            Howdy! I&apos;m Isaac.

          </h1>
          <p className=" text-center text-md sm:text-xl md:text-2xl lg:text-4xl slide-down-fade-in font-light">
            I'm a computer science major{' '}
            <HeroLink text="&#64;TAMU" href="https://www.tamu.edu" />{' '}
            and intern{' '}
            <HeroLink text="&#64;SISO" href="https://www.siso-eng.com" />.
          </p>

          {/* TextCycler Container */}

          {/* Wrapping text container */}
          <div className="text-center slide-down-fade-in text-md sm:text-xl md:text-2xl lg:text-4xl font-light">
            Want more? I'm also a{' '}
            <TextCycler
              texts={[
                "Half-Marathon Runner",
                "Software Developer",
                "CD Enthusiast",
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

              divClassName=" translate-y-[0.4rem] slide-down-fade-in inline-block "
              textClassName=" text-md sm:text-xl md:text-2xl lg:text-4xl font-bold underline text-(--primary-color) "
            />.
          </div>

          <div className="slide-down-fade-in flex flex-row justify-center w-full ">
            <IconLink IconComponent={AiOutlineLinkedin} href='https://www.linkedin.com/in/isaacchacko' isNewTab={true} />
            <IconLink IconComponent={BiFile} href='/Isaac_Chacko.pdf' isNewTab={true} />
            <IconLink IconComponent={FiGithub} href='https://www.github.com/isaacchacko' isNewTab={true} />
            <IconLink IconComponent={BiMailSend} href='mailto:isaac.chacko05@tamu.edu' isNewTab={true} />
            <PiLineVerticalBold className="w-10 h-10" />
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
            <ColorPaletteEditor className="hidden sm:flex " />
          </div>
        </div>

        {/*
          <SpotifyStatus className="my-10"/>
        <Glyphs />
          */}
        <InfoModal className="slide-down-fade-in" />
      </div>
    </>
  );
}
