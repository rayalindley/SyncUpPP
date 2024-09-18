import React from 'react';
import { FaMoneyBillWave, FaCalendarAlt, FaUserFriends, FaChartLine } from 'react-icons/fa';

interface MonthlySummary {
  organizationId: string;
  total_payments: number;
  total_amount_paid: number;
  average_payment_amount: number;
  pending_payments: number;
  successful_payments: number;
  failed_payments: number;
  total_event_payments: number;
  total_membership_payments: number;
  month: string;
  total_amount_per_month: number;
}

interface TransactionSummaryProps {
  summary: MonthlySummary[];
}

const SummaryCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ title, value, icon }) => (
  <div className="flex items-center rounded-lg bg-charleston p-6 shadow-md">
    <div className="mr-4 text-3xl text-primary">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const TransactionSummary: React.FC<TransactionSummaryProps> = ({ summary }) => {
  const calculateOverallSummary = (data: MonthlySummary[]): MonthlySummary => {
    return data.reduce((acc, curr) => ({
      organizationId: curr.organizationId,
      total_payments: acc.total_payments + curr.total_payments,
      total_amount_paid: acc.total_amount_paid + curr.total_amount_paid,
      average_payment_amount: (acc.total_amount_paid + curr.total_amount_paid) / (acc.total_payments + curr.total_payments),
      pending_payments: acc.pending_payments + curr.pending_payments,
      successful_payments: acc.successful_payments + curr.successful_payments,
      failed_payments: acc.failed_payments + curr.failed_payments,
      total_event_payments: acc.total_event_payments + curr.total_event_payments,
      total_membership_payments: acc.total_membership_payments + curr.total_membership_payments,
      month: 'Overall',
      total_amount_per_month: acc.total_amount_per_month + curr.total_amount_per_month,
    }), {
      organizationId: '',
      total_payments: 0,
      total_amount_paid: 0,
      average_payment_amount: 0,
      pending_payments: 0,
      successful_payments: 0,
      failed_payments: 0,
      total_event_payments: 0,
      total_membership_payments: 0,
      month: '',
      total_amount_per_month: 0,
    });
  };

  const overallSummary = calculateOverallSummary(summary);

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold mb-4 text-light">Transaction Summary (Overall)</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Payments"
          value={overallSummary.total_payments}
          icon={<FaMoneyBillWave />}
        />
        <SummaryCard
          title="Total Amount Paid"
          value={`$${overallSummary.total_amount_paid.toFixed(2)}`}
          icon={<FaChartLine />}
        />
        <SummaryCard
          title="Average Payment"
          value={`$${overallSummary.average_payment_amount.toFixed(2)}`}
          icon={<FaChartLine />}
        />
        <SummaryCard
          title="Pending Payments"
          value={overallSummary.pending_payments}
          icon={<FaCalendarAlt />}
        />
        <SummaryCard
          title="Successful Payments"
          value={overallSummary.successful_payments}
          icon={<FaMoneyBillWave />}
        />
        <SummaryCard
          title="Failed Payments"
          value={overallSummary.failed_payments}
          icon={<FaMoneyBillWave />}
        />
        <SummaryCard
          title="Event Payments"
          value={overallSummary.total_event_payments}
          icon={<FaCalendarAlt />}
        />
        <SummaryCard
          title="Membership Payments"
          value={overallSummary.total_membership_payments}
          icon={<FaUserFriends />}
        />
      </div>
    </div>
  );
};

export default TransactionSummary;
