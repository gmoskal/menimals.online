import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  PandaDropSimulation,
  giantPandaCollisionPolygon,
  giantPandaDropPhysics,
  matchGameDropPhysics,
  pandaDropPresentation,
} from "../app/_lib/panda-drop-physics.ts";

const projectRoot = new URL("../", import.meta.url);
const leftwardRandomValues = [0.25];
const mobilePandaArena = { width: 390, height: 844, size: 228 };
const maximumHeavyDropMilliseconds = 1_200;
const minimumVisibleBounceSizeRatio = 0.1;

function repeatingRandom(values) {
  let index = 0;

  return () => values[index++ % values.length];
}

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
  assert.match(component, /className="brand-mark"/);
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

test("the exact app icon asset is present", async () => {
  await access(new URL("public/app-icon.png", projectRoot));
});

test("the exact App Store badge mask is present", async () => {
  await access(
    new URL("public/app-store-badge-content-mask.svg", projectRoot),
  );
});
