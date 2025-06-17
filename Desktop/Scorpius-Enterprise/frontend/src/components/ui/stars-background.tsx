"use client";

import React, { useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  vx: number;
  vy: number;
}

interface StarsBackgroundProps {
  className?: string;
  starDensity?: number;
  allStarsTwinkle?: boolean;
  twinkleProbability?: number;
  minTwinkleSpeed?: number;
  maxTwinkleSpeed?: number;
}

export function StarsBackground({
  className,
  starDensity = 0.00015,
  allStarsTwinkle = true,
  twinkleProbability = 0.7,
  minTwinkleSpeed = 0.5,
  maxTwinkleSpeed = 1,
}: StarsBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();

  const generateStars = useCallback(
    (width: number, height: number): Star[] => {
      const area = width * height;
      const numStars = Math.floor(area * starDensity);
      return Array.from({ length: numStars }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 0.8 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
      }));
    },
    [starDensity],
  );

  const updateStars = useCallback(
    (stars: Star[], width: number, height: number) => {
      return stars.map((star) => {
        let newX = star.x + star.vx;
        let newY = star.y + star.vy;

        if (newX < 0 || newX > width) newX = Math.random() * width;
        if (newY < 0 || newY > height) newY = Math.random() * height;

        let newOpacity = star.opacity;
        if (allStarsTwinkle || Math.random() < twinkleProbability) {
          const twinkleSpeed =
            minTwinkleSpeed +
            Math.random() * (maxTwinkleSpeed - minTwinkleSpeed);
          newOpacity += (Math.random() - 0.5) * twinkleSpeed * 0.05;
          newOpacity = Math.max(0.1, Math.min(1, newOpacity));
        }

        return {
          ...star,
          x: newX,
          y: newY,
          opacity: newOpacity,
        };
      });
    },
    [allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed],
  );

  const drawStars = useCallback(
    (ctx: CanvasRenderingContext2D, stars: Star[]) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });
    },
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const updateCanvasSize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;
      starsRef.current = generateStars(width, height);
    };

    updateCanvasSize();

    const animate = () => {
      if (!ctx) return;

      starsRef.current = updateStars(
        starsRef.current,
        canvas.width,
        canvas.height,
      );
      drawStars(ctx, starsRef.current);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [generateStars, updateStars, drawStars]);

  return (
    <canvas
      ref={canvasRef}
      className={cn("absolute inset-0 z-0 h-full w-full", className)}
    />
  );
}
