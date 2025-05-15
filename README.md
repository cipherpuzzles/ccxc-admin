# CCXC Admin

这是 CCXC Engine 的新版通用开源后台

我们尽可能的将各种场景通用化，然而在你部署后，可能仍然需要根据你的项目进行修改。

## 使用

该项目使用 Vite + Vue 3.0 + AntDesign Vue 框架开发。就像其他的 Node 项目那样，你可以简单的用

```bash
npm install
npm run dev
```

来启动这个项目并完成开发。

## 二次开发

首先我们建议你先编辑 `.env.development` 和 `.env.production` 文件，将前端和后端指向你的项目实际地址。

查看并尝试修改 `src/views/BasicSetting.vue`，尽管大部分功能我们已尽可能做成通用化，但是这部分仍然很难通用化。

## 使用文档

关于题目管理、题目文章的 Vue 模式，以及题目脚本的后台 Javascript 脚本。存在一系列自定义的函数和执行环境。请在编写对应代码时参考以下文档。

### 题目的Vue模式

在题目管理中，可以将题目的“内容类型”设置为“Vue SFC”模式，此时题目编辑器将出现“题目HTML”和“题目脚本”的编辑框。可以在其中编写一个 Vue SFC。

一般来说，Vue SFC 分为 `template`、`style` 和 `script` 三个部分。

在 CCXC Admin 编辑器中，你需要将 `template` 和 `style` 写在 “题目HTML” 中，将 `script` 以指定的格式写在 “题目脚本” 中。

除此之外，“题目HTML” 中还可以有 `data` 数据段。这部分数据不会提供给前端。

在 “题目脚本” 中，必须按照如下格式编写。（不能带有`<script>`标签）

```javascript
const { inject } = Vue; // 这里是从Vue导入的东西，相当于 import { xxx } from 'vue'

// 必须存在且只能有一个 export default {}，这将作为Vue的实例对象。因此，这里只能使用options语法。
export default {
    setup() {
        // 按照Vue 3.0推荐的写法，所有的东西你都应该写在 setup() 函数里面
    }
}
```

在Vue脚本中，你可以使用内置对象 inject 提取渲染器提供的各种功能。可用函数如下：

#### api

api(url: string, data: any, type: "normal" | "sp") : Promise&lt;any>

调用后端api

#### backend

backend(key: string, data: any) : Promise&lt;any>

调用后端脚本（“题目脚本”中定义的脚本）

#### adjustTextColor

adjustTextColor(color: string): "#000000" | "#ffffff"

根据传入的背景色返回黑色或白色，使得这个颜色的文本能在指定的背景下看清楚，用于动态生成背景色时显示文本使用。

#### formatTimestamp

formatTimestamp(timestamp: number, format?: string): string

格式化时间戳

#### markdownToHtml

markdownToHtml(markdown: string): string

转换markdown到HTML

#### sleep

sleep(ms: number): Promise&lt;unknown>

延时指定的毫秒数

#### ysync

ysync: Yjs

你将获取到一个Yjs对象，用于编写同队伍间实时同步、实时协作内容。

例子：

```javascript
const ysync = inject('ysync');

const yDoc = ysync.yDoc;
const yMap = yDoc.getMap("MY_CRDT");
```

