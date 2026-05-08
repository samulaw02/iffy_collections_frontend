import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { fmtReceiptDate } from '../../utils/dateUtils';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const fmt = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

const Divider = () => (
  <div style={{ borderTop: '1px dashed #999', margin: '8px 0' }} />
);

const ReceiptPrint = React.forwardRef(({ sale, items }, ref) => (
  <div
    ref={ref}
    style={{
      fontFamily: 'monospace',
      fontSize: '13px',
      width: '100%',
      maxWidth: '420px',
      margin: '0 auto',
      padding: '20px 24px',
      color: '#111',
      lineHeight: '1.6',
    }}
  >
    {/* Header */}
    <div style={{ textAlign: 'center', marginBottom: '12px' }}>
      <img
        src="/logo.png"
        alt="Iffy Collections"
        style={{ width: '72px', height: '72px', objectFit: 'contain', display: 'block', margin: '0 auto 6px' }}
      />
      <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>IFFY COLLECTIONS</div>
      <div>Bodija, Ibadan, Nigeria</div>
      <div>Tel: 08135359072</div>
    </div>

    <Divider />
    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', letterSpacing: '2px', margin: '6px 0' }}>
      SALES RECEIPT
    </div>
    <Divider />

    {/* Sale info */}
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Receipt #:</span>
        <span style={{ fontWeight: 'bold' }}>{sale.receipt_number}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Date:</span>
        <span>{fmtReceiptDate(sale.created_at)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Customer:</span>
        <span>{sale.customer_name && sale.customer_name !== 'Walk-in Customer' ? sale.customer_name : 'Walk-in Customer'}</span>
      </div>
      {sale.customer_phone && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Phone:</span>
          <span>{sale.customer_phone}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Cashier:</span>
        <span>{sale.processed_by_name}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Payment:</span>
        <span style={{ fontWeight: 'bold' }}>{(sale.payment_method || '').toUpperCase()}</span>
      </div>
    </div>

    <Divider />

    {/* Items header */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 36px 110px 110px', gap: '0 6px', fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>
      <span>ITEM</span>
      <span style={{ textAlign: 'center' }}>QTY</span>
      <span style={{ textAlign: 'right' }}>PRICE</span>
      <span style={{ textAlign: 'right' }}>TOTAL</span>
    </div>

    <Divider />

    {/* Items */}
    {items.map((item, i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 36px 110px 110px', gap: '0 6px', marginBottom: '4px' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product_name}</span>
        <span style={{ textAlign: 'center' }}>{item.quantity}</span>
        <span style={{ textAlign: 'right' }}>{fmt(item.unit_price)}</span>
        <span style={{ textAlign: 'right' }}>{fmt(item.subtotal)}</span>
      </div>
    ))}

    <Divider />

    {/* Totals */}
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Subtotal:</span>
        <span>{fmt(sale.subtotal)}</span>
      </div>
      {parseFloat(sale.discount) > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Discount:</span>
          <span>-{fmt(sale.discount)}</span>
        </div>
      )}
    </div>

    <Divider />

    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', margin: '6px 0' }}>
      <span>TOTAL:</span>
      <span>{fmt(sale.total)}</span>
    </div>

    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span>Amount Paid:</span>
      <span>{fmt(sale.amount_paid)}</span>
    </div>

    <Divider />

    {/* Footer */}
    <div style={{ textAlign: 'center', marginTop: '10px', lineHeight: '1.8' }}>
      <div>Thank you for shopping with us!</div>
    </div>
  </div>
));
ReceiptPrint.displayName = 'ReceiptPrint';

export default function ReceiptModal({ sale, onClose, mode = 'complete' }) {
  const { sale: saleData, items } = sale;
  const printRef = useRef();
  const [sendingWA, setSendingWA] = useState(false);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const handleWhatsApp = async () => {
    setSendingWA(true);
    const phone = saleData.customer_phone
      ? saleData.customer_phone.replace(/\D/g, '').replace(/^0/, '234')
      : '';

    // Try Web Share API with PDF file (works on Android/iOS Chrome & Safari)
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      const pdfBlob = pdf.output('blob');
      const pdfFile = new File(
        [pdfBlob],
        `receipt-${saleData.receipt_number}.pdf`,
        { type: 'application/pdf' }
      );

      if (navigator.canShare?.({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: `Receipt ${saleData.receipt_number}`,
          text: `Receipt from Iffy Collections – ${saleData.receipt_number}`,
        });
        setSendingWA(false);
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') { setSendingWA(false); return; }
    }

    // Fallback for desktop / browsers without file share support
    const fmtWa = (n) => `N${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
    const itemLines = items.map(i => `  - ${i.product_name} x${i.quantity} @ ${fmtWa(i.unit_price)} = ${fmtWa(i.subtotal)}`).join('\n');
    const msg = [
      `*IFFY COLLECTIONS RECEIPT*`,
      `Receipt: ${saleData.receipt_number}`,
      `Date: ${new Date(saleData.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}`,
      `Customer: ${saleData.customer_name || 'Walk-in'}`,
      ``,
      `*Items:*`,
      itemLines,
      ``,
      `Subtotal: ${fmtWa(saleData.subtotal)}`,
      parseFloat(saleData.discount) > 0 ? `Discount: -${fmtWa(saleData.discount)}` : null,
      `*TOTAL: ${fmtWa(saleData.total)}*`,
      `Payment: ${(saleData.payment_method || '').toUpperCase()}`,
      ``,
      `Thank you for shopping with us!`,
      `Tel: 08135359072`,
    ].filter(Boolean).join('\n');

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    setSendingWA(false);
  };

  const handleDownloadPDF = async () => {
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`receipt-${saleData.receipt_number}.pdf`);
    } catch {
      toast.error('PDF generation failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          {mode === 'complete' ? (
            <div>
              <h2 className="text-lg font-semibold text-green-700">✅ Sale Complete!</h2>
              <p className="text-sm text-gray-500">{saleData.receipt_number}</p>
            </div>
          ) : (
            <h2 className="text-lg font-semibold text-gray-800">Receipt</h2>
          )}
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <ReceiptPrint ref={printRef} sale={saleData} items={items} />

        <div className="p-5 border-t border-gray-200 flex flex-wrap gap-2">
          <button onClick={handlePrint} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            🖨️ Print
          </button>
          <button onClick={handleWhatsApp} disabled={sendingWA} className="btn-secondary flex-1 flex items-center justify-center gap-2 text-green-700 border-green-300 hover:bg-green-50">
            {sendingWA ? '⏳ Preparing…' : '💬 WhatsApp'}
          </button>
          <button onClick={handleDownloadPDF} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            📄 Download PDF
          </button>
          <button onClick={onClose} className="btn-primary flex-1">
            New Sale
          </button>
        </div>
      </div>
    </div>
  );
}
