"use strict";
// tsc --target ES5 --experimentalDecorators
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Debounce = exports.debounce = void 0;
var fs = require('fs');
var Path = require('path');
var childProcess = require('child_process');
var exec = childProcess.exec;
// 目前有stylus、less
// from 和 target 会被替换掉
var Template = {
    stylus: {
        extension: "styl",
        cmd: "stylus <${from}> ${target}",
        targetExtension: "css",
    },
    less: {
        extension: "less",
        cmd: "lessc ${from} ${target}",
        targetExtension: "css",
    },
    typescript: {
        extension: ["ts", "tsx"],
        // cmd: "tsc --outFile file.js file.ts"
        cmd: "tsc --outFile ${target} ${from}",
        targetExtension: { ts: "js", tsx: "jsx" },
    },
};
var watchDir = ['./test']; // 监听的文件或文件夹 test | test,test2
var type = 'less'; // css预编译语言类型
var targetExtension = "wxss"; // 目标文件后缀名
// 监听路径数组  避免重复监听
var watchArr = [];
process.on('exit', function (code) {
    console.log(code);
});
process.stdin.setEncoding('utf8');
// 监听忽略目录
var excludeDir = [
    "node_modules",
    "\\.idea",
    "\\.git",
].map(function (d) { return new RegExp(d); });
var supportType = Object.keys(Template);
/**
 * 防抖函数
 * @param callback 回调
 * @param delay 延时
 * @returns {Function}
 */
function debounce(callback, delay) {
    var timer = null;
    return function () {
        var _this = this;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        timer = setTimeout(function () {
            timer = null;
            callback.apply(_this, args);
        }, delay);
    };
}
exports.debounce = debounce;
/**
 * 防抖装饰器
 * @param delay
 * @constructor
 */
