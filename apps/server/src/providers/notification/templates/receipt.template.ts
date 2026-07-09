export interface PaymentReceiptData {
  firstName: string;
  orderNumber: string;
  currency: string;
  amount: string;
  reference: string;
  invoiceNumber?: string | null;
  paymentMethod?: string | null;
  paidAt?: Date | string | null;
  trackingNumber?: string | null;
  trackUrl?: string;
}

export function buildPaymentReceiptHtml(data: PaymentReceiptData): string {
  const paidLine = data.paidAt
    ? `<tr><td style="padding:6px 0;color:#64748b;">Paid at</td><td style="padding:6px 0;text-align:right;">${formatDate(data.paidAt)}</td></tr>`
    : '';
  const invoiceLine = data.invoiceNumber
    ? `<tr><td style="padding:6px 0;color:#64748b;">Invoice</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${data.invoiceNumber}</td></tr>`
    : '';
  const methodLine = data.paymentMethod
    ? `<tr><td style="padding:6px 0;color:#64748b;">Method</td><td style="padding:6px 0;text-align:right;">${data.paymentMethod}</td></tr>`
    : '';
  const trackingLine = data.trackingNumber
    ? `<tr><td style="padding:6px 0;color:#64748b;">Tracking</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${data.trackingNumber}</td></tr>`
    : '';
  const trackBtn = data.trackUrl
    ? `<p style="margin-top:24px;"><a href="${data.trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">Track shipment</a></p>`
    : '';

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1e293b;border-radius:16px;overflow:hidden;">
        <tr><td style="padding:28px 32px;background:linear-gradient(135deg,#14532d,#166534);">
          <h1 style="margin:0;color:#fff;font-size:22px;">Payment receipt</h1>
          <p style="margin:8px 0 0;color:#bbf7d0;font-size:14px;">Guzo Logistics</p>
        </td></tr>
        <tr><td style="padding:32px;color:#e2e8f0;">
          <p style="margin:0 0 16px;">Hi ${escapeHtml(data.firstName)},</p>
          <p style="margin:0 0 24px;color:#94a3b8;">Thank you — we received your payment.</p>
          <table width="100%" style="border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;padding:16px 0;margin-bottom:16px;">
            <tr><td style="padding:6px 0;color:#64748b;">Order</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${data.orderNumber}</td></tr>
            ${invoiceLine}
            <tr><td style="padding:6px 0;color:#64748b;">Amount</td><td style="padding:6px 0;text-align:right;font-size:20px;font-weight:700;color:#4ade80;">${data.currency} ${data.amount}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;">Reference</td><td style="padding:6px 0;text-align:right;font-family:monospace;">${data.reference}</td></tr>
            ${methodLine}
            ${paidLine}
            ${trackingLine}
          </table>
          ${trackBtn}
          <p style="margin-top:32px;font-size:12px;color:#64748b;">Keep this email for your records.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildPaymentReceiptText(data: PaymentReceiptData): string {
  const lines = [
    `Hi ${data.firstName},`,
    '',
    `Payment received for order ${data.orderNumber}.`,
    `Amount: ${data.currency} ${data.amount}`,
    `Reference: ${data.reference}`,
  ];
  if (data.invoiceNumber) lines.push(`Invoice: ${data.invoiceNumber}`);
  if (data.paymentMethod) lines.push(`Method: ${data.paymentMethod}`);
  if (data.trackingNumber) lines.push(`Tracking: ${data.trackingNumber}`);
  if (data.trackUrl) lines.push(`Track: ${data.trackUrl}`);
  return lines.join('\n');
}

export interface DeliveryConfirmationData {
  firstName: string;
  orderNumber: string;
  trackingNumber?: string | null;
  trackUrl?: string;
}

export function buildDeliveryConfirmationHtml(data: DeliveryConfirmationData): string {
  const trackBtn = data.trackUrl
    ? `<p style="margin-top:24px;"><a href="${data.trackUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;">View delivery details</a></p>`
    : '';
  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#0f172a;font-family:Segoe UI,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1e293b;border-radius:16px;">
        <tr><td style="padding:32px;color:#e2e8f0;">
          <h2 style="margin:0 0 12px;color:#4ade80;">Delivered</h2>
          <p style="margin:0 0 16px;">Hi ${escapeHtml(data.firstName)},</p>
          <p style="margin:0;color:#94a3b8;">Your order <strong style="color:#fff;">${data.orderNumber}</strong> has been delivered successfully.</p>
          ${data.trackingNumber ? `<p style="margin:16px 0 0;color:#64748b;font-family:monospace;">Tracking: ${data.trackingNumber}</p>` : ''}
          ${trackBtn}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function formatDate(value: Date | string): string {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString('en-ET');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
