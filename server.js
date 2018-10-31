const fetch = require('isomorphic-fetch');
const Dropbox = require('dropbox').Dropbox;
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const token = require('./config').token;

if(!token){
  throw new Error('You need to specify dropbox token');
}

const dbx = new Dropbox({ accessToken: token, fetch: fetch });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('Welcome to drop-box client');
async function cliFlow() {
  try {
    const dirPath = await cliAsk('Enter absolute file path to folder,from which you want to upload files\n');
    const fileNames = fs.readdirSync(dirPath);
    const filesArr = fileNames
    .map(relFilePAth => {
      const absFilePath = dirPath + '/' + relFilePAth;
      const ext = path.extname(relFilePAth);
      const stats = getStats(absFilePath);
      const file = {
        name: relFilePAth,
        size: stats.size,
        ext: ext
      }
      return file
    })
    .sort((a,b) => a.size - b.size)
    await uploadFiles(filesArr);
    process.exit(0);
  } catch(e) {
    console.log(e);
  }
}

function getStats(absFilePath) {
  return fs.statSync(absFilePath, (err, stats) => stats)
}

function uploadFile(file){
  return new Promise((resolve, reject) => {
    dbx.filesUpload({path: `/${file.ext}/` + file.name, contents: file})
      .then(function(response) {
        if(!response.error){
          console.log(file.name + ' uploaded!');
          resolve('success');
        } else {
          console.log(response.error_summary);
        }
      })
      .catch(function(error) {
        console.error(error);
      });
  })
}

function uploadFiles(filesArr){
  return Promise.all(filesArr.map(file => uploadFile(file)));
}

function cliAsk(pharse) {
  return new Promise((resolve) => {
    rl.question(pharse, (line) => resolve(line))
  })
}

cliFlow();
