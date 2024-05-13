const hx = require("hbuilderx")
const fs = require("fs")
const path = require("path")
const {exec, execSync} = require("child_process")


const getConfiguration = () => {
	const pkg = require("./package.json")
	return hx.workspace.getConfiguration(pkg.id)
}

/**
 * @param {string} key
 * @param {any} defaultValue 非get函数的defaultValue，而是处理数值异常时的默认值
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

const logMessage = (message, operation="DEFAULT") => {
	if(!getConfiguration().get("qOutputLog")) return
	// 错误日志
	const fs =require("fs")
	const path = require("path")
	fs.appendFileSync(path.resolve(__dirname, ".log"), [new Date().toLocaleString(), operation, message, "\n"].join("\t"), {encoding: "utf8"})
}

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

module.exports = {
	getConfiguration,
	getConfigurationNumberItem,
	logMessage,
	getTaskList
}