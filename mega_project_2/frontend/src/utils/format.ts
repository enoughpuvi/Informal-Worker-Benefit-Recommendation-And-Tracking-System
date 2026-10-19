export const formatStatus = (status?: string): string => {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

export const formatCurrency = (amount?: number): string => {
  if (amount === undefined || amount === null) return 'N/A';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};
