// import InteractiveBackground from "./_components/InteractiveComponents";
// import OceanShader from "./_components/OceanShader";
// import ShaderAnimation from "./_components/StarFall";
// import ThreeJSScene from "./_components/Threejsattempt";
// import ThreeJSTextExample from "./_components/TextThreejs";

import SpaceScene from "./_components/SpaceAnimation";


export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* <OceanShader />
      <InteractiveBackground />; */}
      {/* <ShaderAnimation /> */}
      {/* <ThreeJSScene /> */}
      {/* <ThreeJSTextExample /> */}
      <SpaceScene />
    </div>
  );
}
