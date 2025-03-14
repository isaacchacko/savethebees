export default function StravaLogo({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 512 512"
      className={"w-12 h-12" + className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Strava"
    >
      <rect width="512" height="512" rx="15%" fill="#fc4c01" />
      <path fill="#ffffff" d="M120 288L232 56l112 232h-72l-40-96-40 96z" />
      <path fill="#fda580" d="M280 288l32 72 32-72h48l-80 168-80-168z" />
    </svg>
  );
}
