import React from 'react';

const HowWebsite = () => {
  return (
    <div className="w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold">How&apos;d You Make the Website?</h2>
      <div className="text-(--primary-color) leading-relaxed">
        The frontend was made with <span className="text-white">Next.JS</span> and <span className="text-white">Tailwind CSS</span>, and the backend was made with <span className="text-white">Redis</span>. External services were integrated with RESTful API calls and Oauth. Deployment was handled by <span className="text-white">Vercel</span>.
      </div>
      <div className="italic">
        Click anywhere to exit...
      </div>
    </div>
  );
};

export default HowWebsite;
