import {FC, forwardRef, ReactElement, Ref, useState} from "react";
import {Network, sfApi} from "../redux/store";
import {
  createSkipPaging,
  IndexSubscription,
  Ordering,
  SkipPaging, Stream,
  StreamPeriodOrderBy
} from "@superfluid-finance/sdk-core";
import Container from "@mui/material/Container";
import StreamPeriodDataGrid from "./StreamPeriodDataGrid";
import {
  AppBar,
  Box,
  Button,
  Card,
  Dialog,
  Grid,
  IconButton,
  List, ListItem, ListItemText,
  Slide,
  TextField,
  Toolbar,
  Typography
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import {TransitionProps} from "@mui/material/transitions";
import {AppDataGrid} from "./AppDataGrid";

interface Props {
  network: Network;
  streamId: string
}

const StreamDetails: FC<Props> = ({network, streamId}) => {
  const streamQuery = sfApi.useStreamQuery({
    chainId: network.chainId,
    id: streamId
  });

  const stream: Stream | undefined | null = streamQuery.data

  const [streamPeriodPaging, setStreamPeriodPaging] = useState<SkipPaging>(createSkipPaging())
  const [streamPeriodOrdering, setStreamPeriodOrdering] = useState<Ordering<StreamPeriodOrderBy> | undefined>()
  const streamPeriodListQuery = sfApi.useStreamPeriodsQuery({
    chainId: network.chainId,
    filter: {
      stream: streamId.toLowerCase()
    },
    pagination: streamPeriodPaging,
    order: streamPeriodOrdering
  });

  return (<Container>
    <Typography variant="h2">
      Stream Details
    </Typography>
    {stream && (<>
      <Card>
        <List>
          <ListItem divider>
            <ListItemText primary="Token" secondary={stream.token}/>
          </ListItem>
          <ListItem divider>
            <ListItemText primary="Sender" secondary={stream.sender}/>
          </ListItem>
          <ListItem divider>
            <ListItemText primary="Receiver" secondary={stream.receiver}/>
          </ListItem>
          <ListItem divider>
            <ListItemText primary="Current Flow Rate" secondary={stream.currentFlowRate}/>
          </ListItem>
          <ListItem>
            <ListItemText primary="Created At" secondary={new Date(stream.createdAtTimestamp * 1000).toDateString()}/>
          </ListItem>
        </List>
      </Card>
      <Card>
        <Typography variant="h3">
          Stream Periods
        </Typography>
        <StreamPeriodDataGrid queryResult={streamPeriodListQuery} setPaging={setStreamPeriodPaging}
                              ordering={streamPeriodOrdering} setOrdering={setStreamPeriodOrdering}/>
      </Card>
    </>)}
  </Container>)
};


const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export const StreamDetailsDialog: FC<Props> = (props) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Button variant="outlined" onClick={handleClickOpen}>
        Details
      </Button>
      <Dialog
        fullScreen
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{position: 'relative'}}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={handleClose}
              aria-label="close"
            >
              <CloseIcon/>
            </IconButton>
          </Toolbar>
        </AppBar>
        <StreamDetails {...props} />
      </Dialog>
    </Box>
  );
}

