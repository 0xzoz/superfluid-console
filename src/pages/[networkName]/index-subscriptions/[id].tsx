import { NextPage } from "next";
import { useRouter } from "next/router";
import { FC, useState } from "react";
import { findNetwork, Network } from "../../../redux/networks";
import Error from "next/error";
import { sfSubgraph } from "../../../redux/store";
import { createSkipPaging, Index, IndexSubscription, Ordering, SkipPaging, SubscriptionUnitsUpdatedEvent_OrderBy } from "@superfluid-finance/sdk-core";
import { skipToken } from "@reduxjs/toolkit/dist/query";
import { Box, Card, Container, Grid, List, ListItem, ListItemText, Skeleton, Typography } from "@mui/material";
import SuperTokenAddress from "../../../components/SuperTokenAddress";
import SkeletonAddress from "../../../components/skeletons/SkeletonAddress";
import AccountAddress from "../../../components/AccountAddress";
import { BigNumber } from "ethers";
import SubscriptionUnitsUpdatedEventDataGrid from "../../../components/SubscriptionUnitsUpdatedEventDataGrid";

const IndexSubscriptionPage: NextPage = () => {
    const router = useRouter()
    const { networkName, id } = router.query;

    const network = typeof networkName === "string" ? findNetwork(networkName) : undefined;

    if (!network) {
        return <Error statusCode={404} />;
    }

    return <IndexSubscriptionPageContent indexSubscriptionId={getId(id)} network={network} />;;
}

export default IndexSubscriptionPage;

export const IndexSubscriptionPageContent: FC<{ indexSubscriptionId: string, network: Network }> = ({ indexSubscriptionId, network }) => {
    const indexSubscriptionQuery = sfSubgraph.useIndexSubscriptionQuery({
        chainId: network.chainId,
        id: indexSubscriptionId
    });

    const indexSubscription: IndexSubscription | undefined | null = indexSubscriptionQuery.data

    const indexQuery = sfSubgraph.useIndexQuery(indexSubscription ? {
        chainId: network.chainId,
        id: indexSubscription.index
    } : skipToken);

    const index: Index | undefined | null = indexQuery.data

    const [subscriptionUnitsUpdatedEventPaging, setSubscriptionUnitsUpdatedEventPaging] = useState<SkipPaging>(createSkipPaging({
        take: 10
    }))
    const [subscriptionUnitsUpdatedEventPagingOrdering, setSubscriptionUnitsUpdatedEventOrdering] = useState<Ordering<SubscriptionUnitsUpdatedEvent_OrderBy> | undefined>()
    const subscriptionUnitsUpdatedEventQuery = sfSubgraph.useSubscriptionUnitsUpdatedEventsQuery({
        chainId: network.chainId,
        filter: {
            subscription: indexSubscriptionId.toLowerCase()
        },
        pagination: subscriptionUnitsUpdatedEventPaging,
        order: subscriptionUnitsUpdatedEventPagingOrdering
    });

    return (<Container component={Box} sx={{ my: 2, py: 2 }}>
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h3" component="h1">
                    Index Subscription
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Card elevation={2}>
                    <List>
                        <ListItem divider>
                            <ListItemText secondary="Token"
                                primary={(network && indexSubscription) ?
                                    <SuperTokenAddress network={network} address={indexSubscription.token} /> :
                                    <SkeletonAddress />} />
                        </ListItem>
                        <ListItem divider>
                            <ListItemText secondary="Publisher"
                                primary={(network && indexSubscription) ?
                                    <AccountAddress network={network} address={indexSubscription.publisher} /> :
                                    <SkeletonAddress />} />
                        </ListItem>
                        <ListItem divider>
                            <ListItemText secondary="Subscriber"
                                primary={(network && indexSubscription) ?
                                    <AccountAddress network={network} address={indexSubscription.subscriber} /> :
                                    <SkeletonAddress />} />
                        </ListItem>
                        <ListItem divider>
                            <ListItemText secondary="Total Units Received" primary={(indexSubscription && index) ? calculateUnitsReceived(
                                BigNumber.from(index.indexValue),
                                BigNumber.from(indexSubscription.totalAmountReceivedUntilUpdatedAt),
                                BigNumber.from(indexSubscription.indexValueUntilUpdatedAt),
                                Number(indexSubscription.units)
                            ).toString() : <Skeleton sx={{ width: "100px" }} />} />
                        </ListItem>
                    </List>
                </Card>
            </Grid>

            <Grid item xs={12}>
                <Typography variant="h5" component="h2" sx={{ mb: 1 }}>
                    Distributions
                </Typography>
                <Card elevation={2}>
                    <SubscriptionUnitsUpdatedEventDataGrid
                        queryResult={subscriptionUnitsUpdatedEventQuery}
                        setPaging={setSubscriptionUnitsUpdatedEventPaging}
                        ordering={subscriptionUnitsUpdatedEventPagingOrdering}
                        setOrdering={setSubscriptionUnitsUpdatedEventOrdering} />
                </Card>
            </Grid>
        </Grid>
    </Container>)
}

const getId = (id: unknown): string => {
    if (typeof id === "string") {
        return id;
    }
    throw `Id ${id} not found. TODO(KK): error page`;
}

const calculateUnitsReceived = (
    publisherIndexValue: BigNumber,
    subscriberTotalAmountReceivedUntilUpdatedAt: BigNumber,
    subscriberIndexValueUntilUpdatedAt: BigNumber,
    subscriberUnits: number
) => {
    const totalUnitsReceived = subscriberTotalAmountReceivedUntilUpdatedAt.add(
        publisherIndexValue
            .sub(subscriberIndexValueUntilUpdatedAt)
            .mul(subscriberUnits)
    );

    return totalUnitsReceived;
};
