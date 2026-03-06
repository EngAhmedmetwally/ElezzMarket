
"use client";

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  inverted?: boolean;
}

/**
 * Logo component for "Al-Ezz Market".
 * Features clear "العز" text and "جبنة مش أي جبنة" subtext.
 * Colors: Royal Green (#007F4E) and Cream (#FDE6A6).
 * Inverted mode: Black background and White text.
 */
export function Logo({ className, inverted = false }: LogoProps) {
  const circleColor = inverted ? "#000000" : "#FDE6A6";
  const textColor = inverted ? "#FFFFFF" : "#007F4E";

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-full w-full", className)}
    >
      <title>العز ماركت - جبنة مش أي جبنة</title>
      
      {/* Background Circle */}
      <circle cx="256" cy="256" r="250" fill={circleColor} />
      
      {/* Main Text "العز" - Bold and Clear */}
      <text
        x="256"
        y="280"
        textAnchor="middle"
        fill={textColor}
        style={{
          fontSize: '160px',
          fontWeight: '900',
          fontFamily: 'Cairo, sans-serif'
        }}
      >
        العز
      </text>

      {/* Curved subtext "جبنة مش أي جبنة" */}
      <defs>
        <path
          id="textCurve"
          d="M 100,380 A 160,160 0 0,0 412,380"
        />
      </defs>
      <text
        fill={textColor}
        style={{
          fontSize: '34px',
          fontWeight: '700',
          fontFamily: 'Cairo, sans-serif'
        }}
      >
        <textPath xlinkHref="#textCurve" startOffset="50%" textAnchor="middle">
          جبنة مش أي جبنة
        </textPath>
      </text>
    </svg>
  );
}
