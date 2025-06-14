'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import SpotifyLogo from './SpotifyLogo';

const TEXT_SCROLL_SPEED = 0.050;
const TEXT_PAUSE_DURATION = 2000;

type PlaybackState = {
  is_playing: boolean;
  artist?: string;
  track?: string;
  album?: string;
  image?: string;
  progress?: number;
  duration?: number;
  external_url?: string;
  artist_uri?: string;
  album_uri?: string;
};

export default function SpotifyStatus() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [localProgress, setLocalProgress] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  const [hovered, setHovered] = useState(false);

  // resizing effect
  const parentRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // text scrolling effect
  const textRef = useRef<HTMLDivElement>(null);
  const [hiddenWidth, setHiddenWidth] = useState(0);
  const [translate, setTranslate] = useState("0%");
  const [scrollState, setScrollState] = useState('ready');
  const timeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const [clicked, setClicked] = useState(false);  // quick way to "pin" the status so that
  // users don't have to constantly hover

  // constantly fetch playback data
  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');

        if (!res.ok) throw new Error('Failed to fetch playback');

        const data = await res.json();
        setPlayback(data);
        setLocalProgress(data.progress || 0);
        setLocalDuration(data.duration || 0);
      } catch (err) {
        console.error('Error fetching playback:', err);
        setPlayback(null);
      }
    };

    fetchPlaybackData(); // Initial fetch
    const interval = setInterval(fetchPlaybackData, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  // animate playbar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playback?.is_playing) {
      interval = setInterval(() => {
        setLocalProgress(prev => Math.min(prev + 1000, playback.duration || 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playback?.is_playing, playback?.duration]);

  // dynamic width
  useLayoutEffect(() => {
    if (!parentRef.current) { return; }

    setWidth(parentRef.current.getBoundingClientRect().width);

    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });

    observer.observe(parentRef.current);

    return () => {
      observer.disconnect();
    }
  }, [parentRef.current]);

  // dynamic height
  useLayoutEffect(() => {
    if (!childRef.current) { return; }

    setHeight(childRef.current.getBoundingClientRect().height);

    const observer = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height);
    });

    observer.observe(childRef.current);

    return () => {
      observer.disconnect();
    }
  }, [childRef.current]);


  // set hiddenWidth
  useLayoutEffect(() => {
    if (!textRef.current) return;

    const updateWidth = () => {
      if (!textRef.current) return;

      // scrollWidth: deadass width of the whitespace-nowrap text
      // clientWidth: what the client sees

      // if the actual width is larger than what's visible
      if (textRef.current.scrollWidth >= textRef.current.clientWidth) {

        // + 4 for arbitrary padding. try removing it and see if it still works.
        setHiddenWidth(Math.ceil(textRef.current.scrollWidth - textRef.current.clientWidth + 4));

      } else {

        setHiddenWidth(0);

      }
    }

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(textRef.current);

    return () => {
      observer.disconnect();
    }
  }, [width, playback?.track]);


  // control scroll behavior
  useLayoutEffect(() => {

    if (!textRef.current) return;
    if (hiddenWidth <= 0) return; // if there's nothing to hide/scroll to

    // the cycle of scrollState goes:
    // ready -> left -> left-paused -> right -> right-paused -> ready
    // waiting: neither clicked or hovered

    if (scrollState === "left-paused") {
      timeout.current = setTimeout(() => {
        setScrollState('right');
      }, TEXT_PAUSE_DURATION);
    } else if (scrollState === "right-paused") {
      timeout.current = setTimeout(() => {
        setScrollState('left');
      }, TEXT_PAUSE_DURATION);
    } else if (scrollState === "right") {

      // because 0px sometimes cuts off the beginning of the text
      setTranslate("1px");

      timeout.current = setTimeout(() => {
        setScrollState('right-paused');
      }, hiddenWidth / TEXT_SCROLL_SPEED);

    } else if (scrollState == "ready") {

      // ready and left should have the same behavior, however
      // in cases where the user re-hovers the element, using
      // setTranslate(`-${hiddenWidth}px`) would actually be asynchronous
      // and therefore not happen when we want. (still a bit confusing
      // to me. something about how useState changes
      // are batched and how DOM reflows don't trigger right when
      // useState changes are called. more testing required to understand
      // root cause.) therefore, we have to directly change the DOM
      // using textRef.current.style.transform = ... .

      // remove the restriction placed when resetting the scroll position
      textRef.current.classList.remove("transition-none");

      // the said direct change to the DOM
      textRef.current.style.transform = `translateX(-${hiddenWidth}px)`;

      // i guess just to keep our information the same between the DOM
      // and the setState variables?
      setTranslate(`-${hiddenWidth}px`);

      timeout.current = setTimeout(() => {
        setScrollState('left-paused');
      }, hiddenWidth / TEXT_SCROLL_SPEED);

    } else if (scrollState == "left") {
      setTranslate(`-${hiddenWidth}px`);
      timeout.current = setTimeout(() => {
        setScrollState('left-paused');
      }, hiddenWidth / TEXT_SCROLL_SPEED);
    } else {
      timeout.current = undefined;
    }

    return () => clearTimeout(timeout.current);
  }, [scrollState, hiddenWidth]);


  // reset scroll position instantly to the beginning
  useEffect(() => {

    if (clicked) return; // if pinned, never attempt to reset

    // clear any ungoing timeout (to prevent future
    // useState changes)
    if (timeout.current) {
      clearTimeout(timeout.current);
      timeout.current = undefined;
    }

    if (!textRef.current) return;

    // if the useState hovered change was false -> true
    if (hovered) {
      textRef.current.classList.add("transition-none");

      // similar vain as above. useState isn't synchronous, need
      // to edit the DOM directly.
      textRef.current.style.transform = "translateX(0px)";
      void textRef.current.offsetHeight;
      textRef.current.classList.remove("transition-none");
      setScrollState("ready");
    } else {

      // if the user is now not hovering (true -> false)
      setScrollState("waiting");

    }

  }, [playback?.track, hovered]);

  // Format time helper
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = localDuration > 0
    ? (localProgress / localDuration) * 100
    : 0;

  if (!playback || !playback.is_playing) {
    return (
      <div className='hidden sm:block flex-grow flex justify-start items-center'>
        <div className='h-20 w-20 relative flex justify-center items-center'>
          <SpotifyLogo className="" />
        </div>
        <div className="relative p-2 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="relative p-2 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in">
              <p className="font-black text-white cursor-pointer">
                Isaac isn&apos;t listening to anything...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => setClicked(!clicked)} ref={parentRef} style={{ height }} className='hidden sm:flex group flex flex-row flex-grow flex items-center'>
      <div className='h-20 w-20 relative flex justify-start items-center'>
        <SpotifyLogo className="" />
      </div>
      <div className="relative p-3 bg-(--spotify-background) rounded-lg flex flex-grow gap-2 items-center">
        <div style={{ height: hovered ? `${height}px` : 3 }} className="flex-grow flex flex-col justify-center ">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between 2xl:text-2xl text-gray-500">
          </div>
        </div>
      </div>
      <div ref={childRef} className="absolute transition-opacity duration-400 group-hover:delay-0 delay-300 ease-out p-3 bg-(--spotify-background) rounded-lg flex flex-row flex-grow gap-2 items-center"
        style={{
          width,
          opacity: (hovered || clicked) ? "100" : "0" // moved opacity from tailwind to ts controlled
        }}
      >
        {playback?.image && (
          <div className='h-20 w-20 relative'>
            <Image
              src={playback.image}
              alt="Album cover"
              fill
              className="pulse-border rounded-lg object-cover"
            />
          </div>
        )}
        <div className="overflow-hidden flex flex-col gap-1 w-full ">
          <div className={`flex flex-row transition-transform ease-linear`}
            style={{
              transform: `translateX(${translate})`,
              transitionDuration: `${hiddenWidth / TEXT_SCROLL_SPEED}ms`,
              transitionDelay: `${TEXT_PAUSE_DURATION}ms` // making important variables global/easier to change
            }}
            ref={textRef}>
            <p className='font-bold md:text-xl 2xl:text-2xl text-white whitespace-nowrap'>
              Isaac is now listening to:{' '}
              <a
                href={playback.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold md:text-xl 2xl:text-2xl text-white sm:hover:underline cursor-pointer "
              >
                {playback.track}
              </a>
              {' by '}
              <a
                href={`https://open.spotify.com/artist/${playback.artist_uri?.split(':')[2]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whitespace-nowrap font-bold md:text-xl 2xl:text-2xl text-white sm:hover:underline cursor-pointer "
              >
                {playback.artist}
              </a>
            </p>

          </div>
          <div className="">
            <div className="w-full h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between 2xl:text-2xl text-gray-500">
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(localDuration)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

}
