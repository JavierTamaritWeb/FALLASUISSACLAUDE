import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputPath = path.join(__dirname, '../img/Escudo_falla.avif');
const outputPath = path.join(__dirname, '../img/og-share.png');

async function generateOgImage() {
  try {
    console.log('Generando og-share.png optimizado para WhatsApp...');

    // Verificar que existe el input
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ El archivo de origen no existe: ${inputPath}`);
        process.exit(1);
    }

    await sharp(inputPath)
      .resize({
        width: 1200,
        height: 630,
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Fondo blanco sólido
      .png({
        quality: 80,
        compressionLevel: 9,
        force: true
      })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    const sizeInKb = stats.size / 1024;

    console.log(`✅ og-share.png generado correctamente.`);
    console.log(`📏 Dimensiones: 1200x630`);
    console.log(`💾 Tamaño: ${sizeInKb.toFixed(2)} KB`);

    if (sizeInKb >= 300) {
      console.warn('⚠️ ADVERTENCIA: La imagen supera o está muy cerca de los 300KB. WhatsApp podría no mostrarla. Intentando recomprimir...');
      // Reintentar con menor calidad si sale muy grande
       await sharp(inputPath)
        .resize({ width: 1200, height: 630, fit: 'contain', background: 'white' })
        .flatten({ background: 'white' })
        .png({ quality: 60, compressionLevel: 9 })
        .toFile(outputPath);
        
        const statsNew = fs.statSync(outputPath);
        console.log(`💾 Nuevo tamaño: ${(statsNew.size / 1024).toFixed(2)} KB`);
    } else {
      console.log('👍 Tamaño aceptable para WhatsApp (<300KB).');
    }

  } catch (error) {
    console.error('❌ Error al generar og-share.png:', error);
    process.exit(1);
  }
}

generateOgImage();
