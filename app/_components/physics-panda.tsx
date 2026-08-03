"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  PandaDropSimulation,
  pandaDropPresentation,
  type PandaDropArena,
  type PandaDropPose,
} from "../_lib/panda-drop-physics";

type PhysicsPandaProps = {
  readonly alt: string;
  readonly isActive: boolean;
  readonly onSettledChange: (pose: PandaDropPose | null) => void;
};

function applyPose(element: HTMLImageElement, pose: PandaDropPose) {
  element.style.transform = [
    `translate3d(${pose.x}px, ${pose.y}px, 0)`,
    `rotate(${pose.angle}rad)`,
  ].join(" ");
}

export function PhysicsPanda(p: PhysicsPandaProps) {
  const stageRef = useRef<HTMLDivElement>(null);
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
    const panda = pandaRef.current;
    if (!stage || !panda) {
      return;
    }

    let animationFrame = 0;
    let previousFrame = performance.now();
    let accumulatedMilliseconds = 0;

    const arena = (): PandaDropArena => {
      const stageBounds = stage.getBoundingClientRect();

      return {
        height: stageBounds.height,
        size: panda.offsetWidth,
        width: stageBounds.width,
      };
    };

    let simulation = new PandaDropSimulation(arena());

    const settle = () => {
      const pose = simulation.pose;
      applyPose(panda, pose);
      panda.dataset.settled = "true";
      settledChangeRef.current(pose);
    };

    const animate = (frameTime: number) => {
      const frameMilliseconds = Math.min(
        frameTime - previousFrame,
        pandaDropPresentation.maximumFrameMilliseconds,
      );
      previousFrame = frameTime;
      accumulatedMilliseconds +=
        frameMilliseconds * pandaDropPresentation.timeScale;

      while (
        accumulatedMilliseconds >=
          pandaDropPresentation.fixedStepMilliseconds &&
        !simulation.isSettled
      ) {
        simulation.step(pandaDropPresentation.fixedStepMilliseconds);
        accumulatedMilliseconds -=
          pandaDropPresentation.fixedStepMilliseconds;
      }

      applyPose(panda, simulation.pose);

      if (simulation.isSettled) {
        settle();
        return;
      }

      animationFrame = window.requestAnimationFrame(animate);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      simulation = new PandaDropSimulation(arena());
      panda.dataset.settled = "false";
      settledChangeRef.current(null);
      applyPose(panda, simulation.pose);

      if (reduceMotion) {
        let simulatedMilliseconds = 0;
        while (
          !simulation.isSettled &&
          simulatedMilliseconds <
            pandaDropPresentation.reducedMotionSimulationLimitMilliseconds
        ) {
          simulation.step(pandaDropPresentation.fixedStepMilliseconds);
          simulatedMilliseconds +=
            pandaDropPresentation.fixedStepMilliseconds;
        }
        settle();
        return;
      }

      previousFrame = performance.now();
      accumulatedMilliseconds = 0;
      animationFrame = window.requestAnimationFrame(animate);
    };

    let dimensions = "";
    const resizeObserver = new ResizeObserver(() => {
      const measuredArena = arena();
      const nextDimensions = [
        Math.round(measuredArena.width),
        Math.round(measuredArena.height),
        Math.round(measuredArena.size * 100) / 100,
      ].join(":");
      if (nextDimensions === dimensions) {
        return;
      }

      dimensions = nextDimensions;
      start();
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
    </div>
  );
}
