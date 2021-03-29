import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('api', {
  notificationApi: {
    sendNotification(message: string) {
      ipcRenderer.send('notify', message);
    }
  },
  batteryApi: {

  },
  filesApi: {
    fetchFiles(source:string) {
        ipcRenderer.send('files', source);
    },
    getFiles() {
        return new Promise((resolve, _) => {
            ipcRenderer.on('list', (_:any, fileObj: {}) => {
                resolve(fileObj);
            });
        });
    },
    uploadAFile(filePath:string) {
      ipcRenderer.send('uploadPath',filePath);
    },
    isFileUploaded() {
      return new Promise((resolve, _) => {
        ipcRenderer.on('isUploadDone', (_:any, fileId: string) => {
                resolve(fileId);
        });
      });
    },
    downloadAFile(fileName:string, fileId:string) {
      ipcRenderer.send('downloadFile',fileName, fileId);
    },
    isFileDownloaded() {
      return new Promise((resolve, _) => {
        ipcRenderer.on('isDownloadDone', (_:any, isDownloaded: boolean) => {
                resolve(isDownloaded);
        });
      });
    }
  }
})