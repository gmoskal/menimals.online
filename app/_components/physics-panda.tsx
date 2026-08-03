"use client";

import { animated, to, useSpring } from "@react-spring/web";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  createPandaDropTrajectory,
  samplePandaDropTrajectory,
  type PandaDropArena,
  type PandaDropPose,
  type PandaDropRelease,
  type PandaDropTrajectory,
} from "../_lib/panda-drop-physics";

const AnimatedImage = animated(Image);
const linearEasing = (progress: number) => progress;
const tossGesture = {
  boundaryOverflowRatio: 0.2,
  keyboardVelocityY: -1_050,
  maximumVelocity: 1_800,
  sampleWindowMilliseconds: 120,
  velocityMultiplier: 1.15,
} as const;

type PhysicsPandaProps = {
  readonly alt: string;
  readonly isActive: boolean;
  readonly onSettledChange: (pose: PandaDropPose | null) => void;
};

type PointerSample = {
  readonly atMilliseconds: number;
  readonly x: number;
  readonly y: number;
};

type PandaInteraction =
  | { readonly kind: "playing" }
  | {
      readonly currentPose: PandaDropPose;
      readonly kind: "dragging";
      readonly originPointer: PointerSample;
      readonly originPose: PandaDropPose;
      readonly pointerId: number;
      readonly samples: readonly PointerSample[];
    };

