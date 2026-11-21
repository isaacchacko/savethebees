"use client";

import { useEffect, useState } from "react";

// A city seen from above: buildings, streets, water and parks from OpenStreetMap, as a wireframe.
// One city is picked per visit and kept for the session, so moving between pages keeps the same map.
// Coordinates in the files are meters from the city's center, north up.
const HALF = 1400;
const SESSION_KEY = "city";

type City = { buildings: number[][]; major: number[][]; minor: number[][]; areas: number[][] };

const path = (flat: number[], close = false) => {
  let d = `M${flat[0]} ${flat[1]}`;
  for (let i = 2; i < flat.length; i += 2) d += `L${flat[i]} ${flat[i + 1]}`;
  return close ? `${d}Z` : d;
};

async function pickCity(): Promise<City> {
  let key: string | null = null;
  try {
    key = sessionStorage.getItem(SESSION_KEY);
  } catch {}
  if (!key) {
    const index: { key: string }[] = await fetch("/cities/index.json").then((r) => r.json());
    key = index[Math.floor(Math.random() * index.length)].key;
    try {
      sessionStorage.setItem(SESSION_KEY, key);
    } catch {}
  }
  return fetch(`/cities/${key}.json`).then((r) => r.json());
}

export default function CityMap() {
  const [city, setCity] = useState<City | null>(null);

  useEffect(() => {
    pickCity().then(setCity, () => {});
  }, []);

  return (
    <figure className="city" aria-hidden="true">
      {city && (
        <>
          <svg viewBox={`${-HALF} ${-HALF} ${HALF * 2} ${HALF * 2}`} preserveAspectRatio="xMidYMid slice">
            <path className="areas" d={city.areas.map((a) => path(a, true)).join("")} />
            <path className="buildings" d={city.buildings.map((b) => path(b, true)).join("")} />
            <path className="minor" d={city.minor.map((r) => path(r)).join("")} />
            <path className="major" d={city.major.map((r) => path(r)).join("")} />
          </svg>
          <figcaption>
            ©{" "}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" tabIndex={-1}>
              OpenStreetMap
            </a>{" "}
            contributors
          </figcaption>
        </>
      )}
    </figure>
  );
}
