import { simulateShot, WEAPONS } from "./physics.js";

const DIFF = {
  easy: { noise: 68, angleJitter: 0.06, powerJitter: 0.07, samples: 55 },
  normal: { noise: 26, angleJitter: 0.022, powerJitter: 0.025, samples: 85 },
  hard: { noise: 9, angleJitter: 0.007, powerJitter: 0.008, samples: 110 },
};

function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

/**
 * Pick a ballistic shot for the CPU. Scores every sampled arc by how close its
 * impact lands to an enemy worm, then adds a difficulty-scaled human error.
 */
export function chooseShot({ worm, enemies, wind, terrain, structures, worms, difficulty = "normal" }) {
  const cfg = DIFF[difficulty] || DIFF.normal;
  if (!enemies.length) return null;

  let target = enemies[0];
  let bestD = Infinity;
  for (const e of enemies) {
    const d = dist(worm.x, worm.y, e.x, e.y);
    if (d < bestD) { bestD = d; target = e; }
  }

  const dir = target.x >= worm.x ? 1 : -1;
  const useGrenade = worm.ammo.grenade > 0 && Math.random() < 0.22;
  const weapon = useGrenade ? "grenade" : "bazooka";
  const elevations = [-12, -2, 8, 18, 28, 38, 47, 56, 65, 73, 79];
  const powers = [0.34, 0.42, 0.5, 0.58, 0.66, 0.74, 0.82, 0.9, 0.97];

  let best = null;
  let checked = 0;
  for (const elev of elevations) {
    for (const power of powers) {
      if (checked++ > cfg.samples) break;
      const rad = (elev * Math.PI) / 180;
      const angle = dir > 0 ? rad : Math.PI - rad;
      const mx = worm.x + Math.cos(angle) * 26;
      const my = worm.y - 6 + Math.sin(angle) * 26;
      const sim = simulateShot({
        x: mx, y: my, angle, power, weapon, wind, terrain, structures, worms,
        ignoreWormId: worm.id, ownerTeam: worm.team, maxTime: 6.5,
      });
      if (!sim) continue;

      let score;
      if (sim.hitWorm) {
        score = sim.hitWorm.team === worm.team ? 3000 : -40;
      } else {
        let nearest = Infinity;
        for (const e of enemies) {
          nearest = Math.min(nearest, dist(sim.impact.x, sim.impact.y, e.x, e.y));
        }
        score = nearest;
        if (sim.impact.type === "miss" || sim.impact.type === "timeout") score += 700;
      }

      // Don't blow yourself up.
      const selfD = dist(sim.impact.x, sim.impact.y, worm.x, worm.y);
      if (selfD < 95) score += (95 - selfD) * 6;
      for (const w of worms) {
        if (w.team === worm.team && w.id !== worm.id) {
          const d = dist(sim.impact.x, sim.impact.y, w.x, w.y);
          if (d < 80) score += (80 - d) * 4;
        }
      }

      score += Math.random() * cfg.noise;
      if (!best || score < best.score) {
        best = { angle, power, weapon, score, impact: sim.impact, sim };
      }
    }
  }

  if (!best) {
    return { angle: dir > 0 ? -0.7 : Math.PI + 0.7, power: 0.7, weapon: "bazooka" };
  }

  // A little sloppiness on lower difficulties.
  const angle = best.angle + (Math.random() * 2 - 1) * cfg.angleJitter;
  const power = Math.max(0.12, Math.min(1, best.power + (Math.random() * 2 - 1) * cfg.powerJitter));
  return { angle, power, weapon: best.weapon, predicted: best.impact };
}

export function weaponName(id) {
  return WEAPONS[id]?.label || id;
}
