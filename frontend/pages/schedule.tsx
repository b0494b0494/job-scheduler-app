import { Box, Typography, Button, TextField, CircularProgress, Alert, Drawer, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Calendar from '../components/Calendar';
import FeedbackForm from '../components/FeedbackForm'; // FeedbackFormをインポート
import { format } from 'date-fns';
import { useForm, Controller } from 'react-hook-form';

interface ScheduleFormInputs {
    title: string;
    date: string;
    description: string;
}

interface Schedule {
    id: number;
    title: string;
    description: string;
    date: string;
    time: string;
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

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const [openDrawer, setOpenDrawer] = useState(false); // ドロワーの開閉状態
    const [selectedScheduleForFeedback, setSelectedScheduleForFeedback] = useState<Schedule | null>(null); // フィードバック対象のスケジュール

    // Calendarコンポーネントから日付が選択されたときに呼び出されるハンドラ
    const handleDateSelect = (selectedDate: Date | null) => {
        if (selectedDate) {
            setValue('date', format(selectedDate, 'yyyy-MM-dd'), { shouldValidate: true });
        }
    };

    const onSubmit = async (data: ScheduleFormInputs) => {
        setGeneralError(null);

        try {
            const response = await fetch(`${API_URL}/schedules`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'スケジュールの追加に失敗しました。');
            }
            setValue('title', '');
            setValue('description', '');
            setValue('date', format(new Date(), 'yyyy-MM-dd'));
            // スケジュール追加後、カレンダーコンポーネントが自動で再フェッチするようにする
            // 現状は、カレンダーコンポーネントが自身のuseEffectでスケジュールをフェッチするため、
            // ここで特別な処理は不要です。
        } catch (err: any) {
            setGeneralError(err.message);
        }
    };

    // フィードバックボタンクリックハンドラ
    const handleOpenFeedbackForm = (schedule: Schedule) => {
        setSelectedScheduleForFeedback(schedule);
        setOpenDrawer(true);
    };

    // ドロワーを閉じるハンドラ
    const handleCloseDrawer = () => {
        setOpenDrawer(false);
        setSelectedScheduleForFeedback(null);
    };

    // FeedbackFormの保存成功時のハンドラ
    const handleFeedbackSaveSuccess = () => {
        handleCloseDrawer();
        // 必要であれば、スケジュール一覧を再フェッチするロジックを追加
    };

    return (
        <Box sx={{ p: 3, maxWidth: '900px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                スケジュール管理
            </Typography>

            {/* カレンダーコンポーネントを配置 */}
            <Calendar onDateSelect={handleDateSelect} onFeedbackButtonClick={handleOpenFeedbackForm} /> {/* onFeedbackButtonClickを追加 */}

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
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'スケジュール追加'}
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
