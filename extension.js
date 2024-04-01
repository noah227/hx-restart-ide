var hx = require("hbuilderx");
const {
	exec, execSync
} = require("child_process");
const { error } = require("console");
const { stderr, stdout } = require("process");


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

//该方法将在插件激活的时候调用
function activate(context) {
	let disposable = hx.commands.registerCommand('extension.restartIde', () => {
		 
		const action = () => {
			const path = require("path")
			const appRoot = hx.env.appRoot
			execSync("chcp 65001")
			exec("cli app quit", {cwd: appRoot}, (err, stdout, stderr) => {
				if (err) hx.window.showErrorMessage(err.message) 
				else {
					exec("cli open", {cwd: appRoot}, (err, stdout, stderr) => {
						if (err) hx.window.showErrorMessage(err.message)
						else {
							// 用cli在hx调试模式下重启无效的
							hx.window.showInformationMessage("已重启")
						}
					})
				}
			}) 
		}
		const _ = needPrompt()
		if (_) {
			hx.window.showMessageBox({
				type: 'question',
				title: '提示',
				text: '重启IDE？',
				buttons: ['重启', '重启并不再提示', '取消'],
				defaultButton: "重启"
			}).then(button => {
				if (button === "重启") action()
				else if(button === "重启并不再提示") {
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