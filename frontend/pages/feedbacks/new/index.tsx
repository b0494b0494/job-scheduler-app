import React from 'react';
import { useRouter } from 'next/router';
import FeedbackForm from '../../../components/FeedbackForm';

const FeedbackNewPage: React.FC = () => {
    const router = useRouter();
    const { scheduleId, date } = router.query;

    const handleSaveSuccess = () => {
        router.push('/schedule'); // 保存成功したらスケジュール一覧に戻る
    };

    return (
        <FeedbackForm
            initialScheduleId={scheduleId ? parseInt(scheduleId as string) : undefined}
            initialDate={date ? (date as string) : undefined}
            onClose={() => router.push('/schedule')}
            onSaveSuccess={handleSaveSuccess}
        />
    );
};

export default FeedbackNewPage;