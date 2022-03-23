import { Chip, Stack } from "@mui/material";
import _ from "lodash";
import { FC } from "react";
import { Network } from "../redux/networks";
import { sfSubgraph } from "../redux/store";
import AppLink from "./AppLink";
import FlowingBalance, { FlowingBalanceProps } from "./FlowingBalance";

const FlowingBalanceWithToken: FC<
  FlowingBalanceProps & { network: Network; tokenAddress: string }
> = ({ network, tokenAddress, ...flowingBalanceProps }) => {
  const tokenQuery = sfSubgraph.useTokenQuery({
    chainId: network.chainId,
    id: tokenAddress,
  });

  return (
    <Stack direction="row" alignItems="center">
      {tokenQuery.data ? (
        <AppLink
          data-cy={"token-link"}
          className="address"
          href={`/${network.slugName}/supertokens/${tokenAddress}`}
          sx={{ textDecoration: "none" }}
        >
          <Chip
            clickable
            size="small"
            label={tokenQuery.data.symbol}
            sx={{ mr: 1, cursor: "pointer" }}
          />
        </AppLink>
      ) : null}
      <FlowingBalance {...flowingBalanceProps} />
    </Stack>
  );
};

export default FlowingBalanceWithToken;
