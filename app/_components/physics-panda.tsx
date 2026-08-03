"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  advancePandaDropSimulation,
  createPandaDropSimulation,
  pandaDropPresentation,
  settledPandaDropBody,
  type PandaDropArena,
  type PandaDropBody,
} from "../_lib/panda-drop-physics";

type PhysicsPandaProps = {
  readonly alt: string;
  readonly isActive: boolean;
  readonly onSettledChange: (isSettled: boolean) => void;
};

function applyBody(element: HTMLImageElement, body: PandaDropBody) {
  element.style.transform = `translate3d(${body.x}px, ${body.y}px, 0)`;
}

export function PhysicsPanda(p: PhysicsPandaProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const floorRef = useRef<HTMLDivElement>(null);
  const pandaRef = useRef<HTMLImageElement>(null);
  const settledChangeRef = useRef(p.onSettledChange);
  const reduceMotion = Boolean(useReducedMotion());

  useEffect(() => {
    settledChangeRef.current = p.onSettledChange;
  }, [p.onSettledChange]);

  useLayoutEffect(() => {
    if (!p.isActive) {
      return;
    }

    const stage = stageRef.current;
    const floor = floorRef.current;
    const panda = pandaRef.current;
    if (!stage || !floor || !panda) {
      return;
    }

    let animationFrame = 0;
    let previousFrame = performance.now();
    let accumulatedSeconds = 0;

    const measureArena = (): PandaDropArena => {
      const stageRect = stage.getBoundingClientRect();
      const pandaSize = panda.getBoundingClientRect().width;

      return {
        floorY: floor.offsetTop - pandaSize,
        height: stageRect.height,
        size: pandaSize,
        width: stageRect.width,
      };
    };

    let arena = measureArena();
    let simulation = createPandaDropSimulation(arena);

    const placeSettledPanda = () => {
      arena = measureArena();
      applyBody(panda, settledPandaDropBody(arena));
      panda.dataset.settled = "true";
    };

    const animate = (frameTime: number) => {
      const frameSeconds = Math.min(
        (frameTime - previousFrame) / 1000,
        pandaDropPresentation.maximumFrameSeconds,
      );
      previousFrame = frameTime;
      accumulatedSeconds += frameSeconds * pandaDropPresentation.timeScale;

      while (
        accumulatedSeconds >= pandaDropPresentation.fixedStepSeconds &&
        !simulation.isSettled
      ) {
        advancePandaDropSimulation(
          simulation,
          pandaDropPresentation.fixedStepSeconds,
        );
        accumulatedSeconds -= pandaDropPresentation.fixedStepSeconds;
      }

      applyBody(panda, simulation.body);

      if (simulation.isSettled) {
        panda.dataset.settled = "true";
        settledChangeRef.current(true);
        return;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      arena = measureArena();
      panda.dataset.settled = "false";
      settledChangeRef.current(false);

      if (reduceMotion) {
        placeSettledPanda();
        settledChangeRef.current(true);
        return;
      }

      simulation = createPandaDropSimulation(arena);
      applyBody(panda, simulation.body);
      previousFrame = performance.now();
      accumulatedSeconds = 0;
      animationFrame = window.requestAnimationFrame(animate);
    };

    let previousDimensions = "";
    const resizeObserver = new ResizeObserver(() => {
      const measuredArena = measureArena();
      const dimensions = [
        Math.round(measuredArena.width),
        Math.round(measuredArena.height),
        Math.round(measuredArena.size * 100) / 100,
      ].join(":");
      if (dimensions === previousDimensions) {
        return;
      }

      previousDimensions = dimensions;
      if (simulation.isSettled || reduceMotion) {
        placeSettledPanda();
      } else {
        start();
      }
    });

    start();
    resizeObserver.observe(stage);
    resizeObserver.observe(panda);

    return () => {
      resizeObserver.disconnect();
      window.cancelAnimationFrame(animationFrame);
    };
  }, [p.isActive, reduceMotion]);

  return (
    <div ref={stageRef} className="panda-physics-stage">
      <Image
        ref={pandaRef}
        className="panda"
        src="/panda.png"
        width={1024}
        height={1024}
        sizes="(max-aspect-ratio: 1/1) 58vw, 46vh"
        alt={p.alt}
        priority
      />
      <div ref={floorRef} className="panda-floor" aria-hidden="true" />
    </div>
  );
}
