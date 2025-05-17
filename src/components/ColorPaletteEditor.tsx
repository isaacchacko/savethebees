import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Reset from './Reset';
import useLocalStorageMulti from '@/hooks/useLocalStorageMulti';

const Circle = dynamic(() => import('@uiw/react-color-circle'), { ssr: false });

const DEFAULT_COLOR = "#10B981";
const ACCENT_COLORS = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
];

const COLOR_KEYS = [
  'primary-color',
  'secondary-color',
  'tertiary-color',
]

interface HSVColor {
  h: number;
  s: number;
  v: number;
  a: number;
}

interface ColorDict {
  [key: string]: string; // a dictionary string -> color strings
}

interface SetColorDict {
  // a type that defines the function we'll
  // use to change values within the ColorDict
  (key: string, value: string): void;
}

export default function ColorPaletteEditor({className=""}: {className?: string}) {
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

  const resetColor = () => {
    const defaultColorHex = getComputedStyle(document.documentElement)
    .getPropertyValue("--default-primary-color").trim();

    applyColor(defaultColorHex);
  };

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
      <div className={className + "slide-down-fade-in ml-3 relative flex flex-row p-3 pl-0 items-center overflow-hidden"}>

        {/* Color Swatch */}
        <div
          className={`w-10 h-10 bg-(--primary-color) flex-none z-20 cursor-pointer border-2 border-gray-300 rounded transition-transform duration-300 hover:scale-100 transition-all duration-300`}
          onClick={() => setVisible(!visible)}
        />

        <div className={`flex items-center transition-transform duration-300 z-0 ${visible ? 'translate-x-0' : '-translate-x-80'}`}>
          <Reset onReset={resetColor}/>
          {
            ACCENT_COLORS.map(
              color => {
                return <div 
                  key={color}
                  onClick={() => applyColor(color)}
                  className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300 hover:scale-110 transition-transform mr-2"
                  style={{ backgroundColor: color }}
                />
              }
            )
          }
        </div>

      </div>
    </>
  );
}
