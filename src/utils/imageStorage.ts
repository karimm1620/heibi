import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import { generateId } from './id';

const goalImagesDir = new Directory(Paths.document, 'goal-images');

function ensureGoalImagesDir() {
  if (!goalImagesDir.exists) {
    goalImagesDir.create({ intermediates: true, idempotent: true });
  }
}

export class ImagePermissionDeniedError extends Error {
  constructor() {
    super('PERMISSION_DENIED');
    this.name = 'ImagePermissionDeniedError';
  }
}

/**
 * Buka image library, lalu COPY gambar yang dipilih ke dalam
 * document directory milik app (bukan hanya simpan URI cache sementara
 * dari picker, yang bisa hilang setelah app di-restart / cache dibersihkan).
 * Return null kalau user membatalkan.
 */
export async function pickGoalImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new ImagePermissionDeniedError();
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets?.length) {
    return null;
  }

  const picked = result.assets[0];
  ensureGoalImagesDir();

  const sourceFile = new File(picked.uri);
  const extension = sourceFile.extension || '.jpg';
  const destinationFile = new File(goalImagesDir, `${generateId('img')}${extension}`);

  await sourceFile.copy(destinationFile);
  return destinationFile.uri;
}

/** Hapus file gambar goal lama — dipanggil saat goal dihapus atau gambar diganti */
export function deleteGoalImage(uri?: string) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Aman diabaikan — file mungkin sudah tidak ada
  }
}

/**
 * Baca isi file gambar goal sebagai base64 — dipakai buat embed gambar ke
 * dalam backup JSON (bukan cuma nyimpen `imageUri`-nya doang, itu path lokal
 * device ini yang gak akan valid lagi kalau backup di-restore di device
 * lain). Return null kalau file gak ada / gagal dibaca, biar backup tetap
 * jalan buat goal lain — bukan bikin backup gagal total.
 */
export async function readGoalImageAsBase64(uri: string): Promise<string | null> {
  try {
    const file = new File(uri);
    if (!file.exists) return null;
    return await file.base64();
  } catch {
    return null;
  }
}

/**
 * Tulis ulang gambar goal dari base64 (dipanggil pas restore backup). Selalu
 * bikin file BARU dengan id baru — sengaja gak dipaksa reuse nama file dari
 * device asal backup, biar gak collision sama gambar goal yang mungkin udah
 * ada duluan di device ini. Return URI lokal yang baru & valid di device ini.
 */
export function writeGoalImageFromBase64(base64: string, extension: string): string {
  ensureGoalImagesDir();
  const destinationFile = new File(goalImagesDir, `${generateId('img')}${extension || '.jpg'}`);
  destinationFile.create({ overwrite: true, intermediates: true });
  destinationFile.write(base64, { encoding: 'base64' });
  return destinationFile.uri;
}