更多用法请参考 [Yjs 文档](https://yjs.dev/) 。

### 题目文章的Vue模式

在“题目文章”内容编辑框的最顶部插入以下文本

```html
<!--use vue-->
```

之后就可以按照Vue SFC的格式编写Vue组件。

但是`script`中仍然需要按照上述题目的Vue模式中“题目脚本”的格式编写。

以下是一个完整的模板：

```html
<!--use vue-->
<template>

</template>

<style>

</style>

<script>
const { inject } = Vue; // 这里是从Vue导入的东西，相当于 import { xxx } from 'vue'

// 必须存在且只能有一个 export default {}，这将作为Vue的实例对象。因此，这里只能使用options语法。
export default {
    setup() {
        // 按照Vue 3.0推荐的写法，所有的东西你都应该写在 setup() 函数里面
    }
}
</script>
```

### 题目脚本（后端脚本）

在左侧菜单“题目脚本”中，可以定义题目后端脚本。

题目脚本由`Javascript`编写，在后端服务器的 [Jurassic](https://github.com/paulbartrum/jurassic) 环境中运行。

该运行环境已实现完整ES5兼容，但未完整实现ES6兼容，编写代码时需要考虑到这一点，具体实现特性请点击上面链接查看。

后端脚本中提供一个全局变量 `ctx`，在 `ctx` 中提供了一些必要的数据和方法。

后端脚本有两种类型，题目脚本由Vue SFC类型的题目中的`backend`函数调用。

另一种“高级判题脚本”在编辑题目时，在“高级判题”中选择了“自定义判题函数”并在高级判题函数中填入脚本的key，在判题时由后端自动调用。

两种类型的 `ctx` 提供的信息和方法有所不同。请注意以下内容中的标识。


**题目后端脚本模板**

```javascript
/**
 * @param {Ctx} ctx 全局上下文对象
 * @param {object} request 用户请求
 */
function main(ctx, request) {
    // 使用request处理前端的请求

    // 将前端需要的东西return返回
    return {
        data
    }
}

//=======以下是JSON解析与调用脚本，一般不需要修改========
/**
 * @param {Ctx} ctx 全局上下文对象
 */
function _jsonProcessHelper(ctx) {
    let request = JSON.parse(ctx.request);
    let resBody = main(ctx, request);
    let resString = JSON.stringify(resBody);
    ctx.response(resString);
}

_jsonProcessHelper(ctx);
```

**高级判题脚本模板**

```javascript
/**
 * @param {Ctx} ctx 全局上下文对象
 * @param {string} answer 用户答案
 */
function main(ctx, answer) {
    // 使用answer判断答案，返回true或者false
    if (answer.trim().toUpperCase() === "ANSWER") {
        return true;
    }
    
    return false;
}


//===============以下为入口函数调用脚本，一般不用修改==============
/**
 * @param {Ctx} ctx 全局上下文对象
 */
function _mainProcessHelper(ctx) {
    let result = main(ctx, ctx.answer);
    ctx.setResult(result);
}

_mainProcessHelper(ctx);
```

下面介绍 `ctx` 对象中的字段和方法。

#### request

【题目后端】

request: string

从前端调用时，前端传来的请求对象，内容为JSON字符串。请调用JSON.parse转换后使用。

#### uid

【题目后端】【高级判题】

uid: number

当前用户的UID

#### username

【题目后端】【高级判题】

username: string

当前用户的用户名

#### gid

【题目后端】【高级判题】

gid: number

当前用户所属队伍的GID

#### pid

【高级判题】

pid: number

当前运行此后端脚本正在判题的题目PID

#### answer

【高级判题】

answer: string

用户的答案（经整理，去除前后空格，去除中间的空格、下划线和减号。其他字符均未处理，大小写也未统一。）

#### originalAnswer

【高级判题】

originalAnswer: string

用户的答案（原始）

#### getStatus

【题目后端】

getStatus(key: string) : string

读取：当前用户的状态存储（注意状态信息是加密存储在每个浏览器上的，不同用户的不同进程都有不同的状态）

#### setStatus

【题目后端】

setStatus(key: string, value: string)

写入：当前用户的状态存储

#### getProgress

【题目后端】【高级判题】

getProgress(pid: number, key: string) : string

读取：当前组队的题目进度（组队题目进度是存在后端数据库中的，组队内部共享，每个题目有不同的状态）

#### setProgress

【题目后端】【高级判题】

setProgress(pid: number, key: string, value: string)

写入：当前组队的题目进度

#### getStorage

【题目后端】【高级判题】

getStorage(key: string) : string

读取：全局状态存储。存储在服务器后端。

#### setStorage

【题目后端】【高级判题】

setStorage(key: string, value: string)

写入：全局状态存储。存储在服务器后端。

#### getPuzzleData

【题目后端】【高级判题】

getPuzzleData(pid: number) : string

获取题目的data片段（题目详情中`<data></data>`中的内容）

#### costCredit

【题目后端】

costCredit(gid: number, cost: number) : boolean

扣减组队的信用点。返回是否扣减成功。

#### response

【题目后端】

response(body: string)

返回给前端的数据对象。内容为JSON字符串。必须调用`JSON.stringify`后传入。**必须**在此脚本中至少调用这个函数一次，即使你没什么需要返回的，也需要调用一次 `ctx.response("{}");`

不过在上面给出的模板中已经有了，如果直接复制模板使用可以不用考虑这个。

#### setResult

【高级判题】

setResult(result: boolean)

设置判题结果，true或者false。**必须**在此脚本中至少调用此函数一次。

不过在上面给出的模板中已经有了，如果直接复制模板使用可以不用考虑这个。

#### setExtraMessage

【高级判题】

setExtraMessage(message: string)

设置同时返回的附加消息。

#### hitMilestone

【高级判题】

hitMilestone(hit: boolean)

设置是否返回里程碑状态。注意：判题结果**必须为false**时，里程碑状态才能生效。

#### setShowAnswer

【高级判题】

setShowAnswer(answer: string)

设置用户显示答案时应该看到的内容（不设置时会按照题目本身的答案显示）

#### getGroupName

【题目后端】【高级判题】

getGroupName(gid: number) : string

返回给定的GID的队伍名

#### getRankAndWinner

【题目后端】

getRankAndWinner(gid: number) : { rank: number; champion: string }

返回给定的GID的队伍的完赛排名以及冠军队伍名称

这在输出结局剧情时很有用

#### httpPostForm

【题目后端】

httpPostForm(url: string, form: object, headers: object) : string

由后端发出HTTP POST请求，调用指定的URL。form为请求参数。

