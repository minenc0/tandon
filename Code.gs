// =============================================
// Code.gs — Google Apps Script (Backend)
// Serve HTML form + Handle file upload ke Drive
// =============================================

// Serve halaman HTML form
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Praktikum Siber 3')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

// =============================================
// Upload file ke Google Drive
// Dipanggil dari client via google.script.run
// =============================================
function uploadFileToDrive(fileData, fileName, mimeType, folderName) {
  try {
    // Validasi parameter
    if (!fileData || !fileName) {
      return {
        status: 'error',
        message: 'Data file atau nama file kosong.'
      };
    }

    // Decode base64
    var cleanBase64 = fileData.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    var decodedData = Utilities.base64Decode(cleanBase64);

    // Dapatkan atau buat folder
    var folder = getOrCreateFolder(folderName);

    // Cek duplikat nama file
    var uniqueName = getUniqueFileName(folder, fileName);

    // Buat blob dan simpan ke Drive
    var blob = Utilities.newBlob(decodedData, mimeType, uniqueName);
    var file = folder.createFile(blob);

    // Set permission public
    file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW);

    Logger.log('File diupload: ' + uniqueName + ' (ID: ' + file.getId() + ')');

    return {
      status: 'success',
      message: 'File "' + uniqueName + '" berhasil diupload!',
      fileName: uniqueName,
      fileId: file.getId(),
      url: file.getUrl(),
      size: file.getSize()
    };

  } catch (error) {
    Logger.log('ERROR upload: ' + error.toString());
    return {
      status: 'error',
      message: 'Server error: ' + error.message
    };
  }
}

// =============================================
// Helper: Dapatkan atau buat folder
// =============================================
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  var folder = DriveApp.createFolder(folderName);
  Logger.log('Folder dibuat: ' + folderName);
  return folder;
}

// =============================================
// Helper: Cek duplikat, tambah suffix
// =============================================
function getUniqueFileName(folder, fileName) {
  var name = fileName;
  var ext = '';
  var dotIndex = name.lastIndexOf('.');

  if (dotIndex > 0) {
    ext = name.substring(dotIndex);
    name = name.substring(0, dotIndex);
  }

  var counter = 1;
  var uniqueName = fileName;

  var files = folder.getFilesByName(fileName);
  if (!files.hasNext()) {
    return fileName;
  }

  while (true) {
    uniqueName = name + ' (' + counter + ')' + ext;
    var checkFiles = folder.getFilesByName(uniqueName);
    if (!checkFiles.hasNext()) {
      return uniqueName;
    }
    counter++;
  }
}
