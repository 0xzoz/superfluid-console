import { FC, useMemo, useState } from "react";
import { Network } from "../redux/networks";
import { GridColDef } from "@mui/x-data-grid";
import SuperTokenAddress from "./SuperTokenAddress";
import { timeAgo } from "../utils/dateTime";
import { IndexPublicationDetailsDialog } from "./IndexPublicationDetails";
import { createSkipPaging, Index, Index_OrderBy, Ordering, SkipPaging } from "@superfluid-finance/sdk-core";
import { sfSubgraph } from "../redux/store";
import { AppDataGrid } from "./AppDataGrid";

export const publishedIndexOrderingDefault: Ordering<Index_OrderBy> | undefined = undefined;
export const publishedIndexPagingDefault: SkipPaging = createSkipPaging({
  take: 10
});

export const AccountIndexesDataGrid: FC<{
  network: Network,
  accountAddress: string
}> = ({ network, accountAddress }) => {
  const columns: GridColDef[] = useMemo(() => [
    { field: 'id', hide: true, flex: 1 },
    {
      field: 'token',
      headerName: "Token",
      sortable: true,
      flex: 1,
      renderCell: (params) => (<SuperTokenAddress network={network} address={params.value} />)
    },
    { field: 'totalUnits', headerName: "Total Units", sortable: true, flex: 1 },
    { field: 'totalAmountDistributedUntilUpdatedAt', headerName: "Total Distributed", sortable: true, flex: 1 },
    {
      field: 'createdAtTimestamp',
      headerName: "Created At",
      sortable: true,
      flex: 1,
      renderCell: (params) => (timeAgo(params.value * 1000))
    },
    {
      field: 'details', headerName: "Details", flex: 1, sortable: false, renderCell: (cellParams) => (
        <IndexPublicationDetailsDialog network={network} indexId={cellParams.id.toString()} />
      )
    }
  ], []);

  const [publishedIndexPaging, setPublishedIndexPaging] = useState<SkipPaging>(publishedIndexPagingDefault);

  const [publishedIndexOrdering, setPublishedIndexOrdering] = useState<Ordering<Index_OrderBy> | undefined>(publishedIndexOrderingDefault);
  const publishedIndexQuery = sfSubgraph.useIndexesQuery({
    chainId: network.chainId,
    pagination: publishedIndexPaging,
    filter: {
      publisher: accountAddress
    },
    order: publishedIndexOrdering
  })

  const rows: Index[] = publishedIndexQuery.data ? publishedIndexQuery.data.data : [];

  return <AppDataGrid columns={columns} rows={rows} queryResult={publishedIndexQuery}
    setPaging={setPublishedIndexPaging} ordering={publishedIndexOrdering}
    setOrdering={x => setPublishedIndexOrdering(x as any)} />;
}

export default AccountIndexesDataGrid;