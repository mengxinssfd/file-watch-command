const fs = require('fs');
const Path = require('path');
const exec = require('child_process').exec;

let watchDir = ['./test'];// 监听的文件或文件夹 test | test,test2
let type = 'less'; // css预编译语言类型
let targetExtension = "wxss";// 目标文件后缀名

// 监听忽略目录
const excludeDir = [
    "node_modules",
    ".idea",
    ".git",
].map(d => {
        return new RegExp(d);
    }
);

// 目前有stylus、less
// from 和 target 会被替换掉
const Template = {
    stylus: {
        extension: "styl",
        cmd: "stylus <${from}> ${target}",
        targetExtension: "css"
    },
    less: {
        extension: "less",
        cmd: "lessc ${from} ${target}",
        targetExtension: "css"
    },
    typescript: {
        extension: ["ts", "tsx"],
        // cmd: "tsc --outFile file.js file.ts"
        cmd: "tsc --outFile ${target} ${from}",
        targetExtension: {ts: "js", tsx: "jsx"}
    }
};
const supportType = Object.keys(Template);

// 监听路径数组  避免重复监听
const watchArr = [];

process.on('exit', function (code) {
    console.log(code);
});
process.stdin.setEncoding('utf8');

function debounce(callback, delay) {
    let timer;

    return function (...args) {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

// 控制台输入
function input(tips) {
    process.stdout.write(tips);
    return new Promise((res, rej) => {
        process.stdin.on('data', (input) => {
            input = input.toString().trim();
            res(input);
            // if ([ 'NO', 'no'].indexOf(input) > -1) process.exit(0);
        });
    });
}

/**
 * 控制台循环输入，
 * @param tips
 * @param conditionFn 若返回false则一直输入
 * @returns {Promise<*>}
 */
async function inputLoop(tips, conditionFn) {
    let words;
    do {
        words = await input(tips);
    } while (!await conditionFn(words));
    return words;
}

// 不足10前面加0
function addZero(time) {
    return time > 9 ? time : '0' + time;
}

// 获取cmd命令
function getCMD(filePath) {
    const tem = Template[type];
    const filePathSplit = filePath.split(".");
    if (filePathSplit.length < 2) {
        throw new Error("该路径没有后缀!");
    }
    const lastIndex = filePathSplit.length - 1;
    const ext = tem.extension;
    const tgExt = tem.targetExtension;
    filePathSplit[lastIndex] = typeof ext === "string" ? targetExtension : tgExt[filePathSplit[lastIndex]];
    const target = filePathSplit.join(".");
    return tem.cmd.replace("${from}", filePath).replace("${target}", target);
}

function getTime() {
    const date = new Date();
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    return `${addZero(h)}:${addZero(m)}:${addZero(s)}`;
}

// 执行命令
async function execute(filePath) {
    const cmd = getCMD(filePath);
    console.log(getTime(), '执行"' + cmd + '"命令...');
    exec(cmd, function (error, stdout, stderr) {
        if (error) {
            console.log('编译失败');
            console.log('\n\n*******************************************');
            console.log(error);
            console.log('*******************************************\n\n');
        } else {
            console.log(getTime(), '编译成功\n');
            console.log(getTime(), '继续监听' + watchDir + '中...');
        }
    });
}


const execDebounce = debounce(function (filePath) {
    execute(filePath);
}, 500);

// 添加监听
function watch(fileName) {
    if (watchArr.indexOf(fileName) > -1) return;
    watchArr.push(fileName);
    console.log("对" + fileName + "文件夹添加监听\n");

    const watcher = fs.watch(fileName, null, async (e, f) => {
        const s = f.split('.');
        const filePath = Path.resolve(fileName, f);

        try {
            const exist = await fs.existsSync(filePath);
            if (!exist) {
                console.log(filePath, "已删除!");
                // 删除过的需要在watchArr里面去掉，否则重新建一个相同名称的目录不会添加监听
                const index = watchArr.indexOf(filePath);
                if (index > -1) {
                    watchArr.splice(index, 1);
                }
                return;
            }
            // 如果是新增的目录，必须添加监听否则不能监听到该目录的文件变化
            const stat = await fs.statSync(filePath);
            if (stat.isDirectory()) {
                watch(filePath);
            }
        } catch (e) {
            console.log("watch try catch", e, filePath);
        }

        let ext = Template[type].extension;
        ext = Array.isArray(ext) ? ext : [ext];
        // 判断是否需要监听的文件类型
        if (s.length < 2 || !ext.includes(s[s.length - 1])) return;
        console.log(getTime(), '监听到', filePath, '文件有改动');

        // 复制到txt文件
        /*timer = setTimeout(() => {
           console.log("event", e);
           console.log("file", f);
           const p = path.join(watchDir, f);
           const newP = p.split(".")[0] + ".txt";
           fs.readFile(p, "utf-8", (err, data) => {
             if (err) return;
             console.log("write", newP);
             fs.writeFile(newP, data, "utf-8", (err2) => {
               if (err2) return;
               console.log("done");
             });
           });
         }, 1000);*/

        // 改动一个文件会触发多次该回调
        execDebounce(filePath);
    });

    watcher.addListener("error", function (e) {
        console.log("addListener error", e);
    });
}

// 遍历文件夹
async function forEachDir(fileName) {
    try {
        const stats = await fs.statSync(fileName);
        const raw = String.raw`${fileName}`;
        const isExclude = excludeDir.some(e => {
            return e.test(raw);
        });
        if (stats.isDirectory() && !isExclude) {
            console.log("遍历", fileName);
            watch(fileName);

            const dir = await fs.readdirSync(fileName);
            for (const d of dir) {
                let p = Path.resolve(fileName, d);
                forEachDir(p);
            }
        } else {
            // console.log(d);
        }
    } catch (e) {
        return Promise.reject(e);
    }

}

function inputWatchDir() {
    return inputLoop("请输入监听目录:", async function (path) {
        path = path.split(",");
        if (!Array.isArray(path)) {
            path = [path];
        }

        const exists = await existWatchDir(path);
        if (exists !== true) {
            console.log("目录", exists, "不存在!\n");
        }
        return exists === true;
    });
}

function inputType() {
    return inputLoop("请输入预编译语言类型:", function (type) {
        const support = supportType.includes(type);
        if (!support) {
            console.log("该预编译语言类型", type, "尚未配置！请重新输入，或配置该类型！");
        }
        return support;
    });
}

/**
 * 判断文件是否存在
 * @param dir {string[] | string}
 * @returns {Promise<boolean | string>}
 */
function existWatchDir(dir) {
    if (!Array.isArray(dir)) {
        dir = [dir];
    }
    const pArr = dir.map(async (d) => {
        return (await fs.existsSync(d)) ? Promise.resolve() : Promise.reject(d);
    });
    return Promise.all(pArr).then(() => true, (e) => e);
}

async function init() {
    try {
        const configFileName = "watch.config.json";
        const configFilePath = Path.resolve("./", configFileName);
        // const f = await fs.readFileSync(p);
        const existsConfigFile = await fs.existsSync(configFilePath);
        let isUseOld = "N";
        // 判断是否存在配置，如果存在则询问是否使用上次的配置
        if (existsConfigFile) {
            isUseOld = (await input("检测到有上次的监听配置，是否使用上次的配置(Y/N) ")).toUpperCase();
            isUseOld = ["Y", "N"].includes(isUseOld) ? isUseOld : "Y";
        }

        // 使用旧的配置
        if (existsConfigFile && isUseOld === "Y") {
            const file = await fs.readFileSync(configFilePath);
            let {watchDir: wd, type: tp, targetExtension: te} = JSON.parse(file);
            watchDir = wd || [];
            type = tp || "";
            targetExtension = te || Template[type].targetExtension;

            const existsWatchDir = await existWatchDir(watchDir);
            // 目录不存在，重新输入目录
            if (existsWatchDir !== true) {
                console.log("该目录", existsWatchDir, "不存在");
                watchDir = (await inputWatchDir()).split(",");
            }
            // 类型不支持，重新输入类型
            if (!supportType.includes(type)) {
                console.log("该预编译语言类型", type, "尚未配置！请重新输入，或配置该类型！");
                type = await inputType();
            }

            if (!targetExtension) {
                targetExtension = (await input("请输入编译后的文件类型(默认: " + JSON.stringify(Template[type].targetExtension) + "):")) || Template[type].targetExtension;
            }
        }

        // 如果不存在或者不使用旧的 添加新配置
        if (!existsConfigFile || isUseOld === "N" || !watchDir) {
            // watchDir = (await input("请输入监听目录:")) || watchDir;
            watchDir = (await inputWatchDir()).split(",");

            // type = (await input("请输入预编译语言类型:")) || type;
            type = await inputType();

            targetExtension = (await input("请输入编译后的文件类型(默认: " + JSON.stringify(Template[type].targetExtension) + "):")) || Template[type].targetExtension;
        }

        console.log(`\n监听目录:${watchDir}, 预编译语言:${type}, 编译文件后缀:${JSON.stringify(targetExtension)}\n`);

        // 遍历目录
        watchDir.forEach(w => forEachDir(w));

        // 保存设置
        await fs.writeFileSync(configFilePath, JSON.stringify({watchDir, type, targetExtension}));
    } catch (e) {
        console.error("init try catch", e);
    }
    console.log(getTime(), '正在监听 ' + watchDir);
}


(async function () {
    /* await inputLoop("输入数字:", function (word) {
         const isNum = /\d+/.test(word);
         if (!isNum) {
             console.log("输入的不是数字!");
         }
         return isNum;
     });
     console.log("over");*/
    /*try {
        const exist = await existWatchDir(["test"]);
        console.log(exist);
    } catch (e) {
        console.log("eeee", e);
    }*/
    await init();
})();
