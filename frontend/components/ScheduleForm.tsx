import { useState } from 'react';

interface Schedule {
    title: string;
    date: string;
    description: string;
}

interface ScheduleFormProps {
    onScheduleAdded: (newSchedule: Schedule) => void;
}

export default function ScheduleForm({ onScheduleAdded }: ScheduleFormProps) {
    const [title, setTitle] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [description, setDescription] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newSchedule: Schedule = { title, date, description };

        try {
            const response = await fetch('http://host.docker.internal:5000/api/schedules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSchedule),
            });

            if (response.ok) {
                const createdSchedule = await response.json();
                onScheduleAdded(createdSchedule);
                setTitle('');
                setDate('');
                setDescription('');
            } else {
                console.error('Failed to add schedule');
            }
        } catch (err) {
            console.error('Error:', err);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>タイトル:</label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>日付:</label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>
            <div>
                <label>説明:</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
            <button type="submit">追加</button>
        </form>
    );
}