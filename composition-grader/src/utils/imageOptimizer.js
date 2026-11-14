/**
 * 針對學生手寫作文照片進行高精度 OCR 預處理
 * 1. 自動修正手機拍照之 EXIF 方向
 * 2. 等比例縮放至最適 OCR 解析度（長邊最大 2048px，確保每個中文字筆畫清晰且不超過 Vercel 4.5MB 限制）
 * 3. 輸出高品質 JPEG Base64
 */
export async function optimizeManuscriptImage(file, maxDimension = 2048, quality = 0.92) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('請上傳有效的圖片檔案（JPG、PNG 或 HEIC）'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('讀取圖片檔案失敗'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('載入圖片失敗，請確認檔案格式是否正確'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // 計算最適 OCR 等比例縮放
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          // 若無法取得 2D context，回退原 Base64
          const rawBase64 = e.target.result.split(',')[1];
          resolve({ base64: rawBase64, mimeType: file.type, width, height });
          return;
        }

        // 以純白底襯底，防止透明 PNG 背景反黑
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // 繪製原圖（現代瀏覽器自動校正 EXIF 旋轉）
        ctx.drawImage(img, 0, 0, width, height);

        // 轉為高品質 JPEG 格式
        const mimeType = 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1];

        resolve({
          base64,
          mimeType,
          dataUrl,
          width,
          height,
          originalSizeKb: Math.round(file.size / 1024),
          optimizedSizeKb: Math.round((base64.length * 3) / 4 / 1024),
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
