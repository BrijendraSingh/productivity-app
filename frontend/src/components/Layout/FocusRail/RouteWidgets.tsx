import React from 'react';
import { Box } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useFocusRail } from '../../../contexts/FocusRailContext';
import { useFocusRailData } from '../../../hooks/useFocusRailData';
import { RailHeader } from './widgets/RailHeader';
import { QuadrantPulse } from './widgets/QuadrantPulse';
import { DailyProgress } from './widgets/DailyProgress';
import { UpcomingDeadlines } from './widgets/UpcomingDeadlines';
import { QuickNav } from './widgets/QuickNav';
import { QuickCapture } from './widgets/QuickCapture';
import { TodoInspector } from './widgets/TodoInspector';
import { OverdueUrgent } from './widgets/OverdueUrgent';
import { DiaryRail } from './widgets/DiaryRail';
import { JournalRail } from './widgets/JournalRail';
import { BlogRail } from './widgets/BlogRail';
import { AnalyticsRail } from './widgets/AnalyticsRail';
import { railContent } from './railStyles';

function RailSection({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{ width: '100%', minWidth: 0, pt: 1.5, mt: 1.5, borderTop: 1, borderColor: 'divider' }}
    >
      {children}
    </Box>
  );
}

function DashboardWidgets() {
  const { stats, upcomingTodos, loading } = useFocusRailData();
  return (
    <>
      <RailSection>
        <DailyProgress stats={stats} loading={loading} />
      </RailSection>
      <RailSection>
        <UpcomingDeadlines todos={upcomingTodos} loading={loading} />
      </RailSection>
      <RailSection>
        <QuickNav />
      </RailSection>
    </>
  );
}

function TodosWidgets() {
  const { selectedTodoId } = useFocusRail();
  const { stats, urgentTodos, loading } = useFocusRailData();

  return (
    <>
      <RailSection>
        <QuickCapture />
      </RailSection>
      {selectedTodoId ? (
        <RailSection>
          <TodoInspector todoId={selectedTodoId} />
        </RailSection>
      ) : (
        <RailSection>
          <OverdueUrgent todos={urgentTodos} />
        </RailSection>
      )}
      {!loading && stats && (
        <RailSection>
          <DailyProgress stats={stats} loading={false} />
        </RailSection>
      )}
    </>
  );
}

function DiaryWidgets() {
  const { stats, loading } = useFocusRailData();
  return <DiaryRail stats={stats} loading={loading} />;
}

function JournalWidgets() {
  const { stats } = useFocusRailData();
  return <JournalRail stats={stats} />;
}

function BlogWidgets() {
  const { stats } = useFocusRailData();
  return <BlogRail stats={stats} />;
}

function AnalyticsWidgets() {
  return <AnalyticsRail />;
}

export function RouteWidgets() {
  const { pathname } = useLocation();
  const { pageWidgets } = useFocusRail();
  const { stats, loading } = useFocusRailData();

  const route = pathname.split('/')[1] || '';

  let routeContent: React.ReactNode = null;
  switch (route) {
    case '':
    case 'dashboard':
      routeContent = <DashboardWidgets />;
      break;
    case 'todos':
      routeContent = <TodosWidgets />;
      break;
    case 'matrix':
      routeContent = null;
      break;
    case 'diary':
      routeContent = <DiaryWidgets />;
      break;
    case 'journal':
      routeContent = <JournalWidgets />;
      break;
    case 'blog':
      routeContent = <BlogWidgets />;
      break;
    case 'analytics':
      routeContent = <AnalyticsWidgets />;
      break;
    default:
      routeContent = <QuickNav />;
  }

  return (
    <Box sx={railContent}>
      <RailHeader />
      <RailSection>
        <QuadrantPulse stats={stats} loading={loading} />
      </RailSection>
      {pageWidgets ??
        (routeContent &&
          (['diary', 'journal', 'blog', 'analytics'].includes(route) ? (
            <RailSection>{routeContent}</RailSection>
          ) : (
            routeContent
          )))}
    </Box>
  );
}
