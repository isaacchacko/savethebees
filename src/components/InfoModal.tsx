import React, { useState, useEffect } from 'react';
import HowWebsite from '@/components/HowWebsite';
import FlyingTriangles from '@/components/FlyingTriangles';

const InfoModal = (
  {
    className = ""
  }:
  {
    className?: string;
  }
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [componentKey, setComponentKey] = useState<keyof typeof componentMap | null>(null);

  const componentMap = {
    HowWebsite: <HowWebsite />,
    FlyingTriangles: <FlyingTriangles />,
  };

  const openModal = (key: keyof typeof componentMap) => {
    setComponentKey(key);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setComponentKey(null);
  };

  useEffect(() => {
    const handleEscape = (event: { key: string }) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <div className={` ${className} flex flex-col italic lg:flex-row lg:divide-y-0 mt-10 gap-2 text-(--primary-color) font-black`}>
        <a
          className="hover:underline pointer-events-auto cursor-pointer"
          onClick={() => openModal("HowWebsite")}
        >
          How&apos;d you make the website?
        </a>
        <div className="bg-gray-400 w-full h-1 lg:hidden rounded-lg"></div>
        <span className="text-gray-400 hidden lg:flex">•</span>
        <a
          className="hover:underline pointer-events-auto cursor-pointer"
          onClick={() => openModal("FlyingTriangles")}
        >
          What are the flying triangles?
        </a>
      </div>
      {isOpen && (
        <div className="absolute info bg-clip-padding flex items-center justify-center pointer-events-auto"
          onClick={closeModal}>
          <div
            className="bg-black p-6 rounded-lg w-1/3 min-w-[300px] max-w-[90vw]" // i hate how this is arbitrary but whatever
            onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => e.stopPropagation()}
          >
            {componentKey && componentMap[componentKey]}
          </div>
        </div>
      )}
    </>
  );
};

export default InfoModal;
