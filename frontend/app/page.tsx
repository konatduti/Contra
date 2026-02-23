import { Suspense } from "react";
import { HomeHero } from "@/components/HomeHero";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <HomeHero />
    </Suspense>
  );
}
