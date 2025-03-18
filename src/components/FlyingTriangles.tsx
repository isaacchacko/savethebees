import React from 'react';

const FlyingTriangles = () => {
  return (
    <div className="w-full flex flex-col gap-4">
      <h2 className="text-2xl font-bold">What are the flying triangles?</h2>
      <div className="text-(--primary-color) leading-relaxed">
        These flying triangles are called <span className="text-white">Boids</span>, an artificial life program that mimics the flocking patterns of birds. Each ship can only &quot;see&quot; ships in a small radius from itself. Each ship is simple, but by following three basic rules <span className="text-white">(Separation, Alignment, Cohesion)</span>, the ships coalesce into flocks, resembling an intelligent body. <span className="text-white">Try clicking and holding on the background!</span>
      </div>
      <div className="italic">
        Click anywhere to exit...
      </div>
    </div>
  );
};

export default FlyingTriangles;
