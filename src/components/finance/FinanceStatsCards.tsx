import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  PieChart,
  BarChart3,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  color?: 'default' | 'success' | 'warning' | 'destructive';
}

interface FinanceStatsCardsProps {
  stats: StatCard[];
  loading?: boolean;
  className?: string;
}

const defaultIcons = {
  amount: <DollarSign className="h-4 w-4" />,
  count: <BarChart3 className="h-4 w-4" />,
  users: <Users className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  target: <Target className="h-4 w-4" />,
  chart: <PieChart className="h-4 w-4" />,
};

export const FinanceStatsCards: React.FC<FinanceStatsCardsProps> = ({
  stats,
  loading = false,
  className = '',
}) => {
  const getCardColorClasses = (color?: string) => {
    switch (color) {
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950';
      case 'destructive':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950';
      default:
        return '';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const formatValue = (value: string | number) => {
    if (typeof value === 'number') {
      // For numeric values, format as currency if it looks like a monetary amount
      if (value > 1000 || value.toString().includes('.')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'GHS',
        }).format(value);
      }
      return value.toString();
    }
    return value;
  };

  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
      >
        {[...Array(4)].map((_, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-muted animate-pulse rounded w-24"></div>
              <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded w-32 mb-2"></div>
              <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}
    >
      {stats.map((stat) => (
        <Card
          key={stat.id}
          className={cn('py-3', getCardColorClasses(stat.color))}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            {stat.icon || defaultIcons.amount}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold mb-1">
              {formatValue(stat.value)}
            </div>

            <div className="flex items-center justify-between">
              {stat.subtitle && (
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              )}

              {stat.trend && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getTrendColor(stat.trend.direction)}`}
                >
                  {getTrendIcon(stat.trend.direction)}
                  <span className="ml-1">
                    {stat.trend.value > 0 ? '+' : ''}
                    {stat.trend.value}%
                  </span>
                </Badge>
              )}
            </div>

            {stat.trend?.label && (
              <p className="text-xs text-muted-foreground mt-1">
                {stat.trend.label}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Helper function to create common finance stats
export const createFinanceStats = (data: {
  totalAmount: number;
  recordCount: number;
  averageAmount?: number;
  previousPeriodAmount?: number;
  previousPeriodCount?: number;
}): StatCard[] => {
  const {
    totalAmount,
    recordCount,
    averageAmount,
    previousPeriodAmount,
    previousPeriodCount,
  } = data;

  const stats: StatCard[] = [
    {
      id: 'total',
      title: 'Total Amount',
      value: totalAmount,
      icon: <DollarSign className="h-4 w-4" />,
      color: 'success',
    },
    {
      id: 'count',
      title: 'Total Records',
      value: recordCount,
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  if (averageAmount !== undefined) {
    stats.push({
      id: 'average',
      title: 'Average Amount',
      value: averageAmount,
      icon: <PieChart className="h-4 w-4" />,
    });
  }

  // Add trend data if previous period data is available
  if (previousPeriodAmount !== undefined) {
    const amountChange = totalAmount - previousPeriodAmount;
    const amountChangePercent =
      previousPeriodAmount > 0
        ? (amountChange / previousPeriodAmount) * 100
        : 0;

    stats[0].trend = {
      value: Math.round(amountChangePercent * 100) / 100,
      label: 'vs previous period',
      direction:
        amountChange > 0 ? 'up' : amountChange < 0 ? 'down' : 'neutral',
    };
  }

  if (previousPeriodCount !== undefined) {
    const countChange = recordCount - previousPeriodCount;
    const countChangePercent =
      previousPeriodCount > 0 ? (countChange / previousPeriodCount) * 100 : 0;

    stats[1].trend = {
      value: Math.round(countChangePercent * 100) / 100,
      label: 'vs previous period',
      direction: countChange > 0 ? 'up' : countChange < 0 ? 'down' : 'neutral',
    };
  }

  return stats;
};

// Predefined stat configurations for different finance pages
export const incomeStatsConfig = (data: {
  totalIncome: number;
  recordCount: number;
  averageIncome: number;
  topOccasion: string;
  topOccasionAmount: number;
}): StatCard[] => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return [
    {
      id: 'total_income',
      title: 'Total Income',
      value: formatCurrency(data.totalIncome),
      icon: <DollarSign className="h-4 w-4" />,
      color: 'success',
    },
    {
      id: 'income_records',
      title: 'Income Records',
      value: data.recordCount.toString(),
      icon: <BarChart3 className="h-4 w-4" />,
      subtitle: 'total entries',
    },
    {
      id: 'avg_income',
      title: 'Average Income',
      value: formatCurrency(data.averageIncome),
      icon: <Target className="h-4 w-4" />,
      subtitle: 'per record',
    },
    {
      id: 'top_occasion',
      title: 'Top Record',
      value: data.topOccasion,
      subtitle: data.topOccasionAmount
        ? formatCurrency(data.topOccasionAmount)
        : undefined,
      icon: <PieChart className="h-4 w-4" />,
    },
  ];
};

export const expenseStatsConfig = (data: {
  totalExpenses: number;
  recordCount: number;
  averageExpense: number;
  topCategory: string;
  topCategoryAmount: number;
}): StatCard[] => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return [
    {
      id: 'total_expenses',
      title: 'Total Expenses',
      value: formatCurrency(data.totalExpenses),
      icon: <DollarSign className="h-4 w-4" />,
      color: 'destructive',
    },
    {
      id: 'expense_records',
      title: 'Expense Records',
      value: data.recordCount.toString(),
      icon: <BarChart3 className="h-4 w-4" />,
      subtitle: 'total entries',
    },
    {
      id: 'avg_expense',
      title: 'Average Expense',
      value: formatCurrency(data.averageExpense),
      icon: <Target className="h-4 w-4" />,
      subtitle: 'per record',
    },
    {
      id: 'top_category',
      title: 'Top Item',
      value: data.topCategory,
      subtitle: data.topCategoryAmount
        ? formatCurrency(data.topCategoryAmount)
        : undefined,
      icon: <PieChart className="h-4 w-4" />,
    },
  ];
};

export const contributionStatsConfig = (data: {
  totalContributions: number;
  recordCount: number;
  averageContribution: number;
  topContributor: string;
  topContributorAmount: number;
}): StatCard[] => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return [
    {
      id: 'total_contributions',
      title: 'Total Contributions',
      value: formatCurrency(data.totalContributions),
      icon: <DollarSign className="h-4 w-4" />,
      color: 'success',
    },
    {
      id: 'contribution_records',
      title: 'Contribution Records',
      value: data.recordCount.toString(),
      icon: <Users className="h-4 w-4" />,
      subtitle: 'total entries',
    },
    {
      id: 'avg_contribution',
      title: 'Average Contribution',
      value: formatCurrency(data.averageContribution),
      icon: <Target className="h-4 w-4" />,
      subtitle: 'per record',
    },
    {
      id: 'top_contributor',
      title: 'Top Contributor',
      value: data.topContributor,
      subtitle: data.topContributorAmount
        ? formatCurrency(data.topContributorAmount)
        : undefined,
      icon: <PieChart className="h-4 w-4" />,
    },
  ];
};

export const pledgeStatsConfig = (data: {
  totalPledges: number;
  recordCount: number;
  fulfilledAmount: number;
  pendingAmount: number;
  fulfillmentRate: number;
}): StatCard[] => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return [
    {
      id: 'total_pledges',
      title: 'Total Pledges',
      value: formatCurrency(data.totalPledges),
      icon: <DollarSign className="h-4 w-4" />,
      color: 'default',
    },
    {
      id: 'pledge_records',
      title: 'Pledge Records',
      value: data.recordCount.toString(),
      icon: <Users className="h-4 w-4" />,
      subtitle: 'total entries',
    },
    {
      id: 'fulfilled_amount',
      title: 'Fulfilled Amount',
      value: formatCurrency(data.fulfilledAmount),
      icon: <Target className="h-4 w-4" />,
      color: 'success',
    },
    {
      id: 'pending_amount',
      title: 'Pending Amount',
      value: formatCurrency(data.pendingAmount),
      icon: <Calendar className="h-4 w-4" />,
      color: 'warning',
    },
  ];
};

export const balanceStatsConfig = (data: {
  totalIncome: number;
  totalExpenses: number;
}): StatCard[] => {
  const balance = data.totalIncome - data.totalExpenses;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'GHS',
    }).format(amount);
  };

  return [
    {
      id: 'summary_income',
      title: 'Total Revenue',
      value: formatCurrency(data.totalIncome),
      icon: <DollarSign className="h-4 w-4" />,
      color: 'success',
      subtitle: 'Income + Contributions',
    },
    {
      id: 'summary_expenses',
      title: 'Total Expenses',
      value: formatCurrency(data.totalExpenses),
      icon: <DollarSign className="h-4 w-4" />,
      color: 'destructive',
    },
    {
      id: 'summary_balance',
      title: 'Net Balance',
      value: formatCurrency(balance),
      icon: <Wallet className="h-4 w-4" />,
      color: balance >= 0 ? 'success' : 'destructive',
      subtitle: balance >= 0 ? 'Surplus' : 'Deficit',
    },
  ];
};
