import React, { useEffect, useState } from "react";
import GraphiQL from "graphiql";
import {
  buildClientSchema,
  getIntrospectionQuery,
  print,
  parse,
} from "graphql";
import { request } from "graphql-request";
import type { GraphQLSchema } from "graphql";
import useSfTheme from "../styles/useSfTheme";
import "graphiql/graphiql.min.css";
// @ts-ignore
import GraphiQLExplorer from "graphiql-explorer";
import { Box } from "@mui/material";
import FullPageLoader from "./FullPageLoader";
import _ from "lodash";
import { networks, networksByName } from "../redux/networks";
import { useRouter } from "next/router";

const DocumentationLinks = [
  {
    name: "Subgraph",
    link: "https://docs.superfluid.finance/superfluid/docs/subgraph",
  },
  {
    name: "Protocol",
    link: "https://docs.superfluid.finance/superfluid",
  },
];

const ExampleQueries = [
  {
    name: "Supertokens",
    query: `query getSuperfluidTokens {
  tokens(where: {isListed: true, isSuperToken: true}, first: 25) {
    superTokenAddress: id
    name
    symbol
    underlyingAddress
  }
}
`,
  },
  {
    name: "Accounts",
    query: `query getAccounts {
  accounts(first: 25) {
    id
    createdAtTimestamp
    createdAtBlockNumber
    updatedAtTimestamp
    updatedAtBlockNumber
    isSuperApp
  }
}
`,
  },
  {
    name: "Flow events paginated",
    query: `query getFlowEvents($timePaginator: BigInt! = "0") {
  flowUpdatedEvents(first: 25, orderBy: timestamp, where: {timestamp_gt: $timePaginator}) {
    id
    transactionHash
    timestamp
    token
    sender
    receiver
    flowRate
    oldFlowRate
    type
    totalAmountStreamedUntilTimestamp
  }
}
`,
  },
];

const getGraphQLIntrospectionClientSchemaMemoized = _.memoize(
  (_subgraphUrl: string) =>
    request(_subgraphUrl, getIntrospectionQuery()).then((introspectionResult) =>
      buildClientSchema(introspectionResult)
    )
);

const SubgraphExplorer: React.FC = () => {
  const router = useRouter();
  const { _network, _query, _variables } = router.query;

  useEffect(() => {
    if (router.isReady) {
      if (_network) {
        setNetworkName(_network as string);
      }

      if (_query) {
        setQuery(print(parse(atob(_query as string)))); // Prettify the crushed query.
      }

      if (_variables) {
        setVariables(atob(_variables as string));
      }
    }
  }, [router, _network, _query, _variables]);

  const [networkName, setNetworkName] = useState("matic");
  const theme = useSfTheme();
  const isDarkTheme = theme.palette.mode === "dark";

  const network = networksByName.get(networkName)!;
  const subgraphUrl = network.subgraphUrl;

  const [schema, setSchema] = useState<GraphQLSchema | null>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNetworkLoading, setIsNetworkLoading] = useState(false);
  const [fetchedFromUrl, setFetchedFromUrl] = useState<string | null>(null);
  const [query, setQuery] =
    useState(`# Hi! Welcome to Superfluid's GraphiQL instance for querying Superfluid's Subgraphs (powered by The Graph).

# Try the Explorer on the left to build up queries by just by clicking.
# Try the Documentation Explorer on the right to browse the schema with comments.
# Try the Examples button on the toolbar to select pre-made GraphQL queries.

query MyQuery {
  __typename # Placeholder value
}
`);

  const [variables, setVariables] = useState<string | undefined>(`{
  "variableName": "value"
}`);
  const graphiql = React.createRef<GraphiQL>();

  useEffect(() => {
    if (!schema) {
      setIsInitializing(true);
    } else {
      setIsInitializing(false);
    }
    setIsNetworkLoading(true);
    getGraphQLIntrospectionClientSchemaMemoized(subgraphUrl).then(
      (clientSchema: GraphQLSchema) => {
        setSchema(clientSchema);
        setIsInitializing(false);
        setIsNetworkLoading(false);
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [networkName]);

  const handlePrettifyQuery = () => {
    if (graphiql) {
      graphiql?.current?.handlePrettifyQuery();
    }
  };

  const updateQuery = (query: string | undefined) => {
    setQuery(query ?? "");
  };

  return (
    <>
      {isInitializing ? (
        <FullPageLoader />
      ) : (
        <Box
          component="div"
          className="graphiql-container"
          sx={{ height: "100%", filter: `invert(${isDarkTheme ? 0.925 : 0})` }}
        >
          <GraphiQLExplorer
            schema={schema}
            query={query}
            onEdit={updateQuery}
            explorerIsOpen={isExplorerOpen}
            onToggleExplorer={() => setIsExplorerOpen(!isExplorerOpen)}
          />
          {schema && (
            <GraphiQL
              ref={graphiql}
              schema={schema}
              query={query}
              variables={variables}
              onEditQuery={updateQuery}
              fetcher={async (graphQLParams) => {
                const data = await fetch(subgraphUrl, {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(graphQLParams),
                  credentials: "same-origin",
                });
                setFetchedFromUrl(subgraphUrl);
                return data.json().catch(() => data.text());
              }}
            >
              <GraphiQL.Logo>{" "}</GraphiQL.Logo>
              <GraphiQL.Toolbar>
                <GraphiQL.Button
                  onClick={handlePrettifyQuery}
                  label="Prettify"
                  title="Prettify Query (Shift-Ctrl-P)"
                />
                <GraphiQL.Button
                  onClick={() => setIsExplorerOpen(!isExplorerOpen)}
                  title="Explorer Toggle"
                  label="Explorer"
                />
                <GraphiQL.Menu
                  label={isNetworkLoading ? "Loading..." : network.displayName}
                  title="Select Network"
                >
                  {Object.values(networks).map((network) => (
                    <GraphiQL.MenuItem
                      key={network.chainId}
                      label={network.displayName}
                      title={network.subgraphUrl}
                      onSelect={() => setNetworkName(network.slugName)}
                    />
                  ))}
                </GraphiQL.Menu>
                <GraphiQL.Menu label="Examples" title="Select Example Queries">
                  {ExampleQueries.map((val) => {
                    return (
                      <GraphiQL.MenuItem
                        key={val.name}
                        label={val.name}
                        title={val.name}
                        onSelect={() => updateQuery(val.query)}
                      >
                        {val.name}
                      </GraphiQL.MenuItem>
                    );
                  })}
                </GraphiQL.Menu>
                <GraphiQL.Menu label="Superfluid Docs" title="Superfluid Docs">
                  {DocumentationLinks.map((val) => {
                    return (
                      <GraphiQL.MenuItem
                        key={val.name}
                        label={val.name}
                        title={val.name}
                        onSelect={() => window.open(val.link, "_blank")}
                      >
                        {val.name}
                      </GraphiQL.MenuItem>
                    );
                  })}
                </GraphiQL.Menu>
              </GraphiQL.Toolbar>
              {fetchedFromUrl ? (
                <GraphiQL.Footer>Result from: {fetchedFromUrl}</GraphiQL.Footer>
              ) : (
                <></>
              )}
            </GraphiQL>
          )}
        </Box>
      )}
    </>
  );
};

export default SubgraphExplorer;
