import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  PandaDropSimulation,
  createMenimalDropTrajectory,
  giantPandaCollisionPolygon,
  giantPandaDropPhysics,
  matchGameDropPhysics,
  pandaDropPresentation,
} from "../app/_lib/panda-drop-physics.ts";

const projectRoot = new URL("../", import.meta.url);
const leftwardRandomValues = [0.25];
const mobilePandaArena = { width: 390, height: 844, size: 228 };
const sharedMenimalArena = { width: 1_000, height: 844, size: 228 };
const expectedKiwiSizeRatio = 0.75;
const expectedPenguinSizeRatio = 0.825;
const menimalSpawnIntervalMilliseconds = 2_200;
const maximumTossVelocity = 1_800;
const maximumHeavyDropMilliseconds = 1_200;
const maximumNaturalMenimalFallMilliseconds = 650;
const minimumVisibleBounceSizeRatio = 0.1;
const viewportEdgeTolerance = 0.05;

function repeatingRandom(values) {
  let index = 0;

  return () => values[index++ % values.length];
}

function releaseFromArenaCenter(motion) {
  const x = (mobilePandaArena.width - mobilePandaArena.size) / 2;
  const y = (mobilePandaArena.height - mobilePandaArena.size) / 2;

  return {
    motion,
    pose: {
      angle: 0,
      centerX: mobilePandaArena.width / 2,
      isSettled: false,
      topY: y,
      x,
      y,
    },
  };
}

function releaseAt({ motion, size, x, y }) {
  return {
    motion,
    pose: {
      angle: 0,
      centerX: x + size / 2,
      isSettled: false,
      topY: y,
      x,
      y,
    },
  };
}

function bodyExtents(simulation) {
  const xCoordinates = simulation.body.vertices.map((vertex) => vertex.x);
  const yCoordinates = simulation.body.vertices.map((vertex) => vertex.y);

  return {
    bottom: Math.max(...yCoordinates),
    left: Math.min(...xCoordinates),
    right: Math.max(...xCoordinates),
    top: Math.min(...yCoordinates),
  };
}

function firstFallDuration(trajectory, kind) {
  const initialY = trajectory.frames[0].poses[kind].y;
  const firstMoveIndex = trajectory.frames.findIndex(
    (frame) => Math.abs(frame.poses[kind].y - initialY) > 0.001,
  );
  const firstBounceIndex = trajectory.frames.findIndex(
    (frame, index, frames) =>
      index > firstMoveIndex &&
      frame.poses[kind].y < frames[index - 1].poses[kind].y,
  );

  assert.ok(firstMoveIndex >= 0, `${kind} did not start falling`);
  assert.ok(firstBounceIndex > firstMoveIndex, `${kind} did not rebound`);
  return (
    trajectory.frames[firstBounceIndex].atMilliseconds -
    trajectory.frames[firstMoveIndex].atMilliseconds
  );
}

test("social sharing uses a static versioned JPEG like 28gor", async () => {
  const [layout, siteContent, socialImage] = await Promise.all([
    readFile(new URL("app/layout.tsx", projectRoot), "utf8"),
    readFile(new URL("app/_lib/site-content.ts", projectRoot), "utf8"),
    readFile(
      new URL("public/og-image-20260804-02.jpeg", projectRoot),
    ),
  ]);

  assert.match(layout, /summary_large_image/);
  assert.match(layout, /siteSocialImage/);
  assert.match(layout, /siteSocialTwitterImage/);
  assert.match(siteContent, /siteSocialImageVersion = "20260804-02"/);
  assert.match(siteContent, /`\/og-image-\$\{siteSocialImageVersion\}\.jpeg`/);
  assert.match(siteContent, /type: "image\/jpeg"/);
  assert.deepEqual([...socialImage.subarray(0, 3)], [0xff, 0xd8, 0xff]);
});

