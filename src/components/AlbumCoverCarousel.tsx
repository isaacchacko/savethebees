import Image from 'next/image';
import React, { useRef, useEffect, useState } from 'react';
import SpotifyLogo from "@/components/SpotifyLogo";

const WIDTH = 300;
const HEIGHT = 300;
const BASE = "p-2";


const Header = ({
  className = "font-bold text-2xl 2xl:text-4xl text-white cursor-pointer pb-2",
  text,
  href = ""
}: HeaderProps) => (
    <div className="flex flex-row justify-between items-center gap-4">
      {href !== "" ? (
        <div className={className}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-white sm:hover:underline cursor-pointer"
          >
            {text}
          </a>
        </div>
      ) : (
          <div className={className}>
            <span>{text}</span>
          </div>
        )}
      <SpotifyLogo />
    </div>
  );

const AlbumCoverCarousel: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const images = Array.from({ length: 30 }, (_, index) => `/carousel/image_${index + 1}.jpg`);
  const [isHovered, setIsHovered] = useState(false);
  const [direction, setDirection] = useState(1); // 1 for right, -1 for left
  const [scrollSpeed, setScrollSpeed] = useState(10); // Initial scroll speed

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: -WIDTH, // Move one album to the left
        behavior: 'smooth',
      });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: WIDTH, // Move one album to the right
        behavior: 'smooth',
      });
    }
  };

  const handleMouseOver = (event: React.MouseEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const rect = image.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateX = (y - HEIGHT / 2) / 10;
    const rotateY = (x - WIDTH / 2) / 10;

    image.style.transform = `perspective(400px) rotate3d(1, -1, 0, ${rotateX}deg) rotate3d(1, 1, 0, ${rotateY}deg) scale(1.05)`;
  };

  const handleMouseOut = (event: React.MouseEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    image.style.transition = 'transform 0.3s';
    image.style.transform = 'perspective(400px) rotate3d(1, -1, 0, 0deg) rotate3d(1, 1, 0, 0deg) scale(1)';
    setTimeout(() => {
      image.style.transition = '';
    }, 300); // Reset transition after animation completes
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    if (isHovered) {
      const image = event.currentTarget;
      const rect = image.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const rotateX = (y - HEIGHT / 2) / 10;
      const rotateY = (x - WIDTH / 2) / 10;

      image.style.transform = `perspective(400px) rotate3d(1, -1, 0, ${rotateX}deg) rotate3d(1, 1, 0, ${rotateY}deg) scale(1.05)`;
    }
  };

  useEffect(() => {
    if (carouselRef.current) {
      let intervalId: NodeJS.Timeout;

      const maxScrollLeft = carouselRef.current.scrollWidth - carouselRef.current.clientWidth;

      const scrollCarousel = () => {
        if (!isHovered && carouselRef.current) {
          const scrollLeft = carouselRef.current.scrollLeft;

          // Smoothly slow down before reversing direction
          if (scrollLeft >= maxScrollLeft || scrollLeft <= 0) {
            setScrollSpeed((prevSpeed) => Math.max(prevSpeed - 0.1, 0)); // Gradually reduce speed
            if (scrollSpeed <= 0) {
              setDirection((prevDirection) => -prevDirection); // Reverse direction
              setScrollSpeed(10); // Reset speed after reversing
            }
          }

          carouselRef.current.scrollBy({
            left: scrollSpeed * direction,
            behavior: 'smooth',
          });
        }
      };

      intervalId = setInterval(scrollCarousel, 20); // Smooth scrolling interval

      return () => clearInterval(intervalId);
    }
  }, [isHovered, direction, scrollSpeed]);

  return (
    <div className="px-4">
      <h2 className="font-black text-white text-2xl 2xl:text-4xl text-white cursor-pointer">
        <Header text="Favorite Album Covers" href="https://open.spotify.com/playlist/4IlbP26s8HFFvcjoYW8oUD?si=4d2e1ef821fa4c8a"/>
      </h2>
      <p>Because some things ARE judged by their cover.</p>
      <hr className="mt-5 mb-5"></hr>
      <div className="px-4">
        <div
          className="relative flex items-center"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left Button */}
          <button
            onClick={scrollLeft}
            className={`absolute left-0 z-10 bg-gray-700 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-600 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            ◀
          </button>

          {/* Carousel */}
          <div
            ref={carouselRef}
            className="scroll flex flex-row overflow-x-scroll overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-gray-200"
            style={{ pointerEvents: 'auto', height: HEIGHT }}
          >
            {images.map((image, index) => (
              <div key={index} className="shrink-0 relative">
                <Image
                  src={image}
                  alt={`Album cover ${index + 1}`}
                  width={WIDTH}
                  height={HEIGHT}
                  className={BASE}
                  onMouseOver={handleMouseOver}
                  onMouseOut={handleMouseOut}
                  onMouseMove={handleMouseMove}
                />
              </div>
            ))}
          </div>

          {/* Right Button */}
          <button
            onClick={scrollRight}
            className={`absolute right-0 z-10 bg-gray-700 text-white rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-600 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlbumCoverCarousel;
