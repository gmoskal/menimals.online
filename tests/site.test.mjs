import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  advancePandaDropSimulation,
  createPandaDropSimulation,
  matchGameDropPhysics,
  pandaDropPresentation,
} from "../app/_lib/panda-drop-physics.ts";

const projectRoot = new URL("../", import.meta.url);

test("home reveals the App Store scribble after the physical panda settles", async () => {
  const component = await readFile(
    new URL("app/_components/site-page.tsx", projectRoot),
    "utf8",
  );

  assert.match(component, /className="panda-stage"/);
  assert.match(component, /<PhysicsPanda/);
  assert.match(component, /isPandaSettled \?/);
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

test("panda uses the production game physics and settles centered after one bounce", () => {
  assert.deepEqual(matchGameDropPhysics, {
    angularDamping: 0.012,
    angularVelocityBase: 1.2,
    angularVelocityImpactMultiplier: 0.2,
    boundaryFriction: 0.48,
    boundaryRestitution: 0.22,
    collisionBodyScale: 0.94,
    dropVelocityBase: 18,
    gravityMagnitude: 13.92,
    horizontalVelocityBase: 18,
    horizontalVelocityImpactMultiplier: 4.5,
    linearDamping: 0.03,
    stampFriction: 0.52,
  });

  const viewports = [
    { width: 1440, height: 900, size: 210 },
    { width: 390, height: 844, size: 114 },
    { width: 320, height: 568, size: 94 },
  ];

  for (const viewport of viewports) {
    const arena = {
      ...viewport,
      floorY: viewport.height - viewport.size - 14,
    };
    const simulation = createPandaDropSimulation(arena);
    const initialY = simulation.body.y;
    let bounceCount = 0;
    let simulatedSeconds = 0;

    while (
      !simulation.isSettled &&
      simulatedSeconds < pandaDropPresentation.maximumSimulationSeconds
    ) {
      const velocityY = simulation.body.velocityY;
      advancePandaDropSimulation(
        simulation,
        pandaDropPresentation.fixedStepSeconds,
      );
      if (velocityY > 0 && simulation.body.velocityY < 0) {
        bounceCount += 1;
      }
      simulatedSeconds += pandaDropPresentation.fixedStepSeconds;
    }

    assert.ok(initialY < -viewport.size);
    assert.equal(bounceCount, 1);
    assert.equal(simulation.isSettled, true);
    assert.ok(
      Math.abs(simulation.body.x - (viewport.width - viewport.size) / 2) <
        0.001,
    );
    assert.equal(simulation.body.y, arena.floorY);
    assert.ok(
      Math.abs(simulation.body.angle / (Math.PI * 2) - 3) < 0.001,
    );
  }
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
