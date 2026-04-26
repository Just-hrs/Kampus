import { Filesystem, Directory, Encoding  } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function exportData(json: string) {
  const fileName = `kampus-backup-${Date.now()}.json`;

  await Filesystem.writeFile({
    path: fileName,
    data: json,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,  });

  const uriResult = await Filesystem.getUri({
    directory: Directory.Cache,
    path: fileName,
  });

  await Share.share({
    title: "Kampus Backup",
    text: "Your backup file",
    url: uriResult.uri,
    dialogTitle: "Export Backup",
  });
}