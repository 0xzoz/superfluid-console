import {Box, Breadcrumbs, Container, Link, Tab, Tabs, Typography} from "@mui/material";
import {ReactNode, SyntheticEvent, useState} from "react";
import {useRouter} from "next/router";
import {findNetwork, sfApi} from "../../../redux/store";
import {skipToken} from "@reduxjs/toolkit/query";
import AccountStreams from "../../../components/AccountStreams";
import AppLink from "../../../components/AppLink";
import AccountIndexes from "../../../components/AccountIndexes";
import AccountOverview from "../../../components/AccountOverview";
import {NextPage} from "next";

const getAddress = (address: unknown): string => {
  if (typeof address === "string") {
    return address;
  }

  throw Error(`Address ${address} not found. TODO(KK): error page`)
}

const AccountPage: NextPage = () => {
  const router = useRouter()
  const {networkName, address} = router.query;
  const [value, setValue] = useState(0);

  const network = typeof networkName === "string" ? findNetwork(networkName) : undefined;
  const queryResult = sfApi.useAccountQuery(network ? {
    chainId: network.chainId,
    id: getAddress(address)
  } : skipToken);

  const handleChange = (event: SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (<Container>
    {
      network && <Breadcrumbs aria-label="breadcrumb">
        <AppLink underline="hover" color="inherit" href={`/${network.slugName}`}>
          {network.slugName}
        </AppLink>
        <AppLink underline="hover" color="inherit" href={`/${network.slugName}/accounts`}>
          Accounts
        </AppLink>
        <AppLink underline="hover" color="inherit" href={`/${network.slugName}/accounts/${address}`}>
          {address}
        </AppLink>
      </Breadcrumbs>
    }
    <Typography variant="h2" component="h1">
      {address}
    </Typography>
    <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
      <Tabs value={value} onChange={handleChange} aria-label="basic tabs example">
        <Tab label="Overview" {...a11yProps(0)} />
        <Tab label="Streams" {...a11yProps(1)} />
        <Tab label="Indexes" {...a11yProps(2)} />
        <Tab label="Events" {...a11yProps(3)} />
      </Tabs>
    </Box>
    <TabPanel value={value} index={0}>
      {(network && address) && <AccountOverview network={network} accountAddress={getAddress(address)}/>}
    </TabPanel>
    <TabPanel value={value} index={1}>
      <Typography variant="h5" component="h2">
        Streams
      </Typography>
      {(network && address) && <AccountStreams network={network} accountAddress={getAddress(address)}/>}
    </TabPanel>
    <TabPanel value={value} index={2}>
      {(network && address) && <AccountIndexes network={network} accountAddress={getAddress(address)}/>}
    </TabPanel>
    <TabPanel value={value} index={3}>
      <Typography variant="h5" component="h2">
        Events
      </Typography>
    </TabPanel>
  </Container>);

}

AccountPage.getInitialProps = () => {
  return {};
}

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function a11yProps(index: number) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  };
}

function TabPanel(props: TabPanelProps) {
  const {children, value, index, ...other} = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{p: 3}}>
          {value === index && children}
        </Box>
      )}
    </div>
  );
}

export default AccountPage;
