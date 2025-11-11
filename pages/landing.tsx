import React from "react";
import Head from "next/head";

import LandingPlaner from "@/components/LandingPlaner/landingPlaner";

export default function LandingPage() {
  return (
    <>
      <Head>
        <title>plan-track.pro — планирование производства и услуг</title>
        <meta name="description" content="Видите загрузку, окна и риски срыва сроков. 30-дневный триал." />
      </Head>
      <LandingPlaner />
    </>
  );
}
