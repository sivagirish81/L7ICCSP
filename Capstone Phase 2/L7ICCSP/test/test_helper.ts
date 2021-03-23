import { GoogleAuth } from "../src/main/code/authenticator/googleAuth";
import readline from 'readline';
import { GoogleAccessCloud } from "../src/main/code/cloud/google_access_cloud";
import { LocalAccessStorage } from '../src/main/code/storage/local_access_storage';
import { AccessStorage } from "../src/main/code/storage/access_storage";
import { CloudOperations } from '../src/main/code/cloud_operations';
import * as fs from "fs";

export async function setUp (): Promise<CloudOperations> {
    let tester = new GoogleAuth();
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        await tester.authorize();
        if (!tester.isToken()) {
            const it = rl[Symbol.asyncIterator]();
            console.log("Access this url to get required code: ", tester.getAuthUrl());
            const code = await it.next();
            await tester.getAccessToken(code['value']);
        }
        rl.close();
        const access_cloud = new GoogleAccessCloud(tester.getDrive());
        console.log("Search file");
        let files = await access_cloud.searchFile('L7ICCSP', "");
        if (files.length === 0) {
            await access_cloud.putFolder('L7ICCSP', "");
        }
        files = await access_cloud.searchFile('merkle', "");
        if (files.length === 0) {
            await access_cloud.putFolder('merkle', "");
        }
        const storage: AccessStorage = new LocalAccessStorage();
        const operations = new CloudOperations(access_cloud, tester, storage);
        await operations.setUser();
        return operations;
}

export function createFile(fileName: string, size: number) {
    return new Promise((resolve, reject) => {
        const fd = fs.openSync(fileName, 'w');
        fs.writeSync(fd, 'ok', (size*1024*1024));
        fs.closeSync(fd);
        resolve(true);
    });
}

export async function createFiles() {
    let n = 1;
    const promises = [];
    // create 10 1mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 1));
        n++;
    }
    // create 10 2mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 2));
        n++;
    }
    // create 10 3mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 3));
        n++;
    }
    // create 10 5mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 5));
        n++;
    }
    // create 10 10mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 10));
        n++;
    }
    // create 10 20mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 20));
        n++;
    }
    // create 10 30mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 30));
        n++;
    }
    // create 10 50mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 50));
        n++;
    }
    // create 10 75mb files
    for(let i=0; i<10; i++) {
        promises.push(createFile('data/file' + n, 75));
        n++;
    }
    // create 10 100mb files
    for(let i=0; i<9; i++) {
        promises.push(createFile('data/file' + n, 100));
        n++;
    }
    // create 1 1gb file
    promises.push(createFile('data/file' + n, 1024));
    try{
        const values = await Promise.all(promises);
        return values.every(Boolean);
    } catch(err) {
        console.log("CreateFile Error");
        console.log(err);
    }
    return false;
}