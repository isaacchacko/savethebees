import React, { useState, useEffect } from 'react';
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex, hexToHsva } from '@uiw/color-convert';
import Reset from './Reset';

const DEFAULT_HEADER_COLOR = "#10B981";

export default function ColorPaletteEditor() {
  const [headerColorHSVA, setHeaderColorHSVA] = useState({ h: 214, s: 0, v: 100, a: 1 });
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const headerHex = getComputedStyle(document.documentElement)
        .getPropertyValue("--header-color")
        .trim() || DEFAULT_HEADER_COLOR;
      setHeaderColorHSVA(hexToHsva(headerHex));
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);
  
  const resetColorHSVA = () => {
    const defaultColorHex = getComputedStyle(document.documentElement).getPropertyValue("--default-header-color").trim();
    document.documentElement.style.setProperty('--header-color', defaultColorHex);
    setHeaderColorHSVA(hexToHsva(defaultColorHex));
    
    // Update derived colors
    const dimmedColor = dimColor(defaultColorHex, 0.8);
    const dimmestColor = dimColor(defaultColorHex, 0.6);
    document.documentElement.style.setProperty('--paragraph-color', dimmedColor);
    document.documentElement.style.setProperty('--boid-color', dimmestColor);
  }

  const handleHeaderColorChange = (color: { hsva: any }) => {
    const headerColorHex = hsvaToHex(color.hsva);
    document.documentElement.style.setProperty('--header-color', headerColorHex);
    setHeaderColorHSVA(color.hsva);
    
    // Update derived colors
    const dimmedColor = dimColor(headerColorHex, 0.8);
    const dimmestColor = dimColor(headerColorHex, 0.6);
    document.documentElement.style.setProperty('--paragraph-color', dimmedColor);
    document.documentElement.style.setProperty('--boid-color', dimmestColor);
  };

  const dimColor = (hex: string, factor: number): string => {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex flex-row p-3 pl-0 items-center overflow-hidden">
      {/* Color Swatch Trigger */}
      <div

        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex-none scale-90 z-20 cursor-pointer border-2 border-gray-300 rounded shadow-md transition-transform duration-300 hover:scale-100 transition-all duration-300`}
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: hsvaToHex(headerColorHSVA),
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
