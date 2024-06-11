import {
  AreaComp,
  BodyComp,
  DoubleJumpComp,
  GameObj,
  HealthComp,
  KaboomCtx,
  OpacityComp,
  PosComp,
  ScaleComp,
  SpriteComp,
} from "kaboom";
import { scale } from "./constants";
import { globalGameState } from "./state";

type PlayerGameObj = GameObj<
  SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp &
    HealthComp &
    OpacityComp & {
      speed: number;
      direction: string;
      isInhaling: boolean;
      isFull: boolean;
    }
>;

const playerEnemyCollisionFramesHurtCount = 39;

export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
  const player = k.make([
    k.sprite("assets", { anim: "kirbIdle" }),
    k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10) }),
    k.body(),
    k.pos(posX * scale, posY * scale),
    k.scale(scale),
    k.doubleJump(10),
    k.health(4),
    k.opacity(1),
    {
      speed: 300,
      direction: "right",
      isInhaling: false,
      isExhaling: false,
      isFull: false,
    },
    "player",
  ]);

  const handlePlayerEnemyCollision = async (enemy: GameObj) => {
    if (player.isInhaling && enemy.isHalable) {
      player.isInhaling = false;
      k.destroy(enemy);
      player.isFull = true;
      return;
    }

    if (player.hp() === 0) {
      k.destroy(player);
      k.go(globalGameState.currentScene);
      return;
    }

    player.hurt();
    await k.tween(
      player.opacity,
      0,
      0.05,
      (val) => (player.opacity = val),
      k.easings.linear
    );
    await k.tween(
      player.opacity,
      1,
      0.05,
      (val) => (player.opacity = val),
      k.easings.linear
    );

    console.warn(`

    handlePlayerEnemyCollision player.hp() is now
      player.hp(): `, player.hp(), `

    `)
  }

  player.onCollide("enemy", async (enemy: GameObj) =>
    await handlePlayerEnemyCollision(enemy)
  );

  let playerEnemyCollisionFramesCount = 0;

  player.onCollideUpdate("enemy", async (enemy: GameObj) => {
    playerEnemyCollisionFramesCount++;

    if (playerEnemyCollisionFramesCount >= playerEnemyCollisionFramesHurtCount) {
      console.warn(`

      onCollideUpdate
        playerEnemyCollisionFramesCount: `, playerEnemyCollisionFramesCount, `
        player.hp(): `, player.hp(), `

      `)
      playerEnemyCollisionFramesCount = 0;
      return await handlePlayerEnemyCollision(enemy);
    }
  });

  player.onCollideEnd("enemy", () => {
    playerEnemyCollisionFramesCount = 0;
  });


  player.onCollide("exit", () => {
    k.go(globalGameState.nextScene);
  });

  const inhaleEffect = k.add([
    k.sprite("assets", { anim: "kirbInhaleEffect" }),
    k.pos(),
    k.scale(scale),
    k.opacity(0),
    "inhaleEffect",
  ]);
  const exhaleEffect = k.add([
    k.sprite("assets", { anim: "kirbExhaleEffect" }),
    k.pos(),
    k.scale(scale),
    k.opacity(0),
    "exhaleEffect",
  ]);

  const haleZone = player.add([
    k.area({ shape: new k.Rect(k.vec2(0), 20, 4) }),
    k.pos(),
    "haleZone",
  ]);

  haleZone.onUpdate(() => {
    if (player.direction === "left") {
      haleZone.pos = k.vec2(-14, 8);
      inhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);
      inhaleEffect.flipX = true;
      exhaleEffect.pos = k.vec2(player.pos.x - 60, player.pos.y + 0);
      exhaleEffect.flipX = true;
      return;
    }
    haleZone.pos = k.vec2(14, 8);
    inhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0);
    inhaleEffect.flipX = false;
    exhaleEffect.pos = k.vec2(player.pos.x + 60, player.pos.y + 0);
    exhaleEffect.flipX = false;
  });

  player.onUpdate(() => {
    if ((Math.random() * 100) > 99) {
      console.warn(`
        X: `, player.pos.x, `
        Y: `, player.pos.y, `
      `)
    }

    if (player.pos.y > 2000) {
      console.warn(`

      Falling down
        player: `, player, `
        globalGameState: `, globalGameState, `

      `)
      k.go(globalGameState.currentScene);
    }
  });

  return player;
}

