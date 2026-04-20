import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'Africa/Lagos';

export const fmtDate = (date, pattern = 'dd MMM yyyy') =>
  formatInTimeZone(new Date(date), TZ, pattern);

export const fmtDateTime = (date) =>
  formatInTimeZone(new Date(date), TZ, 'dd MMM yyyy, HH:mm');

export const fmtReceiptDate = (date) =>
  formatInTimeZone(new Date(date), TZ, 'dd/MM/yyyy HH:mm');
