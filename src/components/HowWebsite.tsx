
import React from 'react';

const HowWebsite = () => {
  return (
    <div className="">
      <h2 className="whitespace-nowrap text-2xl font-bold mb-4">How&apos;d You Make the Website?</h2>
      <div className="text-(--primary-color) leading-relaxed">
        The frontend was made with <p className="text-white inline">Next.JS</p> and <p className="text-white inline">Tailwind CSS</p>, and the backend was made with <p className="text-white inline">Redis</p>. External services were integrated with RESTful API calls and Oauth. Deployment was handled by <p className="text-white inline">Vercel</p>.
      </div>
      <div className="mt-5 italic">
        Click anywhere to exit...
      </div>
    </div>
  );
};

export default HowWebsite;