test("home reveals the App Store scribble after the physical panda settles", async () => {
  const component = await readFile(
    new URL("app/_components/site-page.tsx", projectRoot),
    "utf8",
  );

  assert.match(component, /className="panda-stage"/);
  assert.match(component, /<PhysicsPanda/);
  assert.match(component, /settledPanda \?/);
  assert.match(component, /settledPanda\.centerX/);
  assert.match(component, /settledPanda\.topY/);
  assert.match(component, /<ScribbleAppStoreCta/);
  assert.match(component, /height: 125/);
  assert.match(component, /markerStrokeWidth: 71/);
  assert.match(component, /mobileScale: 0\.72/);
  assert.match(component, /strokeCount: 6/);
  assert.match(component, /width: 470/);
  assert.doesNotMatch(component, /className="brand-mark"/);
  assert.match(component, /className="privacy-shortcut"/);
  assert.doesNotMatch(component, /languageLabel|selectLocale/);
  assert.doesNotMatch(component, /<footer/);
});

test("panda ports the game's rigid-body drop with three times its game mass", () => {
  assert.deepEqual(matchGameDropPhysics, {
    angularDamping: 0.012,
    angularVelocityBase: 1.2,
    angularVelocityImpactMultiplier: 0.2,
    boundaryFriction: 0.48,
    boundaryRestitution: 0.22,
    collisionBodyScale: 0.94,
    dropVelocityBase: 18,
    dropVelocityMaximum: 102,
    dropVelocityRankGrowth: 2.65,
    gravityMagnitude: 13.92,
    heavyStampRestitution: 0.14,
    horizontalVelocityBase: 18,
    horizontalVelocityImpactMultiplier: 4.5,
    impactRankGrowth: 0.055,
    lightStampRestitution: 0.34,
    linearDamping: 0.03,
    massBase: 0.82,
    massGrowth: 1.22,
    massMaximum: 16,
    massMultiplier: 3,
    maximumImpactScale: 2.25,
    maximumInitialRotation: Math.PI / 18,
    stampFriction: 0.52,
  });
  assert.ok(
    Math.abs(giantPandaDropPhysics.downwardVelocity - 41.85) < 0.0001,
  );
  assert.ok(
    Math.abs(giantPandaDropPhysics.horizontalVelocityMagnitude - 24.7275) <
      0.0001,
  );
  assert.ok(
    Math.abs(giantPandaDropPhysics.angularVelocityMagnitude - 1.499) <
      0.0001,
  );
  assert.ok(
    Math.abs(giantPandaDropPhysics.mass - 0.82 * 1.22 ** 9 * 3) < 0.0001,
  );
  assert.equal(giantPandaCollisionPolygon.length, 10);

  const viewports = [
    { width: 1440, height: 900, size: 420 },
    { width: 390, height: 844, size: 228 },
    { width: 320, height: 568, size: 188 },
  ];

  for (const viewport of viewports) {
    const simulation = new PandaDropSimulation(
      viewport,
      repeatingRandom(leftwardRandomValues),
    );
    const initialPose = simulation.pose;
    const initialMotion = simulation.motion;
    let maximumVelocityY = initialMotion.velocityY;
    let bounceCount = 0;
    let previousVelocityY = initialMotion.velocityY;
    let simulatedMilliseconds = 0;

    while (
      !simulation.isSettled &&
      simulatedMilliseconds <
        pandaDropPresentation.reducedMotionSimulationLimitMilliseconds
    ) {
      simulation.step(pandaDropPresentation.fixedStepMilliseconds);
      const motion = simulation.motion;
      maximumVelocityY = Math.max(maximumVelocityY, motion.velocityY);
      if (previousVelocityY > 0 && motion.velocityY < 0) {
        bounceCount += 1;
      }
      previousVelocityY = motion.velocityY;
      simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
    }

    assert.equal(initialPose.angle, 0);
    assert.equal(initialPose.y, -viewport.size);
    assert.ok(initialMotion.velocityX < 0);
    assert.ok(initialMotion.velocityY > 0);
    assert.equal(initialMotion.angularVelocity, 0);
    assert.ok(maximumVelocityY > initialMotion.velocityY);
    assert.ok(bounceCount >= 1);
    assert.equal(simulation.isSettled, true);
    assert.notEqual(simulation.pose.centerX, viewport.width / 2);
    assert.notEqual(simulation.pose.angle, initialPose.angle);
    assert.equal(simulation.body.mass, giantPandaDropPhysics.mass);
    assert.ok(simulation.body.bounds.max.y <= viewport.height + 1);
  }
});

