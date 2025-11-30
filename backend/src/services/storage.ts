import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads';

// Créer le dossier uploads s'il n'existe pas
if (STORAGE_TYPE === 'local' && !fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

export async function saveAudioFile(fileBuffer: Buffer, originalName: string): Promise<string> {
  if (STORAGE_TYPE === 'local') {
    const fileId = uuidv4();
    const extension = path.extname(originalName);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(STORAGE_PATH, fileName);
    
    fs.writeFileSync(filePath, fileBuffer);
    
    // Retourner l'URL relative (en production, ce serait une URL S3 ou CDN)
    return `/uploads/${fileName}`;
  }
  
  // TODO: Implémenter S3 ou autre storage cloud
  throw new Error('Only local storage is implemented');
}

export function getAudioFileUrl(filePath: string): string {
  if (STORAGE_TYPE === 'local') {
    return filePath; // En production, retourner URL complète
  }
  return filePath;
}

