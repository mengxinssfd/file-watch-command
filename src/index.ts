// tsc --target ES5 --experimentalDecorators

// TODO Template存配置文件且可编辑
const fs = require('fs');
const Path = require('path');
const childProcess = require('child_process');
const exec = childProcess.exec;

// 目前有stylus、less
// from 和 target 会被替换掉
const Template = {
    stylus: {
        extension: "styl",
        cmd: "stylus <${from}> ${to}",
        toExtension: "css",
    },
    less: {
        extension: "less",
        cmd: "lessc ${from} ${to}",
        toExtension: "css",
    },
    typescript: {
        // ts => js  tsx => jsx
        extension: ["ts", "tsx"],
        // cmd: "tsc --outFile file.js file.ts"
        cmd: "tsc --outFile ${to} ${from}",
        toExtension: {ts: "js", tsx: "jsx"},
    },
};
type TEMPLATE = typeof Template

let watchDir = ['./test'];// 监听的文件或文件夹 test | test,test2
let type: keyof TEMPLATE = 'less'; // css预编译语言类型
let toExtension: string = "wxss";// 目标文件后缀名

// 监听路径数组  避免重复监听
const watchArr = [];

process.on('exit', function (code) {
    console.log(code);
});
process.stdin.setEncoding('utf8');

// 监听忽略目录
const excludeDir = [
    "node_modules",
    "\\.idea",
    "\\.git",
].map(d => new RegExp(d));


const supportType: Array<keyof TEMPLATE> = Object.keys(Template) as any;

/**
 * 防抖函数
 * @param callback 回调
 * @param delay 延时
 * @returns {Function}
 */
export function debounce(callback: (...args: any[]) => void, delay: number) {
    let timer: any = null;
    return function (...args: any[]) {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(() => {
            timer = null;
            callback.apply(this, args);
        }, delay);
    };
}

/**
 * 防抖装饰器
 * @param delay
 * @constructor
 */
export function Debounce(delay: number) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        // 在babel的网站编译的是target包含key，descriptor
        if (target.descriptor) {
            descriptor = target.descriptor;
        }
        descriptor.value = debounce(descriptor.value, delay);
    };
}

