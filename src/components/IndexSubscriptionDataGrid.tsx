import { FC, useMemo } from "react";
import { AppDataGrid } from "./AppDataGrid";
import { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import {
  IndexSubscription,
  IndexSubscription_OrderBy,
  Ordering,
  PagedResult,
  SkipPaging,
} from "@superfluid-finance/sdk-core";
import { IndexSubscriptionDetailsDialog } from "./IndexSubscriptionDetails";
import AccountAddress from "./AccountAddress";
import SuperTokenAddress from "./SuperTokenAddress";
import { Network } from "../redux/networks";
import calculateEtherAmountReceived from "../logic/calculateEtherAmountReceived";
import { BigNumber } from "ethers";
import calculatePoolPercentage from "../logic/calculatePoolPercentage";
import Decimal from "decimal.js";
import TimeAgo from "./TimeAgo";

interface Props {
  network: Network;
  queryResult: {
    isFetching: boolean;
    data?: PagedResult<IndexSubscription>;
  };
  setPaging: (paging: SkipPaging) => void;
  ordering: Ordering<IndexSubscription_OrderBy> | undefined;
  setOrdering: (ordering?: Ordering<IndexSubscription_OrderBy>) => void;
}

const IndexSubscriptionDataGrid: FC<Props> = ({
  network,
  queryResult,
  setPaging,
  ordering,
  setOrdering,
}) => {
  const columns: GridColDef[] = useMemo(
    () => [
      { field: "id", hide: true },
      {
        field: "createdAtTimestamp",
        headerName: "Created At",
        sortable: true,
        flex: 0.5,
        renderCell: (params: GridRenderCellParams<number>) => <TimeAgo subgraphTime={params.value} />,
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

  const rows: IndexSubscription[] = queryResult.data
    ? queryResult.data.data
    : [];

  return (
    <AppDataGrid
      columns={columns}
      rows={rows}
      queryResult={queryResult}
      setPaging={setPaging}
      ordering={ordering}
      setOrdering={(x) => setOrdering(x as any)}
    />
  );
};

export default IndexSubscriptionDataGrid;
