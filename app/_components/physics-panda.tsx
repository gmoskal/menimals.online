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
  createMenimalDropTrajectory,
  menimalDropConfig,
  menimalKinds,
  sampleMenimalDropTrajectory,
  type MenimalDropReleases,
  type MenimalDropTrajectory,
  type MenimalKind,
  type PandaDropArena,
  type PandaDropMotion,
  type PandaDropPose,
  type PandaDropRelease,
} from "../_lib/panda-drop-physics";

const AnimatedImage = animated(Image);
const linearEasing = (progress: number) => progress;
const stoppedMotion = {
  angularVelocity: 0,
  velocityX: 0,
  velocityY: 0,
} as const satisfies PandaDropMotion;
const tossGesture = {
  keyboardVelocityY: -1_050,
  maximumVelocity: 1_800,
  sampleWindowMilliseconds: 120,
  velocityMultiplier: 1.15,
} as const;
const companionNames = {
  kiwi: "Kiwi",
  penguin: "Penguin",
} as const satisfies Record<Exclude<MenimalKind, "panda">, string>;

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

type PlushInteraction =
  | { readonly type: "playing" }
  | {
      readonly currentPose: PandaDropPose;
      readonly menimal: MenimalKind;
      readonly originPointer: PointerSample;
      readonly originPose: PandaDropPose;
      readonly pointerId: number;
      readonly samples: readonly PointerSample[];
      readonly type: "dragging";
    };

type MenimalToss = {
  readonly kind: MenimalKind;
  readonly release: PandaDropRelease;
};

