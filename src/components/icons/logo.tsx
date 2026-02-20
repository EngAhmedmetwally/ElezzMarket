
import * as React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>ElEzz Market Logo</title>
      <defs>
        <mask id="text-mask-logo">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <text x="12" y="17.5" fontFamily="Cairo, sans-serif" fontWeight="bold" fontSize="8" text-anchor="middle" fill="black">العز</text>
        </mask>
      </defs>
      {/* Awning */}
      <path d="M2 7h20v2H2z" />
      {/* Awning Stripes */}
      <path d="M3 7h1v2H3z" />
      <path d="M5 7h1v2H5z" />
      <path d="M7 7h1v2H7z" />
      <path d="M9 7h1v2H9z" />
      <path d="M11 7h1v2H11z" />
      <path d="M13 7h1v2H13z" />
      <path d="M15 7h1v2H15z" />
      <path d="M17 7h1v2H17z" />
      <path d="M19 7h1v2H19z" />
      <path d="M21 7h1v2H21z" />
      {/* Building with text cut out */}
      <path d="M4 10h16v11H4z" mask="url(#text-mask-logo)" />
    </svg>
  );
}
