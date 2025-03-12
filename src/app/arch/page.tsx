
'use client';

import Link from 'next/link';
import { useState } from 'react';
import Image from 'next/image';
import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Navbar from "@/components/Navbar";
import RegionsOfInterest from '@/components/RegionsOfInterest'

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  targetId: string;
}

interface HeaderProps {
  className?: string;
  text: string; // Define the type here
  href?: string;
  id?: string;
}

const Header = ({
  className = "font-bold text-2xl 2xl:text-4xl text-white pb-2",
  text,
  href = "",
  id = ""
}: HeaderProps) => (
    <div className="flex flex-row justify-between items-center gap-4">
      {href !== "" ? (
        <div className={className + "cursor-pointer"}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"

            id={id}
            className="font-black text-white sm:hover:underline cursor-pointer"
          >
            {text}
          </a>
        </div>
      ) : (
          <div className={className} id={id}>
            <span>{text}</span>
          </div>
        )}
    </div>
  );

export default function About() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;
  const scrollToSection = (targetId: string) => {
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const areas: Area[] = [
    { x: 5.5, y: 1, width: 44.5, height: 46.5, label: 'ranger', targetId: 'ranger' },
    { x: 50.5, y: 1, width: 21.5, height: 46.5, label: 'neofetch (deprecated)', targetId: 'neofetch' },
    { x: 73, y: 1, width: 21.5, height: 46.5, label: 'cli-visualizer', targetId: 'cli-visualizer' },
    { x: 5.5, y: 48.5, width: 89, height: 47, label: 'lazyvim', targetId: 'lazyvim' },
    { x: 5, y: 97.5, width: 90, height: 2.5, label: 'bumblebee-status', targetId: 'bumblebee-status' },
  ];

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <Navbar showColorPalette={false} learnMorePath="/arch" />
      <div className="slide-down-fade-in relative flex flex-col min-h-screen justify-start pointer-events-none">

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow pointer-events-auto">
          <div className="text-base leading-loose text-center md:text-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-1 md:pb-6">
              Arch Linux &amp; Ricing
            </h2>
            <p className="text-lg leading-loose mb-4">
              Linux is an alternative operating system from your typical Windows or MacOS. Of the many reasons people switch to Linux is the extreme customizability thats possible. Linux ricing (a term coined from <a href='https://www.urbandictionary.com/define.php?term=ricing' target="_blank" rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">car ricing</a>) is the nerd trend of customizing your operating system's aesthetic until it's completely distinct from anyone else (Source: <a href='https://www.reddit.com/r/unixporn/' target="_blank" rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">redditors</a>). After customizing their computer, people like to compare their "rices" with other nerds. So, if you're one of those nerds out there, below is how I like my Arch Linux :) . Hover/Click over different sections of the image to view the technology/framework used to stylize my rice.
            </p>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow pointer-events-auto">
          <div className="text-base leading-loose text-center md:text-left">
            <Header text="My Rice" id="rice"/>
            <p className="pb-4" >Click on the image to see the technology used.</p>
            <RegionsOfInterest
              imageSrc="/i3_rice.png"
              imageAlt="Your image description"
              width={2000}
              height={900}
              divClassName="flex justify-center relative"
              className="object-contain max-w-5/6 animate-appear"
              areas={areas}
              onAreaClick={scrollToSection}
            />
          </div>
        </div>

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow pointer-events-auto">
          <div className="text-base leading-loose text-center md:text-left">
            <Header
              text="Utilized Libraries/Frameworks"
            />

            <hr className="mt-5 mb-5"></hr>

            <h2 id='ranger' className="text-2xl text-gray-300 font-medium italic mb-4">ranger</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='https://github.com/ranger/ranger' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">ranger</a> is a nifty file explorer for the command line. If loading a GUI to surf your files/moving your mouse to click them was too arduous for you, then ranger is your solution. It allows you to use vim-like keybindings to move around your file directory system, and can be mapped to preview various file types with your preferred file viewer. Although I still prefer to use the good ol' <code className="bg-gray-800 text-white rounded px-1 py-0.5 font-thin">cd</code> and <code className="bg-gray-800 text-white rounded px-1 py-0.5 font-thin">ls</code>, sometimes <code className="bg-gray-800 text-white rounded px-1 py-0.5 font-thin">ranger</code> matches my needs just a little bit more.
            </p>
            <button
              className="bg-gray-600 hover:bg-(--tertiary-color) text-white font-bold py-2 px-4 rounded"
              onClick={() => scrollToSection('rice')}
            >
              Back to Top
            </button>
            <hr className="mt-5 mb-5"></hr>

            <h2 id='neofetch' className="text-2xl text-gray-300 font-medium italic mb-4">neofetch</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='https://github.com/dylanaraps/neofetch' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">neofetch</a> is the bread and butter of virtually all unix users, no matter what distribution. It's the emblem of any riced Linux distribution. Unfortunately, neofetch has stopped development, meaning that its outputs are not guaranteed to be true and it's bug fixes have been put on hold indefinitely. Regardless, I still use neofetch just to taste the nostalgia, and to remember how good we had it.
            </p>

            <button
              className="bg-gray-600 hover:bg-(--tertiary-color) text-white font-bold py-2 px-4 rounded"
              onClick={() => scrollToSection('rice')}
            >
              Back to Top
            </button>
            <hr className="mt-5 mb-5"></hr>

            <h2 id='cli-visualizer' className="text-2xl text-gray-300 font-medium italic mb-4">cli-visualizer</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='https://github.com/dpayne/cli-visualizer' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">cli-visualizer</a> is a TUI audio visualizer majorly written in C++. It listens to your audio output, defines its waveform, and then displays animations that are reactive to volumne, cadence, etc. It has a couple of modes (and also can simulate the <a target="_blank" href='https://en.wikipedia.org/wiki/Lorenz_system' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">Lorenz attractor</a>, go figure), but I just use it to look cool and to rice out :) . It uses the curses library to render the imagery, and is pretty optimized. Nothing more to say other than to check it out.
            </p>

            <button
              className="bg-gray-600 hover:bg-(--tertiary-color) text-white font-bold py-2 px-4 rounded"
              onClick={() => scrollToSection('rice')}
            >
              Back to Top
            </button>
            <hr className="mt-5 mb-5"></hr>

            <h2 id='lazyvim' className="text-2xl text-gray-300 font-medium italic mb-4">lazyvim</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='http://www.lazyvim.org/' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">lazyvim</a> is the one application that I recommend anyone who is trying to be productive and use their time wisely to learn. Lazyvim is essentially a pre-compiled build of NeoVim, with all of the doohickeys and gadgets you could ever ask for, while also staying with the typical norms of NeoVim. Lazyvim takes away the burdens of learning about the wild assortment of plugin managers and plugins you could be using with NeoVim, and instead allows you to spend your time learning what's important: vim keybindings. Vim keybindings have gotten me out of more binds than I can count, and a lot of archaic applications still accept vim keybindings. Once you learn vim, you will never go back.
            </p>

            <button
              className="bg-gray-600 hover:bg-(--tertiary-color) text-white font-bold py-2 px-4 rounded"
              onClick={() => scrollToSection('rice')}
            >
              Back to Top
            </button>
            <hr className="mt-5 mb-5"></hr>

            <h2 id='bumblebee-status' className="text-2xl text-gray-300 font-medium italic mb-4">bumblebee-status</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='https://github.com/tobi-wan-kenobi/bumblebee-status' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">bumblebee-status</a> is a extremely versatile taskbar framework that works (for the most part) out of the box. There's a large amount of built-in libraries that should house every conceivable functionality you might like. Even if you want some niche output for your special taskbar, the <a target="_blank" href='https://bumblebee-status.readthedocs.io/en/latest/' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">documentation</a> online is really accessible in terms of creating your own "modules" (the sections on the status bar). If you're not into <i>that</i> much customization, don't worry. All of the modules in my status bar came out of the box, so as long as your drivers are working properly, then bumblebee-status can work properly as well.
            </p>

            <button
              className="bg-gray-600 hover:bg-(--tertiary-color) text-white font-bold py-2 px-4 rounded"
              onClick={() => scrollToSection('rice')}
            >
              Back to Top
            </button>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow pointer-events-auto">
          <div className="text-base leading-loose text-center md:text-left">
            <Header
              text="Libraries/Frameworks Not Mentioned"
            />

            <h2 id='wallhaven.cc' className="text-2xl text-gray-300 font-medium italic mb-4">wallhaven.cc</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='https://www.wallhaven.cc' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">wallhaven</a> is a website catalogue of lots of amazing high-quality wallpapers for both desktop and mobile. With my current i3 setup, I've set it such that every reload of i3 will download a fresh wallpaper from their website (free API). Although their catalogue includes both SFW and NSFW content, their filters make it really easy to find what you're looking for.
            </p>

            <hr className="mt-5 mb-5"></hr>

            <h2 id='pywal' className="text-2xl text-gray-300 font-medium italic mb-4">pywal</h2>
            <p className="text-lg leading-loose mb-4">
              <a target="_blank" href='https://github.com/dylanaraps/pywal' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">pywal</a> is what cinches my whole setup together. It is a color palette generator based on the current background image. So, when I refresh my i3 and receive a new wallpaper from wallhaven.cc, pywal will reactively generate the latest color palette and apply it to my system palette. This allows for literally any application on my computer to utilize the palette and thus reactively match my background. Works like a charm and something I recommend for anyone who is getting into ricing.
            </p>
          </div>
        </div>

        <footer className="absolute bottom-2 left-2 contactInfo">
          <p>Copyright &copy; 2025 Isaac Chacko</p>
        </footer>
      </div>
    </div>

  );
}
