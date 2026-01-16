import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'image' | 'text' | 'unsupported';
  pageCount?: number;
  selected: boolean;
}

export type OutputFormat = 'pdf' | 'pdf-compressed' | 'pdf-high-quality';

export interface MergeProgress {
  current: number;
  total: number;
  phase: 'preparing' | 'processing' | 'compressing' | 'finalizing' | 'complete';
  message: string;
  currentFile?: string;
}

// Quality settings for different output formats
interface QualitySettings {
  imageQuality: number;      // JPEG quality (0-1)
  maxImageDimension: number; // Max width/height for images
  useObjectStreams: boolean; // PDF compression
  scaleImages: boolean;      // Whether to downscale large images
}

const QUALITY_PRESETS: Record<OutputFormat, QualitySettings> = {
  'pdf-compressed': {
    imageQuality: 0.5,
    maxImageDimension: 1200,
    useObjectStreams: true,
    scaleImages: true,
  },
  'pdf': {
    imageQuality: 0.8,
    maxImageDimension: 2400,
    useObjectStreams: true,
    scaleImages: true,
  },
  'pdf-high-quality': {
    imageQuality: 0.95,
    maxImageDimension: 4800,
    useObjectStreams: false,
    scaleImages: false,
  },
};

// Supported image formats (expanded)
const IMAGE_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.tiff', '.tif', '.svg', '.ico', '.avif', '.jfif',
  '.heic', '.heif', // iPhone photos
];
const IMAGE_MIMES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
  'image/tiff', 'image/svg+xml', 'image/x-icon', 'image/avif',
  'image/heic', 'image/heif',
];

// Supported text formats
const TEXT_EXTENSIONS = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.css', '.js', '.ts', '.log'];
const TEXT_MIMES = ['text/plain', 'text/markdown', 'text/csv', 'application/json', 'text/xml', 'text/html'];

/**
 * Determine file type from file object
 */
export function getFileType(file: File): 'pdf' | 'image' | 'text' | 'unsupported' {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const mime = file.type.toLowerCase();
  
  if (ext === '.pdf' || mime === 'application/pdf') {
    return 'pdf';
  }
  
  if (IMAGE_EXTENSIONS.includes(ext) || IMAGE_MIMES.some(m => mime.includes(m))) {
    return 'image';
  }
  
  if (TEXT_EXTENSIONS.includes(ext) || TEXT_MIMES.some(m => mime.includes(m))) {
    return 'text';
  }
  
  return 'unsupported';
}

/**
 * Get page count for a PDF file
 */
export async function getPdfPageCount(file: File): Promise<number> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdf.getPageCount();
  } catch {
    return 0;
  }
}

/**
 * Compress/resize an image using canvas
 */
async function compressImage(
  imageData: ArrayBuffer,
  mimeType: string,
  settings: QualitySettings
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const blob = new Blob([imageData], { type: mimeType });
  const bitmap = await createImageBitmap(blob);
  
  let targetWidth = bitmap.width;
  let targetHeight = bitmap.height;
  
  // Scale down if needed
  if (settings.scaleImages && (bitmap.width > settings.maxImageDimension || bitmap.height > settings.maxImageDimension)) {
    const scale = settings.maxImageDimension / Math.max(bitmap.width, bitmap.height);
    targetWidth = Math.round(bitmap.width * scale);
    targetHeight = Math.round(bitmap.height * scale);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Use better quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  
  const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.imageQuality);
  const jpegBase64 = jpegDataUrl.split(',')[1];
  const jpegBytes = Uint8Array.from(atob(jpegBase64), c => c.charCodeAt(0));
  
  return { bytes: jpegBytes, width: targetWidth, height: targetHeight };
}

/**
 * Convert an image file to PDF bytes with quality settings
 */
