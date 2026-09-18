import React, { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

/**
 * MagneticButton - Tactile magnetic button wrapper that snaps towards the mouse cursor.
 * 
 * @param {React.ReactNode} children - Button element
 * @param {string} className - Wrapper classes
 * @param {number} strength - Pull strength multiplier (default: 0.28)
 * @param {number} maxDistance - Maximum magnetic pull offset in px (default: 16)
 * @param {object} springConfig - Spring configuration for smooth pull & snap back
 */
const MagneticButton = ({
  children,
  className = "",
  strength = 0.28,
  maxDistance = 16,
  springConfig = { stiffness: 320, damping: 18, mass: 0.4 },
  style = {},
  ...props
}) => {
  const buttonRef = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e) => {
    // Disable magnetic snap on touch screens
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = (e.clientX - centerX) * strength;
    let deltaY = (e.clientY - centerY) * strength;

    // Clamp displacement to keep interaction refined
    deltaX = Math.max(-maxDistance, Math.min(maxDistance, deltaX));
    deltaY = Math.max(-maxDistance, Math.min(maxDistance, deltaY));

    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: springX,
        y: springY,
        transformStyle: "preserve-3d",
        ...style,
      }}
      className={`inline-block will-change-transform ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default MagneticButton;
