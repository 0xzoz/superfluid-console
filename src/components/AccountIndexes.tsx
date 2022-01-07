import {Network, sfApi} from "../redux/store";
import {Account, createSkipPaging, Ordering, SkipPaging} from "@superfluid-finance/sdk-core";
import {FC, ReactElement, useState} from "react";
import IndexSubscriptionDataGrid from "./IndexSubscriptionDataGrid";
import {IndexOrderBy} from "@superfluid-finance/sdk-core/src/subgraph/entities/index";
import {
  IndexSubscriptionOrderBy
} from "@superfluid-finance/sdk-core/src/subgraph/entities/indexSubscription/indexSubscription";
import PublishedIndexDataGrid from "./PublishedIndexDataGrid";
import {Card, Typography} from "@mui/material";

interface Props {
  network: Network,
  account: Account
}

const AccountIndexes: FC<Props> = ({network, account}): ReactElement => {
  const [indexSubscriptionPaging, setIndexSubscriptionPaging] = useState<SkipPaging>(createSkipPaging({
    take: 10
  }));
  const [indexSubscriptionOrdering, setIndexSubscriptionOrdering] = useState<Ordering<IndexSubscriptionOrderBy> | undefined>(undefined);
  const indexSubscriptionQuery = sfApi.useIndexSubscriptionsQuery({
    chainId: network.chainId,
    pagination: indexSubscriptionPaging,
    filter: {
      subscriber: account.id
    },
    order: indexSubscriptionOrdering
  })

  const [publishedIndexPaging, setPublishedIndexPaging] = useState<SkipPaging>(createSkipPaging({
    take: 10
  }));
  const [publishedIndexOrdering, setPublishedIndexOrdering] = useState<Ordering<IndexOrderBy> | undefined>(undefined);
  const publishedIndexQuery = sfApi.useIndexesQuery({
    chainId: network.chainId,
    pagination: publishedIndexPaging,
    filter: {
      publisher: account.id
    },
    order: publishedIndexOrdering
  })

  return <>
    <Card>
      <Typography variant="h5" component="h3">
        Publications
      </Typography>
      <PublishedIndexDataGrid network={network} queryResult={publishedIndexQuery} setPaging={setPublishedIndexPaging} ordering={publishedIndexOrdering} setOrdering={setPublishedIndexOrdering} />
    </Card>
    <Card>
      <Typography variant="h5" component="h3">
        Subscriptions
      </Typography>
    <IndexSubscriptionDataGrid network={network} queryResult={indexSubscriptionQuery} setPaging={setIndexSubscriptionPaging} ordering={indexSubscriptionOrdering} setOrdering={setIndexSubscriptionOrdering}/>
    </Card>
  </>
}

export default AccountIndexes;
