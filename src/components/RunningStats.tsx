import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto'; // Required for Chart.js
import StravaLogo from "@/components/StravaLogo";

const BASE_SUBTITLE_CLASS = "font-black mb-4 text-(--primary-color) inline ";

// Define HeaderProps type
interface HeaderProps {
  className?: string;
  text: string;
  href?: string;
}

const Header = ({
  className = "font-bold text-2xl 2xl:text-4xl text-white cursor-pointer pb-2",
  text,
  href = ""
}: HeaderProps) => (
  <div className="flex flex-row justify-between items-center gap-4">
    {href !== "" ? (
      <div className={className}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-black text-white sm:hover:underline cursor-pointer"
        >
          {text}
        </a>
      </div>
    ) : (
      <div className={className}>
        <span>{text}</span>
      </div>
    )}
      <StravaLogo />
  </div>
);

interface Activity {
  distance: number; // Distance in meters
  start_date: string; // ISO date string
}

const RunningStats = () => {
  const [totalMileage, setTotalMileage] = useState(0);
  const [weeklyMileage, setWeeklyMileage] = useState<{ weekLabel: string; mileage: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [primaryColorRgba, setPrimaryColorRgba] = useState<string>('rgba(0, 123, 255, 1)'); // Default color
  const [primaryColorRgbaFill, setPrimaryColorRgbaFill] = useState<string>('rgba(0, 123, 255, 0.6)'); // Default fill color
  const [isSmallScreen, setIsSmallScreen] = useState(false); // small screen stuff

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Assuming md breakpoint is 768px
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Function to convert hex to RGBA
  function hexToRgba(hexColor: string, alpha = 1): string {
    const hex = hexColor.replace(/^#/, '');
    const rgb = {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };

    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }

  // Function to fetch activities from the API endpoint
  const fetchActivities = async () => {
    let retryCount = 0;
    const maxRetries = 2; // Retry once

    while (retryCount <= maxRetries) {
      try {
        const response = await fetch('/api/strava/activities');
        if (!response.ok) {
          if (response.status === 429 && retryCount < maxRetries) {
            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
            continue;
          }

          throw new Error(`Failed to fetch activities. Reload the page and try again. ${response.status} ${response.statusText}`);
        }

        const data: Activity[] = await response.json();

        // Calculate total mileage
        const totalMiles = data.reduce((sum, activity) => sum + activity.distance / 1609.34, 0); // Convert meters to miles
        setTotalMileage(totalMiles);

        // Calculate weekly mileage with week labels
        const weekLabels: { [key: string]: string } = {};

        // Determine start and end dates for activities
        const startDate = new Date(Math.min(...data.map((activity) => new Date(activity.start_date).getTime())));
        const endDate = new Date(Math.max(...data.map((activity) => new Date(activity.start_date).getTime())));

        // Generate all weeks in the range
        const allWeeks: { [key: string]: number } = {};
        const currentWeekStart = new Date(startDate);
        currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay()); // Start of the week (Sunday)
        while (currentWeekStart <= endDate) {
          const currentWeekEnd = new Date(currentWeekStart);
          currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // End of the week (Saturday)

          const weekKey = `${currentWeekStart.toISOString().split('T')[0]}_${currentWeekEnd.toISOString().split('T')[0]}`;
          allWeeks[weekKey] = 0; // Initialize mileage for each week to 0

          // Generate label without year
          const startWeekLabel = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endWeekLabel = currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          weekLabels[weekKey] = `${startWeekLabel} - ${endWeekLabel}`;

          // Move to the next week
          currentWeekStart.setDate(currentWeekStart.getDate() + 7);
        }

        // Update mileage for weeks with activities
        data.forEach((activity) => {
          const date = new Date(activity.start_date);
          const startOfWeek = new Date(date);
          startOfWeek.setDate(date.getDate() - date.getDay()); // Start of the week (Sunday)
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6); // End of the week (Saturday)

          const weekKey = `${startOfWeek.toISOString().split('T')[0]}_${endOfWeek.toISOString().split('T')[0]}`;
          allWeeks[weekKey] = (allWeeks[weekKey] || 0) + activity.distance / 1609.34; // Convert meters to miles
        });

        // Prepare weekly mileage data with labels
        const weeklyData = Object.keys(allWeeks).map((weekKey) => ({
          weekLabel: weekLabels[weekKey],
          mileage: allWeeks[weekKey],
        }));

        setWeeklyMileage(weeklyData);
        break; // Exit loop if successful
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('Error fetching activities:', err);
          setError(err.message);
        } else {
          console.error('Unknown error occurred:', err);
          setError('An unknown error occurred.');
        }
        break; // Exit loop if failed after retries
      }
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setError(null); // Clear previous errors
      await fetchActivities();
    };

    initializeData();

    // Extract CSS variables dynamically after component mounts
    if (typeof window !== 'undefined') {
      const primaryColorHex = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
      
      if (primaryColorHex) {
        setPrimaryColorRgba(hexToRgba(primaryColorHex));
        setPrimaryColorRgbaFill(hexToRgba(primaryColorHex, 0.6));
      }
    }
  }, []);

  // Bar chart data and options
  const chartData = {
    labels: weeklyMileage.map((item) => item.weekLabel),
    datasets: [
      {
        data: weeklyMileage.map((item) => item.mileage),
        backgroundColor: primaryColorRgbaFill,
        borderColor: primaryColorRgba,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: 'y' as const, // Set indexAxis to 'y'
    plugins: {
      legend: { display: false }, // Remove legend
      title: {
        display: true,
        text: 'Weekly Running Mileage', // Graph title
        font: { size: 18 },
        color: primaryColorRgba, // Use primary color for title
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Mileage', color: primaryColorRgba }, // X-axis label
        beginAtZero: true,
      },
      y: {
        title: { display: true, text: 'Weeks', color: primaryColorRgba }, // Y-axis label
        ticks: {
          display: !isSmallScreen, // Hide labels on small screens
        },
      },
    },
  };

  // Calculate percentage and status
  const goalMiles = 365;
  const percentage = (totalMileage / goalMiles) * 100;
  const currentDay = new Date().getDate() + new Date().getMonth() * 30; // Approximate day of the year
  const status = totalMileage >= currentDay ? "ahead of schedule!" : totalMileage < currentDay ? "behind schedule..." : "on schedule!";

  return (
    <div className="relative font-sans bg-(--spotify-background) rounded-lg shadow">
      <Header text="Running"/>
      <p>I love to run! I&apos;ve ran two half-marathons in the past, one in SF and another in Houston. Although my next goal is to run a <i>full</i> marathon, I&apos;ve definitely fallen off. I will have to make up some ground before I&apos;m marathon ready. My goal for 2025 is to run 365 miles.</p>
      <hr className="mt-5 mb-5"></hr>
      {error ? (
        <p className="text-red-500 mb-4">{error}</p>
      ) : (
        <>
            <div className="2xl:text-3xl">
              <p className={BASE_SUBTITLE_CLASS}>Total Mileage in {new Date().getFullYear()}: </p> 
              <p className="inline  ">{totalMileage.toFixed(2)} of 365 miles ({percentage.toFixed(2)}%)</p>
            </div>

            <div className="2xl:text-3xl">
              <p className={BASE_SUBTITLE_CLASS}>Current Status: </p>
              <p className="inline">{status}</p>
            </div>

          <div className="w-full max-w-4xl mx-auto my-10">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </>
      )}
    </div>
  );
};

export default RunningStats;
