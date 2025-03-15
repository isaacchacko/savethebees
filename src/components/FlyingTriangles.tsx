
import React from 'react';

const FlyingTriangles = () => {
  return (
    <div className="">
      <h2 className="whitespace-nowrap text-2xl font-bold mb-4">What are the flying triangles?</h2>
      <div className="text-(--primary-color) leading-relaxed">
        These flying triangles are called <p className="text-white inline">Boids</p>, an artifical life program that mimicks the flocking patterns of birds. Each ship can only &quot;see&quot; ships in small radius from itself. Each ship is dumb, but by following three simple rules <p className="text-white inline">(Separation, Alignment, Cohesion)</p>, the ships coalesce into flocks, resembling an intelligent body. <p className="text-white inline">Try clicking and holding on the background!</p>
      </div>
      <div className="mt-5 italic">
        Click anywhere to exit...
      </div>
    </div>
  );
};

export default FlyingTriangles;
