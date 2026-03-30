import React from 'react';
import { WelcomeBanner } from '@/modules/dashboard/components/WelcomeBanner';
import { StatsGrid } from '@/modules/dashboard/components/StatsGrid';

const DashboardPage: React.FC = () => {
  return (
    <>
      <WelcomeBanner />
      <StatsGrid />
    </>
  );
};

export default DashboardPage;
