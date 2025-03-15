import React, { useState, useEffect } from 'react';
import HowWebsite from '@/components/HowWebsite';
import FlyingTriangles from '@/components/FlyingTriangles';

const InfoModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [componentKey, setComponentKey] = useState(null);

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
    const handleEscape = (event : {key: string}) => {
      if (event.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row mt-10 gap-2 text-(--primary-color) font-black">
        <a
          className="hover:underline pointer-events-auto cursor-pointer"
          onClick={() => openModal("HowWebsite")}
        >
          How&apos;d you make the website?
        </a>
        <span className="text-gray-400 hidden lg:flex">•</span>
        <a
          className="hover:underline pointer-events-auto cursor-pointer"
          onClick={() => openModal("FlyingTriangles")}
        >
          What are the flying triangles?
        </a>
      </div>
      {isOpen && (
        <div
          className="info bg-clip-padding bg-black fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col p-6 rounded-lg w-full-1/3 pointer-events-auto"
          onClick={closeModal}
        >
          <div
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
