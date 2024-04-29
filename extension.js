var hx = require("hbuilderx");
const {
	exec, execSync
} = require("child_process")
const path = require("path")

const getConfiguration = () => {
	const pkg = require("./package.json")
	return hx.workspace.getConfiguration(pkg.id)
}

const configKey = "promptBeforeRestart"
/**
 * 检测是否需要在重启前提示
 */
const needPrompt = () => { 
	return getConfiguration().get(configKey)
}

const logError = (message, operation="DEFAULT") => {
	// 错误日志
	const fs =require("fs")
	const path = require("path")
	fs.appendFileSync(path.resolve(__dirname, ".log"), [new Date().toLocaleString(), operation, message, "\n"].join("\t"), {encoding: "utf8"})
}

//该方法将在插件激活的时候调用
function activate(context) {
	const {i18nHelper} = require("hx-i18n-helper")
	const helper = i18nHelper(path.resolve(__dirname))
	const helperKeys = require("./helper.keys")
	
	let disposable = hx.commands.registerCommand('extension.restartIde', () => {
		const action = () => {
			const appRoot = hx.env.appRoot
			execSync("cli app quit", {cwd: appRoot, encoding: "utf8"})
            execSync("cli open", {cwd: appRoot, encoding: "utf8"})
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