import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Container, Typography, Box, Chip, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { Comment, ThumbUp, Warning, CheckCircle, Block, HelpOutline, Info } from '@mui/icons-material';
import { trpc } from '../../../utils/trpc'; // Import trpc

interface Feedback {
    id: number;
    impression?: string;
    attraction?: string;
    concern?: string;
    aspiration?: string;
    next_step?: string;
    other?: string;
    createdAt: string;
}

const FeedbackDetailPage: React.FC = () => {
    const router = useRouter();
    const { id } = router.query;

    const feedbackId = typeof id === 'string' ? parseInt(id) : undefined;

    const { data: feedback, isLoading, isError, error } = trpc.getFeedbackById.useQuery(feedbackId!, { enabled: !!feedbackId });

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

    if (isLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Container>;
    }

    if (isError) {
        return <Container sx={{ mt: 4 }}><Alert severity="error">{error?.message}</Alert></Container>;
    }

    if (!feedback) {
        return <Container sx={{ mt: 4 }}><Alert severity="info">フィードバックが見つかりません。</Alert></Container>;
    }

    const DetailSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
        <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {icon}
                <Typography variant="h6" component="h2" sx={{ ml: 1, fontWeight: 'bold' }}>{title}</Typography>
            </Box>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: 'text.secondary' }}>
                    {children || '記入なし'}
                </Typography>
            </Paper>
        </Box>
    );

    return (
        <Container maxWidth="lg" sx={{ mt: 5, mb: 5 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        フィードバック詳細
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        作成日時: {new Date(feedback.createdAt).toLocaleString()}
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    <Grid item xs={12} md={6}>
                        <DetailSection icon={<Comment color="primary" />} title="① 感想">
                            {feedback.impression}
                        </DetailSection>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DetailSection icon={<ThumbUp color="success" />} title="② 魅力点">
                            {feedback.attraction}
                        </DetailSection>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DetailSection icon={<Warning color="warning" />} title="③ 不安点/懸念点">
                            {feedback.concern}
                        </DetailSection>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <DetailSection icon={<HelpOutline color="action" />} title="⑥ その他">
                            {feedback.other}
                        </DetailSection>
                    </Grid>
                </Grid>

                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CheckCircle sx={{ mr: 1, color: 'grey.600' }} />
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>④ 志望度</Typography>
                        </Box>
                        <Chip
                            label={feedback.aspiration || '未設定'}
                            color={getAspirationChipColor(feedback.aspiration)}
                            sx={{ mt: 1, fontWeight: 'medium' }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Info sx={{ mr: 1, color: 'grey.600' }} />
                            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>⑤ 次のステップ</Typography>
                        </Box>
                        <Chip
                            label={feedback.next_step || '未設定'}
                            color={getNextStepChipColor(feedback.next_step)}
                            sx={{ mt: 1, fontWeight: 'medium' }}
                        />
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default FeedbackDetailPage;
