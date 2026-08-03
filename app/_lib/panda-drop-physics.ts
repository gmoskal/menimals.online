const matchGameBaseVelocity = 18;
const velocitySearchIterations = 36;

export const matchGameDropPhysics = {
  angularDamping: 0.012,
  angularVelocityBase: 1.2,
  angularVelocityImpactMultiplier: 0.2,
  boundaryFriction: 0.48,
  boundaryRestitution: 0.22,
  collisionBodyScale: 0.94,
  dropVelocityBase: matchGameBaseVelocity,
  gravityMagnitude: 13.92,
  horizontalVelocityBase: matchGameBaseVelocity,
  horizontalVelocityImpactMultiplier: 4.5,
  linearDamping: 0.03,
  stampFriction: 0.52,
} as const;

export const pandaDropPresentation = {
  fixedStepSeconds: 1 / 120,
  maximumFrameSeconds: 1 / 30,
  maximumSimulationSeconds: 36,
  minimumBounceSpeed: 40,
  referenceSceneHeight: 844,
  timeScale: 3.6,
} as const;

export type PandaDropArena = {
  readonly floorY: number;
  readonly height: number;
  readonly size: number;
  readonly width: number;
};

export type PandaDropBody = {
  angle: number;
  angularVelocity: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
};

export type PandaDropSimulation = {
  readonly arena: PandaDropArena;
  body: PandaDropBody;
  readonly gravity: number;
  isSettled: boolean;
};

function approachZero(value: number, amount: number) {
  if (Math.abs(value) <= amount) {
    return 0;
  }

  return value - Math.sign(value) * amount;
}

function sceneScale(arena: PandaDropArena) {
  return arena.height / pandaDropPresentation.referenceSceneHeight;
}

function initialAngularVelocity(velocityX: number, scale: number) {
  const impact = Math.max(
    0,
    (velocityX / scale - matchGameDropPhysics.horizontalVelocityBase) /
      matchGameDropPhysics.horizontalVelocityImpactMultiplier,
  );

  return (
    matchGameDropPhysics.angularVelocityBase +
    impact * matchGameDropPhysics.angularVelocityImpactMultiplier
  );
}

function simulateHorizontalTravel(
  arena: PandaDropArena,
  velocityX: number,
) {
  const simulation = runSimulation(createSimulation(arena, 0, velocityX));

  return simulation.body.x;
}

function runSimulation(simulation: PandaDropSimulation) {
  const maximumSteps = Math.ceil(
    pandaDropPresentation.maximumSimulationSeconds /
      pandaDropPresentation.fixedStepSeconds,
  );

  for (let step = 0; step < maximumSteps; step += 1) {
    advancePandaDropSimulation(
      simulation,
      pandaDropPresentation.fixedStepSeconds,
    );
    if (simulation.isSettled) {
      break;
    }
  }

  return simulation;
}

function solveInitialVelocity(arena: PandaDropArena, travel: number) {
  const scale = sceneScale(arena);
  let lowerVelocity = 0;
  let upperVelocity = 220 * scale;

  for (let attempt = 0; attempt < velocitySearchIterations; attempt += 1) {
    const velocity = (lowerVelocity + upperVelocity) / 2;
    if (simulateHorizontalTravel(arena, velocity) < travel) {
      lowerVelocity = velocity;
    } else {
      upperVelocity = velocity;
    }
  }

  return (lowerVelocity + upperVelocity) / 2;
}

