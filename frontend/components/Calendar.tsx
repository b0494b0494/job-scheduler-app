import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { Feedback as FeedbackIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';

interface Feedback {
    id: number;
    impression: string;
    attraction: string;
    concern: string;
    aspiration: '高め' | '普通' | '低め';
    next_step: '次に進めたい' | '保留' | '辞退';
    other: string;
    createdAt: string;
    scheduleId: number;
}

interface Schedule {
    id: number;
    title: string;
    date: string;
    description?: string;
    feedback?: Feedback;
}

interface CalendarProps {
    onDateSelect: (date: Date | null) => void;
    onFeedbackButtonClick: (schedule: Schedule) => void; // 新しいpropsを追加
}

export default function Calendar({ onDateSelect, onFeedbackButtonClick }: CalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            console.log('DEBUG: API_URL being used:', API_URL);
            console.log('Fetching schedules from:', `${API_URL}/schedules`);
            const response = await fetch(`${API_URL}/schedules`);
            console.log('Response status:', response.status);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`スケジュールの取得に失敗しました。Status: ${response.status}, Message: ${errorText}`);
            }
            const data = await response.json();
            console.log('Fetched schedules data:', data);
            setSchedules(data);
            setError(null);
        } catch (err: any) {
            console.error('Error in fetchSchedules:', err);
            setError(err.message);
            setSchedules([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, []);

    const schedulesForSelectedDate = selectedDate
        ? schedules.filter(schedule => isSameDay(new Date(schedule.date), selectedDate))
        : [];

    const handleFeedbackClick = (schedule: Schedule) => {
        // FeedbackFormをドロワーで開くために、onFeedbackButtonClickを呼び出す
        onFeedbackButtonClick(schedule);
    };

    // CustomDayコンポーネントを定義
    const CustomDay = (props: PickersDayProps<Date>) => {
        const { day, outsideCurrentMonth, ...other } = props;
        const hasSchedule = schedules.some(schedule => isSameDay(new Date(schedule.date), day));

        return (
            <PickersDay
                {...other}
                day={day}
                outsideCurrentMonth={outsideCurrentMonth}
                sx={{
                    ...(hasSchedule && {
                        border: '2px solid',
                        borderColor: 'primary.main',
                        borderRadius: '50%',
                    }),
                }}
            />
        );
    };

    return (
        <Box sx={{ p: 3, maxWidth: '900px', mx: 'auto' }}>
            <Typography variant="h4" component="h1" gutterBottom>
                カレンダーとスケジュール
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, mt: 4 }}>
                <Box sx={{ flex: 1, bgcolor: 'background.paper', borderRadius: 2, p: 2, boxShadow: 3 }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                        <DateCalendar
                            value={selectedDate}
                            onChange={(newValue) => {
                                setSelectedDate(newValue);
                                onDateSelect(newValue);
                            }}
                            slots={{ day: CustomDay }}
                        />
                    </LocalizationProvider>
                </Box>

                <Box sx={{ flex: 1, bgcolor: 'background.paper', borderRadius: 2, p: 2, boxShadow: 3 }}>
                    <Typography variant="h5" gutterBottom>
                        {selectedDate ? format(selectedDate, 'yyyy年MM月dd日 (E)', { locale: ja }) : '日付を選択してください'} のスケジュール
                    </Typography>
                    {loading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
                    {error && !loading && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {!loading && schedulesForSelectedDate.length === 0 && !error && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            この日付にはスケジュールがありません。
                        </Alert>
                    )}
                    {!loading && schedulesForSelectedDate.length > 0 && (
                        <List>
                            {schedulesForSelectedDate.map((schedule) => (
                                <ListItem
                                    key={schedule.id}
                                    sx={{
                                        borderBottom: '1px solid #444',
                                        '&:last-child': { borderBottom: 'none' },
                                        py: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <ListItemText
                                        primary={
                                            <Typography variant="h6" component="span">
                                                {schedule.title}
                                            </Typography>
                                        }
                                        secondary={
                                            <>
                                                <Typography variant="body2" color="text.secondary">
                                                    {schedule.description}
                                                </Typography>
                                            </>
                                        }
                                    />
                                    <Box>
                                        {schedule.feedback ? (
                                            <Button
                                                variant="outlined"
                                                color="info"
                                                startIcon={<VisibilityIcon />}
                                                onClick={() => router.push(`/feedbacks/${schedule.feedback?.id}`)}
                                                sx={{ mr: 1 }}
                                            >
                                                フィードバックを見る
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                startIcon={<FeedbackIcon />}
                                                onClick={() => handleFeedbackClick(schedule)}
                                                sx={{ mr: 1 }}
                                            >
                                                フィードバックを追加
                                            </Button>
                                        )}
                                    </Box>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
