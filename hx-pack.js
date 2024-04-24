const cozip = require("cozip")
const publishName = `${require("./package.json").name}.zip`

;(() => {
    cozip(publishName, [
        ["./extension.js", false],
        ["./helper.keys.js", false],
        ["./package.nls.json", false],
        ["./package.nls.en.json", false],
        ["./package.json", false],
        ["./node_modules/flat", true],
        ["./node_modules/hx-i18n-helper", true],
    ], err => {
        if (err) console.error(err)
        else {
            console.log("打包完成, 文件大小", (require("fs").statSync(publishName).size / 1024).toFixed(2), "KB")
        }
    })
})()
