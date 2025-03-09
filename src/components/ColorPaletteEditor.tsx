
import React, { useState, useEffect } from 'react'; // Added useEffect
import Wheel from '@uiw/react-color-wheel';
import { hsvaToHex, hexToHsva } from '@uiw/color-convert';

const DEFAULT_HEADER_COLOR = "#10B981"; // Tailwind green-500

export default function ColorPaletteEditor() {
  const [headerColorHSVA, setHeaderColorHSVA] = useState({ h: 0, s: 100, v: 100, a: 1 }); // More vibrant initial color
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  useEffect(() => {
    // Delay retrieval until after component mounts
    const timeoutId = setTimeout(() => {
      const headerHex =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--header-color")
          .trim() || DEFAULT_HEADER_COLOR; // Fallback if variable is not set

      setHeaderColorHSVA(hexToHsva(headerHex));
    }, 0); // Delay execution to ensure DOM is ready

    return () => clearTimeout(timeoutId); // Cleanup timeout
  }, []);

  const handleHeaderColorChange = (color: { hsva: any }) => {
    setHeaderColorHSVA(color.hsva);
    const headerColorHex = hsvaToHex(color.hsva);
    document.documentElement.style.setProperty('--header-color', headerColorHex);

    const dimmedColor = dimColor(headerColorHex, 0.8);
    document.documentElement.style.setProperty('--paragraph-color', headerColorHex);
    
    // Set boid color to dimmer version
    const dimmestColor = dimColor(headerColorHex, 0.6);
    document.documentElement.style.setProperty('--boid-color', dimmestColor);
  };

  const dimColor = (hex: string, factor: number): string => {
    const r = Math.round(parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.round(parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.round(parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div>
      <div
        className="cursor-pointer border-2 border-gray-300 rounded shadow-md"
        style={{
          width: '40px',
          height: '40px',
          backgroundColor: hsvaToHex(headerColorHSVA),
        }}
        onClick={() => setIsPickerVisible(!isPickerVisible)}
      />
      
      {/* Color picker dropdown */}
      {isPickerVisible && (
        <div className="absolute top-full">
          <Wheel
            color={headerColorHSVA}
            onChange={handleHeaderColorChange}
            width={160}
            height={160}
          />
        </div>
      )}
    </div>
  );
}
