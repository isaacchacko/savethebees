
import { useState } from 'react';
import Image from 'next/image';

export default function Card(
  {
    image,
    text,
    title,
    icon
  }
) {

  // State to track whether the card is flipped
  const [isFlipped, setIsFlipped] = useState(false);
  
  return (
  <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 my-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
    <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
      {/* About Me Text */}
      <div className="text-base leading-relaxed text-center md:text-left">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-8 md:pb-16">
          Tracking
        </h2>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl">
          Life is a video game. Here are some of my stats.
        </p>
      </div>

      {/* Flip Card Container */}
      <div
        className="relative perspective w-[250px] sm:w-[400px] md:w-[600px] lg:w-[800px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Inner Card */}
        <div
          className={`transition-transform duration-500 transform-style-preserve-3d ${
isFlipped ? 'rotate-y-180' : ''
}`}
        >
          {/* Front Side (Image) */}
          <div className="backface-hidden">
            <Image
              src="/profile-picture.jpg"
              alt="Your Name"
              width={1500}
              height={1500}
              className="rounded-lg object-cover scale-90 hover:scale-100 transition-transform duration-300 ring-3 ring-(--tertiary-color)"
            />
          </div>

          {/* Back Side (Blurb Text) */}
          <div className="absolute inset-0 bg-(--tertiary-color) rounded-lg flex items-center justify-center backface-hidden rotate-y-180">
            <p className="text-center px-4 text-sm sm:text-base md:text-lg lg:text-xl">
              ICDC @ Disney Land, April 2024.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
