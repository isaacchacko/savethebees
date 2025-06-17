'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Navbar from "@/components/Navbar";

// expand/collapse readme
import { FiGithub, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { FaGit, FaGithub } from 'react-icons/fa';

interface HTMLDictType {
  [name: string]: string;
}

interface ChipDict {
  [name: string]: string[];
}

interface TechnologyDict {
  [name: string]: string;
}

interface TitleDict {
  [name: string]: string;
}

interface BooleanDict {
  [name: string]: boolean;
}

const titleDict: TitleDict = {
  'savethebees': "My Personal Website",
  'eulerelo': "Eulerelo: Competitve Math",
  'autowal': "Autowal: a CLI tool"
}

const techStack: ChipDict = {
  "savethebees": ["Next.js", "Typescript", "Tailwind CSS", "Redis", "Vercel"],
  "eulerelo": ["Next.js", "Typescript", "Tailwind CSS", "PrismaDB", "PostgreSQL"],
  "autowal": ["Python", "Bash", "cURL", "Linux"],
}

const TECHNOLOGIES: TechnologyDict = {
  "Next.js": "#ffffff", // Official: black/white, using white
  "Typescript": "#3178c6", // Official blue
  "Tailwind CSS": "#38bdf8", // Official blue
  "Redis": "#dc382d", // Official red
  "Vercel": "#ffffff", // Official: black
  "PrismaDB": "#0c344b", // Prisma's dark blue
  "PostgreSQL": "#336791", // Official blue
  "Python": "#3776ab", // Official blue
  "Bash": "#4eaa25", // Green (Bash logo)
  "cURL": "#073551", // Official blue
  "Linux": "#1793d1", // Official yellow
};

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;
  const repositories: string[] = ["autowal", "eulerelo", "savethebees"];
  const [HTMLDict, setHTMLDict] = useState<HTMLDictType>(() =>
    repositories.reduce((acc, repo) => ({ ...acc, [repo]: "" }), {})
  );

  const [visibleDict, setVisibleDict] = useState<BooleanDict>(() =>
    repositories.reduce((acc, repo) => ({ ...acc, [repo]: false }), {})
  );

  const setHTMLForRepo = (name: string, html: string) => {
    setHTMLDict(prev => ({ ...prev, [name]: html }));
  };

  const setVisible = (name: string, state: boolean) => {
    setVisibleDict(prev => ({ ...prev, [name]: state }));
  };

  useEffect(() => {
    async function fetchHTML() {

      for (const name of repositories) {
        const response = await fetch(`/api/github/repo/${name}`);

        if (!response.ok) {
          console.error(`Failed to fetch repository README for "${name}`)
          continue;
        } else {

          const json = await response.json();
          console.log(json.data);
          setHTMLForRepo(name, json.data);

        }


      }
    }

    fetchHTML();
  }, []);

  function getContrastYIQ(hexcolor: string) {
    // Remove hash if present
    hexcolor = hexcolor.replace('#', '');

    // Parse r, g, b values
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // YIQ formula
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black for light backgrounds, white for dark backgrounds
    return (yiq >= 128) ? '#000000' : '#ffffff';
  }

  useEffect(() => {
    console.log(visibleDict);
  }, [visibleDict]);

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="pointer-events-none relative flex flex-col min-h-screen justify-start">
        <Navbar />

        <div className="slide-down-fade-in">
          <div className="pointer-events-auto flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <div className="text-base leading-relaxed text-center md:text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-1 md:pb-6"> Projects
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                Although a complete list can be found on my <a target="_blank" href='https://github.com/isaacchacko' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">GitHub</a>, here&apos;s a brief list of my more notable projects.
              </p>
            </div>
          </div>


          {repositories.map((name, index, arr) => (
            <div key={index} className='text-base leading-relaxed pointer-events-auto flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow"'>
              <div className='flex flex-row gap-3 items-center justify-between'>
                <div className='flex flex-row gap-2 items-center group'>
                  <span className="font-black text-white text-2xl 2xl:text-4xl text-white text-bold cursor-pointer pb-2 underline underline-offset-5 text-(--primary-color) group-hover:text-white transition-colors duration-300">
                    <a href={`http://github.com/isaacchacko/${name}`} target="_blank" rel="noopener noreferrer" className="">
                      {titleDict[name]}
                    </a>
                  </span>
                  <div onClick={() => {
                    setVisibleDict(prev =>
                      ({ ...prev, [name]: !prev[name] })
                    )
                  }} className='text-(--primary-color) group-hover:text-white underline transition-colors duration-300'>
                    {visibleDict[name]
                      ? <FiChevronDown />
                      : <FiChevronRight />
                    }</div>
                </div>

                <a href={`http://github.com/isaacchacko/${name}`} target="_blank" rel="noopener noreferrer" className="">
                  <div className='hover:scale-110 transition-transform duration-300 rounded-lg flex flex-row gap-2 items-center border border-white px-3 py-1'>
                    <FaGithub size={24} />
                    <span>Open on GitHub</span>
                  </div>
                </a>

              </div>
              <div className={` ${visibleDict[name] ? "" : "hidden"} w-full markdown-body quick-slide-down-fade-in `}>

                <div className='flex flex-row items-center gap-3 flex-wrap justify-start my-3'>
                  {techStack[name].map((techName, techIndex, techArr) => (
                    <div key={techIndex} className={`hover:scale-110 transition-transform duration-300 inline-block px-3 py-1 rounded-full font-semibold text-sm`}
                      style={{
                        background: TECHNOLOGIES[techName],
                        color: getContrastYIQ(TECHNOLOGIES[techName]),
                      }}>
                      {techName}
                    </div>
                  ))}
                </div>
                <div dangerouslySetInnerHTML={{ __html: HTMLDict[name] }} >
                </div>
              </div>
            </div>
          ))}
        </div>


        <footer className="absolute bottom-2 left-2 contactInfo">
          <p>Copyright &copy; 2025 Isaac Chacko</p>
        </footer>
      </div>
    </div>
  );
}
