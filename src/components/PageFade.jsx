// src/components/PageFade.jsx
import React from "react";

/**
 * Simple fade-in wrapper for pages.
 * Usage: wrap page content in <PageFade> ... </PageFade>
 * or in App.jsx wrap route element render: <PageFade><Home/></PageFade>
 */
export default function PageFade({ children, duration = 300 }) {
  const style = {
    animation: `pageFadeIn ${duration}ms ease both`,
  };
  return <div style={style} className="page-fade-root">{children}</div>;
}
