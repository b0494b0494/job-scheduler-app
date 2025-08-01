import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // ダークモードに設定
    background: {
      default: '#121212', // より暗い背景
      paper: '#212121',   // カードなどの背景を少し明るいグレーに
    },
    primary: {
      main: '#82b1ff', // 明るい青（ダークテーマ向け）
    },
    secondary: {
      main: '#ff8a80', // 明るい赤（ダークテーマ向け）
    },
    text: {
      primary: '#e0e0e0', // 明るいテキスト色
      secondary: '#b0b0b0', // 少し暗いテキスト色
    },
    success: {
      main: '#69f0ae', // 明るい緑
    },
    warning: {
      main: '#ffc400', // 明るい黄色
    },
    error: {
      main: '#ff5252', // 明るい赤
    },
    info: {
      main: '#80d8ff', // 明るい水色
    },
  },
  shape: {
    borderRadius: 4, // 角の丸みはそのままシャープに
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)', // ダークテーマ向けに影を調整
          },
        },
      },
    },
    MuiTextField: {
        defaultProps: {
            variant: 'outlined',
        },
        styleOverrides: {
            root: {
                '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.23)', // アウトラインの色を調整
                    },
                    '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                    },
                    '&.Mui-focused fieldset': {
                        borderColor: '#82b1ff', // フォーカス時の色
                    },
                },
            },
        },
    },
    MuiCard: {
        styleOverrides: {
            root: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)', // ダークテーマ向けに影を強調
            }
        }
    },
    MuiPaper: {
        styleOverrides: {
            root: {
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }
        }
    },
    MuiChip: {
        styleOverrides: {
            root: {
                fontWeight: 'bold',
            },
            filledSuccess: {
                backgroundColor: '#4caf50', // 成功チップの色を調整
                color: '#fff',
            },
            filledWarning: {
                backgroundColor: '#ff9800', // 警告チップの色を調整
                color: '#fff',
            },
            filledError: {
                backgroundColor: '#f44336', // エラーチップの色を調整
                color: '#fff',
            },
            filledPrimary: {
                backgroundColor: '#2196f3', // プライマリーチップの色を調整
                color: '#fff',
            },
            filledInfo: {
                backgroundColor: '#03a9f4', // インフォチップの色を調整
                color: '#fff',
            },
            filledSecondary: {
                backgroundColor: '#9c27b0', // セカンダリーチップの色を調整
                color: '#fff',
            },
        },
    },
  },
});

export default theme;