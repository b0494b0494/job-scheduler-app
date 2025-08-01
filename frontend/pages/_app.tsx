import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline, Box } from '@mui/material'; // Boxをインポート
import theme from '../theme';
import Menu from '../components/Menu'; // Menuコンポーネントをインポート

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Menu /> {/* Menuコンポーネントを配置 */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}> {/* コンテンツ部分をBoxでラップ */}
        <Component {...pageProps} />
      </Box>
    </ThemeProvider>
  );
}

export default MyApp;