test("panda falls heavily without airborne spin and rolls only after impact", () => {
  const simulation = new PandaDropSimulation(
    mobilePandaArena,
    repeatingRandom(leftwardRandomValues),
  );
  const initialPose = simulation.pose;
  const initialMotion = simulation.motion;
  let airborneAngle = Math.abs(initialPose.angle);
  let firstBounceMilliseconds = null;
  let previousVelocityY = initialMotion.velocityY;
  let wallMilliseconds = 0;

  assert.equal(initialPose.angle, 0);
  assert.equal(initialMotion.angularVelocity, 0);

  while (!simulation.isSettled && wallMilliseconds < 6_000) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    wallMilliseconds +=
      pandaDropPresentation.fixedStepMilliseconds /
      pandaDropPresentation.timeScale;
    const motion = simulation.motion;

    if (firstBounceMilliseconds === null && previousVelocityY > 0) {
      if (motion.velocityY < 0) {
        firstBounceMilliseconds = wallMilliseconds;
      } else {
        airborneAngle = Math.max(airborneAngle, Math.abs(simulation.pose.angle));
      }
    }
    previousVelocityY = motion.velocityY;
  }

  assert.ok(firstBounceMilliseconds !== null);
  assert.ok(firstBounceMilliseconds < 2_700);
  assert.ok(airborneAngle < 0.001);
  assert.ok(Math.abs(simulation.pose.angle) > 0.05);
  assert.equal(simulation.isSettled, true);
  assert.ok(wallMilliseconds < 4_000);
});

test("panda crosses the visible screen at full speed instead of slow motion", () => {
  const simulation = new PandaDropSimulation(
    mobilePandaArena,
    repeatingRandom(leftwardRandomValues),
  );
  let firstVisibleMilliseconds = null;
  let firstImpactMilliseconds = null;
  let previousVelocityY = simulation.motion.velocityY;
  let wallMilliseconds = 0;

  while (firstImpactMilliseconds === null && wallMilliseconds < 6_000) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    wallMilliseconds +=
      pandaDropPresentation.fixedStepMilliseconds /
      pandaDropPresentation.timeScale;
    const motion = simulation.motion;

    if (
      firstVisibleMilliseconds === null &&
      simulation.pose.y + mobilePandaArena.size > 0
    ) {
      firstVisibleMilliseconds = wallMilliseconds;
    }
    if (previousVelocityY > 0 && motion.velocityY < 0) {
      firstImpactMilliseconds = wallMilliseconds;
    }
    previousVelocityY = motion.velocityY;
  }

  assert.ok(firstVisibleMilliseconds !== null);
  assert.ok(firstImpactMilliseconds !== null);
  const visibleDropMilliseconds =
    firstImpactMilliseconds - firstVisibleMilliseconds;
  assert.ok(
    visibleDropMilliseconds <= maximumHeavyDropMilliseconds,
    `visible drop took ${visibleDropMilliseconds.toFixed(0)} ms`,
  );
});

test("panda's first floor impact creates a visibly tall rebound", () => {
  const simulation = new PandaDropSimulation(
    mobilePandaArena,
    repeatingRandom(leftwardRandomValues),
  );
  let impactY = null;
  let reboundTopY = Number.POSITIVE_INFINITY;
  let previousVelocityY = simulation.motion.velocityY;
  let simulatedMilliseconds = 0;

  while (
    simulatedMilliseconds <
    pandaDropPresentation.reducedMotionSimulationLimitMilliseconds
  ) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
    const motion = simulation.motion;

    if (impactY === null && previousVelocityY > 0 && motion.velocityY < 0) {
      impactY = simulation.pose.y;
      reboundTopY = simulation.pose.y;
    } else if (impactY !== null) {
      reboundTopY = Math.min(reboundTopY, simulation.pose.y);
      if (previousVelocityY < 0 && motion.velocityY >= 0) {
        break;
      }
    }
    previousVelocityY = motion.velocityY;
  }

  assert.ok(impactY !== null);
  const reboundHeight = impactY - reboundTopY;
  const minimumReboundHeight =
    mobilePandaArena.size * minimumVisibleBounceSizeRatio;
  assert.ok(
    reboundHeight >= minimumReboundHeight,
    `first rebound rose ${reboundHeight.toFixed(1)} px; expected at least ${minimumReboundHeight.toFixed(1)} px`,
  );
});

