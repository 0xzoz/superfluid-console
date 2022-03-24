import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Button,
  Chip,
  CircularProgress,
  IconButton,
  OutlinedInput,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableRow,
  TableSortLabel,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import {
  Ordering,
  Stream_Filter,
  Stream_OrderBy,
} from "@superfluid-finance/sdk-core";
import { StreamsQuery } from "@superfluid-finance/sdk-redux";
import { parseEther } from "ethers/lib/utils";
import omit from "lodash/fp/omit";
import set from "lodash/fp/set";
import isEqual from "lodash/isEqual";
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import useDebounce from "../../../hooks/useDebounce";
import { Network } from "../../../redux/networks";
import { sfSubgraph } from "../../../redux/store";
import AccountAddress from "../../AccountAddress";
import FlowRate from "../../FlowRate";
import InfinitePagination from "../../InfinitePagination";
import InfoTooltipBtn from "../../InfoTooltipBtn";
import { StreamDetailsDialog } from "../../StreamDetails";
import { StreamStatus } from "../Account/AccountIncomingStreamsTable";

const MAPPER = {
  currentFlowRate_gte: (value?: string) =>
    value ? parseEther(value).toString() : undefined,
  currentFlowRate_lte: (value?: string) =>
    value ? parseEther(value).toString() : undefined,
};

const DEFAULT_STREAMS_ORDERING = {
  orderBy: "createdAtTimestamp",
  orderDirection: "desc",
} as Ordering<Stream_OrderBy>;

interface SuperTokenStreamsTableProps {
  network: Network;
  tokenAddress: string;
}

