# Document Merger

A web application to merge PDFs and images into a single document. Everything runs client-side - your files never leave your browser.

## Features

- 📁 **Drag & Drop Folders** - Drop entire folders and subfolders
- 📄 **PDF Merging** - Combine multiple PDFs into one
- 🖼️ **Image Conversion** - Convert images (JPG, PNG, GIF, WebP, BMP) to PDF pages
- 🔄 **Reorder Files** - Drag to arrange merge order
- 🔒 **100% Private** - All processing happens locally in your browser
- ⚡ **Fast** - No uploads, no waiting for servers

## Supported Formats

- PDF
- JPG / JPEG
- PNG
- GIF
- WebP
- BMP

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: GitHub Integration

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically deploy on every push

## Tech Stack

- [Next.js 14](https://nextjs.org/) - React framework
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Lucide React](https://lucide.dev/) - Icons
- [Framer Motion](https://www.framer.com/motion/) - Animations

## License

MIT

