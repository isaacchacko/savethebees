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
} from 'react-icons/bi';
import { FiGithub } from "react-icons/fi";
import { AiOutlineLinkedin } from "react-icons/ai";

import DarkModeToggle from './DarkModeToggle';

const ICON_WIDTH_HEIGHT = "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ";
const HOWDY_TEXT_HEIGHT = "text-4xl md:text-4xl lg:text-6xl"
export default function Home() {
  return (
    <div className='w-1/2 sm:p-none flex flex-col items-center justify-center'>
      <div className="flex flex-col items-center gap-3">
        <h1 className={` text-center  ${HOWDY_TEXT_HEIGHT} title-slide-down-fade-in font-bold`}>
          Howdy! I&apos;m a<br></br>
          <TextCycler
            texts={[
              "Half-Marathon Runner",
              "Backend Developer",
              "Laufey Listener",
              "Longboard Lover",
              "Database Engineer",

              // if you change "Zealot" to "User" instead of zealot overflow scroll bars appear for some
              // screen sizes...
              // i think it's because "User" is smaller than "Howdy! I'm" while "Zealot" isn't
              "Linux Zealot"
            ]}
            hrefs={[
              "/tracking",
              "/projects",
              "/tracking",
              "/about",
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
            textClassName={` text-center ${HOWDY_TEXT_HEIGHT} font-bold underline text-(--primary-color) `}
          />

        </h1>
        <div className=" text-center text-sm sm:text-md md:text-lg lg:text-xl slide-down-fade-in font-light">
          I&apos;m currently studying CS and applied math{' '}
          <HeroAtLink text="TAMU" href="https://www.tamu.edu" hasPeriod={false} />{'. '}
          Previously interned {' '}
          <HeroAtLink text="SISO" href="https://www.siso-eng.com" hasPeriod={false} /> and {' '}
          <HeroAtLink text="LUMINARE" href="https://luminare.io/" hasPeriod={true} />
        </div>

        <div className="slide-down-fade-in flex sm:flex-row flex-col items-center justify-center ">
          <div className='flex'>
            <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={AiOutlineLinkedin} href='https://www.linkedin.com/in/isaacchacko' isNewTab={true} />
            <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={BiFile} href='/Isaac_Chacko.pdf' isNewTab={true} />
            <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={FiGithub} href='https://www.github.com/isaacchacko' isNewTab={true} />
            <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={BiMailSend} href='mailto:isaac.chacko05@tamu.edu' isNewTab={true} />
          </div>
          <div className='hidden sm:block bg-white w-1 h-10 rounded-full mx-1'></div>
          <div className='block sm:hidden bg-white w-40 h-1 rounded-full my-1'></div>
          <div className='flex'>

            <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={BiRun} href='/tracking' isNewTab={false} />
            <IconLink className={ICON_WIDTH_HEIGHT} IconComponent={BiDisc} href='/tracking' isNewTab={false} />
            <DarkModeToggle ICON_WIDTH_HEIGHT={ICON_WIDTH_HEIGHT} />
            <ColorPaletteEditor widthHeight={ICON_WIDTH_HEIGHT} />
          </div>
        </div>
      </div>
    </div>
  );
}
