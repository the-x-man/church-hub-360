import {
  ChartColumnBig,
  ChartNoAxesCombined,
  Gift,
  Trophy,
  Wallet,
} from 'lucide-react';
import type { StatCard } from '../FinanceStatsCards';

export interface ContributionDonationStatsData {
  totalContributionAmount: number;
  totalDonationAmount: number;
  recordCount: number;
  averageAmount: number;
  topContributor: string;
  topContributorAmount: number;
}

export const contributionDonationStatsConfig = (
  data: ContributionDonationStatsData
): StatCard[] => {
  const formatCurrency = (amount: number) =>
    `GHS${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return [
    {
      id: 'total_contributions',
      title: 'Total Contributions',
      value: formatCurrency(data.totalContributionAmount),
      icon: (
        <span className="text-green-600">
          <Wallet />
        </span>
      ),
      color: 'default',
    },
    {
      id: 'total_donations',
      title: 'Total Donations',
      value: formatCurrency(data.totalDonationAmount),
      icon: (
        <span className="text-orange-500">
          <Gift />
        </span>
      ),
      color: 'default',
    },
    {
      id: 'record_count',
      title: 'Records',
      value: data.recordCount.toString(),
      icon: (
        <span className="text-purple-500">
          <ChartColumnBig />
        </span>
      ),
      subtitle: 'total entries',
    },
    {
      id: 'avg_amount',
      title: 'Average Amount',
      value: formatCurrency(data.averageAmount),
      icon: (
        <span className="text-blue-500">
          <ChartNoAxesCombined />
        </span>
      ),
      subtitle: 'per record',
    },
    {
      id: 'top_contributor',
      title: 'Top Contributor',
      value: data.topContributor,
      subtitle: formatCurrency(data.topContributorAmount),
      icon: (
        <span className="text-yellow-500">
          <Trophy />
        </span>
      ),
    },
  ];
};
