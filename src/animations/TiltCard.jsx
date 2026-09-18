import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from "framer-motion";

/**
 * TiltCard - High-performance 3D perspective tilt card with spring physics and dynamic glare.
 * 
 * @param {React.ReactNode} children - Card content
 * @param {string} className - Wrapper classes
 * @param {number} maxTilt - Maximum tilt angle in degrees (default: 8)
 * @param {number} perspective - Perspective distance in px (default: 1000)
 * @param {number} scaleOnHover - Scale multiplier on hover (default: 1.015)
 * @param {boolean} glare - Whether to render dynamic cursor glare (default: true)
 * @param {number} glareMaxOpacity - Peak glare opacity (default: 0.28)
 * @param {string} borderRadius - Tailored border radius for glare clipping (default: "rounded-[24px]")
 * @param {boolean} disabled - Disable tilt effect (e.g. for accessibility)
 */
const TiltCard = ({
  children,
  className = "",
  maxTilt = 8,
  perspective = 1000,
  scaleOnHover = 1.015,
  glare = true,
  glareMaxOpacity = 0.28,
  borderRadius = "rounded-[24px]",
  disabled = false,
  style = {},
  ...props
}) => {
  const cardRef = useRef(null);

  // Normalized mouse coordinates: -0.5 (left/top) to +0.5 (right/bottom)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Glare position in percent: 0 to 100
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);

  // Hover state motion value (0 = resting, 1 = hovered)
  const hoverMotion = useMotionValue(0);

  // Buttery-smooth spring physics
  const springConfig = { stiffness: 240, damping: 22, mass: 0.6 };

  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]),
    springConfig
  );
  const scale = useSpring(
    useTransform(hoverMotion, [0, 1], [1, scaleOnHover]),
    springConfig
  );

  // Dynamic radial glare gradient tracking mouse position
  const glareOpacity = useSpring(
    useTransform(hoverMotion, [0, 1], [0, glareMaxOpacity]),
    { stiffness: 200, damping: 25 }
  );
  const glareBackground = useMotionTemplate`radial-gradient(circle 380px at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.45), transparent 75%)`;

  const handleMouseMove = (e) => {
    if (disabled) return;
    // Disable tilt on touch screens to prevent jitter
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xNormalized = clientX / rect.width - 0.5;
    const yNormalized = clientY / rect.height - 0.5;

    mouseX.set(xNormalized);
    mouseY.set(yNormalized);

    glareX.set(Math.round((clientX / rect.width) * 100));
    glareY.set(Math.round((clientY / rect.height) * 100));
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    hoverMotion.set(1);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    mouseX.set(0);
    mouseY.set(0);
    hoverMotion.set(0);
  };

  return (
    <div
      style={{ perspective: `${perspective}px` }}
      className={`relative ${className}`}
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          scale,
          transformStyle: "preserve-3d",
          ...style,
        }}
        className={`relative w-full h-full will-change-transform ${borderRadius}`}
        {...props}
      >
        {children}

        {/* Dynamic 3D Glare / Sheen Overlay */}
        {glare && (
          <motion.div
            aria-hidden="true"
            className={`pointer-events-none absolute inset-0 z-30 ${borderRadius} overflow-hidden mix-blend-overlay`}
            style={{
              opacity: glareOpacity,
              background: glareBackground,
            }}
          />
        )}
      </motion.div>
    </div>
  );
};

export default TiltCard;
