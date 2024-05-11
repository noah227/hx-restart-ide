var hx = require("hbuilderx");
const {
	exec, execSync
} = require("child_process")
const path = require("path")
const {
	getConfiguration, getConfigurationNumberItem, logMessage, getTaskList
} = require("./extension.utils.js")

const configKey = "promptBeforeRestart"
/**
 * 检测是否需要在重启前提示
 */
const needPrompt = () => { 
	return getConfiguration().get(configKey)
}

const tryDelay = getConfigurationNumberItem("restartTryDelay", 120, v => {
	if(v < 100) v = 100 
	return v
})

/**
 * 获取当前HBuilderX的进程id
 */
const getAppId = () => {
	const matchTask = getTaskList().find(([pname, pid]) => pname.toLowerCase().startsWith("hbuilderx"))
	return matchTask ? matchTask[1] : null
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
const startIDE = (appId, cwd, startCount) => {
    if(startCount <= 0) return
	if(getIfAppInstance()) {
		const _appId = getAppId()
		if(_appId && _appId !== appId) {
			return logMessage(`HBuilderX已正常启动[PID: ${_appId}]，重试结束[${startCount}]`)
		}
	}
	logMessage(`启动中：${startCount}`)
    execSync("cli open", {cwd, encoding: "utf8"})        
    // 100ms执行一次
    setTimeout(() => {
        startIDE(appId, cwd, startCount - 1)
    }, tryDelay);
}

/**
 * 杀掉残留的cli进程
 * todo 这是一个不严谨的判断
 */
const clearCli = () => {
	getTaskList().forEach(([pname, pid]) => {
		if(pname.startsWith("cli")) process.kill(pid)
	})
} 

//该方法将在插件激活的时候调用
function activate(context) {
	const {i18nHelper} = require("hx-i18n-helper")
	const helper = i18nHelper(path.resolve(__dirname))
	const helperKeys = require("./helper.keys")
	
	let disposable = hx.commands.registerCommand('extension.restartIde', () => {
		const action = () => { 
			const appRoot = hx.env.appRoot
			const appId = getAppId()
			logMessage(`当前进程id：${getAppId()}`)
			execSync("cli app quit", {cwd: appRoot, encoding: "utf8"})
			// 销毁可能异常存在的cli进程
			// clearCli()
			const restartDelay = getConfigurationNumberItem("restartDelay", 100, v => {
				if(v < 30) v = 30
				else if(v > 1000) v = 1000
				return v
			})
			setTimeout(() => {
				const maxTries = getConfigurationNumberItem("restartMaxTries", 10, v => {
					if(v <= 0) v = 10
					else if(v > 30) v = 30
					return v
				}) 
				startIDE(appId, appRoot, maxTries)
			}, restartDelay)
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