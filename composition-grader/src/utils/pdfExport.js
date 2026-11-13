import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * 直接將兩頁式評分報告產出並下載為 PDF 檔案
 * @param {string} title 作文題目
 * @param {function} onProgress 狀態回呼
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

  // html2canvas 配置：移除可能含有 oklch 的外部樣式表，避免解析異常
  const html2canvasOptions = {
    scale: 2, // 2x 視網膜高解析度
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 794,
    onclone: (clonedDoc) => {
      // 確保克隆文件中的目標容器完全顯現且無 oklch 干擾
      const container = clonedDoc.getElementById('print-report-container');
      if (container) {
        container.style.position = 'static';
        container.style.left = '0';
        container.style.opacity = '1';
        container.style.pointerEvents = 'auto';
      }
      // 移除克隆文件中含有 Tailwind v4 oklch 變數的 style 標籤
      const styles = clonedDoc.querySelectorAll('style');
      styles.forEach((s) => {
        if (s.textContent && s.textContent.includes('oklch')) {
          // 清除 oklch 樣式，依賴 inline styles
          s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, '#1e293b');
        }
      });
    },
  };

  // 1. 繪製第 1 頁（寫作診斷報告書）
  const canvas1 = await html2canvas(page1, html2canvasOptions);
  const imgData1 = canvas1.toDataURL('image/jpeg', 0.95);
  pdf.addImage(imgData1, 'JPEG', 0, 0, pdfWidth, pdfHeight);

  // 2. 繪製第 2 頁（六級分原創昇華範文）
  if (page2) {
    if (onProgress) onProgress('正在產生第 2 頁六級分昇華範文...');

    const canvas2 = await html2canvas(page2, html2canvasOptions);
    const imgData2 = canvas2.toDataURL('image/jpeg', 0.95);
    pdf.addPage('a4', 'portrait');
    pdf.addImage(imgData2, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  }

  if (onProgress) onProgress('正在下載 PDF 檔案...');

  const cleanTitle = (title || '作文').replace(/[\\/:*?"<>|]/g, '_').slice(0, 25);
  pdf.save(`朕的會考六級分診斷報告_${cleanTitle}.pdf`);
}
