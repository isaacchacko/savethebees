'use client';

import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const linkClass =
  'font-semibold text-(--accent) underline decoration-2 underline-offset-[3px] transition-colors hover:text-(--foreground)';

const statLabelClass = 'font-black text-(--primary-color) inline';

interface Activity {
  distance: number;
  start_date: string;
}

function rgbToRgbaVariants(rgb: string): [string, string] {
  if (rgb.startsWith('#')) {
    const hex = rgb.replace('#', '');
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return [`rgba(${r}, ${g}, ${b}, 1)`, `rgba(${r}, ${g}, ${b}, 0.6)`];
  }

  const match = rgb.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
  if (!match) {
    console.warn(`Invalid RGB format: ${rgb}, using default black`);
    return ['rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 0.6)'];
  }

  const [r, g, b] = match.slice(1, 4).map(Number);
  return [`rgba(${r}, ${g}, ${b}, 1)`, `rgba(${r}, ${g}, ${b}, 0.6)`];
}

export default function RunningPage() {
  const [totalMileage, setTotalMileage] = useState(0);
  const [weeklyMileage, setWeeklyMileage] = useState<{ weekLabel: string; mileage: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [primaryColorRgba, setPrimaryColorRgba] = useState('rgba(0, 123, 255, 1)');
  const [primaryColorRgbaFill, setPrimaryColorRgbaFill] = useState('rgba(0, 123, 255, 0.6)');

  useEffect(() => {
    const fetchActivities = async () => {
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch('/api/strava/activities');
          if (!response.ok) {
            if (response.status === 429 && retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
              continue;
            }
            throw new Error(
              `Failed to fetch activities. Reload the page and try again. ${response.status} ${response.statusText}`,
            );
          }

          const data: Activity[] = await response.json();

          const totalMiles = data.reduce((sum, activity) => sum + activity.distance / 1609.34, 0);
          setTotalMileage(totalMiles);

          const weekLabels: { [key: string]: string } = {};
          const startDate = new Date(Math.min(...data.map((a) => new Date(a.start_date).getTime())));
          const endDate = new Date(Math.max(...data.map((a) => new Date(a.start_date).getTime())));

          const allWeeks: { [key: string]: number } = {};
          const currentWeekStart = new Date(startDate);
          currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
          while (currentWeekStart <= endDate) {
            const currentWeekEnd = new Date(currentWeekStart);
            currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

            const weekKey = `${currentWeekStart.toISOString().split('T')[0]}_${currentWeekEnd.toISOString().split('T')[0]}`;
            allWeeks[weekKey] = 0;

            const startWeekLabel = currentWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const endWeekLabel = currentWeekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            weekLabels[weekKey] = `${startWeekLabel} - ${endWeekLabel}`;

            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
          }

          data.forEach((activity) => {
            const date = new Date(activity.start_date);
            const startOfWeek = new Date(date);
            startOfWeek.setDate(date.getDate() - date.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const weekKey = `${startOfWeek.toISOString().split('T')[0]}_${endOfWeek.toISOString().split('T')[0]}`;
            allWeeks[weekKey] = (allWeeks[weekKey] || 0) + activity.distance / 1609.34;
          });

          const weeklyData = Object.keys(allWeeks).map((weekKey) => ({
            weekLabel: weekLabels[weekKey],
            mileage: allWeeks[weekKey],
          }));

          setWeeklyMileage(weeklyData);
          break;
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error('Error fetching activities:', err);
            setError(err.message);
          } else {
            console.error('Unknown error occurred:', err);
            setError('An unknown error occurred.');
          }
          break;
        }
      }
    };

    const init = async () => {
      setError(null);
      await fetchActivities();
    };
    void init();

    if (typeof window !== 'undefined') {
      const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
      if (primaryColor) {
        const [solid, fill] = rgbToRgbaVariants(primaryColor);
        setPrimaryColorRgba(solid);
        setPrimaryColorRgbaFill(fill);
      }
    }
  }, []);

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
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'Weekly running mileage',
        font: { size: 18 },
        color: primaryColorRgba,
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Miles', color: primaryColorRgba },
        beginAtZero: true,
      },
      y: {
        title: { display: true, text: 'Week', color: primaryColorRgba },
        ticks: { display: true },
      },
    },
  };

  const goalMiles = 365;
  const percentage = (totalMileage / goalMiles) * 100;
  const currentDay = new Date().getDate() + new Date().getMonth() * 30;
  const status =
    totalMileage >= currentDay
      ? 'ahead of schedule!'
      : totalMileage < currentDay
        ? 'behind schedule...'
        : 'on schedule!';

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-(--background)">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl px-4 pb-20 pt-8 sm:px-6 sm:pb-24 sm:pt-10 md:px-8 lg:max-w-5xl lg:pt-14">
        <header className="mb-10 space-y-4 sm:mb-12 lg:mb-14">
          <h1 className="text-balance text-3xl font-black tracking-tight text-(--primary-color) sm:text-4xl md:text-5xl">
            Running
          </h1>
          <p className="text-base leading-relaxed text-[var(--foreground)] sm:text-lg md:leading-[1.65]">
            Yearly mileage, weekly volume, and goals! Synced from{' '}
            <a
              href="https://www.strava.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              Strava
            </a>
            .
          </p>
        </header>

        <article className="space-y-10 text-[var(--foreground)] sm:space-y-12">
          <section className="space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-(--primary-color) sm:text-3xl">
              Goals &amp; background
            </h2>
            <p className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              I&apos;ve finished three half marathons so far: one in San Francisco and two in Houston. The next
              target is a full marathon. My goal is to build back consistency until that feels
              realistic. For {year}, I&apos;m aiming for 365 miles on the year.
            </p>
          </section>

          <section className="space-y-4" aria-label="Mileage and weekly volume">
            <h2 className="text-2xl font-bold tracking-tight text-(--primary-color) sm:text-3xl">Mileage</h2>
            <p className="text-base leading-relaxed sm:text-lg md:leading-[1.65]">
              Calendar weeks; values are miles that week. Totals are for {year}.
            </p>
            <hr className="border-[color-mix(in_srgb,var(--foreground)_12%,transparent)]" />

            {error ? (
              <p className="text-red-500">{error}</p>
            ) : (
              <>
                <div className="text-lg sm:text-xl 2xl:text-2xl">
                  <p className={statLabelClass}>Total mileage in {year}: </p>
                  <p className="inline">
                    {totalMileage.toFixed(2)} of 365 miles ({percentage.toFixed(2)}%)
                  </p>
                </div>

                <div className="text-lg sm:text-xl 2xl:text-2xl">
                  <p className={statLabelClass}>Pace vs. a mile per day: </p>
                  <p className="inline">{status}</p>
                </div>

                <div className="md:hidden">
                  <div className="overflow-x-auto rounded-lg">
                    <table className="w-full min-w-[280px] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-[color-mix(in_srgb,var(--foreground)_14%,transparent)]">
                          <th className="py-2 pr-4 font-semibold text-(--primary-color)">Week</th>
                          <th className="py-2 font-semibold text-(--primary-color)">Miles</th>
                        </tr>
                      </thead>
                      <tbody>
                        {weeklyMileage.map((row) => (
                          <tr
                            key={row.weekLabel}
                            className="border-b border-[color-mix(in_srgb,var(--foreground)_8%,transparent)]"
                          >
                            <td className="py-2 pr-4 text-[var(--foreground)]">{row.weekLabel}</td>
                            <td className="py-2 tabular-nums text-[var(--foreground)]">{row.mileage.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="hidden md:mx-auto md:my-10 md:block md:w-full md:max-w-4xl">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </>
            )}
          </section>
        </article>
      </main>
      <Footer />
    </div>
  );
}