test("react-spring presents the sampled rigid-body trajectory", async () => {
  const component = await readFile(
    new URL("app/_components/physics-panda.tsx", projectRoot),
    "utf8",
  );

  assert.match(component, /@react-spring\/web/);
  assert.match(component, /animated\(Image\)/);
  assert.match(component, /playhead/);
});

test("a released panda inherits the toss and falls back under gravity", () => {
  const release = {
    motion: {
      angularVelocity: 0,
      velocityX: 120,
      velocityY: -900,
    },
    pose: {
      angle: 0,
      centerX: mobilePandaArena.width / 2,
      isSettled: false,
      topY: 500,
      x: mobilePandaArena.width / 2 - mobilePandaArena.size / 2,
      y: 500,
    },
  };
  const simulation = new PandaDropSimulation(
    mobilePandaArena,
    repeatingRandom(leftwardRandomValues),
    release,
  );
  let minimumY = simulation.pose.y;
  let startedFalling = false;
  let simulatedMilliseconds = 0;

  assert.ok(Math.abs(simulation.pose.x - release.pose.x) < 0.001);
  assert.ok(Math.abs(simulation.pose.y - release.pose.y) < 0.001);
  assert.ok(simulation.motion.velocityY < -899);

  while (
    !simulation.isSettled &&
    simulatedMilliseconds <
      pandaDropPresentation.reducedMotionSimulationLimitMilliseconds
  ) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
    minimumY = Math.min(minimumY, simulation.pose.y);
    startedFalling ||= simulation.motion.velocityY > 0;
  }

  assert.ok(minimumY < release.pose.y - mobilePandaArena.size * 0.75);
  assert.equal(startedFalling, true);
  assert.equal(simulation.isSettled, true);
});

test("tossed panda rebounds off every viewport edge", () => {
  const edgeCases = [
    {
      distanceFromEdge: (simulation) => bodyExtents(simulation).top,
      name: "top",
      velocity: (motion) => motion.velocityY,
      velocityX: 0,
      velocityY: -maximumTossVelocity,
    },
    {
      distanceFromEdge: (simulation) =>
        mobilePandaArena.height - bodyExtents(simulation).bottom,
      name: "bottom",
      velocity: (motion) => motion.velocityY,
      velocityX: 0,
      velocityY: maximumTossVelocity,
    },
    {
      distanceFromEdge: (simulation) => bodyExtents(simulation).left,
      name: "left",
      velocity: (motion) => motion.velocityX,
      velocityX: -maximumTossVelocity,
      velocityY: 0,
    },
    {
      distanceFromEdge: (simulation) =>
        mobilePandaArena.width - bodyExtents(simulation).right,
      name: "right",
      velocity: (motion) => motion.velocityX,
      velocityX: maximumTossVelocity,
      velocityY: 0,
    },
  ];

  for (const edgeCase of edgeCases) {
    const release = releaseFromArenaCenter({
      angularVelocity: 0,
      velocityX: edgeCase.velocityX,
      velocityY: edgeCase.velocityY,
    });
    const simulation = new PandaDropSimulation(
      mobilePandaArena,
      repeatingRandom(leftwardRandomValues),
      release,
    );
    const initialVelocity = edgeCase.velocity(simulation.motion);
    let minimumDistance = edgeCase.distanceFromEdge(simulation);
    let reversed = false;
    let simulatedMilliseconds = 0;

    while (!reversed && simulatedMilliseconds < 2_500) {
      simulation.step(pandaDropPresentation.fixedStepMilliseconds);
      simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
      minimumDistance = Math.min(
        minimumDistance,
        edgeCase.distanceFromEdge(simulation),
      );
      const velocity = edgeCase.velocity(simulation.motion);
      reversed = initialVelocity < 0 ? velocity > 0 : velocity < 0;
    }

    assert.equal(reversed, true, `${edgeCase.name} edge did not rebound`);
    assert.ok(
      minimumDistance >= -viewportEdgeTolerance,
      `${edgeCase.name} edge was crossed by ${(-minimumDistance).toFixed(1)} px`,
    );
  }
});

