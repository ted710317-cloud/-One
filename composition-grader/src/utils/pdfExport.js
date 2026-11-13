import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * 直接將兩頁式評分報告產出並下載為 PDF 檔案
 * @param {string} title 作文題目
 * @param {function} onProgress 狀態回呼（選填）
 */
export async function exportReportToPdf(title = '作文診斷報告書', onProgress) {
  const page1 = document.getElementById('print-page-1');
  const page2 = document.getElementById('print-page-2');

  if (!page1) {
    window.print();
    return;
  }

  if (onProgress) onProgress('正在產生第 1 頁寫作診斷報告...');

  // A4 尺寸標準：寬 210mm，高 297mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pdfWidth = 210;
  const pdfHeight = 297;

  try {
    // 1. 繪製第 1 頁（寫作診斷報告書）
    const canvas1 = await html2canvas(page1, {
      scale: 2, // 2x 視網膜高解析度，確保列印字體極致清晰
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // 2. 繪製第 2 頁（六級分原創昇華範文）
    if (page2) {
      if (onProgress) onProgress('正在產生第 2 頁六級分昇華範文...');

      const canvas2 = await html2canvas(page2, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
      });

      const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
      pdf.addPage('a4', 'portrait');
      pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }

    if (onProgress) onProgress('正在下載 PDF 檔案...');

    const cleanTitle = (title || '作文').replace(/[\\/:*?"<>|]/g, '_').slice(0, 25);
    pdf.save(`朕的會考六級分診斷報告_${cleanTitle}.pdf`);
  } catch (err) {
    console.error('PDF 直接匯出異常，改由列印對話框備援:', err);
    window.print();
  }
}
