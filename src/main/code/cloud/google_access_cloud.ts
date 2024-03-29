import { AccessCloud } from "./access_cloud";
import fs from 'fs';
import { constants } from '../utils/constants';
import { drive_v3 } from "googleapis";
import { log } from "../utils/logger";


export class GoogleAccessCloud implements AccessCloud {
    private drive: drive_v3.Drive;
    private fileNameToId: { [key: string]: string };

    private ROOTDIR = constants.ROOTDIR;
    private TREEDIR = constants.TREEDIR;

    constructor(drive: any) {
        // Load client secrets from a local file.
        this.drive = drive;
        this.fileNameToId = {};
    }

    private getFolderId(foldername: string): string {
        return this.fileNameToId[foldername] ?? "";
    }

    getFileId(this: GoogleAccessCloud, filename: string): string {
        return this.fileNameToId[filename];
    }

    async getDirList(this: GoogleAccessCloud, dir = this.ROOTDIR): Promise<string[]> {
        const fileNames: string[] = [];
        try {
            let queryString = "";
            if (dir !== "") {
                queryString = `'${this.getFolderId(dir)}' in parents`;
            }
            const res = await this.drive.files.list({
                q: queryString,
                fields: 'nextPageToken, files(id, name, webViewLink, modifiedTime)',
            });
            if (res) {
                const files = res.data.files;
                log('Files:');
                if (files && files.length) {
                    files.map((file: any) => {
                        log(`${file.name} (${file.id}) ${file.webViewLink} ${file.modifiedTime}`);
                        this.fileNameToId[file.name] = file.id;
                        fileNames.push(`${file.name},${file.id},${file.webViewLink},${file.modifiedTime}`);
                    });
                } else {
                    log("No files found");
                }
            }
            else {
                log("no response");
            }
        } catch (err) {
            log(err);
        }
        return fileNames;
    }

    async getFile(this: GoogleAccessCloud, dir: string, fileId: string): Promise<string> {
        let dest = fs.createWriteStream(dir + '/' + fileId); // file path where google drive function will save the file

        let progress = 0; // This will contain the download progress amount
        const promises = [];
        // Uploading Single image to drive
        const download = new Promise((resolve: (value: string) => void, reject) => {
            this.drive.files
                .get({ fileId, alt: 'media' }, { responseType: 'stream' })
                .then((driveResponse: any) => {
                    driveResponse.data
                        .on('end', () => {
                            log("Download Complete");
                            resolve(dir + '/' + fileId);
                        })
                        .on('error', (err: any) => {
                            throw new Error('Error downloading file.');
                        })
                        .on('data', (d: any) => {
                            progress += d.length;
                            if (process.stdout.isTTY) {
                                process.stdout.clearLine(0);
                                process.stdout.cursorTo(0);
                                process.stdout.write(`Downloaded ${progress} bytes`);
                            }

                        })
                        .pipe(dest);
                })
                .catch((err: any) => {
                    log(err);
                    reject(err)
                });
        });
        promises.push(download);
        try {
            const results = await Promise.all(promises);
            return results[0];
        } catch (err) {
            log("getFile() error");
            log(err);
        }
        return "";
    }

    async putFile(this: GoogleAccessCloud, filePath: string, dir: string): Promise<boolean> {
        log("Upload called")
        const folderIds = [];
        const folderId = this.getFolderId(dir);
        if (folderId.length > 0) {
            folderIds.push(folderId);
        }
        const fileArray = filePath.split('/');
        const filename = fileArray[fileArray.length - 1];
        var fileMetadata = {
            'name': filename,
            parents: folderIds
        };
        var media = {
            // mimeType: 'image/jpeg',
            body: fs.createReadStream(filePath)
        };
        try {
            const res = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id'
            });
            if (res && res.data.id) {
                log('File Id: ', res.data.id);
                this.fileNameToId[filename] = res.data.id;
                log("ID", this.fileNameToId[filename]);
            } else {
                log("Upload failed");
            }
            return true;
        } catch (error) {
            log("putFile() error");
            log(error);
        }
        return false;
    }

    async renameFile(this: GoogleAccessCloud, oldFileName: string, newFileName: string): Promise<boolean> {
        log(`Rename Called for file: ${oldFileName} to change to ${newFileName}`);
        const fileId = this.fileNameToId[oldFileName];
        log("Inside rename fileid: ", fileId);
        const body = { 'name': newFileName };
        const promises = [];
        promises.push(new Promise((resolve, reject) => {
            this.drive.files.update({
                fileId: fileId,
                requestBody: body,
            }, (err: any, res: any) => {
                if (err) reject(err);
                else {
                    log('The name of the file has been updated!');
                    resolve(res);
                }
            })
        }));
        try {
            await Promise.all(promises);
            return true;
        } catch (err) {
            log("renameFile() error");
            log(err);
        }
        return false;
    }

    async searchFile(this: GoogleAccessCloud, filePrefix: string, dir = this.TREEDIR): Promise<string[]> {
        const queryString1 = `name contains '${filePrefix}' `
        let queryString2 = "";
        if (dir !== "" && this.getFolderId(dir) !== "") {
            queryString2 = `and '${this.getFolderId(dir)}' in parents`;
        }
        const queryString = queryString1 + queryString2;
        log("query string: ", queryString);
        const filenames: string[] = [];
        try {
            const res = await this.drive.files.list({
                q: queryString,
                fields: 'nextPageToken, files(id,name)',
                spaces: 'drive',
            });
            const files = res.data.files;
            if (files && files.length) {
                log('Files:', files, '\n');
                files.map((file: any) => {
                    this.fileNameToId[file.name] = file.id;
                    filenames.push(file.name);
                });
            } else {
                log('No files found.');
            }
        } catch (err) {
            log(err);
        }
        return filenames;
    }

    async putFolder(this: GoogleAccessCloud, folderName: string, dir: string): Promise<boolean> {
        const folderIds = [];
        const folderId = this.getFolderId(dir);
        if (folderId.length > 0) {
            folderIds.push(folderId);
        }
        var fileMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder',
            parents: folderIds
        };
        try {
            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                fields: 'id'
            });
            if (file && file.data && file.data.id) {
                this.fileNameToId[folderName] = file.data.id;
                return true;
            }
        } catch (err) {
            log(err);
        }
        return false;
    }

    async deleteFile(fileId: string): Promise<boolean> {
        try {
            await this.drive.files.delete({
                fileId: fileId
            });
            return true;
        } catch (err) {
            log("Delete File error");
            log(err)
        }
        return false;
    }
}

// const accessCloud = new GoogleAccessCloud();
