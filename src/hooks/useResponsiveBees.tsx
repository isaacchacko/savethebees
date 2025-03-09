
import { useState, useEffect } from "react";

export default function useResponsiveBees() {
  const [numBees, setNumBees] = useState(100); // Default value for small screens

  useEffect(() => {
    const updateNumBees = () => {
      const width = window.innerWidth;

      if (width < 640) {
        setNumBees(50); // Small screens
      } else if (width >= 640 && width < 768) {
        setNumBees(100); // Medium screens
      } else if (width >= 768) {
        setNumBees(300); // Large screens
      }
    };

    updateNumBees(); // Initial check
    window.addEventListener("resize", updateNumBees); // Update on resize

    return () => window.removeEventListener("resize", updateNumBees); // Cleanup
  }, []);

  return numBees;
}