test("panda, kiwi, and penguin collide in one Matter world", () => {
  const pandaRelease = releaseAt({
    motion: { angularVelocity: 0, velocityX: 0, velocityY: 0 },
    size: sharedMenimalArena.size,
    x: 20,
    y: 260,
  });
  const kiwiSize = sharedMenimalArena.size * expectedKiwiSizeRatio;
  const kiwiRelease = releaseAt({
    motion: { angularVelocity: 0, velocityX: 600, velocityY: 0 },
    size: kiwiSize,
    x: 300,
    y: 280,
  });
  const penguinSize =
    sharedMenimalArena.size * expectedPenguinSizeRatio;
  const penguinRelease = releaseAt({
    motion: { angularVelocity: 0, velocityX: -600, velocityY: 0 },
    size: penguinSize,
    x: 610,
    y: 270,
  });
  const simulation = new PandaDropSimulation(
    sharedMenimalArena,
    repeatingRandom(leftwardRandomValues),
    pandaRelease,
    { kiwiRelease, penguinRelease },
  );
  const dynamicBodies = simulation.engine.world.bodies.filter(
    (body) => !body.isStatic,
  );
  let simulatedMilliseconds = 0;

  assert.equal(dynamicBodies.length, 3);
  while (!simulation.hasMenimalContact && simulatedMilliseconds < 2_000) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
  }

  assert.equal(simulation.hasMenimalContact, true);
  assert.ok(simulation.penguinMotion.velocityX > 0);
});

test("three menimals enter from the center 2.2 seconds apart", () => {
  const simulation = new PandaDropSimulation(
    sharedMenimalArena,
    repeatingRandom(leftwardRandomValues),
    undefined,
    { staggeredEntrance: true },
  );
  const firstActiveAt = new Map([[1, 0]]);
  let simulatedMilliseconds = 0;

  assert.equal(simulation.pose.centerX, sharedMenimalArena.width / 2);
  assert.equal(simulation.kiwiPose.centerX, sharedMenimalArena.width / 2);
  assert.equal(simulation.penguinPose.centerX, sharedMenimalArena.width / 2);
  while (simulatedMilliseconds < 4_500) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
    const dynamicBodyCount = simulation.engine.world.bodies.filter(
      (body) => !body.isStatic,
    ).length;
    if (!firstActiveAt.has(dynamicBodyCount)) {
      firstActiveAt.set(dynamicBodyCount, simulatedMilliseconds);
    }
  }

  assert.ok(
    Math.abs(firstActiveAt.get(2) - menimalSpawnIntervalMilliseconds) <=
      pandaDropPresentation.fixedStepMilliseconds,
  );
  assert.ok(
    Math.abs(firstActiveAt.get(3) - menimalSpawnIntervalMilliseconds * 2) <=
      pandaDropPresentation.fixedStepMilliseconds,
  );
});

test("the heavier panda reaches its first rebound before the penguin", () => {
  const trajectory = createMenimalDropTrajectory(
    mobilePandaArena,
    () => 0.5,
  );

  assert.ok(
    firstFallDuration(trajectory, "panda") <
      firstFallDuration(trajectory, "penguin"),
  );
});

test("all three menimals complete their first fall at a natural speed", () => {
  const trajectory = createMenimalDropTrajectory(
    mobilePandaArena,
    () => 0.5,
  );

  for (const kind of ["panda", "kiwi", "penguin"]) {
    assert.ok(
      firstFallDuration(trajectory, kind) <
        maximumNaturalMenimalFallMilliseconds,
      `${kind} falls too slowly`,
    );
  }
});

test("an edge toss cannot escape above the side walls", () => {
  const release = {
    motion: {
      angularVelocity: 0,
      velocityX: maximumTossVelocity,
      velocityY: -maximumTossVelocity,
    },
    pose: {
      angle: 0,
      centerX: mobilePandaArena.size / 2,
      isSettled: false,
      topY: -mobilePandaArena.size,
      x: 0,
      y: -mobilePandaArena.size,
    },
  };
  const simulation = new PandaDropSimulation(
    mobilePandaArena,
    repeatingRandom(leftwardRandomValues),
    release,
  );
  let simulatedMilliseconds = 0;

  while (
    !simulation.isSettled &&
    simulatedMilliseconds <
      pandaDropPresentation.reducedMotionSimulationLimitMilliseconds
  ) {
    simulation.step(pandaDropPresentation.fixedStepMilliseconds);
    simulatedMilliseconds += pandaDropPresentation.fixedStepMilliseconds;
  }

  assert.equal(simulation.isSettled, true);
  assert.ok(simulation.body.bounds.min.x >= -2);
  assert.ok(simulation.body.bounds.max.x <= mobilePandaArena.width + 2);
});

