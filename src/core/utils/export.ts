import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function exportData(json: string) {
  const fileName = `kampus-backup-${Date.now()}.json`;

  // save file
  await Filesystem.writeFile({
    path: fileName,
    data: json,
    directory: Directory.Documents,
  });

  // get file uri
  const uriResult = await Filesystem.getUri({
    directory: Directory.Documents,
    path: fileName,
  });

  // open share sheet
  await Share.share({
    title: "Kampus Backup",
    text: "Your backup file",
    url: uriResult.uri,
  });
}