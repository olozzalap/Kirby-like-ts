import {
  AreaComp,
  BodyComp,
  DoubleJumpComp,
  GameObj,
  KaboomCtx,
  PosComp,
  ScaleComp,
  SpriteComp,
} from "kaboom";
import { scale } from "./constants";

type PlayerGameObj = GameObj<
  SpriteComp &
    AreaComp &
    BodyComp &
    PosComp &
    ScaleComp &
    DoubleJumpComp & { speed: number }
>;

export function makePlayer(k: KaboomCtx, posX: number, posY: number) {
  return k.make([
    k.sprite("assets", { anim: "kirbIdle" }),
    k.area({ shape: new k.Rect(k.vec2(4, 5.9), 8, 10) }),
    k.body(),
    k.pos(posX * scale, posY * scale),
    k.scale(scale),
    k.doubleJump(10),
    {
      speed: 300,
    },
    "kirb",
  ]);
}

export function setControls(k: KaboomCtx, player: PlayerGameObj) {
  k.onKeyDown((key) => {
    switch (key) {
      case "left":
        player.flipX = true;
        player.move(-player.speed, 0);
        break;
      case "right":
        player.flipX = false;
        player.move(player.speed, 0);
        break;
      case "z":
        player.play("kirbInhaling");
        break;
      default:
    }
  });
  k.onKeyPress((key) => {
    switch (key) {
      case "x":
        player.doubleJump();
        break;
      default:
    }
  });
  k.onKeyRelease((key) => {
    switch (key) {
      case "z":
        player.play("kirbIdle");
        break;
      default:
    }
  });
}

export function makeFlameEnemy(k: KaboomCtx, posX: number, posY: number) {
  k.add([
    k.sprite("assets", { anim: "flame" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({ shape: new k.Rect(k.vec2(4, 6), 8, 10) }),
    k.body(),
    "flame",
  ]);
}

export function makeGuyEnemy(k: KaboomCtx, posX: number, posY: number) {
  k.add([
    k.sprite("assets", { anim: "guyWalk" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({ shape: new k.Rect(k.vec2(2, 3.9), 12, 12) }),
    k.body(),
    "guy",
  ]);
}

export function makeBirdEnemy(k: KaboomCtx, posX: number, posY: number) {
  k.add([
    k.sprite("assets", { anim: "bird" }),
    k.scale(scale),
    k.pos(posX * scale, posY * scale),
    k.area({ shape: new k.Rect(k.vec2(4, 6), 8, 10) }),
    k.body({ isStatic: true }),
    "bird",
  ]);
}
