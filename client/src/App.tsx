import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import {
  createTheme,
  DEFAULT_THEME,
  MantineProvider,
  AppShell,
  mergeMantineTheme,
  Button,
  Container,
  Text,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";

import { useAppSelector } from "./store/hooks";
import { selectPrimaryColor } from "./store/themeSlice";

import Header from "./components/Header";
import Trade from "./components/Trade";
import {
  useMeQuery,
  useGetCoinsQuery,
  useLazyGetMyHoldingsQuery,
  useLazyGetMyOrdersQuery,
} from "./store/api";

import "./App.css";

const HEADER_HEIGHT = 60;

function ErrorContent() {
  return (
    <Container>
      <Text>Something went wrong.</Text>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload
      </Button>
    </Container>
  );
}

function App() {
  const { data: user } = useMeQuery();
  useGetCoinsQuery();

  const [fetchHoldings] = useLazyGetMyHoldingsQuery();
  const [fetchOrders] = useLazyGetMyOrdersQuery();

  useEffect(() => {
    if (user) {
      void fetchHoldings();
      void fetchOrders();
    }
  }, [user, fetchHoldings, fetchOrders]);

  const primaryColor = useAppSelector(selectPrimaryColor);

  const theme = mergeMantineTheme(
    DEFAULT_THEME,
    createTheme({
      primaryColor,
      fontFamily: "Verdana, sans-serif",
    }),
  );

  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <ErrorBoundary fallback={<ErrorContent />}>
        <Notifications />
        <BrowserRouter>
          <AppShell h="100%" header={{ height: HEADER_HEIGHT }} padding="md">
            <AppShell.Header>
              <Header />
            </AppShell.Header>
            <AppShell.Main h="100%">
              <Routes>
                <Route index path="/" element={<Trade />} />
                <Route path="/trade" element={<h1>Trade</h1>} />
                <Route path="/portfolio" element={<h1>Portfolio</h1>} />
                <Route path="/account" element={<h1>Account</h1>} />
                <Route path="/settings" element={<h1>Settings</h1>} />
              </Routes>
            </AppShell.Main>
          </AppShell>
        </BrowserRouter>
      </ErrorBoundary>
    </MantineProvider>
  );
}

export default App;
