import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Typography, MenuItem, Select, FormControl, InputLabel, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Paper, IconButton } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import ja from 'date-fns/locale/ja';
import SendIcon from '@mui/icons-material/Send';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { trpc } from '../utils/trpc'; // Import trpc

interface FeedbackFormInputs {
    impression?: string;
    attraction?: string;
    concern?: string;
    aspiration?: '高め' | '普通' | '低め' | '';
    next_step?: '次に進めたい' | '保留' | '辞退' | '';
    other?: string;
    scheduleId: number;
}

interface Schedule {
    id: number;
    title: string;
    date: string;
    description?: string;
}

interface FeedbackFormProps {
    initialScheduleId?: number;
    initialDate?: string;
    onClose?: () => void;
    onSaveSuccess?: () => void;
}

interface ChatMessage {
    sender: 'user' | 'llm';
    text: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ initialScheduleId, initialDate, onClose, onSaveSuccess }) => {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FeedbackFormInputs>();
    const [schedule, setSchedule] = useState<Schedule | null>(null);
    const [schedulesForDate, setSchedulesForDate] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [llmLoading, setLlmLoading] = useState<boolean>(false);
    const [llmError, setLlmError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate ? new Date(initialDate) : null);
    const [newScheduleModalOpen, setNewScheduleModalOpen] = useState(false);
    const [newScheduleTitle, setNewScheduleTitle] = useState('');
    const [newScheduleDescription, setNewScheduleDescription] = useState('');

    // tRPC queries and mutations
    const { data: fetchedSchedule, isLoading: isScheduleLoading, isError: isScheduleError, error: scheduleError } = trpc.getScheduleById.useQuery(initialScheduleId!, { enabled: !!initialScheduleId });
    const { data: fetchedSchedulesForDate, isLoading: isSchedulesForDateLoading, isError: isSchedulesForDateError, error: schedulesForDateError } = trpc.getSchedulesByDate.useQuery(selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '', { enabled: !!selectedDate });
    const createScheduleMutation = trpc.createSchedule.useMutation();
    const createFeedbackMutation = trpc.createFeedback.useMutation();
    const classifyFeedbackMutation = trpc.classifyFeedback.useMutation();
    const chatMutation = trpc.chat.useMutation();
    const analyzeChatMutation = trpc.analyzeChat.useMutation();

    const watchImpression = watch("impression");
    const selectedScheduleId = watch("scheduleId");

    const [messages, setMessages] = useState<ChatMessage[]>([{ sender: 'llm', text: 'カジュアル面談のフィードバックについて、壁打ちしましょう！何から話しますか？' }]);
    const [chatInput, setChatInput] = useState<string>('');
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [chatMode, setChatMode] = useState<'chat' | 'analyze'>('chat');

    const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'chat' | 'analyze') => {
        if (newMode !== null) {
            setChatMode(newMode);
            setMessages([]);
            setChatInput('');
            setLlmError(null);
            if (newMode === 'chat') {
                setMessages([{ sender: 'llm', text: 'カジュアル面談のフィードバックについて、壁打ちしましょう！何から話しますか？' }]);
            }
        }
    };

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (fetchedSchedule) {
            setSchedule(fetchedSchedule);
            setValue('scheduleId', fetchedSchedule.id);
        } else if (fetchedSchedulesForDate && fetchedSchedulesForDate.length > 0) {
            setSchedulesForDate(fetchedSchedulesForDate);
            if (fetchedSchedulesForDate.length === 1) {
                setSchedule(fetchedSchedulesForDate[0]);
                setValue('scheduleId', fetchedSchedulesForDate[0].id);
            } else {
                setSchedule(null);
                setValue('scheduleId', 0);
            }
        } else {
            setSchedule(null);
            setValue('scheduleId', 0);
        }
    }, [fetchedSchedule, fetchedSchedulesForDate, setValue]);

    const onSubmit = async (data: FeedbackFormInputs) => {
        setLoading(true);
        setError(null);
        try {
            await createFeedbackMutation.mutateAsync(data);
            onSaveSuccess && onSaveSuccess();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClassifyFeedback = async () => {
        setLlmLoading(true);
        setLlmError(null);
        try {
            let textToClassify: string = '';

            if (chatMode === 'chat') {
                textToClassify = messages
                    .filter(msg => msg.sender === 'user')
                    .map(msg => msg.text)
                    .join('\n');
            } else {
                textToClassify = chatInput;
            }

            if (!textToClassify.trim()) {
                setLlmError('分類するフィードバックテキストを入力してください。');
                return;
            }

            const classifiedData = await classifyFeedbackMutation.mutateAsync({ text: textToClassify });
            setValue('impression', classifiedData.impression || '');
            setValue('attraction', classifiedData.attraction || '');
            setValue('concern', classifiedData.concern || '');
            setValue('aspiration', classifiedData.aspiration || '');
            setValue('next_step', classifiedData.next_step || '');
            setValue('other', classifiedData.other || '');

        } catch (err: any) {
            setLlmError(err.message);
        } finally {
            setLlmLoading(false);
        }
    };

    const handleCreateNewSchedule = async () => {
        if (!newScheduleTitle || !selectedDate) {
            setError('タイトルと日付は必須です。');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const newSchedule = await createScheduleMutation.mutateAsync({
                title: newScheduleTitle,
                description: newScheduleDescription,
                date: format(selectedDate, 'yyyy-MM-dd'),
            });
            setSchedule(newSchedule);
            setValue('scheduleId', newSchedule.id);
            setNewScheduleModalOpen(false);
            setNewScheduleTitle('');
            setNewScheduleDescription('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;

        const userMessage: ChatMessage = { sender: 'user', text: chatInput };
        setMessages((prev) => [...prev, userMessage]);
        setChatInput('');
        setLlmLoading(true);
        setLlmError(null);

        try {
            let llmResponse;
            if (chatMode === 'chat') {
                llmResponse = await chatMutation.mutateAsync({ messages: [...messages, userMessage] });
            } else {
                llmResponse = await analyzeChatMutation.mutateAsync({ text: chatInput });
            }
            const llmMessage: ChatMessage = { sender: 'llm', text: llmResponse.reply };
            setMessages((prev) => [...prev, llmMessage]);
        } catch (err: any) {
            setLlmError(err.message);
        } finally {
            setLlmLoading(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    フィードバック壁打ち
                </Typography>

                <ToggleButtonGroup
                    value={chatMode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="chat mode"
                    sx={{ mb: 2 }}
                >
                    <ToggleButton value="chat" aria-label="chat mode">
                        壁打ちモード
                    </ToggleButton>
                    <ToggleButton value="analyze" aria-label="analyze mode">
                        分析モード
                    </ToggleButton>
                </ToggleButtonGroup>

                <Paper elevation={3} sx={{ height: '400px', display: 'flex', flexDirection: 'column', mt: 2 }}>
                    <Box ref={chatContainerRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                        {messages.map((msg, index) => (
                            <Box key={index} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 1.5,
                                        maxWidth: '70%',
                                        bgcolor: msg.sender === 'user' ? 'primary.light' : 'grey.200',
                                        color: msg.sender === 'user' ? 'white' : 'black',
                                        borderRadius: msg.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                                    }}
                                >
                                    <Typography variant="body2">{msg.text}</Typography>
                                </Paper>
                            </Box>
                        ))}
                    </Box>
                    <Box sx={{ display: 'flex', p: 1, borderTop: '1px solid #eee' }}>
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder={chatMode === 'chat' ? "メッセージを入力..." : "分析したい長文を入力..."}
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && chatMode === 'chat') {
                                    handleSendMessage();
                                }
                            }}
                            multiline={chatMode === 'analyze'} 
                            rows={chatMode === 'analyze' ? 4 : 1} 
                            sx={{ mr: 1 }}
                            disabled={llmLoading}
                        />
                        <IconButton color="primary" onClick={handleSendMessage} disabled={llmLoading}>
                            {llmLoading ? <CircularProgress size={24} /> : <SendIcon />}
                        </IconButton>
                    </Box>
                </Paper>
                {llmError && <Alert severity="error" sx={{ mt: 2 }}>{llmError}</Alert>}

                <Button
                    variant="contained"
                    onClick={handleClassifyFeedback}
                    disabled={llmLoading || !schedule}
                    sx={{ mt: 2, mb: 2 }}
                >
                    チャット内容を自動分類
                </Button>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                        label="感想 (チャット内容から自動入力されます)"
                        multiline
                        rows={4}
                        fullWidth
                        margin="normal"
                        {...register('impression', { required: '感想は必須です' })}
                        error={!!errors.impression}
                        helperText={errors.impression?.message}
                        disabled={!schedule}
                    />
                    <TextField
                        label="魅力点 (企業や仕事の魅力点)"
                        multiline
                        rows={3}
                        fullWidth
                        margin="normal"
                        {...register('attraction')}
                        disabled={!schedule}
                    />
                    <TextField
                        label="不安点/懸念点 (気になった点や今後確認したいこと)"
                        multiline
                        rows={3}
                        fullWidth
                        margin="normal"
                        {...register('concern')}
                        disabled={!schedule}
                    />
                    <FormControl fullWidth margin="normal" disabled={!schedule}>
                        <InputLabel>志望度</InputLabel>
                        <Select
                            label="志望度"
                            defaultValue=""
                            {...register('aspiration')}
                        >
                            <MenuItem value="">選択してください</MenuItem>
                            <MenuItem value="高め">高め</MenuItem>
                            <MenuItem value="普通">普通</MenuItem>
                            <MenuItem value="低め">低め</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal" disabled={!schedule}>
                        <InputLabel>次のステップ</InputLabel>
                        <Select
                            label="次のステップ"
                            defaultValue=""
                            {...register('next_step')}
                        >
                            <MenuItem value="">選択してください</MenuItem>
                            <MenuItem value="次に進めたい">次に進めたい</MenuItem>
                            <MenuItem value="保留">保留</MenuItem>
                            <MenuItem value="辞退">辞退</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label="その他"
                        multiline
                        rows={3}
                        fullWidth
                        margin="normal"
                        {...register('other')}
                        disabled={!schedule}
                    />

                    <Box sx={{ mt: 3 }}>
                        <Button type="submit" variant="contained" color="primary" disabled={loading || !selectedScheduleId}>
                            {loading ? <CircularProgress size={24} /> : 'フィードバックを保存'}
                        </Button>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={onClose}
                            sx={{ ml: 2 }}
                        >
                            キャンセル
                        </Button>
                    </Box>
                </form>

                <Dialog open={newScheduleModalOpen} onClose={() => setNewScheduleModalOpen(false)}>
                    <DialogTitle>新しいスケジュールを作成</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label="タイトル"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={newScheduleTitle}
                            onChange={(e) => setNewScheduleTitle(e.target.value)}
                        />
                        <TextField
                            margin="dense"
                            label="説明 (任意)"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={newScheduleDescription}
                            onChange={(e) => setNewScheduleDescription(e.target.value)}
                        />
                        <TextField
                            margin="dense"
                            label="日付"
                            type="text"
                            fullWidth
                            variant="standard"
                            value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                            disabled
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setNewScheduleModalOpen(false)}>キャンセル</Button>
                        <Button onClick={handleCreateNewSchedule} disabled={loading}>作成</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default FeedbackForm;
