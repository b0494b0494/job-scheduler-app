import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, List, ListItem, ListItemText } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { format, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { Feedback as FeedbackIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { trpc } from '../utils/trpc'; // Import trpc

interface Feedback {
    id: number;
    impression: string;
    attraction: string;
    concern: string;
    aspiration: string;
    next_step: string;
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
    onFeedbackButtonClick: (schedule: Schedule) => void;
}

export default function Calendar({ onDateSelect, onFeedbackButtonClick }: CalendarProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const router = useRouter();

    // Use tRPC query for fetching schedules
    const { data: schedules, isLoading, isError, error } = trpc.getSchedules.useQuery();

    const schedulesForSelectedDate = selectedDate && schedules
        ? schedules.filter(schedule => isSameDay(new Date(schedule.date), selectedDate))
        : [];

    const handleFeedbackClick = (schedule: Schedule) => {
        onFeedbackButtonClick(schedule);
    };

    const CustomDay = (props: PickersDayProps<Date>) => {
        const { day, outsideCurrentMonth, ...other } = props;
        const hasSchedule = schedules?.some(schedule => isSameDay(new Date(schedule.date), day));

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
                    {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>}
                    {isError && !isLoading && <Alert severity="error" sx={{ mt: 2 }}>{error?.message}</Alert>}
                    {!isLoading && schedulesForSelectedDate.length === 0 && !isError && (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            この日付にはスケジュールがありません。
                        </Alert>
                    )}
                    {!isLoading && schedulesForSelectedDate.length > 0 && (
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