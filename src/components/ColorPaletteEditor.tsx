import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { hsvaToHex, hexToHsva } from '@uiw/color-convert';
import Reset from './Reset';
import useLocalStorageMulti from '@/hooks/useLocalStorageMulti';

const Wheel = dynamic(() => import('@uiw/react-color-wheel'), { ssr: false });

const DEFAULT_HEADER_COLOR = "#10B981";
const DEFAULT_SECONDARY_COLOR = "#059669";
const DEFAULT_TERTIARY_COLOR = "#047857";

interface HSVColor {
  h: number;
  s: number;
  v: number;
  a: number;
}

interface ColorObject {
  [key: string]: string; // Define colors as an object with string keys
}

interface SetColorsFunction {
  (key: string, value: string): void; // Define setColors as a function
}

export default function ColorPaletteEditor() {
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const [colors, setColors] = useLocalStorageMulti(
    ['primary-color', 'secondary-color', 'tertiary-color'],
    { 
      'primary-color': DEFAULT_HEADER_COLOR, 
      'secondary-color': DEFAULT_SECONDARY_COLOR, 
      'tertiary-color': DEFAULT_TERTIARY_COLOR 
    }
  );

  // Ensure colors is an object
  const colorObject = colors as ColorObject;

  // Ensure setColors is a function
  const setColorsFunction = setColors as SetColorsFunction;

  // Add a fallback for undefined values
  const primaryColor = colorObject['primary-color'] || DEFAULT_HEADER_COLOR;

  // Ensure primaryColor is valid before passing it to hexToHsva
  const headerColorHSVA = hexToHsva(primaryColor);

  const [swatchColor, setSwatchColor] = useState(DEFAULT_HEADER_COLOR); // Separate state for swatch color

  // Set dynamic styles after hydration
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', colorObject['primary-color'] || DEFAULT_HEADER_COLOR);
    document.documentElement.style.setProperty('--secondary-color', colorObject['secondary-color'] || DEFAULT_SECONDARY_COLOR);
    document.documentElement.style.setProperty('--tertiary-color', colorObject['tertiary-color'] || DEFAULT_TERTIARY_COLOR);
    setSwatchColor(colorObject['primary-color'] || DEFAULT_HEADER_COLOR); // Update swatch color after hydration
  }, [colors]);

  const resetColorHSVA = () => {
    const defaultColorHex = getComputedStyle(document.documentElement).getPropertyValue("--default-primary-color").trim();
    setColorsFunction('primary-color', defaultColorHex);
    setColorsFunction('secondary-color', dimColor(defaultColorHex, 0.8));
    setColorsFunction('tertiary-color', dimColor(defaultColorHex, 0.6));
  };

  const handleHeaderColorChange = (color: { hsva: HSVColor }) => {
    const newColorHex = hsvaToHex(color.hsva);
    setColorsFunction('primary-color', newColorHex);
    setColorsFunction('secondary-color', dimColor(newColorHex, 0.8));
    setColorsFunction('tertiary-color', dimColor(newColorHex, 0.6));
  };

  const dimColor = (hex: string, factor: number): string => {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="slide-down-fade-in ml-3 relative flex flex-row p-3 pl-0 items-center overflow-hidden">
      {/* Color Swatch Trigger */}
      <div
        className={`flex-none scale-90 z-20 cursor-pointer border-2 border-gray-300 rounded shadow-md transition-transform duration-300 hover:scale-100 transition-all duration-300`}
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: swatchColor, // Use hydrated swatch color
        }}
        onClick={() => setIsPickerVisible(!isPickerVisible)}
      />
      {/* Controls Container */}
      <div className={`flex items-center transition-transform duration-300 z-0 ${
        isPickerVisible ? 'translate-x-0' : '-translate-x-80'
      }`}>
        <Reset onReset={resetColorHSVA}/>
        <div className="">
          <Wheel
            color={headerColorHSVA}
            onChange={handleHeaderColorChange}
            width={40}
            height={40}
          />
        </div>
      </div>

    </div>
  );
}
