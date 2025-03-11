import { useState } from 'react';

export default function GlowingResetButton({ onReset }: { onReset: () => void }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      className={`group relative transition-all duration-300 ${
        isHovered ? 'drop-shadow-glow' : 'drop-shadow-none'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onReset}
    >
      <svg
        width="40px"
        height="40px"
        viewBox="0 0 76.01 76.01"
        className="transition-transform duration-300 group-hover:scale-105"
      >
        <path
          fill="currentColor"
          className="text-zinc-100 group-hover:text-blue-400 transition-colors duration-300"
          strokeWidth="0.2"
          strokeLinejoin="round"
          d="M25.3362 20.5864L25.3348 29.2137C28.5107 25.8499 33.0116 23.7507 38.0029 23.7507C47.6232 23.7507 55.422 31.5494 55.422 41.1698C55.422 45.9799 53.4723 50.3347 50.32 53.4869L46.401 49.5679C48.5503 47.4187 49.8796 44.4495 49.8796 41.1699C49.8796 34.6106 44.5623 29.2932 38.003 29.2932C34.4855 29.2932 31.3251 30.8224 29.1504 33.2522L38.0029 33.2531L33.2529 38.0031L20.5862 38.0031L20.5862 25.3364L25.3362 20.5864Z"
        />
      </svg>
    </button>
  );
}
