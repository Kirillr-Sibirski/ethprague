"use client";

import IInchContainer from "../../components/1inch";
import { NextPage } from "next";

const Page: NextPage = () => {
  return <IInchContainer dstChainId={10} dstTokenAddress="0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" />;
};

export default Page;
