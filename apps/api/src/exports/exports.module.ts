import { ExportsService } from './exports.service';
import { PdfGeneratorService } from './services/pdf-generator.service';
import { PrismaClient } from '@prisma/client';

// Simple factory function to create the exports service
export function createExportsService(prisma: PrismaClient): ExportsService {
  const pdfGenerator = new PdfGeneratorService();
  return new ExportsService(prisma, pdfGenerator);
}
