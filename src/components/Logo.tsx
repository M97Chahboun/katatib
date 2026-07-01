import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function Logo({ className = "w-10 h-10", size = 40, strokeWidth = 4.5 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} transition-all duration-300`}
    >
      {/* 
        This vector path represents the exact geometric structure of your brand logo:
        - Symmetrical triple-layered open book pages (stepped heights Y=34, 30, 26).
        - Wide aspect ratio for elegant breathing space.
        - Bottom crossed Rehal stand legs with vertical outer cuts.
        - Symmetrical arch merging into the central rising arrow.
      */}
      
      {/* Outer Page Layer 3 */}
      <path
        d="M 20 34 V 62 L 47 71"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 80 34 V 62 L 53 71"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle Page Layer 2 */}
      <path
        d="M 26 30 V 58 L 47 65"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 74 30 V 58 L 53 65"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Innermost Page Layer 1 */}
      {/* Top beautiful curved open book profile */}
      <path
        d="M 32 26 C 38 26 44 36 50 36 C 56 36 62 26 68 26"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Left side and bottom slant */}
      <path
        d="M 32 26 V 54 L 47 59"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right side and bottom slant */}
      <path
        d="M 68 26 V 54 L 53 59"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Rehal Stand Feet */}
      <path
        d="M 30 78 V 70 L 38 78"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 70 78 V 70 L 62 78"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Central Rising Arrow */}
      {/* Curved shaft of the arrow, sweeping from left foot upwards */}
      <path
        d="M 30 78 C 38 74 50 68 50 56 V 48"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Symmetrical crossing stand element */}
      <path
        d="M 70 78 C 62 74 50 68 50 56"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Arrowhead */}
      <path
        d="M 43 55 L 50 48 L 57 55"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
