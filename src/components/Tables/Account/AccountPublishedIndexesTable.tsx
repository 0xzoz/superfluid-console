import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CloseIcon from "@mui/icons-material/Close";
import FilterListIcon from "@mui/icons-material/FilterList";
import {
  Box,
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
import {
  createSkipPaging,
  Index_Filter,
  Index_OrderBy,
  Ordering,
} from "@superfluid-finance/sdk-core";
import { IndexesQuery } from "@superfluid-finance/sdk-redux";
import omit from "lodash/fp/omit";
import set from "lodash/fp/set";
import isEqual from "lodash/isEqual";
import { ChangeEvent, FC, FormEvent, useEffect, useRef, useState } from "react";
import useDebounce from "../../../hooks/useDebounce";
import { Network } from "../../../redux/networks";
import { sfSubgraph } from "../../../redux/store";
import BalanceWithToken from "../../BalanceWithToken";
import { IndexPublicationDetailsDialog } from "../../IndexPublicationDetails";
import InfinitePagination from "../../InfinitePagination";
import InfoTooltipBtn from "../../InfoTooltipBtn";
import TimeAgo from "../../TimeAgo";

export enum DistributionStatus {
  Distributed,
  NotDistributed,
}

export enum UnitsStatus {
  Issued,
  NotIssued,
}

export const publishedIndexOrderingDefault: Ordering<Index_OrderBy> = {
  orderBy: "createdAtTimestamp",
  orderDirection: "desc",
};

export const publishedIndexPagingDefault = createSkipPaging({
  take: 10,
});

interface AccountPublishedIndexesTableProps {
  network: Network;
  accountAddress: string;
}

const AccountPublishedIndexesTable: FC<AccountPublishedIndexesTableProps> = ({
  network,
  accountAddress,
}) => {
  const filterAnchorRef = useRef(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const [distributionStatus, setDistributionStatus] =
    useState<DistributionStatus | null>(null);
  const [unitsStatus, setUnitsStatus] = useState<UnitsStatus | null>(null);

  const defaultFilter = {
    publisher: accountAddress,
  };

  const createDefaultArg = (): Required<IndexesQuery> => ({
    chainId: network.chainId,
    filter: defaultFilter,
    pagination: publishedIndexPagingDefault,
    order: publishedIndexOrderingDefault,
  });

  const [queryArg, setQueryArg] = useState<Required<IndexesQuery>>(
    createDefaultArg()
  );

  const [queryTrigger, queryResult] = sfSubgraph.useLazyIndexesQuery();

  const queryTriggerDebounced = useDebounce(queryTrigger, 250);

  const onQueryArgChanged = (newArgs: Required<IndexesQuery>) => {
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
  }, [network, accountAddress]);

  const setPage = (newPage: number) =>
    onQueryArgChanged(
      set("pagination.skip", (newPage - 1) * queryArg.pagination.take, queryArg)
    );

  const setPageSize = (newPageSize: number) =>
    onQueryArgChanged(set("pagination.take", newPageSize, queryArg));

  const onOrderingChanged = (newOrdering: Ordering<Index_OrderBy>) =>
    onQueryArgChanged({ ...queryArg, order: newOrdering });

  const onSortClicked = (field: Index_OrderBy) => () => {
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
      onOrderingChanged(publishedIndexOrderingDefault);
    }
  };

  const onFilterChange = (newFilter: Index_Filter) => {
    onQueryArgChanged({
      ...queryArg,
      pagination: { ...queryArg.pagination, skip: 0 },
      filter: newFilter,
    });
  };

  const onIndexIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onFilterChange({
        ...queryArg.filter,
        indexId: e.target.value,
      });
    } else {
      onFilterChange(omit("indexId", queryArg.filter));
    }
  };

  const getDistributionStatusFilter = (
    status: DistributionStatus | null
  ): Index_Filter => {
    switch (status) {
      case DistributionStatus.Distributed:
        return { totalAmountDistributedUntilUpdatedAt_gt: "0" };
      case DistributionStatus.NotDistributed:
        return { totalAmountDistributedUntilUpdatedAt: "0" };
      default:
        return {};
    }
  };

  const changeDistributionStatus = (newStatus: DistributionStatus | null) => {
    const {
      totalAmountDistributedUntilUpdatedAt_gt,
      totalAmountDistributedUntilUpdatedAt,
      ...newFilter
    } = queryArg.filter;

    setDistributionStatus(newStatus);
    onFilterChange({
      ...newFilter,
      ...getDistributionStatusFilter(newStatus),
    });
  };

  const onDistributionStatusChange = (
    _event: unknown,
    newValue: DistributionStatus
  ) => changeDistributionStatus(newValue);

  const clearDistributionStatusFilter = () => changeDistributionStatus(null);

  const getUnitsStatusFilter = (status: UnitsStatus | null): Index_Filter => {
    switch (status) {
      case UnitsStatus.Issued:
        return { totalUnits_gt: "0" };
      case UnitsStatus.NotIssued:
        return { totalUnits: "0" };
      default:
        return {};
    }
  };

  const changeUnitsStatus = (newStatus: UnitsStatus | null) => {
    const { totalUnits_gt, totalUnits, ...newFilter } = queryArg.filter;

    setUnitsStatus(newStatus);
    onFilterChange({
      ...newFilter,
      ...getUnitsStatusFilter(newStatus),
    });
  };

  const onUnitsStatusChange = (_event: unknown, newStatus: UnitsStatus) =>
    changeUnitsStatus(newStatus);

  const clearUnitsStatusFilter = () => changeUnitsStatus(null);

  const clearFilterField =
    (...fields: Array<keyof Index_Filter>) =>
    () =>
      onFilterChange(omit(fields, queryArg.filter));

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

  const {
    skip = publishedIndexPagingDefault.skip,
    take = publishedIndexPagingDefault.take,
  } = queryResult.data?.paging || {};

  return (
    <>
      <Toolbar sx={{ mt: 3, px: 1 }} variant="dense" disableGutters>
        <Typography sx={{ flex: "1 1 100%" }} variant="h6" component="h2">
          Publications
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mx: 2 }}>
          {filter.indexId && (
            <Chip
              label={
                <>
                  Index ID: <b>{filter.indexId}</b>
                </>
              }
              size="small"
              onDelete={clearFilterField("indexId")}
            />
          )}

          {distributionStatus !== null && (
            <Chip
              label={
                distributionStatus === DistributionStatus.Distributed
                  ? "Has distributed tokens"
                  : "Has not distributed tokens"
              }
              size="small"
              onDelete={clearDistributionStatusFilter}
            />
          )}

          {unitsStatus !== null && (
            <Chip
              label={
                unitsStatus === UnitsStatus.Issued
                  ? "Has issued units"
                  : "Has not issued units"
              }
              size="small"
              onDelete={clearUnitsStatusFilter}
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
                Index ID
              </Typography>
              <OutlinedInput
                fullWidth
                size="small"
                type="number"
                inputProps={{ min: 0 }}
                value={filter.indexId || ""}
                onChange={onIndexIdChange}
                endAdornment={
                  filter.indexId && (
                    <IconButton
                      size="small"
                      sx={{ fontSize: "16px", p: 0.5 }}
                      tabIndex={-1}
                      onClick={clearFilterField("indexId")}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )
                }
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Has distributed?
              </Typography>

              <ToggleButtonGroup
                size="small"
                exclusive
                fullWidth
                value={distributionStatus}
                onChange={onDistributionStatusChange}
              >
                <ToggleButton value={DistributionStatus.Distributed}>
                  Yes
                </ToggleButton>
                <ToggleButton value={DistributionStatus.NotDistributed}>
                  No
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <Box>
              <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                Has issued units?
              </Typography>

              <ToggleButtonGroup
                size="small"
                exclusive
                fullWidth
                value={unitsStatus}
                onChange={onUnitsStatusChange}
              >
                <ToggleButton value={UnitsStatus.Issued}>Yes</ToggleButton>
                <ToggleButton value={UnitsStatus.NotIssued}>No</ToggleButton>
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
            <TableCell>Index ID</TableCell>
            <TableCell>
              <TableSortLabel
                active={
                  order?.orderBy === "totalAmountDistributedUntilUpdatedAt"
                }
                direction={
                  order?.orderBy === "totalAmountDistributedUntilUpdatedAt"
                    ? order?.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("totalAmountDistributedUntilUpdatedAt")}
              >
                Total Distributed
              </TableSortLabel>
            </TableCell>
            <TableCell>
              <TableSortLabel
                active={order?.orderBy === "totalUnits"}
                direction={
                  order?.orderBy === "totalUnits"
                    ? order?.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("totalUnits")}
              >
                Total Units
                <InfoTooltipBtn
                  title="The sum of total pending and approved units issued to subscribers."
                  iconSx={{ mb: 0, mr: 0.5 }}
                />
              </TableSortLabel>
            </TableCell>
            <TableCell width="140px">
              <TableSortLabel
                active={order?.orderBy === "updatedAtTimestamp"}
                direction={
                  order?.orderBy === "updatedAtTimestamp"
                    ? order?.orderDirection
                    : "desc"
                }
                onClick={onSortClicked("updatedAtTimestamp")}
              >
                Created
              </TableSortLabel>
            </TableCell>
            <TableCell width="68px" />
          </TableRow>
        </TableHead>
        <TableBody>
          {tableRows.map((index) => (
            <TableRow key={index.id} hover>
              <TableCell>{index.indexId}</TableCell>
              <TableCell>
                <BalanceWithToken
                  wei={index.totalAmountDistributedUntilUpdatedAt}
                  network={network}
                  tokenAddress={index.token}
                />
              </TableCell>
              <TableCell>{index.totalUnits}</TableCell>
              <TableCell>
                <TimeAgo
                  subgraphTime={index.createdAtTimestamp}
                  typographyProps={{ typography: "body2" }}
                />
              </TableCell>

              <TableCell align="right">
                <IndexPublicationDetailsDialog
                  network={network}
                  indexId={index.id.toString()}
                >
                  {(onClick) => (
                    <IconButton
                      title="Details"
                      sx={{ background: "rgba(255, 255, 255, 0.05)" }}
                      onClick={onClick}
                    >
                      <ArrowForwardIcon fontSize="small" />
                    </IconButton>
                  )}
                </IndexPublicationDetailsDialog>
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
                  page={skip / take + 1}
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

export default AccountPublishedIndexesTable;
