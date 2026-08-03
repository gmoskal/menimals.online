"use client";

import { animated, useSpring } from "@react-spring/web";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
  createPandaDropTrajectory,
  samplePandaDropTrajectory,
  type PandaDropArena,
  type PandaDropPose,
  type PandaDropTrajectory,
} from "../_lib/panda-drop-physics";

const AnimatedImage = animated(Image);
const linearEasing = (progress: number) => progress;

type PhysicsPandaProps = {
  readonly alt: string;
  readonly isActive: boolean;
  readonly onSettledChange: (pose: PandaDropPose | null) => void;
};

function poseTransform(pose: PandaDropPose) {
  return [
    `translate3d(${pose.x}px, ${pose.y}px, 0)`,
    `rotate(${pose.angle}rad)`,
  ].join(" ");
}

export function PhysicsPanda(p: PhysicsPandaProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pandaRef = useRef<HTMLImageElement>(null);
  const trajectoryRef = useRef<PandaDropTrajectory>(null);
  const settledChangeRef = useRef(p.onSettledChange);
  const reduceMotion = Boolean(useReducedMotion());
  const [spring, springApi] = useSpring(() => ({ playhead: 0 }));
  const transform = spring.playhead.to((playhead) => {
    const trajectory = trajectoryRef.current;

    return trajectory
      ? poseTransform(samplePandaDropTrajectory(trajectory, playhead))
      : "translate3d(calc(50vw - var(--panda-size) / 2), -100%, 0) rotate(0rad)";
  });

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

    const arena = (): PandaDropArena => {
      const stageBounds = stage.getBoundingClientRect();

      return {
        height: stageBounds.height,
        size: panda.offsetWidth,
        width: stageBounds.width,
      };
    };

    const settle = (trajectory: PandaDropTrajectory) => {
      panda.dataset.settled = "true";
      settledChangeRef.current(trajectory.finalPose);
    };

    const start = () => {
      springApi.stop();
      const trajectory = createPandaDropTrajectory(arena());
      trajectoryRef.current = trajectory;
      panda.dataset.settled = "false";
      settledChangeRef.current(null);
      springApi.set({ playhead: 0 });

      if (reduceMotion) {
        springApi.set({ playhead: trajectory.durationMilliseconds });
        settle(trajectory);
        return;
      }

      void springApi.start({
        playhead: trajectory.durationMilliseconds,
        config: {
          duration: trajectory.durationMilliseconds,
          easing: linearEasing,
        },
        onRest: (result) => {
          if (result.finished && trajectoryRef.current === trajectory) {
            settle(trajectory);
          }
        },
      });
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
      springApi.stop();
    };
  }, [p.isActive, reduceMotion, springApi]);

  return (
    <div ref={stageRef} className="panda-physics-stage">
      <AnimatedImage
        ref={pandaRef}
        className="panda"
        style={{ transform }}
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
