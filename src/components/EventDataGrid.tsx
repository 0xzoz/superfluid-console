import {FC} from "react";
import {AppDataGrid} from "./AppDataGrid";
import {GridColDef} from "@mui/x-data-grid";
import {
  AllEvents,
  Ordering,
  PagedResult,
  SkipPaging
} from "@superfluid-finance/sdk-core";
import {Event_OrderBy} from "@superfluid-finance/sdk-core/dist/module/subgraph/schema.generated";
import {Network} from "../redux/networks";


export type EventOrderBy = Event_OrderBy;
// TODO(KK): bad import

interface Props {
  network: Network,
  queryResult: {
    isFetching: boolean
    data?: PagedResult<AllEvents>
  }
  setPaging: (paging: SkipPaging) => void;
  ordering: Ordering<EventOrderBy> | undefined;
  setOrdering: (ordering?: Ordering<EventOrderBy>) => void;
}

const columns: GridColDef[] = [
  {field: 'id', hide: true, sortable: false, flex: 1},
  {field: 'name', headerName: "Name", sortable: false, flex: 1},
  {field: 'timestamp', headerName: "Timestamp", sortable: false, flex: 1, renderCell: (params) => (new Date(params.value * 1000).toLocaleString())},
  {field: 'blockNumber', headerName: "Block Number", sortable: false, flex: 1},
  {field: 'transactionHash', headerName: "Transaction Hash", sortable: false, flex: 1}
];

const EventDataGrid: FC<Props> = ({network, queryResult, setPaging, ordering, setOrdering}) => {
  const rows: AllEvents[] = queryResult.data ? queryResult.data.data : [];

  return (<AppDataGrid columns={columns} rows={rows} queryResult={queryResult} setPaging={setPaging} ordering={ordering}
                       setOrdering={x => setOrdering(x as any)}/>);
}

export default EventDataGrid;
