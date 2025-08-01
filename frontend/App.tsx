import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages';
import FeedbackPage from './pages/feedbacks';
import FeedbackDetailPage from './pages/feedbacks/[id]';
import Schedules from './pages/schedule';
import Menu from './components/Menu';
import NewFeedbackPage from './pages/feedbacks/new';

const App: React.FC = () => {
    return (
        <Router>
            <Menu />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/feedbacks" element={<FeedbackPage />} />
                <Route path="/feedbacks/new" element={<NewFeedbackPage />} />
                <Route path="/feedbacks/:id" element={<FeedbackDetailPage />} />
                <Route path="/schedules" element={<Schedules />} />
            </Routes>
        </Router>
    );
};

export default App;