type PandaRuntime = {
  readonly readArena: () => PandaDropArena;
  readonly runTrajectory: (release?: PandaDropRelease) => void;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function poseTransform(pose: PandaDropPose) {
  return [
    `translate3d(${pose.x}px, ${pose.y}px, 0)`,
    `rotate(${pose.angle}rad)`,
  ].join(" ");
}

function pointerSample(event: PointerEvent<HTMLImageElement>): PointerSample {
  return {
    atMilliseconds: event.timeStamp,
    x: event.clientX,
    y: event.clientY,
  };
}

function recentSamples(
  samples: readonly PointerSample[],
  latest: PointerSample,
) {
  const earliestTime =
    latest.atMilliseconds - tossGesture.sampleWindowMilliseconds;

  return [...samples, latest].filter(
    (sample) => sample.atMilliseconds >= earliestTime,
  );
}

function translatedPose(
  interaction: Extract<PandaInteraction, { kind: "dragging" }>,
  sample: PointerSample,
  arena: PandaDropArena,
): PandaDropPose {
  const overflow = arena.size * tossGesture.boundaryOverflowRatio;
  const rawX =
    interaction.originPose.x + sample.x - interaction.originPointer.x;
  const rawY =
    interaction.originPose.y + sample.y - interaction.originPointer.y;
  const x = clamp(rawX, -overflow, arena.width - arena.size + overflow);
  const y = clamp(rawY, -arena.size, arena.height - arena.size + overflow);

  return {
    ...interaction.originPose,
    centerX: interaction.originPose.centerX + x - interaction.originPose.x,
    isSettled: false,
    topY: interaction.originPose.topY + y - interaction.originPose.y,
    x,
    y,
  };
}

function releaseMotion(samples: readonly PointerSample[]) {
  const first = samples[0];
  const last = samples.at(-1) ?? first;
  const elapsedMilliseconds = Math.max(
    last.atMilliseconds - first.atMilliseconds,
    1,
  );
  const velocity = (distance: number) =>
    clamp(
      (distance / elapsedMilliseconds) *
        1_000 *
        tossGesture.velocityMultiplier,
      -tossGesture.maximumVelocity,
      tossGesture.maximumVelocity,
    );

  return {
    angularVelocity: 0,
    velocityX: velocity(last.x - first.x),
    velocityY: velocity(last.y - first.y),
  };
}

export function PhysicsPanda(p: PhysicsPandaProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pandaRef = useRef<HTMLImageElement>(null);
  const trajectoryRef = useRef<PandaDropTrajectory>(null);
  const runtimeRef = useRef<PandaRuntime>(null);
  const interactionRef = useRef<PandaInteraction>({ kind: "playing" });
  const interactionRevisionRef = useRef(0);
  const settledChangeRef = useRef(p.onSettledChange);
  const reduceMotion = Boolean(useReducedMotion());
  const [spring, springApi] = useSpring(() => ({
    interactionRevision: 0,
    playhead: 0,
  }));
  const transform = to(
    [spring.playhead, spring.interactionRevision],
    (playhead) => {
      const interaction = interactionRef.current;
      if (interaction.kind === "dragging") {
        return poseTransform(interaction.currentPose);
      }

      const trajectory = trajectoryRef.current;
      return trajectory
        ? poseTransform(samplePandaDropTrajectory(trajectory, playhead))
        : "translate3d(calc(50vw - var(--panda-size) / 2), -100%, 0) rotate(0rad)";
    },
  );

  const refreshInteraction = () => {
    interactionRevisionRef.current += 1;
    springApi.set({
      interactionRevision: interactionRevisionRef.current,
    });
  };

  const displayedPose = () => {
    const interaction = interactionRef.current;
    if (interaction.kind === "dragging") {
      return interaction.currentPose;
    }

    const trajectory = trajectoryRef.current;
    return trajectory
      ? samplePandaDropTrajectory(trajectory, spring.playhead.get())
      : null;
  };

  const beginDrag = (event: PointerEvent<HTMLImageElement>) => {
    if (!p.isActive) {
      return;
    }

    const pose = displayedPose();
    if (!pose) {
      return;
    }

    springApi.stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "true";
    event.currentTarget.dataset.settled = "false";
    settledChangeRef.current(null);
    const sample = pointerSample(event);
    interactionRef.current = {
      currentPose: { ...pose, isSettled: false },
      kind: "dragging",
      originPointer: sample,
      originPose: pose,
      pointerId: event.pointerId,
      samples: [sample],
    };
    refreshInteraction();
  };

  const moveDrag = (event: PointerEvent<HTMLImageElement>) => {
    const interaction = interactionRef.current;
    const runtime = runtimeRef.current;
    if (
      interaction.kind !== "dragging" ||
      interaction.pointerId !== event.pointerId ||
      !runtime
    ) {
      return;
    }

    const sample = pointerSample(event);
    interactionRef.current = {
      ...interaction,
      currentPose: translatedPose(interaction, sample, runtime.readArena()),
      samples: recentSamples(interaction.samples, sample),
    };
    refreshInteraction();
  };

  const endDrag = (
    event: PointerEvent<HTMLImageElement>,
    inheritsGesture: boolean,
  ) => {
    const interaction = interactionRef.current;
    const runtime = runtimeRef.current;
    if (
      interaction.kind !== "dragging" ||
      interaction.pointerId !== event.pointerId ||
      !runtime
    ) {
      return;
    }

    const samples = recentSamples(interaction.samples, pointerSample(event));
    const release: PandaDropRelease = {
      motion: inheritsGesture
        ? releaseMotion(samples)
        : { angularVelocity: 0, velocityX: 0, velocityY: 0 },
      pose: interaction.currentPose,
    };
    interactionRef.current = { kind: "playing" };
    event.currentTarget.dataset.dragging = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    runtime.runTrajectory(release);
  };

  const tossFromKeyboard = (event: KeyboardEvent<HTMLImageElement>) => {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    const pose = displayedPose();
    const runtime = runtimeRef.current;
    if (!pose || !runtime) {
      return;
    }

    event.preventDefault();
    const release: PandaDropRelease = {
      motion: {
        angularVelocity: 0,
        velocityX: 0,
        velocityY: tossGesture.keyboardVelocityY,
      },
      pose: { ...pose, isSettled: false },
    };
    interactionRef.current = { kind: "playing" };
    runtime.runTrajectory(release);
  };

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

    const readArena = (): PandaDropArena => {
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

    const runTrajectory = (release?: PandaDropRelease) => {
      springApi.stop();
      const currentArena = readArena();
      const trajectory = release
        ? createPandaDropTrajectory(currentArena, Math.random, release)
        : createPandaDropTrajectory(currentArena);
      trajectoryRef.current = trajectory;
      interactionRef.current = { kind: "playing" };
      panda.dataset.dragging = "false";
      panda.dataset.settled = "false";
      settledChangeRef.current(null);
      springApi.set({ playhead: 0 });
      refreshInteraction();

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

    runtimeRef.current = { readArena, runTrajectory };
    let dimensions = "";
    const resizeObserver = new ResizeObserver(() => {
      const arena = readArena();
      const nextDimensions = [
        Math.round(arena.width),
        Math.round(arena.height),
        Math.round(arena.size * 100) / 100,
      ].join(":");
      if (nextDimensions === dimensions) {
        return;
      }

      dimensions = nextDimensions;
      runTrajectory();
    });

    runTrajectory();
    resizeObserver.observe(stage);
    resizeObserver.observe(panda);

    return () => {
      resizeObserver.disconnect();
      runtimeRef.current = null;
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
        aria-label={p.alt}
        draggable={false}
        onKeyDown={tossFromKeyboard}
        onPointerCancel={(event) => endDrag(event, false)}
        onPointerDown={beginDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => endDrag(event, true)}
        role="button"
        tabIndex={0}
        priority
      />
    </div>
  );
}
