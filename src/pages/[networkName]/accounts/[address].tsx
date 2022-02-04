import {
  Box,
  Breadcrumbs,
  Card,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText, Paper, Skeleton,
  Tab,
  Tabs,
  Typography
} from "@mui/material";
import { ReactNode, SyntheticEvent, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { sfApi, sfSubgraph, wrapper } from "../../../redux/store";
import { skipToken } from "@reduxjs/toolkit/query";
import AccountStreams from "../../../components/AccountStreams";
import AccountIndexes from "../../../components/AccountIndexes";
import AccountTokens from "../../../components/AccountTokens";
import { NextPage } from "next";
import NetworkDisplay from "../../../components/NetworkDisplay";
import SkeletonNetwork from "../../../components/skeletons/SkeletonNetwork";
import SkeletonAddress from "../../../components/skeletons/SkeletonAddress";
import { AccountAddressFormatted } from "../../../components/AccountAddress";
import EventList from "../../../components/EventList";
import { findNetwork } from "../../../redux/networks";
import { FavouriteButton } from "../../../components/AddressBook";
import { TabContext, TabList, TabPanel } from "@mui/lab";
import { addressBookSelectors, createEntryId } from "../../../redux/slices/addressBook.slice";
import { useAppSelector } from "../../../redux/hooks";
import { ethers } from "ethers";

const getAddress = (address: unknown): string => {
  if (typeof address === "string") {
    return address;
  }

  throw Error(`Address ${address} not found. TODO(KK): error page`)
}

const AccountPage: NextPage = () => {
  const router = useRouter()
  const { networkName, address } = router.query;

  const network = typeof networkName === "string" ? findNetwork(networkName) : undefined;
  const accountQuery = sfSubgraph.useAccountQuery(network ? {
    chainId: network.chainId,
    id: getAddress(address)
  } : skipToken);

  const [triggerMonitoring, monitorResult] = sfApi.useMonitorForEventsToInvalidateCacheMutation();
  useEffect(() => {
    if (network && accountQuery.data) {
      triggerMonitoring({
        chainId: network.chainId,
        address: accountQuery.data.id
      });
      return monitorResult.reset;
    }
  }, [])

  const [tabValue, setTabValue] = useState<string>("streams");
  const addressBookEntry = useAppSelector(state => network ? addressBookSelectors.selectById(state, createEntryId(network, getAddress(address))) : undefined);

  return (
    <Container component={Box} sx={{ my: 2, py: 2 }}>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Breadcrumbs aria-label="breadcrumb">
            <Typography color="text.secondary">{network && network.displayName}</Typography>
            <Typography color="text.secondary">Accounts</Typography>
            <Typography color="text.secondary">{accountQuery.data && accountQuery.data.id}</Typography>
          </Breadcrumbs>
        </Grid>

        <Grid item xs={12}>
          {(network && accountQuery.data) && (
            <Typography variant="h4" component="h1"><Grid container component={Box} direction="row" alignItems="center">
              <Grid item><FavouriteButton iconProps={{ fontSize: "large" }} network={network} address={accountQuery.data.id} /></Grid>
              <Grid item>{addressBookEntry ? addressBookEntry.nameTag : accountQuery.data.isSuperApp ? "Super App" : "Account"}</Grid>
            </Grid></Typography>)
          }
        </Grid>

        <Grid item xs={12}>
          <Card elevation={2}>
            <Grid container>
              <Grid item md={6}>
                <List>
                  <ListItem divider>
                    <ListItemText secondary="Address"
                      primary={(accountQuery.data) ? ethers.utils.getAddress(accountQuery.data.id) :
                        <SkeletonAddress />} />
                  </ListItem>
                  <ListItem divider>
                    <ListItemText secondary="Account Type"
                      primary={accountQuery.data ? (accountQuery.data.isSuperApp ? "Super App" : "Regular account") :
                        <Skeleton sx={{ width: "40px" }} />} />
                  </ListItem>
                </List>
              </Grid>
              <Grid item md={6}>
                <List>
                  <ListItem divider>
                    <ListItemText secondary="Network"
                      primary={network ? <NetworkDisplay network={network} /> : <SkeletonNetwork />} />
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card elevation={2}>
            <TabContext value={tabValue}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList variant="scrollable"
                  scrollButtons="auto"
                  onChange={(_event, newValue: string) => setTabValue(newValue)}
                  aria-label="tabs">
                  <Tab label="Streams" value="streams" />
                  <Tab label="Indexes" value="indexes" />
                  <Tab label="Super Tokens" value="tokens" />
                  <Tab label="Events" value="events" />
                </TabList>
              </Box>
              <Box>
                <TabPanel value="events">
                  {(network && address) && <EventList network={network} address={getAddress(address)} />}
                </TabPanel>
                <TabPanel value="tokens">
                  {(network && address) && <AccountTokens network={network} accountAddress={getAddress(address)} />}
                </TabPanel>
                <TabPanel value="streams">
                  {(network && address) && <AccountStreams network={network} accountAddress={getAddress(address)} />}
                </TabPanel>
                <TabPanel value="indexes">
                  {(network && address) && <AccountIndexes network={network} accountAddress={getAddress(address)} />}
                </TabPanel>
              </Box>
            </TabContext>
          </Card>
        </Grid>
      </Grid>

    </Container >
  );
}

export default AccountPage;
