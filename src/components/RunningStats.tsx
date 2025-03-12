import React from 'react';
import { Link } from 'next/link';
import StravaLogo from "@/components/StravaLogo";

const BASE_SUBTITLE_CLASS = "font-black mb-4 text-(--primary-color) inline ";

// Define HeaderProps type
interface HeaderProps {
  className?: string;
  text: string;
  href?: string;
}

const Header = ({
  className = "font-bold text-2xl 2xl:text-4xl text-white cursor-pointer pb-2",
  text,
  href = ""
}: HeaderProps): JSX.Element => (
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
    <StravaLogo />
  </div>
);

// Rest of your code...