function Debounce(delay) {
    return function (target, propertyKey, descriptor) {
        // 在babel的网站编译的是target包含key，descriptor
        if (target.descriptor) {
            descriptor = target.descriptor;
        }
        descriptor.value = debounce(descriptor.value, delay);
    };
}
exports.Debounce = Debounce;
// 控制台输入
function input(tips) {
    process.stdout.write(tips);
    return new Promise(function (res) {
        process.stdin.on('data', function (input) {
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
function inputLoop(tips, conditionFn) {
    return __awaiter(this, void 0, void 0, function () {
        var words;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, input(tips)];
                case 1:
                    words = _a.sent();
                    _a.label = 2;
                case 2: return [4 /*yield*/, conditionFn(words)];
                case 3:
                    if (!(_a.sent())) return [3 /*break*/, 0];
                    _a.label = 4;
                case 4: return [2 /*return*/, words];
            }
        });
    });
}
// 不足10前面加0
function addZero(time) {
    return time > 9 ? String(time) : ('0' + time);
}
// 获取cmd命令
function getCMD(filePath) {
    var tem = Template[type];
    var filePathSplit = filePath.split(".");
    if (filePathSplit.length < 2) {
        throw new Error("该路径没有后缀!");
    }
    var lastIndex = filePathSplit.length - 1;
    var ext = tem.extension;
    var tgExt = tem.targetExtension;
    filePathSplit[lastIndex] = typeof ext === "string" ? targetExtension : tgExt[filePathSplit[lastIndex]];
    var target = filePathSplit.join(".");
    return tem.cmd.replace("${from}", filePath).replace("${target}", target);
}
function getTime() {
    var date = new Date();
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    return addZero(h) + ":" + addZero(m) + ":" + addZero(s);
}
var Watcher = /** @class */ (function () {
    function Watcher() {
        var _this = this;
        (function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.init();
                return [2 /*return*/];
            });
        }); })();
    }
    Watcher.prototype.init = function () {
        return __awaiter(this, void 0, void 0, function () {
            var configFileName, configFilePath, existsConfigFile, isUseOld, file, _a, wd, tp, te, existsWatchDir, extension, extension, e_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 17, , 18]);
                        configFileName = "watch.config.json";
                        configFilePath = Path.resolve("./", configFileName);
                        return [4 /*yield*/, fs.existsSync(configFilePath)];
                    case 1:
                        existsConfigFile = _b.sent();
                        isUseOld = "N";
                        if (!existsConfigFile) return [3 /*break*/, 3];
                        return [4 /*yield*/, input("检测到有上次的监听配置，是否使用上次的配置(Y/N) ")];
                    case 2:
                        isUseOld = (_b.sent()).toUpperCase();
                        isUseOld = ["Y", "N"].includes(isUseOld) ? isUseOld : "Y";
                        _b.label = 3;
                    case 3:
                        if (!(existsConfigFile && isUseOld === "Y")) return [3 /*break*/, 11];
                        return [4 /*yield*/, fs.readFileSync(configFilePath)];
                    case 4:
                        file = _b.sent();
                        _a = JSON.parse(file), wd = _a.watchDir, tp = _a.type, te = _a.targetExtension;
                        watchDir = wd || [];
                        type = tp || "";
                        targetExtension = te || Template[type].targetExtension;
                        return [4 /*yield*/, this.existWatchDir(watchDir)];
                    case 5:
                        existsWatchDir = _b.sent();
                        if (!(existsWatchDir !== true)) return [3 /*break*/, 7];
                        console.log("该目录", existsWatchDir, "不存在");
                        return [4 /*yield*/, this.inputWatchDir()];
                    case 6:
                        watchDir = (_b.sent()).split(",");
                        _b.label = 7;
                    case 7:
                        if (!!supportType.includes(type)) return [3 /*break*/, 9];
                        console.log("该预编译语言类型", type, "尚未配置！请重新输入，或配置该类型！");
                        return [4 /*yield*/, this.inputType()];
                    case 8:
                        type = _b.sent();
                        _b.label = 9;
                    case 9:
                        extension = this.getDefaultTargetExtension(type);
                        if (!!targetExtension) return [3 /*break*/, 11];
                        return [4 /*yield*/, input("请输入编译后的文件类型(默认: " + extension + "):")];
                    case 10:
                        targetExtension = (_b.sent()) || extension;
                        _b.label = 11;
                    case 11:
                        if (!(!existsConfigFile || isUseOld === "N" || !watchDir)) return [3 /*break*/, 15];
                        return [4 /*yield*/, this.inputWatchDir()];
                    case 12:
                        // watchDir = (await input("请输入监听目录:")) || watchDir;
                        watchDir = (_b.sent()).split(",");
                        return [4 /*yield*/, this.inputType()];
                    case 13:
                        // type = (await input("请输入预编译语言类型:")) || type;
                        type = _b.sent();
                        extension = this.getDefaultTargetExtension(type);
                        return [4 /*yield*/, input("请输入编译后的文件类型(默认: " + extension + "):")];
                    case 14:
                        targetExtension = (_b.sent()) || extension;
                        _b.label = 15;
                    case 15:
                        console.log("\n\u76D1\u542C\u76EE\u5F55:" + watchDir + ", \u9884\u7F16\u8BD1\u8BED\u8A00:" + type + ", \u7F16\u8BD1\u6587\u4EF6\u540E\u7F00:" + JSON.stringify(targetExtension) + "\n");
                        // 遍历目录
                        watchDir.forEach(function (w) { return _this.forEachDir(w); });
                        // 保存设置
                        return [4 /*yield*/, fs.writeFileSync(configFilePath, JSON.stringify({ watchDir: watchDir, type: type, targetExtension: targetExtension }))];
                    case 16:
                        // 保存设置
                        _b.sent();
                        return [3 /*break*/, 18];
                    case 17:
                        e_1 = _b.sent();
                        console.error("init try catch", e_1);
                        return [3 /*break*/, 18];
                    case 18:
                        console.log(getTime(), '正在监听 ' + watchDir);
                        return [2 /*return*/];
                }
            });
        });
    };
    Watcher.prototype.getDefaultTargetExtension = function (type) {
        var extension = Template[type].targetExtension;
        return typeof extension === "string" ? extension : JSON.stringify(extension);
    };
    // 执行命令
    Watcher.prototype.execute = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var cmd;
            return __generator(this, function (_a) {
                cmd = getCMD(filePath);
                console.log(getTime(), '执行"' + cmd + '"命令...');
                exec(cmd, function (error, stdout /*, stderr: string*/) {
                    console.log('\n\n*************************命令输出start*************************');
                    console.log(stdout);
                    console.log('*************************命令输出end*******************\n\n');
                    if (error) {
                        console.log('编译失败');
                        console.log('\n\n*******************************************');
                        console.log(error);
                        console.log('*******************************************\n\n');
                    }
                    else {
                        console.log(getTime(), '编译成功\n');
                        console.log(getTime(), '继续监听' + watchDir + '中...');
                    }
                });
                return [2 /*return*/];
            });
        });
    };
    // 添加监听
    Watcher.prototype.watch = function (fileName) {
        var _this = this;
        if (watchArr.indexOf(fileName) > -1)
            return;
        watchArr.push(fileName);
        console.log("对" + fileName + "文件夹添加监听\n");
        var watcher = fs.watch(fileName, null, function (e, f) { return __awaiter(_this, void 0, void 0, function () {
            var s, filePath, exist, index, stat, e_2, ext;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        s = f.split('.');
                        filePath = Path.resolve(fileName, f);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, fs.existsSync(filePath)];
                    case 2:
                        exist = _a.sent();
                        if (!exist) {
                            console.log(filePath, "已删除!");
                            index = watchArr.indexOf(filePath);
                            if (index > -1) {
                                watchArr.splice(index, 1);
                            }
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fs.statSync(filePath)];
                    case 3:
                        stat = _a.sent();
                        if (stat.isDirectory()) {
                            this.forEachDir(filePath);
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        e_2 = _a.sent();
                        console.log("watch try catch", e_2, filePath);
                        return [3 /*break*/, 5];
                    case 5:
                        ext = Template[type].extension;
                        ext = Array.isArray(ext) ? ext : [ext];
                        // 判断是否需要监听的文件类型
                        if (s.length < 2 || !ext.includes(s[s.length - 1]))
                            return [2 /*return*/];
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
                        return [2 /*return*/];
                }
            });
        }); });
        watcher.addListener("error", function (e) {
            console.log("addListener error", e);
        });
    };
    // 遍历文件夹
    Watcher.prototype.forEachDir = function (fileName) {
        return __awaiter(this, void 0, void 0, function () {
            var stats, raw_1, isExclude, dir, _i, dir_1, d, p, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, fs.statSync(fileName)];
                    case 1:
                        stats = _a.sent();
                        raw_1 = String.raw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["", ""], ["", ""])), fileName);
                        isExclude = excludeDir.some(function (e) {
                            return e.test(raw_1);
                        });
                        if (!(stats.isDirectory() && !isExclude)) return [3 /*break*/, 3];
                        console.log("遍历", fileName);
                        this.watch(fileName);
                        return [4 /*yield*/, fs.readdirSync(fileName)];
                    case 2:
                        dir = _a.sent();
                        for (_i = 0, dir_1 = dir; _i < dir_1.length; _i++) {
                            d = dir_1[_i];
                            p = Path.resolve(fileName, d);
                            this.forEachDir(p);
                        }
                        return [3 /*break*/, 3];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        e_3 = _a.sent();
                        return [2 /*return*/, Promise.reject(e_3)];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 判断文件是否存在
     * @param dir {string[] | string}
     * @returns {Promise<boolean | string>}
     */
    Watcher.prototype.existWatchDir = function (dir) {
        var _this = this;
        if (!Array.isArray(dir)) {
            dir = [dir];
        }
        var pArr = dir.map(function (path) { return __awaiter(_this, void 0, void 0, function () {
            var exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fs.existsSync(path)];
                    case 1:
                        exists = _a.sent();
                        // 文件存在则为resolve，不存在则reject(文件名)
                        return [2 /*return*/, exists ? Promise.resolve(path) : Promise.reject(path)];
                }
            });
        }); });
        return Promise.all(pArr).then(function () { return true; }, function (e) { return e; });
    };
    Watcher.prototype.inputWatchDir = function () {
        var _this = this;
        return inputLoop("请输入监听目录(dir | dir1,dir2): ", function (path) { return __awaiter(_this, void 0, void 0, function () {
            var exists;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        path = path.split(",");
                        if (!Array.isArray(path)) {
                            path = [path];
                        }
                        return [4 /*yield*/, this.existWatchDir(path)];
                    case 1:
                        exists = _a.sent();
                        if (exists !== true) {
                            console.log("目录", exists, "不存在!\n");
                        }
                        return [2 /*return*/, exists === true];
                }
            });
        }); });
    };
    Watcher.prototype.inputType = function () {
        return inputLoop("请输入预编译语言类型:", function (type) {
            var support = supportType.includes(type);
            if (!support) {
                console.log("该预编译语言类型", type, "尚未配置！请重新输入，或配置该类型！");
            }
            return support;
        });
    };
    __decorate([
        Debounce(500)
    ], Watcher.prototype, "execute", null);
    return Watcher;
}());
new Watcher();
var templateObject_1;