const SuperTokenStreamsTable: FC<SuperTokenStreamsTableProps> = ({
  network,
  tokenAddress,
}) => {
  const filterAnchorRef = useRef(null);

  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [streamStatus, setStreamStatus] = useState<StreamStatus | null>(null);

  const defaultFilter = {
    token: tokenAddress,
  };

  const createDefaultArg = (): Required<StreamsQuery> => ({
    chainId: network.chainId,
    filter: defaultFilter,
    pagination: {
      take: 10,
      skip: 0,
    },
    order: DEFAULT_STREAMS_ORDERING,
  });

  const [queryArg, setQueryArg] = useState<Required<StreamsQuery>>(
    createDefaultArg()
  );

  const [queryTrigger, queryResult] = sfSubgraph.useLazyStreamsQuery();

  const queryTriggerDebounced = useDebounce(queryTrigger, 250);

  const onQueryArgChanged = (newArgs: Required<StreamsQuery>) => {
    setQueryArg(newArgs);

    if (
      queryResult.originalArgs &&
      !isEqual(queryResult.originalArgs.filter, newArgs.filter)
    ) {
      queryTriggerDebounced(newArgs);
    } else {
      queryTrigger(newArgs);
    }
  };

  useEffect(() => {
    onQueryArgChanged(createDefaultArg());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network, tokenAddress]);

  const setPage = (newPage: number) =>
    onQueryArgChanged(
      set("pagination.skip", (newPage - 1) * queryArg.pagination.take, queryArg)
    );

  const setPageSize = (newPageSize: number) =>
    onQueryArgChanged(set("pagination.take", newPageSize, queryArg));

  const onOrderingChanged = (newOrdering: Ordering<Stream_OrderBy>) =>
    onQueryArgChanged({ ...queryArg, order: newOrdering });

  const onSortClicked = (field: Stream_OrderBy) => () => {
    if (queryArg.order.orderBy !== field) {
      onOrderingChanged({
        orderBy: field,
        orderDirection: "desc",
      });
    } else if (queryArg.order.orderDirection === "desc") {
      onOrderingChanged({
        orderBy: field,
        orderDirection: "asc",
      });
    } else {
      onOrderingChanged(DEFAULT_STREAMS_ORDERING);
    }
  };

  const onFilterChange = (newFilter: Stream_Filter) =>
    onQueryArgChanged({
      ...queryArg,
      pagination: { ...queryArg.pagination, skip: 0 },
      filter: newFilter,
    });

  const onSenderChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onFilterChange({
        ...queryArg.filter,
        sender_contains: e.target.value.toLowerCase(),
      });
    } else {
      onFilterChange(omit("sender_contains", queryArg.filter));
    }
  };

  const onReceiverChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onFilterChange({
        ...queryArg.filter,
        receiver_contains: e.target.value.toLowerCase(),
      });
    } else {
      onFilterChange(omit("receiver_contains", queryArg.filter));
    }
  };

  const clearFilterField =
    (...fields: Array<keyof Stream_Filter>) =>
    () =>
      onFilterChange(omit(fields, queryArg.filter));

  const getStreamStatusFilter = (
    status: StreamStatus | null
  ): Stream_Filter => {
    switch (status) {
      case StreamStatus.Active:
        return { currentFlowRate_gt: "0" };
      case StreamStatus.Inactive:
        return { currentFlowRate: "0" };
      default:
        return {};
    }
  };

  const changeStreamStatus = (newStatus: StreamStatus | null) => {
    const { currentFlowRate_gt, currentFlowRate, ...newFilter } =
      queryArg.filter;

    setStreamStatus(newStatus);
    onFilterChange({
      ...newFilter,
      ...getStreamStatusFilter(newStatus),
    });
  };

  const onStreamStatusChange = (_event: unknown, newStatus: StreamStatus) =>
    changeStreamStatus(newStatus);

  const clearStreamStatusFilter = () => changeStreamStatus(null);

  const openFilter = () => setShowFilterMenu(true);
  const closeFilter = () => setShowFilterMenu(false);

  const onFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    closeFilter();
  };

  const resetFilter = () => {
    onFilterChange(defaultFilter);
    closeFilter();
  };

  const tableRows = queryResult.data?.data || [];
  const hasNextPage = !!queryResult.data?.nextPaging;

  const { filter, order, pagination } = queryArg;

  return (
    <>
      <Toolbar sx={{ mt: 3, px: 1 }} variant="dense" disableGutters>
        <Typography sx={{ flex: "1 1 100%" }} variant="h6" component="h2">
          Streams
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mx: 2 }}>
          {filter.sender_contains && (
            <Chip
              label={
                <>
                  Sender: <b>{filter.sender_contains}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("sender_contains")}
            />
          )}

          {filter.receiver_contains && (
            <Chip
              label={
                <>
                  Receiver: <b>{filter.receiver_contains}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("receiver_contains")}
            />
          )}

          {streamStatus !== null && (
            <Chip
              label={
                <>
                  Stream status:{" "}
                  <b>
                    {streamStatus === StreamStatus.Active
                      ? "Active"
                      : "Inactive"}
                  </b>
                </>
              }
              size="small"
              onDelete={clearStreamStatusFilter}
            />
          )}
        </Stack>

        <Tooltip title="Filter">
          <IconButton ref={filterAnchorRef} onClick={openFilter}>
            <FilterListIcon />
          </IconButton>
        </Tooltip>
        <Popover
          open={showFilterMenu}
          anchorEl={filterAnchorRef.current}
          onClose={closeFilter}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Stack
            sx={{ p: 3, pb: 2, minWidth: "300px" }}
            component="form"
            onSubmit={onFormSubmit}
            noValidate
            spacing={2}
          >
            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Sender address
              </Typography>
              <OutlinedInput
                autoFocus
                fullWidth
                size="small"
                value={filter.sender_contains || ""}
                onChange={onSenderChange}
                endAdornment={
                  filter.sender_contains && (
                    <IconButton
                      size="small"
                      sx={{ fontSize: "16px", p: 0.5 }}
                      tabIndex={-1}
                      onClick={clearFilterField("sender_contains")}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Receiver address
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                value={filter.receiver_contains || ""}
                onChange={onReceiverChange}
                endAdornment={
                  filter.receiver_contains && (
                    <IconButton
                      size="small"
                      sx={{ fontSize: "16px", p: 0.5 }}
                      tabIndex={-1}
                      onClick={clearFilterField("receiver_contains")}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Is stream active?
              </Typography>

              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={streamStatus}
                onChange={onStreamStatusChange}
              >
                <ToggleButton value={StreamStatus.Active}>Yes</ToggleButton>
                <ToggleButton value={StreamStatus.Inactive}>No</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              {Object.keys(filter).length !== 0 && (
                <Button onClick={resetFilter} tabIndex={-1}>
                  Reset
                </Button>
              )}
              <Button type="submit" tabIndex={-1}>
                Close
              </Button>
            </Stack>
          </Stack>
        </Popover>
      </Toolbar>
      <Table sx={{ tableLayout: "fixed" }}>
        <TableHead>
          <TableRow>
            <TableCell>Sender</TableCell>
            <TableCell>Receiver</TableCell>
            <TableCell>
              <TableSortLabel
                active={order.orderBy === "currentFlowRate"}
                direction={
                  order.orderBy === "currentFlowRate"
                    ? order.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("currentFlowRate")}
              >
                Flow Rate
                <InfoTooltipBtn
                  iconSx={{ mb: 0 }}
                  title="Flow rate is the velocity of tokens being streamed."
                />
              </TableSortLabel>
            </TableCell>
            <TableCell width="200px">
              <TableSortLabel
                active={order.orderBy === "createdAtTimestamp"}
                direction={
                  order.orderBy === "createdAtTimestamp"
                    ? order.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("createdAtTimestamp")}
              >
                Created
              </TableSortLabel>
            </TableCell>
            <TableCell width="68px" />
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((stream) => (
            <TableRow key={stream.id} hover>
              <TableCell>
                <AccountAddress
                  network={network}
                  address={stream.sender}
                  ellipsis={6}
                />
              </TableCell>
              <TableCell>
                <AccountAddress
                  network={network}
                  address={stream.receiver}
                  ellipsis={6}
                />
              </TableCell>
              <TableCell>
                <FlowRate flowRate={stream.currentFlowRate} />
              </TableCell>
              <TableCell>
                {new Date(stream.createdAtTimestamp * 1000).toLocaleString()}
              </TableCell>

              <TableCell align="right">
                <StreamDetailsDialog network={network} streamId={stream.id}>
                  {(onClick) => (
                    <IconButton
                      title="Details"
                      sx={{ background: "rgba(255, 255, 255, 0.05)" }}
                      onClick={onClick}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  )}
                </StreamDetailsDialog>
              </TableCell>
            </TableRow>
          ))}

          {queryResult.isSuccess && tableRows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                sx={{ border: 0, height: "96px" }}
                align="center"
              >
                <Typography variant="body1">No results</Typography>
              </TableCell>
            </TableRow>
          )}

          {queryResult.isLoading && (
            <TableRow>
              <TableCell
                colSpan={5}
                sx={{ border: 0, height: "96px" }}
                align="center"
              >
                <CircularProgress size={40} />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {tableRows.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} align="right">
                <InfinitePagination
                  page={(pagination.skip ?? 0) / pagination.take + 1}
                  pageSize={pagination.take}
                  isLoading={queryResult.isFetching}
                  hasNext={hasNextPage}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  sx={{ justifyContent: "flex-end" }}
                />
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </>
  );
};

export default SuperTokenStreamsTable;
