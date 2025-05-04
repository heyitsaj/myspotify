import Canvas from "@/components/Canvas";
import KofiWidget from "@/components/Kofi";
export default function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center">
      <KofiWidget />
      <Canvas />
      <div className="top-56 text-center z-10 bg-black/75 w-[1280px]">
        <h1 className="text-4xl font-bold">
          Here&apos;s What I&apos;ve Been Listening To Today!
        </h1>
        <h2 className="text-2xl font-bold">
          Hover over the album covers to view song information, and double-click
          the album to go to its Spotify page!
        </h2>
      </div>
    </div>
  );
}
