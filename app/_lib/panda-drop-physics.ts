const giantPandaTierIndex = 9;
const maximumRegularTierIndex = 12;

export const matchGameDropPhysics = {
  boundaryRestitution: 0.22,
  collisionBodyScale: 0.94,
  dropVelocityBase: 18,
  dropVelocityMaximum: 102,
  dropVelocityRankGrowth: 2.65,
  gravityMagnitude: 13.92,
  heavyStampRestitution: 0.14,
  lightStampRestitution: 0.34,
  linearDamping: 0.03,
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
  velocityY: number;
  x: number;
  y: number;
};

export type PandaDropSimulation = {
  readonly arena: PandaDropArena;
  body: PandaDropBody;
  bounceCount: number;
  readonly gravity: number;
  isSettled: boolean;
};

function sceneScale(arena: PandaDropArena) {
  return arena.height / pandaDropPresentation.referenceSceneHeight;
}

export function dropVelocityForTier(tierIndex: number) {
  const rank = Math.min(Math.max(tierIndex, 0), maximumRegularTierIndex + 1);

  return Math.min(
    matchGameDropPhysics.dropVelocityBase +
      rank * matchGameDropPhysics.dropVelocityRankGrowth,
    matchGameDropPhysics.dropVelocityMaximum,
  );
}

export function restitutionForTier(tierIndex: number) {
  const rank = Math.min(Math.max(tierIndex, 0), maximumRegularTierIndex + 1);
  const maximumRank = maximumRegularTierIndex + 1;
  const weightProgress = Math.min(Math.max(rank / maximumRank, 0), 1);

  return (
    matchGameDropPhysics.lightStampRestitution -
    (matchGameDropPhysics.lightStampRestitution -
      matchGameDropPhysics.heavyStampRestitution) *
      Math.sqrt(weightProgress)
  );
}

export const giantPandaDropPhysics = {
  initialVelocity: dropVelocityForTier(giantPandaTierIndex),
  restitution: Math.max(
    matchGameDropPhysics.boundaryRestitution,
    restitutionForTier(giantPandaTierIndex),
  ),
} as const;

export function createPandaDropSimulation(
  arena: PandaDropArena,
): PandaDropSimulation {
  const scale = sceneScale(arena);

  return {
    arena,
    body: {
      velocityY: giantPandaDropPhysics.initialVelocity * scale,
      x: (arena.width - arena.size) / 2,
      y: -arena.size * 1.12,
    },
    bounceCount: 0,
    gravity: matchGameDropPhysics.gravityMagnitude * scale,
    isSettled: false,
  };
}

export function settledPandaDropBody(arena: PandaDropArena): PandaDropBody {
  return {
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

  body.velocityY += simulation.gravity * seconds;
  body.velocityY *= linearDamping;
  body.y += body.velocityY * seconds;

  if (body.y < simulation.arena.floorY) {
    return;
  }

  body.y = simulation.arena.floorY;
  const minimumBounceSpeed = pandaDropPresentation.minimumBounceSpeed * scale;
  if (simulation.bounceCount === 0 && body.velocityY > minimumBounceSpeed) {
    body.velocityY = -body.velocityY * giantPandaDropPhysics.restitution;
    simulation.bounceCount += 1;
    return;
  }

  body.velocityY = 0;
  simulation.isSettled = true;
}