export function setControls(k: KaboomCtx, player: PlayerGameObj) {
  const inhaleEffectRef = k.get("inhaleEffect")[0];
  const exhaleEffectRef = k.get("exhaleEffect")[0];

  let jumpCount = 0;

  k.onKeyDown((key) => {
    if (key === "space") {
      if (jumpCount >= 10) {
        jumpCount = 0;
      } else {
        player.jump();
        jumpCount++;
      }
    }

    switch (key) {
      case "left":
        player.direction = "left";
        player.flipX = true;
        player.move(-player.speed, 0);
        break;
      case "right":
        player.direction = "right";
        player.flipX = false;
        player.move(player.speed, 0);
        break;
      case "z":
        if (player.isExhaling) {
          return;
        }

        if (player.isFull) {
          player.play("kirbFull");
          inhaleEffectRef.opacity = 0;
          break;
        }

        player.isInhaling = true;
        player.play("kirbInhaling");
        inhaleEffectRef.opacity = 1;
        break;
      case "x":
        if (player.isInhaling) {
          return;
        }

        player.isExhaling = true;
        player.play("kirbInhaling");
        exhaleEffectRef.opacity = 1;
        break;
      default:
    }
  });
  k.onKeyRelease((key) => {
    if (key === "space") {
      k.wait(60, () => jumpCount = 0);
    }

    switch (key) {
      case "z":
        if (player.isFull) {
          player.play("kirbInhaling");
          const shootingStar = k.add([
            k.sprite("assets", {
              anim: "shootingStar",
              flipX: player.direction === "right",
            }),
            k.area({ shape: new k.Rect(k.vec2(5, 4), 6, 6) }),
            k.pos(
              player.direction === "left"
                ? player.pos.x - 80
                : player.pos.x + 80,
              player.pos.y + 5
            ),
            k.scale(scale),
            player.direction === "left"
              ? k.move(k.LEFT, 800)
              : k.move(k.RIGHT, 800),
            "shootingStar",
          ]);
          shootingStar.onCollide("platform", () => k.destroy(shootingStar));

          player.isFull = false;
          k.wait(1, () => player.play("kirbIdle"));
          break;
        }

        inhaleEffectRef.opacity = 0;
        player.isInhaling = false;
        player.play("kirbIdle");
        break;
      case "x":
        exhaleEffectRef.opacity = 0;
        player.isExhaling = false;
        player.play("kirbIdle");
      default:
    }
  });
}

export function makeHalable(k: KaboomCtx, enemy: GameObj) {
  enemy.onCollide("haleZone", () => {
    enemy.isHalable = true;
  });
  enemy.onCollideEnd("haleZone", () => {
    enemy.isHalable = false;
  });

  enemy.onCollide("shootingStar", (shootingStar: GameObj) => {
    k.destroy(enemy);
    k.destroy(shootingStar);
  });

  const playerRef = k.get("player")[0];
  enemy.onUpdate(() => {
    if (enemy.isHalable) {
      if (playerRef.isInhaling) {
        if (playerRef.direction === "right") {
          enemy.move(-800, 10);
          return;
        }
        enemy.move(800, 10);
      } else if (playerRef.isExhaling) {
        if (playerRef.direction === "right") {
          enemy.move(800, 1);
          return;
        }
        enemy.move(-800, 1);
      }
    }
  });
}

export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number) {
  const flame = k.add([
    k.sprite("assets", { anim: "flame" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"],
    }),
    k.body(),
    k.state("idle", ["idle", "jump"]),
    "enemy",
  ]);

  makeHalable(k, flame);

  flame.onStateEnter("idle", async () => {
    await k.wait(1);
    flame.enterState("jump");
  });

  flame.onStateEnter("jump", async () => {
    flame.jump(1000);
  });

  flame.onStateUpdate("jump", async () => {
    if (flame.isGrounded()) {
      flame.enterState("idle");
    }
  });

  return flame;
}

export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number) {
  const guy = k.add([
    k.sprite("assets", { anim: "guyWalk" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(2, 3.9), 12, 12),
      collisionIgnore: ["enemy"],
    }),
    k.body(),
    k.state("idle", ["idle", "left", "right", "jump"]),
    { isHalable: false, speed: 100 },
    "enemy",
  ]);

  makeHalable(k, guy);

  guy.onStateEnter("idle", async () => {
    await k.wait(1);
    guy.enterState("left");
  });

  guy.onStateEnter("left", async () => {
    guy.flipX = false;
    await k.wait(2);
    guy.enterState("right");
  });

  guy.onStateUpdate("left", () => {
    guy.move(-guy.speed, 0);
  });

  guy.onStateEnter("right", async () => {
    guy.flipX = true;
    await k.wait(2);
    guy.enterState("left");
  });

  guy.onStateUpdate("right", () => {
    guy.move(guy.speed, 0);
  });

  return guy;
}

export function makeBirdEnemy(
  k: KaboomCtx,
  posX: number,
  posY: number,
  speed: number
) {
  const bird = k.add([
    k.sprite("assets", { anim: "bird" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({
      shape: new k.Rect(k.vec2(4, 6), 8, 10),
      collisionIgnore: ["enemy"],
    }),
    k.body({ isStatic: true }),
    k.move(k.LEFT, speed),
    k.offscreen({ destroy: true, distance: 400 }),
    "enemy",
  ]);

  makeHalable(k, bird);

  return bird;
}
