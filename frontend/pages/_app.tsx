import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import theme from '../theme';
import Menu from '../components/Menu';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '../utils/trpc';
import { httpLink } from '@trpc/client'; // httpBatchLinkからhttpLinkに変更

function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = React.useState(() => new QueryClient());
  const [trpcClient] = React.useState(() =>
    trpc.createClient({
      links: [
        httpLink({ // httpBatchLinkからhttpLinkに変更
          url: 'http://localhost:3001/trpc',
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Menu />
          <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
            <Component {...pageProps} />
          </Box>
        </ThemeProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default MyApp;