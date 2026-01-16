import { PDFDocument } from 'pdf-lib';

export interface FileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: 'pdf' | 'image' | 'unsupported';
  pageCount?: number;
}

export interface MergeProgress {
  current: number;
  total: number;
  phase: 'preparing' | 'processing' | 'finalizing' | 'complete';
  message: string;
  currentFile?: string;
}

// Supported image formats
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];

/**
 * Determine file type from file object
 */
export function getFileType(file: File): 'pdf' | 'image' | 'unsupported' {
  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  const mime = file.type.toLowerCase();
  
  if (ext === '.pdf' || mime === 'application/pdf') {
    return 'pdf';
  }
  
  if (IMAGE_EXTENSIONS.includes(ext) || IMAGE_MIMES.some(m => mime.includes(m))) {
    return 'image';
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
 * Convert an image file to PDF bytes
 */
async function imageToPdfBytes(file: File): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        const imageData = reader.result as ArrayBuffer;
        const pdfDoc = await PDFDocument.create();
        
        let image;
        const mime = file.type.toLowerCase();
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        if (mime.includes('png') || ext === 'png') {
          image = await pdfDoc.embedPng(imageData);
        } else {
          // Convert other formats to JPEG via canvas
          const blob = new Blob([imageData], { type: file.type });
          const bitmap = await createImageBitmap(blob);
          
          const canvas = document.createElement('canvas');
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Could not get canvas context');
          
          ctx.drawImage(bitmap, 0, 0);
          
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          const jpegBase64 = jpegDataUrl.split(',')[1];
          const jpegBytes = Uint8Array.from(atob(jpegBase64), c => c.charCodeAt(0));
          
          image = await pdfDoc.embedJpg(jpegBytes);
        }
        
        // Create page with image dimensions
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
        
        const pdfBytes = await pdfDoc.save();
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
 * Merge multiple files (PDFs and images) into a single PDF
 */
export async function mergeFiles(
  files: FileItem[],
  onProgress: (progress: MergeProgress) => void
): Promise<Blob> {
  const total = files.length;
  let processed = 0;
  
  console.log('=== Starting Document Merge ===');
  console.log(`Total files: ${total}`);
  
  onProgress({
    current: 0,
    total,
    phase: 'preparing',
    message: 'Preparing to merge documents...',
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
        const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        console.log(`  ✓ Added ${sourcePdf.getPageCount()} pages`);
        results.success++;
      } else if (item.type === 'image') {
        const pdfBytes = await imageToPdfBytes(item.file);
        const imagePdf = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(imagePdf, imagePdf.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
        console.log(`  ✓ Converted image to PDF page`);
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
    phase: 'finalizing',
    message: 'Finalizing document...',
  });
  
  console.log('Saving merged PDF...');
  
  const pdfBytes = await mergedPdf.save({
    useObjectStreams: true,
  });

  // Create blob with explicit Uint8Array to ensure type compatibility
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const sizeMB = blob.size / (1024 * 1024);
  
  console.log('=== Merge Complete ===');
  console.log(`Pages: ${mergedPdf.getPageCount()}`);
  console.log(`Size: ${sizeMB.toFixed(2)} MB`);
  console.log(`Success: ${results.success}, Skipped: ${results.skipped}, Errors: ${results.errors.length}`);
  
  onProgress({
    current: total,
    total,
    phase: 'complete',
    message: `Done! ${mergedPdf.getPageCount()} pages, ${sizeMB.toFixed(2)} MB`,
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

