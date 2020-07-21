# styleWatcher
自动编译预编译文件如less、stylus等，可添加sass、scss等
# 使用方法
步骤1：全局安装相应的预编译语言  
步骤2：执行 
```node styleWatcher.js```  或
```
npm i @mxssfd/style-watcher
```
再在项目的package.json里的script里添加
"watch": "node node_modules/@mxssfd/style-watcher"
```
npm run watch
```
步骤3：填写监听文件夹，预编译类型，编译目标类型即可
