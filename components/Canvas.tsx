"use client";

import { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

type Song = {
  id: string;
  name: string;
  artist: string;
  url: string;
  imgsrc: string;
};
type SongBody = Matter.Body & {
  songInfo: Song;
};

export default function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    const engine = Matter.Engine.create();

    const WIDTH = 1280;
    const HEIGHT = 1280;

    const render = Matter.Render.create({
      element: containerRef.current ?? document.body,
      engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        wireframes: false,
        background: "transparent",
      },
    });

    // Boundaries
    const ground = Matter.Bodies.rectangle(WIDTH / 2, HEIGHT + 50, WIDTH, 100, {
      isStatic: true,
    });
    const roof = Matter.Bodies.rectangle(WIDTH / 2, -50, WIDTH, 100, {
      isStatic: true,
    });
    const wallLeft = Matter.Bodies.rectangle(-50, HEIGHT / 2, 100, HEIGHT, {
      isStatic: true,
    });
    const wallRight = Matter.Bodies.rectangle(
      WIDTH + 50,
      HEIGHT / 2,
      100,
      HEIGHT,
      { isStatic: true }
    );

    Matter.World.add(engine.world, [ground, roof, wallLeft, wallRight]);

    // Mouse dragging
    const mouse = Matter.Mouse.create(render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    Matter.World.add(engine.world, mouseConstraint);
    render.mouse = mouse;

    // Reset out-of-bounds bodies
    Matter.Events.on(engine, "beforeUpdate", () => {
      const allBodies = Matter.Composite.allBodies(engine.world);
      for (const body of allBodies) {
        if (!body.isStatic) {
          const { x, y } = body.position;
          if (x < -200 || x > WIDTH + 200 || y < -200 || y > HEIGHT + 200) {
            Matter.Body.setPosition(body, { x: WIDTH / 2, y: 100 });
            Matter.Body.setVelocity(body, { x: 0, y: 0 });
            Matter.Body.setAngularVelocity(body, 0);
          }
        }
      }
    });

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    Matter.Render.run(render);

    // Track displayed songs
    const displayedSongIds = new Set<string>();

    const spawnSongBox = (song: Song) => {
      const box = Matter.Bodies.rectangle(
        Math.random() * (WIDTH - 100) + 50,
        0,
        120,
        120,
        {
          render: {
            sprite: {
              texture: song.imgsrc,
              xScale: 120 / 640,
              yScale: 120 / 640,
            },
          },
          density: 0.001,
          restitution: 0.8,
        }
      ) as SongBody;
      box.songInfo = song;
      Matter.World.add(engine.world, box);
    };

    const fetchAndAddSongs = async () => {
      try {
        const res = await fetch("/api/today");
        const songs: Song[] = await res.json();

        songs.forEach((song) => {
          if (!displayedSongIds.has(song.id)) {
            displayedSongIds.add(song.id);
            spawnSongBox(song);
          }
        });
      } catch (err) {
        console.error("Error fetching songs:", err);
      }
    };

    fetchAndAddSongs();
    const interval = setInterval(fetchAndAddSongs, 10000);

    // Tooltip & click logic
    let hoverTimeout: NodeJS.Timeout | null = null;
    let lastHoveredBody: Matter.Body | null = null;

    const checkHover = () => {
      if (!render.mouse) return;

      const mousePos = render.mouse.position;
      const bodies = Matter.Composite.allBodies(engine.world);
      const found = Matter.Query.point(bodies, mousePos).find(
        (b) => !b.isStatic && (b as SongBody).songInfo
      ) as SongBody;

      if (found && found !== lastHoveredBody) {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          if (mouseConstraint.mouse.button === -1) {
            const song = found.songInfo as Song;
            setHoveredText(`${song.name} by ${song.artist}`);
            const canvasRect = render.canvas.getBoundingClientRect();
            setHoverPosition({
              x: canvasRect.left + mousePos.x,
              y: canvasRect.top + mousePos.y,
            });
          }
        }, 500);
        lastHoveredBody = found;
      } else if (!found) {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        setHoveredText(null);
        setHoverPosition(null);
        lastHoveredBody = null;
      }
    };

    Matter.Events.on(engine, "afterUpdate", checkHover);

    render.canvas.addEventListener("dblclick", (e) => {
      const rect = render.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const found = Matter.Query.point(
        Matter.Composite.allBodies(engine.world),
        { x, y }
      ).find((b) => (b as SongBody).songInfo);
      if (found) {
        const url = (found as SongBody).songInfo?.url;
        if (url) window.open(url, "_blank");
      }
    });

    return () => {
      clearInterval(interval);
      Matter.Render.stop(render);
      Matter.Runner.stop(runner);
      Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      if (render.canvas.parentNode) {
        render.canvas.parentNode.removeChild(render.canvas);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 z-0 flex items-center justify-center"
      />
      {hoveredText && hoverPosition && (
        <div
          className="fixed text-white text-sm bg-black/80 px-2 py-1 rounded pointer-events-none z-50 transition-opacity duration-150"
          style={{
            top: hoverPosition.y + 12,
            left: hoverPosition.x + 12,
          }}
        >
          {hoveredText}
        </div>
      )}
    </>
  );
}
