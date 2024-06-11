import { k } from "./kaboomCtx";
import { makeMap } from "./utils";
import {
  makeBirdEnemy,
  makeFlameEnemy,
  makeGuyEnemy,
  makePlayer,
  setControls,
} from "./entities";
import { globalGameState } from "./state";

async function gameSetup() {
  k.loadSprite("assets", "./kirby-like.png", {
    sliceX: 9,
    sliceY: 10,
    anims: {
      kirbIdle: 0,
      kirbInhaling: 1,
      kirbFull: 2,
      kirbInhaleEffect: { from: 3, to: 8, speed: 14, loop: true },
      kirbExhaleEffect: { from: 10, to: 12, speed: 10, loop: true },
      shootingStar: 9,
      flame: { from: 36, to: 37, speed: 4, loop: true },
      guyIdle: 18,
      guyWalk: { from: 18, to: 19, speed: 4, loop: true },
      bird: { from: 27, to: 28, speed: 4, loop: true },
    },
  });

  const { map: level1Layout, spawnPoints: level1SpawnPoints } = await makeMap(
    k,
    "level-1"
  );

  const { map: level2Layout, spawnPoints: level2SpawnPoints } = await makeMap(
    k,
    "level-2"
  );

  k.scene("level-1", async () => {
    globalGameState.setCurrentScene("level-1");
    globalGameState.setNextScene("level-2");
    k.setGravity(1600);
    k.add([
      k.rect(k.width(), k.height()),
      k.color(k.Color.fromHex("#47e39f")),
      k.fixed(),
    ]);

    k.add(level1Layout);

    k.add([
        k.pos(100, 700),
        k.color(255, 255, 255),
        k.text("oh hi mAYRKAYAty@^^&!67"),
        k.fixed(),
    ])
    k.add([
        k.pos(700, 700),
        k.color(255, 255, 255),
        k.text("ohhi", {
            size: 48, // 48 pixels tall
            width: 320, // it'll wrap to next line when width exceeds this value
            font: "sans-serif", // specify any font you loaded or browser built-in
        }),
    ])

    const kirb = makePlayer(
      k,
      level1SpawnPoints.player[0].x,
      level1SpawnPoints.player[0].y
    );

    setControls(k, kirb);
    k.add(kirb);
    k.camScale(0.6, 0.6);

    console.warn(`

    level1 scene
      level1Layout: `, level1Layout, `
      kirb: `, kirb, `

    `)
    const loggingUpdateCountInterval = 64;
    let updateCount = 0;

    k.onUpdate(() => {
      updateCount++;
      if (updateCount === loggingUpdateCountInterval) {
        updateCount = 0;
        console.warn(`

          kirb.pos.x: `, kirb.pos.x, `
          level1Layout.pos.x: `, level1Layout.pos.x, `

        `)
      }
      if (kirb.pos.x < level1Layout.pos.x + 1000)
        k.camPos(kirb.pos.x + 200, 800);
    });

    for (const flame of level1SpawnPoints.flame) {
      makeFlameEnemy(k, flame.x, flame.y);
    }

    for (const guy of level1SpawnPoints.guy) {
      makeGuyEnemy(k, guy.x, guy.y);
    }

    for (const bird of level1SpawnPoints.bird) {
      const possibleSpeeds = [100, 200, 300];
      k.loop(10, () => {
        makeBirdEnemy(
          k,
          bird.x,
          bird.y,
          possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
        );
      });
    }
  });

  k.scene("level-2", () => {
    globalGameState.setCurrentScene("level-2");
    globalGameState.setNextScene("level-1");
    k.setGravity(2100);
    k.add([
      k.rect(k.width(), k.height()),
      k.color(k.Color.fromHex("#f7d7db")),
      k.fixed(),
    ]);

    k.add(level2Layout);
    const kirb = makePlayer(
      k,
      level2SpawnPoints.player[0].x,
      level2SpawnPoints.player[0].y
    );

    setControls(k, kirb);
    k.add(kirb);
    k.camScale(k.vec2(0.7));
    k.onUpdate(() => {
      if (kirb.pos.x < level2Layout.pos.x + 3100)
        k.camPos(kirb.pos.x + 200, 800);
    });

    for (const flame of level2SpawnPoints.flame) {
      makeFlameEnemy(k, flame.x, flame.y);
    }

    for (const guy of level2SpawnPoints.guy) {
      makeGuyEnemy(k, guy.x, guy.y);
    }

    for (const bird of level2SpawnPoints.bird) {
      const possibleSpeeds = [100, 200, 300];
      k.loop(10, () => {
        makeBirdEnemy(
          k,
          bird.x,
          bird.y,
          possibleSpeeds[Math.floor(Math.random() * possibleSpeeds.length)]
        );
      });
    }
  });

  k.scene("end", () => {});

  k.go("level-1");
}

gameSetup();
