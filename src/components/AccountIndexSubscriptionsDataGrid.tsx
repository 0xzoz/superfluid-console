import { FC, useMemo, useState } from "react";
import { Network } from "../redux/networks";
import {
  createSkipPaging,
  IndexSubscription,
  IndexSubscription_OrderBy,
  Ordering,
  SkipPaging,
} from "@superfluid-finance/sdk-core";
import { sfSubgraph } from "../redux/store";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import SuperTokenAddress from "./SuperTokenAddress";
import AccountAddress from "./AccountAddress";
import { IndexSubscriptionDetailsDialog } from "./IndexSubscriptionDetails";
import { AppDataGrid } from "./AppDataGrid";
import calculatePoolPercentage from "../logic/calculatePoolPercentage";
import Decimal from "decimal.js";
import calculateEtherAmountReceived from "../logic/calculateEtherAmountReceived";
import { BigNumber } from "ethers";

export const indexSubscriptionOrderingDefault:
  | Ordering<IndexSubscription_OrderBy>
  | undefined = undefined;
export const indexSubscriptionPagingDefault: SkipPaging = createSkipPaging({
  take: 10,
});

export const AccountIndexSubscriptionsDataGrid: FC<{
  network: Network;
  accountAddress: string;
}> = ({ network, accountAddress }) => {
  const [indexSubscriptionPaging, setIndexSubscriptionPaging] =
    useState<SkipPaging>(indexSubscriptionPagingDefault);
  const [indexSubscriptionOrdering, setIndexSubscriptionOrdering] = useState<
    Ordering<IndexSubscription_OrderBy> | undefined
  >(indexSubscriptionOrderingDefault);

  const indexSubscriptionQuery = sfSubgraph.useIndexSubscriptionsQuery({
    chainId: network.chainId,
    pagination: indexSubscriptionPaging,
    filter: {
      subscriber: accountAddress,
    },
    order: indexSubscriptionOrdering,
  });

  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", hide: true },
      {
        field: "token",
        headerName: "Token",
        flex: 1,
        renderCell: (params) => (
          <SuperTokenAddress network={network} address={params.value} />
        ),
      },
      {
        field: "publisher",
        headerName: "Publisher",
        flex: 1.5,
        renderCell: (params) => (
          <AccountAddress network={network} address={params.value} />
        ),
      },
      {
        field: "approved",
        headerName: "Approved",
        flex: 0.5,
        renderCell: (params: GridRenderCellParams<boolean>) => (
          <>{params.value ? "Yes" : "No"}</>
        ),
      },
      {
        field: "totalAmountReceivedUntilUpdatedAt",
        headerName: "Total Amount Received",
        flex: 1.5,
        renderCell: (
          params: GridRenderCellParams<string, IndexSubscription>
        ) => (
          <>
            {calculateEtherAmountReceived(
              BigNumber.from(params.row.indexValueCurrent),
              BigNumber.from(params.row.totalAmountReceivedUntilUpdatedAt),
              BigNumber.from(params.row.indexValueUntilUpdatedAt),
              BigNumber.from(params.row.units)
            )}
            &nbsp;
            <SuperTokenAddress
              network={network}
              address={params.row.token}
              format={(token) => token.symbol}
              formatLoading={() => ""}
            />
          </>
        ),
      },
      {
        field: "units",
        headerName: "Subscription Units",
        flex: 2,
        renderCell: (
          params: GridRenderCellParams<string, IndexSubscription>
        ) => {
          return (
            <>
              {params.value}&nbsp;
              {`(${calculatePoolPercentage(
                new Decimal(params.row.indexTotalUnits),
                new Decimal(params.row.units)
              ).toFixed(2)}%)`}
            </>
          );
        },
      },
      {
        field: "details",
        headerName: "Details",
        flex: 0.5,
        sortable: false,
        renderCell: (cellParams) => (
          <IndexSubscriptionDetailsDialog
            network={network}
            indexSubscriptionId={cellParams.id.toString()}
          />
        ),
      },
    ],
    [network]
  );

  const rows: IndexSubscription[] = indexSubscriptionQuery.data
    ? indexSubscriptionQuery.data.data
    : [];

  return (
    <AppDataGrid
      columns={columns}
      rows={rows}
      queryResult={indexSubscriptionQuery}
      setPaging={setIndexSubscriptionPaging}
      ordering={indexSubscriptionOrdering}
      setOrdering={(x) => setIndexSubscriptionOrdering(x as any)}
    />
  );
};

export default AccountIndexSubscriptionsDataGrid;