async function imageToPdfBytes(file: File, settings: QualitySettings): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const imageData = reader.result as ArrayBuffer;
        const pdfDoc = await PDFDocument.create();
        
        const mime = file.type.toLowerCase();
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        let image;
        
        // For high quality PNG, embed directly; otherwise compress to JPEG
        if ((mime.includes('png') || ext === 'png') && !settings.scaleImages && settings.imageQuality > 0.9) {
          image = await pdfDoc.embedPng(imageData);
        } else {
          // Compress to JPEG with quality settings
          const compressed = await compressImage(imageData, file.type, settings);
          image = await pdfDoc.embedJpg(compressed.bytes);
        }
        
        // Create page with image dimensions
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
        
        const pdfBytes = await pdfDoc.save({ useObjectStreams: settings.useObjectStreams });
        resolve(pdfBytes);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert a text file to PDF bytes
 */
async function textToPdfBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Courier);
        
        const fontSize = 10;
        const lineHeight = fontSize * 1.4;
        const margin = 50;
        const pageWidth = 612; // Letter size
        const pageHeight = 792;
        const maxWidth = pageWidth - (margin * 2);
        const maxLinesPerPage = Math.floor((pageHeight - (margin * 2)) / lineHeight);
        
        // Split text into lines
        const lines = text.split('\n');
        const wrappedLines: string[] = [];
        
        // Word wrap each line
        for (const line of lines) {
          if (line.length === 0) {
            wrappedLines.push('');
            continue;
          }
          
          const words = line.split(' ');
          let currentLine = '';
          
          for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            const width = font.widthOfTextAtSize(testLine, fontSize);
            
            if (width > maxWidth && currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          
          if (currentLine) {
            wrappedLines.push(currentLine);
          }
        }
        
        // Create pages
        let lineIndex = 0;
        while (lineIndex < wrappedLines.length) {
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          let y = pageHeight - margin;
          
          // Add filename header on first page
          if (lineIndex === 0) {
            page.drawText(`File: ${file.name}`, {
              x: margin,
              y: y,
              size: 12,
              font,
              color: rgb(0.4, 0.4, 0.4),
            });
            y -= lineHeight * 2;
          }
          
          // Add lines to page
          const linesForThisPage = Math.min(maxLinesPerPage - (lineIndex === 0 ? 2 : 0), wrappedLines.length - lineIndex);
          
          for (let i = 0; i < linesForThisPage; i++) {
            const lineText = wrappedLines[lineIndex] || '';
            page.drawText(lineText, {
              x: margin,
              y: y,
              size: fontSize,
              font,
              color: rgb(0.1, 0.1, 0.1),
            });
            y -= lineHeight;
            lineIndex++;
          }
        }
        
        // Ensure at least one page
        if (pdfDoc.getPageCount() === 0) {
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          page.drawText(`File: ${file.name} (empty)`, {
            x: margin,
            y: pageHeight - margin,
            size: 12,
            font,
            color: rgb(0.4, 0.4, 0.4),
          });
        }
        
        const pdfBytes = await pdfDoc.save();
        resolve(pdfBytes);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Re-compress images within an existing PDF (for compression mode)
 */
async function recompressPdfImages(
  sourcePdf: PDFDocument,
  mergedPdf: PDFDocument,
  settings: QualitySettings
): Promise<void> {
  // For now, just copy pages - full image recompression would require
  // iterating through each page's resources which is complex
  // The main compression benefit comes from the save options
  const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach(page => mergedPdf.addPage(page));
}

/**
 * Merge multiple files (PDFs and images) into a single PDF
 */
export async function mergeFiles(
  files: FileItem[],
  onProgress: (progress: MergeProgress) => void,
  outputFormat: OutputFormat = 'pdf'
): Promise<Blob> {
  const total = files.length;
  let processed = 0;
  const settings = QUALITY_PRESETS[outputFormat];
  
  console.log('=== Starting Document Merge ===');
  console.log(`Total files: ${total}`);
  console.log(`Output format: ${outputFormat}`);
  console.log(`Quality settings:`, settings);
  
  onProgress({
    current: 0,
    total,
    phase: 'preparing',
    message: `Preparing to merge (${outputFormat === 'pdf-compressed' ? 'compressed' : outputFormat === 'pdf-high-quality' ? 'high quality' : 'standard'})...`,
  });
  
  // Create the merged PDF document
  const mergedPdf = await PDFDocument.create();
  
  const results = {
    success: 0,
    skipped: 0,
    errors: [] as string[],
  };
  
  for (const item of files) {
    processed++;
    const fileNum = `[${processed}/${total}]`;
    
    onProgress({
      current: processed,
      total,
      phase: 'processing',
      message: `Processing ${item.name}...`,
      currentFile: item.name,
    });
    
    console.log(`${fileNum} ${item.name} (${item.type})`);
    
    try {
      if (item.type === 'pdf') {
        const arrayBuffer = await item.file.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        await recompressPdfImages(sourcePdf, mergedPdf, settings);
        console.log(`  ✓ Added ${sourcePdf.getPageCount()} pages`);
        results.success++;
      } else if (item.type === 'image') {
        const pdfBytes = await imageToPdfBytes(item.file, settings);
        const imagePdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        console.log(`  ✓ Converted image to PDF (quality: ${settings.imageQuality * 100}%)`);
        results.success++;
      } else if (item.type === 'text') {
        const pdfBytes = await textToPdfBytes(item.file);
        const textPdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(textPdf, textPdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        console.log(`  ✓ Converted text to PDF (${textPdf.getPageCount()} pages)`);
        results.success++;
      } else {
        console.log(`  ⊘ Skipped (unsupported format)`);
        results.skipped++;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`  ✗ Error: ${errorMsg}`);
      results.errors.push(`${item.name}: ${errorMsg}`);
    }
  }
  
  // Check if we have any pages
  if (mergedPdf.getPageCount() === 0) {
    throw new Error('No pages could be merged. Please check your files and try again.');
  }
  
  onProgress({
    current: total,
    total,
    phase: 'compressing',
    message: outputFormat === 'pdf-compressed' 
      ? 'Compressing final document...' 
      : 'Finalizing document...',
  });
  
  console.log(`Saving merged PDF with ${outputFormat} settings...`);
  
  const pdfBytes = await mergedPdf.save({
    useObjectStreams: settings.useObjectStreams,
  });

  // Create blob with explicit Uint8Array to ensure type compatibility
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const sizeMB = blob.size / (1024 * 1024);
  
  console.log('=== Merge Complete ===');
  console.log(`Pages: ${mergedPdf.getPageCount()}`);
  console.log(`Size: ${sizeMB.toFixed(2)} MB`);
  console.log(`Success: ${results.success}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);
  
  const qualityLabel = outputFormat === 'pdf-compressed' ? ' (compressed)' : 
                       outputFormat === 'pdf-high-quality' ? ' (high quality)' : '';
  
  onProgress({
    current: total,
    total,
    phase: 'complete',
    message: `Done! ${mergedPdf.getPageCount()} pages, ${sizeMB.toFixed(2)} MB${qualityLabel}`,
  });
  
  return blob;
}

/**
 * Create FileItem from File object
 */
export function createFileItem(file: File): FileItem {
  return {
    id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    file,
    name: file.name,
    size: file.size,
    type: getFileType(file),
    selected: true,
  };
}

/**
 * Recursively get all files from a directory entry
 */
export async function getFilesFromEntry(entry: FileSystemEntry): Promise<File[]> {
  const files: File[] = [];
  
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry;
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject);
    });
    files.push(file);
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry;
    const reader = dirEntry.createReader();
    
    const readEntries = (): Promise<FileSystemEntry[]> => {
      return new Promise((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
    };
    
    let entries: FileSystemEntry[] = [];
    let batch: FileSystemEntry[];
    
    do {
      batch = await readEntries();
      entries = entries.concat(batch);
    } while (batch.length > 0);
    
    for (const childEntry of entries) {
      const childFiles = await getFilesFromEntry(childEntry);
      files.push(...childFiles);
    }
  }
  
  return files;
}
