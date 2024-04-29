const {i18nHelper} = require("hx-i18n-helper")

const helper = i18nHelper()
// 初始化所需要的nls文件，默认nls文件将自动检测处理（创建）
helper.initLocales(["en"])
// 此过程会从package.json里提取部分可能存在i18n应用的key进行拍平处理，生成默认的nls文件
// 如果后续package.json有变动的i18n相关的键，重新调用此函数以更新nls文件内容
// 第三参数是自定的用在js内的i18n内容，跟pacakge.json关系不大，所以生成时要保留
helper.generateNls([], true, ["promptTitle","promptText","button1","button2","button3", "restartErrorMessage"])

// 从默认nls文件向其他nls文件同步，同步会跳过已经配置过的内容
// （比如package.nls.en.js中的description字段翻译过了，那么在同步时会跳过该字段）
helper.syncLocales()

// 生成一个简单的键值对辅助文件，对于js代码内需要使用i18n的地方进行智能推断辅助
helper.generateJsHelper("helper.keys.js")
// 自动判断locale并从i18n文件中获取内容，主要是在js代码中辅助使用
// helper.i18nGet("")