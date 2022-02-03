import {configureStore} from "@reduxjs/toolkit";
import {
  createApiWithReactHooks,
  initializeSfApiSlice,
  initializeSubgraphSlice,
  initializeSfTransactionSlice,
  setFrameworkForSdkRedux, allSubgraphSliceEndpoints
} from "@superfluid-finance/sdk-redux";
import {Framework} from "@superfluid-finance/sdk-core";
import {ethers} from "ethers";
import {createWrapper} from "next-redux-wrapper";
import {nextReduxCookieMiddleware, SERVE_COOKIES, wrapMakeStore} from "next-redux-cookie-wrapper";
import {themePreferenceSlice} from "./slices/appPreferences.slice";
import {addressBookSlice} from "./slices/addressBook.slice";
import {networks} from "./networks";
import storageLocal from "redux-persist/lib/storage";
import storageSession from "redux-persist/lib/storage/session";
import {FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE} from "redux-persist";
import {isServer} from "../utils/isServer";
import {searchHistorySlice} from "./slices/searchHistory.slice";

export const {sfApi} = initializeSfApiSlice(createApiWithReactHooks);
export const sfSubgraph = initializeSubgraphSlice(createApiWithReactHooks).injectEndpoints(allSubgraphSliceEndpoints);
export const {sfTransactions} = initializeSfTransactionSlice();

const infuraProviders = networks.map(network => ({
  chainId: network.chainId,
  frameworkGetter: () =>
    Framework.create({
      chainId: network.chainId,
      provider:
        new ethers.providers.JsonRpcProvider(
          network.rpcUrl
        ),
    }),
}));

export const makeStore = wrapMakeStore(() => {
  infuraProviders.map((x) =>
    setFrameworkForSdkRedux(x.chainId, x.frameworkGetter)
  );

  const addressBookReducer = persistReducer(
    {key: 'address-book', version: 1, storage: storageLocal},
    addressBookSlice.reducer,
  );

  const searchHistoryReducer = persistReducer(
    {key: 'search-history', version: 1, storage: storageSession},
    searchHistorySlice.reducer,
  );

  const store = configureStore({
    reducer: {
      "sfApi": sfApi.reducer,
      "sfSubgraph": sfSubgraph.reducer,
      "sfTransactions": sfTransactions.reducer,
      [themePreferenceSlice.name]: themePreferenceSlice.reducer,
      [addressBookSlice.name]: addressBookReducer,
      [searchHistorySlice.name]: searchHistoryReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, SERVE_COOKIES], // Ignore redux-persist actions: https://stackoverflow.com/a/62610422
        },
      }).prepend(nextReduxCookieMiddleware({
        compress: true,
        subtrees: ["appPreferences"]
      })).concat(sfApi.middleware).concat(sfSubgraph.middleware),
  });

  if (!isServer()) {
    persistStore(store);
  }

  return store;
});

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const wrapper = createWrapper<AppStore>(makeStore, {
  debug: true,
  serializeState: (state) => JSON.stringify(state),
  deserializeState: (state) => JSON.parse(state)
});