type MenimalRuntime = {
  readonly readArena: () => PandaDropArena;
  readonly runTrajectory: (toss?: MenimalToss) => void;
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

function menimalSize(kind: MenimalKind, arena: PandaDropArena) {
  return arena.size * menimalDropConfig[kind].sizeRatio;
}

function translatedPose(
  interaction: Extract<PlushInteraction, { type: "dragging" }>,
  sample: PointerSample,
  arena: PandaDropArena,
) {
  const size = menimalSize(interaction.menimal, arena);
  const rawX =
    interaction.originPose.x + sample.x - interaction.originPointer.x;
  const rawY =
    interaction.originPose.y + sample.y - interaction.originPointer.y;
  const x = clamp(rawX, 0, Math.max(arena.width - size, 0));
  const y = clamp(rawY, 0, Math.max(arena.height - size, 0));

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
  const menimalRefs = useRef<Record<MenimalKind, HTMLImageElement | null>>({
    kiwi: null,
    panda: null,
    penguin: null,
  });
  const trajectoryRef = useRef<MenimalDropTrajectory>(null);
  const runtimeRef = useRef<MenimalRuntime>(null);
  const interactionRef = useRef<PlushInteraction>({ type: "playing" });
  const interactionRevisionRef = useRef(0);
  const settledChangeRef = useRef(p.onSettledChange);
  const reduceMotion = Boolean(useReducedMotion());
  const [spring, springApi] = useSpring(() => ({
    interactionRevision: 0,
    playhead: 0,
  }));

  const displayedPose = (kind: MenimalKind) => {
    const interaction = interactionRef.current;
    if (interaction.type === "dragging" && interaction.menimal === kind) {
      return interaction.currentPose;
    }

    const trajectory = trajectoryRef.current;
    return trajectory
      ? sampleMenimalDropTrajectory(trajectory, spring.playhead.get())[kind]
      : null;
  };

  const transformFor = (kind: MenimalKind) =>
    to([spring.playhead, spring.interactionRevision], (playhead) => {
      const interaction = interactionRef.current;
      if (interaction.type === "dragging" && interaction.menimal === kind) {
        return poseTransform(interaction.currentPose);
      }

      const trajectory = trajectoryRef.current;
      if (trajectory) {
        return poseTransform(
          sampleMenimalDropTrajectory(trajectory, playhead)[kind],
        );
      }

      const config = menimalDropConfig[kind];
      return `translate3d(calc(${config.initialCenterXRatio * 100}vw - 50%), -160%, 0) rotate(0rad)`;
    });

  const pandaTransform = transformFor("panda");
  const kiwiTransform = transformFor("kiwi");
  const penguinTransform = transformFor("penguin");

  const refreshInteraction = () => {
    interactionRevisionRef.current += 1;
    springApi.set({ interactionRevision: interactionRevisionRef.current });
  };

  const beginDrag = (
    kind: MenimalKind,
    event: PointerEvent<HTMLImageElement>,
  ) => {
    if (!p.isActive) {
      return;
    }

    const pose = displayedPose(kind);
    if (!pose) {
      return;
    }

    springApi.stop();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.dataset.dragging = "true";
    settledChangeRef.current(null);
    const sample = pointerSample(event);
    interactionRef.current = {
      currentPose: { ...pose, isSettled: false },
      menimal: kind,
      originPointer: sample,
      originPose: pose,
      pointerId: event.pointerId,
      samples: [sample],
      type: "dragging",
    };
    refreshInteraction();
  };

  const moveDrag = (event: PointerEvent<HTMLImageElement>) => {
    const interaction = interactionRef.current;
    const runtime = runtimeRef.current;
    if (
      interaction.type !== "dragging" ||
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
      interaction.type !== "dragging" ||
      interaction.pointerId !== event.pointerId ||
      !runtime
    ) {
      return;
    }

    const samples = recentSamples(interaction.samples, pointerSample(event));
    const toss: MenimalToss = {
      kind: interaction.menimal,
      release: {
        motion: inheritsGesture ? releaseMotion(samples) : stoppedMotion,
        pose: interaction.currentPose,
      },
    };
    event.currentTarget.dataset.dragging = "false";
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    runtime.runTrajectory(toss);
  };

  const tossFromKeyboard = (
    kind: MenimalKind,
    event: KeyboardEvent<HTMLImageElement>,
  ) => {
    if (event.key !== " " && event.key !== "Enter") {
      return;
    }

    const pose = displayedPose(kind);
    const runtime = runtimeRef.current;
    if (!pose || !runtime) {
      return;
    }

    event.preventDefault();
    runtime.runTrajectory({
      kind,
      release: {
        motion: {
          ...stoppedMotion,
          velocityY: tossGesture.keyboardVelocityY,
        },
        pose: { ...pose, isSettled: false },
      },
    });
  };

  const imageInteractionProps = (kind: MenimalKind) => ({
    "aria-label": kind === "panda" ? p.alt : companionNames[kind],
    className: `panda panda--${kind}`,
    draggable: false,
    onKeyDown: (event: KeyboardEvent<HTMLImageElement>) =>
      tossFromKeyboard(kind, event),
    onPointerCancel: (event: PointerEvent<HTMLImageElement>) =>
      endDrag(event, false),
    onPointerDown: (event: PointerEvent<HTMLImageElement>) =>
      beginDrag(kind, event),
    onPointerMove: moveDrag,
    onPointerUp: (event: PointerEvent<HTMLImageElement>) =>
      endDrag(event, true),
    ref: (element: HTMLImageElement | null) => {
      menimalRefs.current[kind] = element;
    },
    role: "button",
    tabIndex: 0,
  });

  useEffect(() => {
    settledChangeRef.current = p.onSettledChange;
  }, [p.onSettledChange]);

  useLayoutEffect(() => {
    if (!p.isActive) {
      return;
    }

    const stage = stageRef.current;
    const panda = menimalRefs.current.panda;
    const kiwi = menimalRefs.current.kiwi;
    const penguin = menimalRefs.current.penguin;
    if (!stage || !panda || !kiwi || !penguin) {
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

    const settle = (trajectory: MenimalDropTrajectory) => {
      for (const kind of menimalKinds) {
        const element = menimalRefs.current[kind];
        if (element) {
          element.dataset.settled = "true";
        }
      }
      settledChangeRef.current(trajectory.finalPoses.panda);
    };

    const runTrajectory = (toss?: MenimalToss) => {
      springApi.stop();
      const currentArena = readArena();
      const releases = toss
        ? Object.fromEntries(
            menimalKinds.map((kind) => {
              const pose = displayedPose(kind);
              if (!pose) {
                throw new Error(`Missing ${kind} pose`);
              }

              return [
                kind,
                kind === toss.kind
                  ? toss.release
                  : { motion: stoppedMotion, pose },
              ];
            }),
          ) as MenimalDropReleases
        : undefined;
      const trajectory = createMenimalDropTrajectory(
        currentArena,
        Math.random,
        releases,
      );
      trajectoryRef.current = trajectory;
      interactionRef.current = { type: "playing" };
      for (const kind of menimalKinds) {
        const element = menimalRefs.current[kind];
        if (element) {
          element.dataset.dragging = "false";
          element.dataset.settled = "false";
        }
      }
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
        {...imageInteractionProps("panda")}
        style={{ transform: pandaTransform }}
        src="/panda.png"
        width={1024}
        height={1024}
        sizes="(max-aspect-ratio: 1/1) 58vw, 46vh"
        alt={p.alt}
        priority
      />
      <AnimatedImage
        {...imageInteractionProps("kiwi")}
        style={{
          transform: kiwiTransform,
          width: `calc(var(--panda-size) * ${menimalDropConfig.kiwi.sizeRatio})`,
        }}
        src="/kiwi.png"
        width={1024}
        height={1024}
        sizes="(max-aspect-ratio: 1/1) 44vw, 35vh"
        alt="Kiwi"
        priority
      />
      <AnimatedImage
        {...imageInteractionProps("penguin")}
        style={{
          transform: penguinTransform,
          width: `calc(var(--panda-size) * ${menimalDropConfig.penguin.sizeRatio})`,
        }}
        src="/pingwin.png"
        width={1024}
        height={1024}
        sizes="(max-aspect-ratio: 1/1) 48vw, 38vh"
        alt="Penguin"
        priority
      />
    </div>
  );
}