// 控制台输入
function input(tips: string): Promise<string> {
    process.stdout.write(tips);
    return new Promise((res) => {
        process.stdin.on('data', (input: Buffer) => {
            res(input.toString().trim());
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
async function inputLoop(
    tips: string,
    conditionFn: (words: string) => boolean | Promise<boolean>,
): Promise<string> {
    let words;
    do {
        words = await input(tips);
    } while (!await conditionFn(words));
    return words;
}

// 不足10前面加0
function addZero(time: number): string {
    return time > 9 ? String(time) : ('0' + time);
}

// 获取cmd命令
function getCMD(filePath: string): string {
    const tem = Template[type];
    const filePathSplit = filePath.split(".");
    if (filePathSplit.length < 2) {
        throw new Error("该路径没有后缀!");
    }
    const lastIndex = filePathSplit.length - 1;
    const ext = tem.extension;
    const tgExt = tem.toExtension;
    filePathSplit[lastIndex] = typeof ext === "string" ? toExtension : tgExt[filePathSplit[lastIndex]];
    const target = filePathSplit.join(".");
    return tem.cmd.replace("${from}", filePath).replace("${to}", target);
}

function getTime(): string {
    const date = new Date();
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    return `${addZero(h)}:${addZero(m)}:${addZero(s)}`;
}

class Watcher {

    constructor() {
        (async () => {
            this.init();
        })();
    }

    async init() {
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

            // 使用旧的配置  并校验配置文件
            if (existsConfigFile && isUseOld === "Y") {
                const file = await fs.readFileSync(configFilePath);
                let {watchDir: wd, type: tp, toExtension: te} = JSON.parse(file);
                watchDir = wd || [];
                type = tp || "";
                toExtension = te || Template[type].toExtension;

                const existsWatchDir = await this.existWatchDir(watchDir);
                // 目录不存在，重新输入目录
                if (existsWatchDir !== true) {
                    console.log("该目录", existsWatchDir, "不存在");
                    watchDir = (await this.inputWatchDir()).split(",");
                }
                // 类型不支持，重新输入类型
                if (!supportType.includes(type)) {
                    console.log("该预编译语言类型", type, "尚未配置！请重新输入，或配置该类型！");
                    type = await this.inputType();
                }

                // 判断是否有文件后缀名
                const extension: string = this.getDefaultTargetExtension(type);
                if (!toExtension) {
                    toExtension = (await input("请输入编译后的文件类型(默认: " + extension + "):")) || extension;
                }
            }

            // 如果不存在或者不使用旧的 添加新配置
            if (!existsConfigFile || isUseOld === "N" || !watchDir) {
                // watchDir = (await input("请输入监听目录:")) || watchDir;
                watchDir = (await this.inputWatchDir()).split(",");

                // type = (await input("请输入预编译语言类型:")) || type;
                type = await this.inputType();

                const extension: string = this.getDefaultTargetExtension(type);
                toExtension = (await input("请输入编译后的文件类型(默认: " + extension + "):")) || extension;
            }

            console.log(`\n监听目录:${watchDir}, 预编译语言:${type}, 编译文件后缀:${JSON.stringify(toExtension)}\n`);

            // 遍历目录
            watchDir.forEach(w => this.forEachDir(w));

            // 保存设置
            await fs.writeFileSync(configFilePath, JSON.stringify({watchDir, type, toExtension}));
        } catch (e) {
            console.error("init try catch", e);
        }
        console.log(getTime(), '正在监听 ' + watchDir);
    }

    getDefaultTargetExtension(type: keyof typeof Template): string {
        const extension = Template[type].toExtension;
        return typeof extension === "string" ? extension : JSON.stringify(extension);
    }

    // 执行命令
    @Debounce(500)
    async execute(filePath: string) {
        const cmd = getCMD(filePath);
        console.log(getTime(), '执行"' + cmd + '"命令...');
        exec(cmd, function (error: Error | null, stdout: string/*, stderr: string*/) {
            console.log('\n\n*************************命令输出start*************************');
            console.log(stdout);
            console.log('*************************命令输出end*******************\n\n');
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

    // 添加监听
    watch(fileName: string) {
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
                    this.forEachDir(filePath);
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
            this.execute(filePath);
        });

        watcher.addListener("error", function (e) {
            console.log("addListener error", e);
        });
    }

    // 遍历文件夹
    async forEachDir(fileName: string) {
        try {
            const stats = await fs.statSync(fileName);
            const raw = String.raw`${fileName}`;
            const isExclude = excludeDir.some(e => {
                return e.test(raw);
            });
            if (stats.isDirectory() && !isExclude) {
                console.log("遍历", fileName);
                this.watch(fileName);

                const dir = await fs.readdirSync(fileName);
                for (const d of dir) {
                    let p = Path.resolve(fileName, d);
                    this.forEachDir(p);
                }
            } else {
                // console.log(d);
            }
        } catch (e) {
            return Promise.reject(e);
        }

    }

    /**
     * 判断文件是否存在
     * @param dir {string[] | string}
     * @returns {Promise<boolean | string>}
     */
    existWatchDir(dir: string[] | string): Promise<true | string> {
        if (!Array.isArray(dir)) {
            dir = [dir];
        }
        const pArr = dir.map(async (path) => {
            const exists = await fs.existsSync(path);
            // 文件存在则为resolve，不存在则reject(文件名)
            return exists ? Promise.resolve(path) : Promise.reject(path);
        });
        return Promise.all(pArr).then(() => true, (e) => e);
    }

    inputWatchDir(): Promise<string> {
        return inputLoop("请输入监听目录(dir | dir1,dir2): ", async (path: any) => {
            path = path.split(",");
            if (!Array.isArray(path)) {
                path = [path];
            }

            const exists = await this.existWatchDir(path);
            if (exists !== true) {
                console.log("目录", exists, "不存在!\n");
            }
            return exists === true;
        });
    }

    inputType(): Promise<keyof TEMPLATE> {
        return inputLoop("请输入预编译语言类型:", function (type) {
            const support = supportType.includes(type as keyof TEMPLATE);
            if (!support) {
                console.log("该预编译语言类型", type, "尚未配置！请重新输入，或配置该类型！");
            }
            return support;
        }) as Promise<keyof TEMPLATE>;
    }
}


new Watcher();
