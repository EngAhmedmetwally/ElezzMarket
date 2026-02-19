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
      <path d="M4 4h16v4H4z" />
      <path d="M4 10h16v4H4z" />
      <path d="M4 16h10v4H4z" />
    </svg>
  );
}
