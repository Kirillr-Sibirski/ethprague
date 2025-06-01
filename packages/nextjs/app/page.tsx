"use client";

import SplitBlock from "./_components/split/splitBlock";
import { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col w-full h-full p-4 md:p-8 gap-8">
      <SplitBlock />
    </div>
  );
};

export default Home;
