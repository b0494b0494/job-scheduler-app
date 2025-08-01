import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';

export default function Home() {
    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
                p: 3,
            }}
        >
            <Typography variant="h3" component="h1" gutterBottom>
                Job Scheduler App
            </Typography>
            <Box>
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ m: 1 }}
                    component={Link}
                    href="/schedule"
                >
                    スケジュール管理
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    sx={{ m: 1 }}
                    component={Link}
                    href="/feedbacks"
                >
                    フィードバック管理
                </Button>
            </Box>
        </Box>
    );
}