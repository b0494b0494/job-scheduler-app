import { Box, Typography, Button, TextField, CircularProgress, Alert, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Calendar from '../components/Calendar';
import FeedbackForm from '../components/FeedbackForm';
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';
import { trpc } from '../utils/trpc'; // Import trpc

interface ScheduleFormInputs {
    title: string;
    date: string;
    description?: string; // description can be optional
}

interface Schedule {
    id: number;
    title: string;
    description?: string;
    date: string;
    time?: string; // time might not be directly from DB
}

export default function SchedulePage() {
    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<ScheduleFormInputs>({
        defaultValues: {
            title: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            description: ''
        }
    });

    const [generalError, setGeneralError] = useState<string | null>(null);
    const router = useRouter();

    // Use tRPC mutation for creating schedules
    const createScheduleMutation = trpc.createSchedule.useMutation({
        onSuccess: () => {
            setValue('title', '');
            setValue('description', '');
            setValue('date', format(new Date(), 'yyyy-MM-dd'));
            // Invalidate queries to refetch schedules in Calendar component
            // This assumes Calendar component uses trpc.getSchedules.useQuery
            trpc.getSchedules.invalidate();
        },
        onError: (error) => {
            setGeneralError(error.message);
        },
    });

    const [openDrawer, setOpenDrawer] = useState(false);
    const [selectedScheduleForFeedback, setSelectedScheduleForFeedback] = useState<Schedule | null>(null);

    const handleDateSelect = (selectedDate: Date | null) => {
        if (selectedDate) {
            setValue('date', format(selectedDate, 'yyyy-MM-dd'), { shouldValidate: true });
        }
    };

    const onSubmit = async (data: ScheduleFormInputs) => {
        setGeneralError(null);
        try {
            await createScheduleMutation.mutateAsync({
                title: data.title,
                date: data.date,
                description: data.description || '', // Ensure description is string
            });
        } catch (err: any) {
            // Error is already handled by onError in useMutation
        }
    };

    const handleOpenFeedbackForm = (schedule: Schedule) => {
        setSelectedScheduleForFeedback(schedule);
        setOpenDrawer(true);
    };

    const handleCloseDrawer = () => {
        setOpenDrawer(false);
        setSelectedScheduleForFeedback(null);
    };

    const handleFeedbackSaveSuccess = () => {
        handleCloseDrawer();
        // Invalidate feedback queries if needed
        trpc.getFeedbacks.invalidate();
    };

    return (
        <Box sx={{ p: 3, maxWidth: '900px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                スケジュール管理
            </Typography>

            {/* カレンダーコンポーネントを配置 */}
            <Calendar onDateSelect={handleDateSelect} onFeedbackButtonClick={handleOpenFeedbackForm} />

            <Box sx={{ mb: 4, p: 3, border: '1px solid #333', borderRadius: 2, bgcolor: 'background.paper', mt: 4 }}>
                <Typography variant="h6" gutterBottom>新しいスケジュールを追加</Typography>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                        label="タイトル"
                        fullWidth
                        sx={{ mb: 2 }}
                        {...register('title', { required: 'タイトルは必須です。' })}
                        error={!!errors.title}
                        helperText={errors.title?.message}
                    />
                    <TextField
                        label="日付"
                        type="date"
                        fullWidth
                        sx={{ mb: 2 }}
                        InputLabelProps={{ shrink: true }}
                        {...register('date', { required: '日付は必須です。' })}
                        error={!!errors.date}
                        helperText={errors.date?.message}
                    />
                    <TextField
                        label="説明 (任意)"
                        fullWidth
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                        {...register('description')}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={createScheduleMutation.isLoading} // Use mutation's isLoading
                    >
                        {createScheduleMutation.isLoading ? <CircularProgress size={24} color="inherit" /> : 'スケジュール追加'}
                    </Button>
                    {generalError && <Alert severity="error" sx={{ mt: 2 }}>{generalError}</Alert>}
                </form>
            </Box>

            {/* フィードバックフォーム用ドロワー */}
            <Drawer
                anchor="right"
                open={openDrawer}
                onClose={handleCloseDrawer}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: '500px' } }, // スマホでは全幅、PCでは500px
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                    <IconButton onClick={handleCloseDrawer}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                {selectedScheduleForFeedback && (
                    <FeedbackForm
                        initialScheduleId={selectedScheduleForFeedback.id}
                        onClose={handleCloseDrawer}
                        onSaveSuccess={handleFeedbackSaveSuccess}
                    />
                )}
            </Drawer>
        </Box>
    );
}