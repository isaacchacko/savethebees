import React, { useState, useEffect } from 'react';
import rgbHex from 'rgb-hex';
import useLocalStorageMulti from '@/hooks/useLocalStorageMulti';

const DEFAULT_COLOR = "#10b981";
const ACCENT_COLORS = [
  "#3b82f6", // blue
  "#e60000", // red
  "#ff781f", // orange
  "#e6ac00", // yellow
  "#69b647", // green
  "#8b5cf6", // violet
  "#10b981", // emerald
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

export default function ColorPaletteEditor({ hide = false, widthHeight = "" }: { hide?: boolean; widthHeight?: string }) {
  const [colorDict, setColorDict] = useLocalStorageMulti(
    COLOR_KEYS,
    DEFAULT_COLOR
  ) as [ColorDict, SetColorDict];
  const [index, setIndex] = useState(0);


  function isRgbString(str: string) {
    return typeof str === "string" && /^rgb\(\s*\d+,\s*\d+,\s*\d+\s*\)$/.test(str);
  }

  useEffect(() => {
    const primary = colorDict['primary-color'];
    if (isRgbString(primary)) {
      const idx = ACCENT_COLORS.indexOf(`#${rgbHex(primary)}`);
      setIndex(idx > -1 ? idx : 0);
    }
  }, []);

  const next = () => {
    setIndex((prev) => (prev + 1) % ACCENT_COLORS.length);
  }

  useEffect(() => {
    COLOR_KEYS.forEach(
      (key, colorKeyIndex) => {
        setColorDict(key, dimColor(ACCENT_COLORS[index], 1 - 0.1 * colorKeyIndex));
      }
    )
  }, [index]);

  useEffect(() => {
    COLOR_KEYS.forEach(
      key => {
        document.documentElement.style.setProperty(`--${key}`, colorDict[key]);
      }
    );
  }, [colorDict]);

  const dimColor = (hex: string, factor: number): string => {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * 1 * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * 1 * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * 1 * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <>
      <div>
        <div key="color" onClick={() => next()} className={` ${hide ? "hidden" : ""} ${widthHeight} bg-(--primary-color) rounded-full cursor-pointer border-2 border-gray-50 dark:border-none scale-80 hover:scale-100 transition-transform `}></div>
      </div>
    </>
  );
}
