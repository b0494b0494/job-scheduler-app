import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
    Container, Typography, Button, Box, Grid, Card, CardContent, Chip,
    CircularProgress, Alert, Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { trpc } from '../../utils/trpc'; // Import trpc

interface Schedule {
    id: number;
    title: string;
    date: string;
    description?: string;
}

interface Feedback {
    id: number;
    impression?: string;
    attraction?: string;
    concern?: string;
    aspiration?: string;
    next_step?: string;
    other?: string;
    createdAt: string;
    scheduleId: number;
    schedule?: Schedule; // Related schedule info
}

export default function FeedbackPage() {
    const router = useRouter();

    const { data: feedbacks, isLoading, isError, error } = trpc.getFeedbacks.useQuery();

    const getAspirationChipColor = (aspiration?: string) => {
        switch (aspiration) {
            case '高め': return 'success';
            case '普通': return 'warning';
            case '低め': return 'error';
            default: return 'default';
        }
    };

    const getNextStepChipColor = (nextStep?: string) => {
        switch (nextStep) {
            case '次に進めたい': return 'primary';
            case '保留': return 'info';
            case '辞退': return 'secondary';
            default: return 'default';
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
        }

        if (isError) {
            return <Alert severity="error" sx={{ mt: 4 }}>{error?.message}</Alert>;
        }

        if (!feedbacks || feedbacks.length === 0) {
            return (
                <Paper sx={{ textAlign: 'center', p: 8, mt: 4 }}>
                    <Typography variant="h6" gutterBottom>
                        まだフィードバックがありません
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 3 }}>
                        最初のフィードバックを作成して、選考プロセスを記録しましょう。
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/feedbacks/new')}
                    >
                        新規作成
                    </Button>
                </Paper>
            );
        }

        return (
            <Grid container spacing={3}>
                {feedbacks.map((feedback) => (
                    <Grid item xs={12} md={6} lg={4} key={feedback.id}>
                        <Card
                            onClick={() => router.push(`/feedbacks/${feedback.id}`)}
                            sx={{
                                cursor: 'pointer',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6,
                                }
                            }}
                        >
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                {feedback.schedule && (
                                    <Box sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" color="text.primary" noWrap>
                                            {feedback.schedule.title}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(feedback.schedule.date).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                )}
                                <Typography variant="h6" component="h2" gutterBottom noWrap>
                                    {feedback.impression ? '感想' : '無題のフィードバック'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{
                                    mb: 2,
                                    flexGrow: 1,
                                    display: '-webkit-box',
                                    WebkitBoxOrient: 'vertical',
                                    WebkitLineClamp: 3,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    minHeight: 60
                                }}>
                                    {feedback.impression || '感想は記入されていません。'}
                                </Typography>
                                <Box sx={{ mt: 'auto', pt: 2 }}>
                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                        <Chip
                                            label={`志望度: ${feedback.aspiration || '未設定'}`}
                                            color={getAspirationChipColor(feedback.aspiration)}
                                            size="small"
                                        />
                                        <Chip
                                            label={feedback.next_step || '未設定'}
                                            color={getNextStepChipColor(feedback.next_step)}
                                            size="small"
                                        />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                                        作成日時: {new Date(feedback.createdAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1">
                    フィードバック一覧
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/feedbacks/new')}
                >
                    新規作成
                </Button>
            </Box>
            {renderContent()}
        </Container>
    );
}