function solveInitialAngularVelocity(
  arena: PandaDropArena,
  velocityX: number,
) {
  const scale = sceneScale(arena);
  const gameAngularVelocity = initialAngularVelocity(velocityX, scale);
  const gameFinalAngle = runSimulation(
    createSimulation(arena, 0, velocityX, gameAngularVelocity),
  ).body.angle;
  const fullTurn = Math.PI * 2;
  const targetAngle = Math.max(
    fullTurn,
    Math.round(gameFinalAngle / fullTurn) * fullTurn,
  );
  let lowerVelocity = 0;
  let upperVelocity = 12;

  for (let attempt = 0; attempt < velocitySearchIterations; attempt += 1) {
    const angularVelocity = (lowerVelocity + upperVelocity) / 2;
    const finalAngle = runSimulation(
      createSimulation(arena, 0, velocityX, angularVelocity),
    ).body.angle;
    if (finalAngle < targetAngle) {
      lowerVelocity = angularVelocity;
    } else {
      upperVelocity = angularVelocity;
    }
  }

  return (lowerVelocity + upperVelocity) / 2;
}

function createSimulation(
  arena: PandaDropArena,
  startX: number,
  velocityX: number,
  angularVelocity = initialAngularVelocity(velocityX, sceneScale(arena)),
): PandaDropSimulation {
  const scale = sceneScale(arena);

  return {
    arena,
    body: {
      angle: 0,
      angularVelocity,
      velocityX,
      velocityY: matchGameDropPhysics.dropVelocityBase * scale,
      x: startX,
      y: -arena.size * 1.12,
    },
    gravity: matchGameDropPhysics.gravityMagnitude * scale,
    isSettled: false,
  };
}

export function createPandaDropSimulation(
  arena: PandaDropArena,
): PandaDropSimulation {
  const targetX = (arena.width - arena.size) / 2;
  const leftInset = Math.max(14, arena.width * 0.04);
  const maximumTravel = Math.max(0, targetX - leftInset);
  const desiredTravel = Math.min(
    maximumTravel,
    Math.max(arena.size * 1.08, arena.width * 0.18),
  );
  const startX = targetX - desiredTravel;
  const velocityX = solveInitialVelocity(arena, desiredTravel);
  const angularVelocity = solveInitialAngularVelocity(arena, velocityX);

  return createSimulation(arena, startX, velocityX, angularVelocity);
}

export function settledPandaDropBody(arena: PandaDropArena): PandaDropBody {
  return {
    angle: 0,
    angularVelocity: 0,
    velocityX: 0,
    velocityY: 0,
    x: (arena.width - arena.size) / 2,
    y: arena.floorY,
  };
}

export function advancePandaDropSimulation(
  simulation: PandaDropSimulation,
  seconds: number,
) {
  if (simulation.isSettled) {
    return;
  }

  const body = simulation.body;
  const scale = sceneScale(simulation.arena);
  const linearDamping = Math.exp(
    -matchGameDropPhysics.linearDamping * seconds,
  );
  const angularDamping = Math.exp(
    -matchGameDropPhysics.angularDamping * seconds,
  );

  body.velocityY += simulation.gravity * seconds;
  body.velocityX *= linearDamping;
  body.velocityY *= linearDamping;
  body.angularVelocity *= angularDamping;
  body.x += body.velocityX * seconds;
  body.y += body.velocityY * seconds;

  let isOnFloor = false;
  if (body.y >= simulation.arena.floorY) {
    body.y = simulation.arena.floorY;
    const minimumBounceSpeed =
      pandaDropPresentation.minimumBounceSpeed * scale;

    if (body.velocityY > minimumBounceSpeed) {
      body.velocityY =
        -body.velocityY * matchGameDropPhysics.boundaryRestitution;
    } else {
      body.velocityY = 0;
      isOnFloor = true;
    }
  }

  if (isOnFloor) {
    const contactFriction =
      (matchGameDropPhysics.stampFriction +
        matchGameDropPhysics.boundaryFriction) /
      2;
    body.velocityX = approachZero(
      body.velocityX,
      contactFriction * simulation.gravity * seconds,
    );
    const collisionRadius =
      (simulation.arena.size * matchGameDropPhysics.collisionBodyScale) / 2;
    body.angularVelocity = body.velocityX / collisionRadius;
  }

  body.angle += body.angularVelocity * seconds;
  simulation.isSettled =
    isOnFloor && body.velocityX === 0 && body.angularVelocity === 0;
}
