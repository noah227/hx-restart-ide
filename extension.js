var hx = require("hbuilderx");
const {
	exec
} = require("child_process")


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
			let cmd = ""
			switch(process.platform) {
				case "win32":
					cmd = "taskkill /f /im hbuilderx.exe"
					break
				case "linux":
					cmd = "pkill -15 hbuilderx"
					break
				case "darwin":
					cmd = "pkill -15 hbuilderx"
					break
			}
			// 销毁进程 
			exec(cmd, (err, stdout, stderr) => {
				if (err) hx.window.showErrorMessage(err.message)
				else {
					const appRoot = hx.env.appRoot
					// 重启进程
					exec(`hbuilderx.exe`, {cwd: appRoot, encoding: "utf8"}, (err, stdout, stderr) => {
						if(err) { 
							// const fs =require("fs")
							// const path = require("path")
							// fs.writeFileSync(path.resolve(__dirname, ".log"), err.message, {encoding: "utf8"})
							// 使用了mshta，所以这里只支持了win
							exec(`mshta vbscript:msgbox("HBuilderX重启失败，请手动启动",48,"提示")(window.close)`)
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