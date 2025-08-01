import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useRouter } from 'next/router';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FeedbackIcon from '@mui/icons-material/Feedback';

const Menu: React.FC = () => {
    const router = useRouter();

    return (
        <AppBar position="static" sx={{ bgcolor: 'background.paper', boxShadow: 3 }}>
            <Toolbar>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
                    Job Scheduler App
                </Typography>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Button
                        color="inherit"
                        startIcon={<CalendarMonthIcon />}
                        onClick={() => router.push('/schedule')}
                        sx={{ color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                        スケジュール管理
                    </Button>
                    <Button
                        color="inherit"
                        startIcon={<FeedbackIcon />}
                        onClick={() => router.push('/feedbacks')}
                        sx={{ color: 'text.primary', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                        フィードバック一覧
                    </Button>
                </Box>
            </Toolbar>
        </AppBar>
    );
};

export default Menu;