import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import useLocalStorageMulti from '@/hooks/useLocalStorageMulti';
import { BiPalette, BiX } from 'react-icons/bi';

const DEFAULT_COLOR = "#10B981";
const ACCENT_COLORS = [
  "#E60000",
  "#FF781F",
  "#e6ac00",
  "#69b647",
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#10B981", // emerald
];

const COLOR_KEYS = [
  'primary-color',
  'secondary-color',
  'tertiary-color',
]

interface ColorDict {
  [key: string]: string; // a dictionary string -> color strings
}

interface SetColorDict {
  // a type that defines the function we'll
  // use to change values within the ColorDict
  (key: string, value: string): void;
}

export default function ColorPaletteEditor({ className = "" }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  // useLocalStorageMulti takes in keys to attempt to retrieve
  // and then a default value to fall back upon if retrieval fails

  const [colorDict, setColorDict] = useLocalStorageMulti(
    COLOR_KEYS,
    DEFAULT_COLOR
  ) as [ColorDict, SetColorDict];

  useEffect(() => {
    COLOR_KEYS.forEach(
      (key) => {
        document.documentElement.style.setProperty(`--${key}`, colorDict[key]);
      }
    );
  }, [colorDict]);

  const applyColor = (hex: string) => {
    COLOR_KEYS.forEach(
      (key, index) => { // crazy that the second parameter is always an index
        setColorDict(key, dimColor(hex, 1 - 0.1 * index));
      }
    );
  };

  const dimColor = (hex: string, factor: number): string => {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * 1); // * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * 1); // * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * 1); // * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <>
      <div>

        <div className='z-20 cursor-pointer w-10 h-10 scale-80 hover:scale-100 duration-300' onClick={() => setVisible(!visible)}>
          {!(visible) && (<BiPalette className="w-10 h-10 cursor-pointer scale-80 hover:scale-100 duration-300" />)}
          {visible && (<BiX className="w-10 h-10 cursor-pointer scale-80 hover:scale-100 duration-300" />)}

        </div>

        <div className="absolute -translate-x-full overflow-hidden">
          <div className={`flex items-center transition-transform duration-300 ${visible ? 'translate-y-0' : 'translate-y-full'}`}>
            {
              ACCENT_COLORS.map(
                color => {
                  return <div
                    key={color}
                    onClick={() => applyColor(color)}
                    className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-50 dark:border-none scale-80 hover:scale-100 transition-transform mr-2"
                    style={{ backgroundColor: color }}
                  />
                }
              )
            }
          </div>

        </div>

      </div>
    </>
  );
}