test("the panda accepts pointer toss gestures without making the stage draggable", async () => {
  const [component, styles] = await Promise.all([
    readFile(
      new URL("app/_components/physics-panda.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  assert.match(component, /onPointerDown/);
  assert.match(component, /onPointerMove/);
  assert.match(component, /setPointerCapture/);
  assert.match(
    component,
    /createMenimalDropTrajectory\([\s\S]*?releases,/,
  );
  assert.match(styles, /\.panda\s*\{[^}]*touch-action: none;/);
  assert.doesNotMatch(styles, /\.panda-physics-stage\s*\{[^}]*touch-action: none;/);
});

test("all three plush toys expose the same pointer and keyboard toss interaction", async () => {
  const component = await readFile(
    new URL("app/_components/physics-panda.tsx", projectRoot),
    "utf8",
  );

  assert.match(component, /src="\/panda\.png"/);
  assert.match(component, /src="\/kiwi\.png"/);
  assert.match(component, /src="\/pingwin\.png"/);
  assert.match(component, /onPointerDown/);
  assert.match(component, /onKeyDown/);
});

test("physics board is an absolute 100vw by 100vh world at the origin", async () => {
  const [component, styles] = await Promise.all([
    readFile(
      new URL("app/_components/physics-panda.tsx", projectRoot),
      "utf8",
    ),
    readFile(new URL("app/globals.css", projectRoot), "utf8"),
  ]);

  assert.match(styles, /46\.666svh/);
  assert.match(styles, /58\.666vw/);
  assert.match(styles, /\.panda-stage\s*\{[^}]*position: absolute;/);
  assert.match(styles, /\.panda-stage\s*\{[^}]*top: 0;/);
  assert.match(styles, /\.panda-stage\s*\{[^}]*left: 0;/);
  assert.match(styles, /\.panda-stage\s*\{[^}]*width: 100vw;/);
  assert.match(styles, /\.panda-stage\s*\{[^}]*height: 100vh;/);
  assert.match(styles, /\.panda-physics-stage\s*\{[^}]*width: 100vw;/);
  assert.match(styles, /\.panda-physics-stage\s*\{[^}]*height: 100vh;/);
  assert.match(component, /rotate\(/);
  assert.match(component, /size: panda\.offsetWidth/);
  assert.doesNotMatch(component, /floorRef|panda-floor/);
});

test("privacy policy is complete in Polish and English", async () => {
  const content = await readFile(
    new URL("app/_lib/site-content.ts", projectRoot),
    "utf8",
  );

  assert.match(content, /Polityka prywatności/);
  assert.match(content, /Privacy policy/);
  assert.match(content, /Menimals nie zakłada kont/);
  assert.match(content, /Menimals does not create accounts/);
  assert.match(content, /contact@menimals\.online/);
});

test("panda asset is present", async () => {
  await access(new URL("public/panda.png", projectRoot));
});

test("kiwi uses the exact game asset at three quarters of the panda size", async () => {
  const physics = await import("../app/_lib/panda-drop-physics.ts");

  await access(new URL("public/kiwi.png", projectRoot));
  assert.equal(physics.kiwiDropPhysics.sizeRatio, expectedKiwiSizeRatio);
});

test("penguin uses the exact game asset and all three masses are distinct", async () => {
  const physics = await import("../app/_lib/panda-drop-physics.ts");

  await access(new URL("public/pingwin.png", projectRoot));
  assert.equal(
    physics.penguinDropPhysics.sizeRatio,
    expectedPenguinSizeRatio,
  );
  assert.ok(physics.kiwiDropPhysics.mass < physics.penguinDropPhysics.mass);
  assert.ok(
    physics.penguinDropPhysics.mass < physics.giantPandaDropPhysics.mass,
  );
});

test("the exact app icon asset is present", async () => {
  await access(new URL("public/app-icon.png", projectRoot));
});

test("the exact App Store badge mask is present", async () => {
  await access(
    new URL("public/app-store-badge-content-mask.svg", projectRoot),
  );
});
