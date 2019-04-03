const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

let watchFile = './test';// 监听的文件或文件夹
// let extension = 'less';// 文件后缀名
let type = 'less'; // 编译类型
let targetExtension = "wxss";

let types = {
    stylus: {
        extension: "styl",
        cmd: "stylus <from> target"
    },
    less: {
        extension: "less",
        cmd: "lessc from target"
    }
};// 目前有stylus、less

let timer = null;
let watchArr = [];

process.on('exit', function (code) {
    console.log(code)
});
process.stdin.setEncoding('utf8');


function input(tips) {
    process.stdout.write(tips);
    return new Promise((res, rej) => {
        process.stdin.on('data', (input) => {
            input = input.toString().trim();
            res(input)
            // if ([ 'NO', 'no'].indexOf(input) > -1) process.exit(0);
        })
    })
}

// 不足10前面加0
function addZero(time) {
    return time > 9 ? time : '0' + time;
}

function getCMD(filePath) {
    let obj = types[type];
    let target = filePath.replace(obj.extension, targetExtension);
    return obj.cmd.replace("from", filePath).replace("target", target)
}

function getTime() {
    let date = new Date();
    let h = date.getHours();
    let m = date.getMinutes();
    let s = date.getSeconds();
    return `${addZero(h)}:${addZero(m)}:${addZero(s)}`;
}

// 执行命令
function execute(filePath) {
    let cmd = getCMD(filePath);
    console.log(getTime(), '执行"' + cmd + '"命令...');
    exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log('编译失败');
            console.log('\n\n*******************************************');
            console.log(error);
            console.log('*******************************************\n\n');
        } else {
            console.log(getTime(), '编译成功\n');
            console.log(getTime(), '继续监听' + watchFile + '中...');
        }
    });
}

function clearTimer() {
    if (timer) {
        clearTimeout(timer);
        timer = null;
    }
}

// 添加监听
function watch(fileName) {
    if (watchArr.indexOf(fileName) > -1) return;
    watchArr.push(fileName);
    console.log("对" + fileName + "文件夹添加监听");
    fs.watch(fileName, null, (e, f) => {
        clearTimer();
        let s = f.split('.');
        let filePath = path.resolve(fileName, f)
        fs.stat(filePath, function (e, stat) {
            if (e) {

            } else {
                if (stat.isDirectory()) {
                    watch(filePath);
                    return
                }
            }
        });


        if (s.length < 2 || s[s.length - 1] !== types[type].extension) return;
        console.log(getTime(), '监听到', filePath, '文件有改动');

        // 复制到txt文件
        /*timer = setTimeout(() => {
           console.log("event", e);
           console.log("file", f);
           let p = path.join(watchFile, f);
           let newP = p.split(".")[0] + ".txt";

           fs.readFile(p, "utf-8", (err, data) => {
             if (err) return;
             console.log("write", newP);
             fs.writeFile(newP, data, "utf-8", (err2) => {
               if (err2) return;
               console.log("done");
             });
           });

         }, 1000);*/

        // 不加setImmediate的话会与clearTimeout冲突
        // setImmediate(() => {
        setTimeout(() => {
            timer = setTimeout(function () {
                execute(filePath);
                clearTimer();
            }, 500);
        });
    });
}

// 遍历文件夹
function readDir(fileName) {
    fs.readdir(fileName, (err, dir) => {
        if (err) throw err;
        for (let d of dir) {
            let p = path.resolve(fileName, d)
            fs.stat(p, function (err, stats) {
                    if (err) {
                        console.log(err)
                    } else {
                        if (stats.isDirectory()) {
                            watch(p)
                            readDir(p)
                        } else {
                            // console.log(d)
                        }
                    }
                }
            )

        }

    })
    ;
}

async function init() {
    watchFile = (await input("请输入监听目录:")) || watchFile;
    type = (await input("请输入预编译语言类型:")) || type;
    targetExtension = (await input("请输入编译后的文件类型:")) || targetExtension;
    console.log(`监听目录:${watchFile}, 编译语言:${type}, 文件类型:${targetExtension}`)
    readDir(watchFile);
    console.log(getTime(), '开始监听' + watchFile);
}

init();

