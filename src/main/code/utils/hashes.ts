import CryptoJS from 'crypto-js';
import { log } from './logger';
const { Worker, isMainThread, parentPort } = require('worker_threads');

// Returns the SHA256 hash of a given file
export async function sha256(file : string) : Promise<string>{
    log("entering worker");
    const worker = new Worker(__dirname + "/hashWorker.js");
    log("Return to Parent");
    let x = new Promise((resolve, _) => {
        worker.on('message', (msg:string) => {
            log("Inside worker message : " + msg);
            worker.terminate();
            resolve(msg);
        })
    });
    worker.postMessage(file);
    return await Promise.resolve(x) as string;
    // const data  = jsonfile.readFileSync("count.json");
    // const hash = data['value'];
    // data['value'] = String.fromCharCode(hash.charCodeAt(0) + 1);
    // jsonfile.writeFileSync("count.json", data);
    // return hash;
}

export async function sha256V2(filepath : string,filename : string,userId : string) : Promise<string>{
    log("entering worker");
    const worker = new Worker(__dirname + "/hashWorker.js");
    log("Return to Parent");
    let x = new Promise((resolve, _) => {
        worker.on('message', (msg:string) => {
            log("Inside worker message : " + msg);
            worker.terminate();
            resolve(msg);
        })
    });
    worker.postMessage({   
            fp : filepath,
            fn : filename,
            uid : userId
    });
    return await Promise.resolve(x) as string;

    // const data  = jsonfile.readFileSync("count.json");
    // const hash = data['value'];
    // data['value'] = String.fromCharCode(hash.charCodeAt(0) + 1);
    // jsonfile.writeFileSync("count.json", data);
    // return hash;
    return '';
}

// Compares 2 64 character strings
// Returns True if first string is larger than 2nd String
// Returns False in all other cases
function compare2Strings(s1 : string,s2 : string){
    let len = 64;
    for (let i = 0; i < len; i++){
        if ((s1[i].charCodeAt(0) - s2[i].charCodeAt(0)) > 0){
            return true;
        }
        else if ((s1[i].charCodeAt(0) - s2[i].charCodeAt(0)) < 0){
            return false;
        }
    }
    return false;
}

// Given 2 Hash compute a single Hash
// Use Case : Compute the Hash of Intermediate Nodes
export function concat(s1: string, s2: string){
    var s;
    // Concate the Hash in the order lexicgraphically least followed by other hash.
    if(compare2Strings(s1,s2)){
        s = s2.concat(s1.toString());
    }
    else{
        s = s1.concat(s2.toString());
    }
    log(s);
    return CryptoJS.SHA256(s).toString(CryptoJS.enc.Hex);
}

// let a = "a9df5381f1d9c454ae92e83afe5ff536bcef949254e61fa8f2ff3721e7ee6611";
// let b = "bff0d3f4caf91b0ec6745c12f6435b2344958881e8cfc4bd450b7afb2fa18be0";
// log(concat(b, a));