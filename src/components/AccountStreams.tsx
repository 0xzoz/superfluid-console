import {Network, sfApi} from "../redux/store";
import {FC, ReactElement, useState} from "react";
import {createSkipPaging, Ordering, SkipPaging, Stream, StreamOrderBy} from "@superfluid-finance/sdk-core";
import {AppDataGrid} from "./AppDataGrid";
import {GridColDef} from "@mui/x-data-grid";
import {Box, Card, Typography} from "@mui/material";
import {StreamDetailsDialog} from "./StreamDetails";
import FlowingBalance from "./FlowingBalance";
import SuperTokenAddress from "./SuperTokenAddress";
import FlowRate from "./FlowRate";
import AccountAddress from "./AccountAddress";

interface Props {
  network: Network,
  accountAddress: string
}

const epochs: [string, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1]
];

const getDuration = (timeAgoInSeconds: number) => {
  for (let [name, seconds] of epochs) {
    const interval = Math.floor(timeAgoInSeconds / seconds);
    if (interval >= 1) {
      return {
        interval: interval,
        epoch: name
      };
    }
  }
};

const timeAgo = (date: number) => {
  const timeAgoInSeconds = Math.floor((new Date().valueOf() - new Date(date).valueOf()) / 1000);
  // @ts-ignore
  const {interval, epoch} = getDuration(timeAgoInSeconds);
  const suffix = interval === 1 ? '' : 's';
  return `${interval} ${epoch}${suffix} ago`;
};

const AccountStreams: FC<Props> = ({network, accountAddress}): ReactElement => {
  // TODO(KK): cast sort field to orderby type

  const incomingStreamColumns: GridColDef[] = [
    {field: 'id', type: "string", hide: true, sortable: false},
    {field: 'token', headerName: "Token", flex: 1, sortable: false, renderCell: (params) => (<SuperTokenAddress network={network} address={params.value} />)},
    {field: 'sender', headerName: "Sender", sortable: false, flex: 1, renderCell: (params) => (<AccountAddress network={network} address={params.value} />)},
    {field: 'currentFlowRate', headerName: "Flow Rate", flex: 1, sortable: true, renderCell: (params) => (<FlowRate flowRate={params.value} />)},
    {
      field: 'streamedUntilUpdatedAt',
      headerName: "Total Streamed",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const stream = params.row as Stream;
        return (<FlowingBalance
          {...{
            balance: stream.streamedUntilUpdatedAt,
            balanceTimestamp: stream.updatedAtTimestamp,
            flowRate: stream.currentFlowRate
          }}
        />)
      }
    },
    {field: 'createdAtTimestamp', headerName: "Created At", sortable: true, flex: 1, renderCell: (params) => (timeAgo(params.value * 1000))},
    {
      field: 'details', headerName: "Details", flex: 1, sortable: false, renderCell: (cellParams) => (
        <StreamDetailsDialog network={network} streamId={cellParams.id.toString()}/>
      )
    }
  ];

  const [incomingStreamOrdering, setIncomingStreamOrdering] = useState<Ordering<StreamOrderBy> | undefined>({
    orderBy: "createdAtTimestamp",
    orderDirection: "desc"
  });
  const [incomingStreamPaging, setIncomingStreamPaging] = useState<SkipPaging>(createSkipPaging({
    take: 10
  }));

  const incomingStreamsQuery = sfApi.useStreamsQuery({
    chainId: network.chainId,
    filter: {
      receiver: accountAddress
    },
    pagination: incomingStreamPaging,
    order: incomingStreamOrdering
  });

  const incomingStreamRows: Stream[] = incomingStreamsQuery.data ? incomingStreamsQuery.data.data : [];

  const [outgoingStreamOrdering, setOutgoingStreamOrdering] = useState<Ordering<StreamOrderBy> | undefined>({
    orderBy: "createdAtTimestamp",
    orderDirection: "desc"
  });
  const [outgoingStreamPaging, setOutgoingStreamPaging] = useState<SkipPaging>(createSkipPaging({
    take: 10
  }));

  const outgoingStreamColumns: GridColDef[] = [
    {field: 'id', hide: true, flex: 1},
    {field: 'token', headerName: "Token", sortable: false, flex: 1, renderCell: (params) => (<SuperTokenAddress network={network} address={params.value} />)},
    {field: 'receiver', headerName: "Receiver", sortable: false, flex: 1, renderCell: (params) => (<AccountAddress network={network} address={params.value} />)},
    {field: 'currentFlowRate', headerName: "Flow Rate", sortable: true, flex: 1, renderCell: (params) => (<FlowRate flowRate={params.value} />)},
    {
      field: 'streamedUntilUpdatedAt',
      headerName: "Total Streamed",
      flex: 1,
      sortable: false,
      renderCell: (params) => {
        const stream = params.row as Stream;
        return (<FlowingBalance
          {...{
            balance: stream.streamedUntilUpdatedAt,
            balanceTimestamp: stream.updatedAtTimestamp,
            flowRate: stream.currentFlowRate
          }}
        />)
      }
    },
    {field: 'createdAtTimestamp', headerName: "Created At", sortable: true, flex: 1, renderCell: (params) => (timeAgo(params.value * 1000))},
    {
      field: 'details', headerName: "Details", flex: 1, sortable: false, renderCell: (cellParams) => (
        <StreamDetailsDialog network={network} streamId={cellParams.id.toString()}/>
      )
    }
  ];

  const outgoingStreamsQuery = sfApi.useStreamsQuery({
    chainId: network.chainId,
    filter: {
      sender: accountAddress
    },
    pagination: outgoingStreamPaging,
    order: outgoingStreamOrdering
  });

  const outgoingStreamRows: Stream[] = outgoingStreamsQuery.data ? outgoingStreamsQuery.data.data : [];

  // TODO(KK): get rid of anys

  return (<Box>
    <Box>
      <Typography variant="h6" component="h2" sx={{ml: 1, mb: 1}}>
        Incoming
      </Typography>
      <AppDataGrid columns={incomingStreamColumns} rows={incomingStreamRows} queryResult={incomingStreamsQuery}
                   setPaging={setIncomingStreamPaging} ordering={incomingStreamOrdering}
                   setOrdering={(x: any) => setIncomingStreamOrdering(x)}/>
    </Box>
    <Box>
      <Typography variant="h6" component="h2" sx={{mt: 3, ml: 1, mb: 1}}>
        Outgoing
      </Typography>
      <AppDataGrid columns={outgoingStreamColumns} rows={outgoingStreamRows} queryResult={outgoingStreamsQuery}
                   setPaging={setOutgoingStreamPaging} ordering={outgoingStreamOrdering}
                   setOrdering={(x: any) => setOutgoingStreamOrdering(x)}/>
    </Box>
  </Box>);
}

export default AccountStreams;
