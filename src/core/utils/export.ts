import { Filesystem, Directory, Encoding  } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

export async function exportData(json: string) {
  const date = new Date().toISOString().slice(0, 10);
  const fileName = `kampus-backup-${date}.json`;
  
  
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
    text: "Backup your student life data safely.",
    url: uriResult.uri,
    dialogTitle: "Export Kampus Backup",
  });

  // give OS time to consume file
  setTimeout(async () => {
    try {
      await Filesystem.deleteFile({
        path: fileName,
        directory: Directory.Cache,
      });
    } catch {
      // ignore cleanup failure
    }
  }, 3000);
}