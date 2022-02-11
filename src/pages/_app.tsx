import Head from "next/head";
import { AppProps } from "next/app";
import CssBaseline from "@mui/material/CssBaseline";
import { CacheProvider, EmotionCache } from "@emotion/react";
import createEmotionCache from "../utils/createEmotionCache";
import { wrapper } from "../redux/store";
import SfAppBar from "../components/SfAppBar";
import { FC, useEffect } from "react";
import Box from "@mui/material/Box";
import "../styles/graphiql.min.css";
import "../styles/app.css";
import { ThemeProvider } from "@mui/material/styles";
import useSfTheme from "../styles/useSfTheme";
import { hotjar } from "react-hotjar";
import Footer from "../components/Footer";
import { useRouter } from "next/router";
import { tryGetNetwork, tryGetString } from "../redux/networks";
import { isDynamicRoute } from "../utils/isDynamicRoute";
import Error from "next/error";
import NetworkContext from "../contexts/NetworkContext";
import IdContext from "../contexts/IdContext";

// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const theme = useSfTheme();

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_HJID && process.env.NEXT_PUBLIC_HJSV) {
      hotjar.initialize(
        Number(process.env.NEXT_PUBLIC_HJID),
        Number(process.env.NEXT_PUBLIC_HJSV)
      );
    } else {
      console.log("Hotjar not initialized.");
    }
  });

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>Superfluid Console</title>
        {/* "theme-mode" is required to be in the head element by `useSfTheme`. */}
        <meta id="theme-mode" name="theme-mode" content={theme.palette.mode} />
        <meta name="theme-color" content={theme.palette.primary.main} />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </Head>
      <ThemeProvider theme={theme}>
        {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexFlow: "column",
            height: "100vh"
          }}
        >
          <SfAppBar />
          <Box component="main" sx={{ height: "100vh" }}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
            <Footer  />
          </Box>
        </Box>
      </ThemeProvider>
    </CacheProvider>
  );
}

/**
 * Scopes to network & id for dynamic routes. Idea is to reduce boilerplate in the specific pages. The downside is that a bit less can be pre-rendered.
 */
const Layout: FC = ({ children }) => {
  const router = useRouter();
  const { _network, _id } = router.query;

  if (isDynamicRoute(router)) {
    if (router.isReady) {
      const network = tryGetNetwork(_network);
      const id = tryGetString(_id);

      if (!network || !id) {
        return <Error statusCode={404} />;
      } else {
        return (
          <NetworkContext.Provider value={network}>
            <IdContext.Provider value={id}>{children}</IdContext.Provider>
          </NetworkContext.Provider>
        );
      }
    } else {
      return (
        // Prefer to show blank page here instead of a loder (less flickering).
        <Box
          sx={{
            height: "100vh",
            width: "100vw",
          }}
        ></Box>
      );
    }
  }

  return <>{children}</>;
};

// NOTE: This wraps the React code with Redux provider component.
export default wrapper.withRedux(MyApp);

export const getRenderedThemeMode = (): "light" | "dark" => {
  // Theme mode is saved to meta tag. We look for it from the DOM because of static optimizations of Next.js.
  const themeModeMetaElement = window.document.getElementById("theme-mode");
  if (!themeModeMetaElement) {
    console.error("Meta tag for theme mode not found!"); // Sometimes happens with HMR.
    return "light"; // *sigh*, default to light.
  }
  return themeModeMetaElement.getAttribute("content") as "light" | "dark";
};