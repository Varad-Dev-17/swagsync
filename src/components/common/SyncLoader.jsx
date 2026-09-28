import React from "react";
import { motion } from "framer-motion";

/**
 * SyncLoader - High-performance (60fps GPU-accelerated) 3-dot wave loader.
 * Zero external library dependencies (uses framer-motion already installed in project).
 *
 * @param {string} [color="#FD7100"] - Dot background color (hex, rgb, or 'currentColor').
 * @param {number} [size=8] - Diameter of each dot in pixels.
 * @param {number} [gap=5] - Gap between dots in pixels.
 * @param {number} [speedMultiplier=1] - Multiplier for animation speed (1 = default, 1.5 = faster).
 * @param {number} [distance] - Bounce height in pixels (defaults to size * 0.75).
 * @param {string} [className=""] - Additional classes for the container.
 */
const SyncLoader = ({
  color = "#FD7100",
  size = 8,
  gap = 5,
  speedMultiplier = 1,
  distance,
  className = "",
  ...props
}) => {
  const bounceHeight = distance ?? Math.max(4, Math.round(size * 0.75));
  const duration = 0.65 / Math.max(speedMultiplier, 0.1);

  return (
    <div
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${className}`}
      style={{ gap: `${gap}px` }}
      {...props}
    >
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="rounded-full inline-block will-change-transform"
          style={{
            width: size,
            height: size,
            backgroundColor: color,
          }}
          animate={{
            y: [0, -bounceHeight, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * (0.14 / Math.max(speedMultiplier, 0.1)),
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default SyncLoader;
