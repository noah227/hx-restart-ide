var hx = require("hbuilderx");
const {
	exec, execSync
} = require("child_process")
const path = require("path")

const getConfiguration = () => {
	const pkg = require("./package.json")
	return hx.workspace.getConfiguration(pkg.id)
}

/**
 * @param {string} key
 * @param {any} defaultValue
 * @param {(v: any) => any} extraHandler 对结果进行额外的处理
 */
const getConfigurationNumberItem = (key, defaultValue, extraHandler) => {
	let v = getConfiguration().get(key)
	if(typeof v !== "number") {
		v = parseInt(v)
		v = isNaN(v) ? defaultValue : v
	}
	return extraHandler ? extraHandler(v) : v
}

const configKey = "promptBeforeRestart"
/**
 * 检测是否需要在重启前提示
 */
const needPrompt = () => { 
	return getConfiguration().get(configKey)
}

const logMessage = (message, operation="DEFAULT") => {
	// 错误日志
	const fs =require("fs")
	const path = require("path")
	fs.appendFileSync(path.resolve(__dirname, ".log"), [new Date().toLocaleString(), operation, message, "\n"].join("\t"), {encoding: "utf8"})
}

const tryDelay = getConfigurationNumberItem("restartTryDelay", 120, v => {
	if(v < 1000) v = 1000
	return v
})

/**
 * @returns {[string, number][]}
 */
const getTaskList = () => {
	const cmd = process.platform === "win32" ? "tasklist" : "ps aux"
	return execSync(cmd, {encoding: "utf8"}).split("\n").map(line => {
		lineSplit = line.trim().split(/\s+/)
		const pname = lineSplit[0]
		const pid = parseInt(lineSplit[1])
		return [pname, pid]
	})
}
/**
 * 检测HBuilderX是否已经正常启动了
 */
const getIfAppInstance = () => {
	return getTaskList().find(([pname, pid]) => pname.toLowerCase().indexOf("hbuilderx") >= 0)
}

/**
 * 多启动几次，你总能起来了吧
 */
const startIDE = (cwd, startCount) => {
    if(startCount <= 0) return
	if(getIfAppInstance()) return logMessage(`HBuilderX已正常启动，重试结束[${startCount}]`)
	logMessage(`启动中：${startCount}`)
    exec("cli open", {cwd, encoding: "utf8"})        
    // 100ms执行一次
    setTimeout(() => {
        startIDE(cwd, startCount - 1)
    }, tryDelay);
}

// 杀掉残留的cli进程
const clearCli = () => {
	getTaskList().forEach(([pname, pid]) => {
		if(pname.startsWith("cli")) process.kill(pid)
	})
} 

//该方法将在插件激活的时候调用
function activate(context) {process.ki
	const {i18nHelper} = require("hx-i18n-helper")
	const helper = i18nHelper(path.resolve(__dirname))
	const helperKeys = require("./helper.keys")
	
	let disposable = hx.commands.registerCommand('extension.restartIde', () => {
		const action = () => { 
			const appRoot = hx.env.appRoot
			execSync("cli app quit", {cwd: appRoot, encoding: "utf8"})
			// 销毁可能异常存在的cli进程
			clearCli()
			const maxTries = getConfigurationNumberItem("restartMaxTries", 10, v => {
				if(v <= 0) v = 10
				else if(v > 30) v = 30
				return v
			}) 
			startIDE(appRoot, maxTries)
		}
		const _ = needPrompt()
		if (_) {
			const buttons = Object.values(helper.i18nGets(["button1", "button2", "button3"]))
			hx.window.showMessageBox({
				type: 'question',
				title: helper.i18nGet(helperKeys.promptTitle),
				text: helper.i18nGet(helperKeys.promptText),
				buttons,
				defaultButton: buttons[0]
			}).then(button => {
				if (button === buttons[0]) action()
				else if(button === buttons[1]) {
					getConfiguration().update(configKey, false)
					action()
				}
				else {}
			})
		} else action()
	});
	//订阅销毁钩子，插件禁用的时候，自动注销该command。
	context.subscriptions.push(disposable);
}
//该方法将在插件禁用的时候调用（目前是在插件卸载的时候触发）
function deactivate() {

}
module.exports = {
	activate,
	deactivate
}