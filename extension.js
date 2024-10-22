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

const commandMap = {
	"win32": {
		kill: "taskkill /f /im hbuilderx.exe",
		start: ""
	},
	"linux": {
		kill: "pkill -15 hbuilderx",
		start: ""
	},
	"darwin": {
		kill: "pkill -15 hbuilderx",
		start: ""
	}
}

//该方法将在插件激活的时候调用
function activate(context) {
	let disposable = hx.commands.registerCommand('extension.restartIde', () => {
		const action = () => {
			const cmd = commandMap[process.platform]
			if (!cmd) return hx.window.showErrorMessage(`插件不支持本平台！【${process.platform}】`)
			// 销毁进程 
			exec(cmd.kill, (err, stdout, stderr) => {
				if (err) hx.window.showErrorMessage(err.message)
				else {
					const appRoot = hx.env.appRoot
					// 重启进程
					exec(`hbuilderx.exe`, {
						cwd: appRoot,
						encoding: "utf8"
					}, (err, stdout, stderr) => {
						if (err) require("dialog").err("HBuilderX重启失败，请手动启动", "提示") 
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
				else if (button === "重启并不再提示") {
					getConfiguration().update(configKey, false).then(() => {
						action()
					})
				} else {}
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