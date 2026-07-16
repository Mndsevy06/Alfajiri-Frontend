export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Hexagon */}
      <path
        d="M100 15L173.61 57.5V142.5L100 185L26.3898 142.5V57.5L100 15Z"
        fill="currentColor"
        fillOpacity="0.15"
      />
      {/* Middle Hexagon */}
      <path
        d="M100 35L156.29 67.5V132.5L100 165L43.7103 132.5V67.5L100 35Z"
        fill="currentColor"
        fillOpacity="0.3"
      />
      {/* Inner Hexagon */}
      <path
        d="M100 55L138.97 77.5V122.5L100 145L61.0287 122.5V77.5L100 55Z"
        fill="currentColor"
      />
      {/* Letter F cut out */}
      <path
        d="M85 80H115V93H100V105H110V118H100V135H85V80Z"
        fill="white"
        style={{ fill: 'var(--background, white)' }}
      />
    </svg>
  );
}
