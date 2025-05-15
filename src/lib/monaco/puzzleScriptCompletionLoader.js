/**
 * 为题目脚本编辑器动态加载自定义补全支持
 * @param editor 需要添加自动补全的编辑器实例
 * @param monaco Monaco编辑器的命名空间对象
 */
function loadPuzzleScriptCompletions(editor, monaco) {
  // 检查编辑器模型的语言
  const model = editor.getModel();
  if (!model || (model.getLanguageId() !== 'javascript' && model.getLanguageId() !== 'typescript')) {
    console.log('不是JavaScript/TypeScript编辑器，不加载自定义补全');
    return; // 只为JavaScript或TypeScript编辑器加载
  }

  // 为该特定编辑器/模型生成唯一的库URI
  const libUri = `puzzle-script-ctx.d.ts`;
  
  // 设置TypeScript编译选项
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    checkJs: true,
    allowJs: true,
    target: monaco.languages.typescript.ScriptTarget.ES2015,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    typeRoots: ["node_modules/@types"],
    lib: ["es2015", "dom"]
  });

  // 初始化自定义补全的disposable
  if (!editor['__custom_completions_disposables__']) {
    editor['__custom_completions_disposables__'] = [];
  }

  // 添加自定义库的TypeScript定义
  const disposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(`
/**
 * 后端脚本上下文对象
 * 提供与后端系统交互的接口和方法
 */
interface Ctx {
  /**
   * 【题目后端】
   * 从前端调用时，前端传来的请求对象，内容为JSON字符串。请调用JSON.parse转换后使用。
   */
  request: string;

  /**
   * 【题目后端】【高级判题】
   * 当前用户的UID
   */
  uid: number;

  /**
   * 【题目后端】【高级判题】
   * 当前用户的用户名
   */
  username: string;

  /**
   * 【题目后端】【高级判题】
   * 当前用户所属队伍的GID
   */
  gid: number;

  /**
   * 【高级判题】
   * 当前运行此后端脚本正在判题的题目PID
   */
  pid: number;

  /**
   * 【高级判题】
   * 用户的答案（经整理，去除前后空格，去除中间的空格、下划线和减号。其他字符均未处理，大小写也未统一。）
   */
  answer: string;

  /**
   * 【高级判题】
   * 用户的答案（原始）
   */
  originalAnswer: string;

  /**
   * 【题目后端】
   * 读取：当前用户的状态存储（注意状态信息是加密存储在每个浏览器上的，不同用户的不同进程都有不同的状态）
   * @param key 状态的键名
   * @returns 状态的值
   */
  getStatus(key: string): string;

  /**
   * 【题目后端】
   * 写入：当前用户的状态存储
   * @param key 状态的键名
   * @param value 状态的值
   */
  setStatus(key: string, value: string): void;

  /**
   * 【题目后端】【高级判题】
   * 读取：当前组队的题目进度（组队题目进度是存在后端数据库中的，组队内部共享，每个题目有不同的状态）
   * @param pid 题目ID
   * @param key 进度的键名
   * @returns 进度的值
   */
  getProgress(pid: number, key: string): string;

  /**
   * 【题目后端】【高级判题】
   * 写入：当前组队的题目进度
   * @param pid 题目ID
   * @param key 进度的键名
   * @param value 进度的值
   */
  setProgress(pid: number, key: string, value: string): void;

  /**
   * 【题目后端】【高级判题】
   * 读取：全局状态存储。存储在服务器后端。
   * @param key 存储的键名
   * @returns 存储的值
   */
  getStorage(key: string): string;

  /**
   * 【题目后端】【高级判题】
   * 写入：全局状态存储。存储在服务器后端。
   * @param key 存储的键名
   * @param value 存储的值
   */
  setStorage(key: string, value: string): void;

  /**
   * 【题目后端】【高级判题】
   * 获取题目的data片段（题目详情中<data></data>中的内容）
   * @param pid 题目ID
   * @returns data片段内容
   */
  getPuzzleData(pid: number): string;

  /**
   * 【题目后端】
   * 扣减组队的信用点。
   * @param gid 队伍ID
   * @param cost 扣减的信用点数量
   * @returns 是否扣减成功
   */
  costCredit(gid: number, cost: number): boolean;

  /**
   * 【题目后端】
   * 返回给前端的数据对象。内容为JSON字符串。必须调用JSON.stringify后传入。
   * 必须在脚本中至少调用这个函数一次，即使没什么需要返回的，也需要调用一次ctx.response("{}");
   * @param body 要返回的JSON字符串
   */
  response(body: string): void;

  /**
   * 【高级判题】
   * 设置判题结果
   * @param result 判题结果，true表示正确，false表示错误
   */
  setResult(result: boolean): void;

  /**
   * 【高级判题】
   * 设置同时返回的附加消息
   * @param message 附加消息
   */
  setExtraMessage(message: string): void;

  /**
   * 【高级判题】
   * 设置是否返回里程碑状态。注意：判题结果必须为false时，里程碑状态才能生效。
   * @param hit 是否命中里程碑
   */
  hitMilestone(hit: boolean): void;

  /**
   * 【高级判题】
   * 设置用户显示答案时应该看到的内容（不设置时会按照题目本身的答案显示）
   * @param answer 显示的答案内容
   */
  setShowAnswer(answer: string): void;

  /**
   * 【题目后端】【高级判题】
   * 返回给定的GID的队伍名
   * @param gid 队伍ID
   * @returns 队伍名称
   */
  getGroupName(gid: number): string;

  /**
   * 【题目后端】
   * 返回给定的GID的队伍的完赛排名以及冠军队伍名称
   * @param gid 队伍ID
   * @returns 包含排名和冠军队伍名的对象
   */
  getRankAndWinner(gid: number): { rank: number; champion: string };

  /**
   * 【题目后端】
   * 由后端发出HTTP POST请求，调用指定的URL
   * @param url 请求的URL
   * @param form 请求的表单数据
   * @param headers 请求的头信息
   * @returns 响应内容
   */
  httpPostForm(url: string, form: object, headers: object): string;
}

/**
 * 后端脚本上下文对象
 * 包含与后端系统交互的接口和方法
 */
declare var ctx: Ctx;

/**
 * 模板代码示例
 */
declare function templateCode(): void;
  `, libUri);

  // 将disposable对象存储到编辑器实例中
  editor['__custom_completions_disposables__'].push(disposable);
  console.log(`已为编辑器(${editor.getId()})加载题目脚本自定义补全支持`);

  // 添加自定义自动补全提供程序
  const completionDisposable = monaco.languages.registerCompletionItemProvider('javascript', {
    triggerCharacters: ['.'],
    provideCompletionItems: function(model, position) {
      // 只为我们特定的编辑器模型提供补全
      if (model !== editor.getModel()) {
        return { suggestions: [] };
      }
      
      const textUntilPosition = model.getValueInRange({
        startLineNumber: position.lineNumber,
        startColumn: 1,
        endLineNumber: position.lineNumber,
        endColumn: position.column
      });
      
      // 为ctx对象提供特定的补全项
      const ctxMatch = textUntilPosition.match(/ctx\.([^.]*)$/);
      if (ctxMatch) {
        const suggestions = [
          {
            label: 'request',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '前端请求数据',
            documentation: '从前端调用时，前端传来的请求对象，内容为JSON字符串。请调用JSON.parse转换后使用。',
            insertText: 'request',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'uid',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '当前用户UID',
            documentation: '当前用户的UID',
            insertText: 'uid',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'username',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '当前用户名',
            documentation: '当前用户的用户名',
            insertText: 'username',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'gid',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '当前用户队伍GID',
            documentation: '当前用户所属队伍的GID',
            insertText: 'gid',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'pid',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '当前题目PID',
            documentation: '当前运行此后端脚本正在判题的题目PID',
            insertText: 'pid',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'answer',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '用户答案(经整理)',
            documentation: '用户的答案（经整理，去除前后空格，去除中间的空格、下划线和减号。其他字符均未处理，大小写也未统一。）',
            insertText: 'answer',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'originalAnswer',
            kind: monaco.languages.CompletionItemKind.Property,
            detail: '用户原始答案',
            documentation: '用户的答案（原始）',
            insertText: 'originalAnswer',
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'getStatus',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '读取用户状态',
            documentation: '读取：当前用户的状态存储（注意状态信息是加密存储在每个浏览器上的，不同用户的不同进程都有不同的状态）',
            insertText: 'getStatus(${1:key})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'setStatus',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '写入用户状态',
            documentation: '写入：当前用户的状态存储',
            insertText: 'setStatus(${1:key}, ${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'getProgress',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '读取组队题目进度',
            documentation: '读取：当前组队的题目进度（组队题目进度是存在后端数据库中的，组队内部共享，每个题目有不同的状态）',
            insertText: 'getProgress(${1:pid}, ${2:key})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'setProgress',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '写入组队题目进度',
            documentation: '写入：当前组队的题目进度',
            insertText: 'setProgress(${1:pid}, ${2:key}, ${3:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'getStorage',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '读取全局状态',
            documentation: '读取：全局状态存储。存储在服务器后端。',
            insertText: 'getStorage(${1:key})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'setStorage',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '写入全局状态',
            documentation: '写入：全局状态存储。存储在服务器后端。',
            insertText: 'setStorage(${1:key}, ${2:value})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'getPuzzleData',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '获取题目data片段',
            documentation: '获取题目的data片段（题目详情中<data></data>中的内容）',
            insertText: 'getPuzzleData(${1:pid})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'costCredit',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '扣减信用点',
            documentation: '扣减组队的信用点。返回是否扣减成功。',
            insertText: 'costCredit(${1:gid}, ${2:cost})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'response',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '返回前端数据',
            documentation: '返回给前端的数据对象。内容为JSON字符串。必须调用JSON.stringify后传入。',
            insertText: 'response(JSON.stringify(${1:{}}))',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'setResult',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '设置判题结果',
            documentation: '设置判题结果，true或者false',
            insertText: 'setResult(${1:false})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'setExtraMessage',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '设置附加消息',
            documentation: '设置同时返回的附加消息',
            insertText: 'setExtraMessage(${1:"消息内容"})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'hitMilestone',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '设置里程碑状态',
            documentation: '设置是否返回里程碑状态。注意：判题结果必须为false时，里程碑状态才能生效。',
            insertText: 'hitMilestone(${1:true})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'setShowAnswer',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '设置显示答案',
            documentation: '设置用户显示答案时应该看到的内容（不设置时会按照题目本身的答案显示）',
            insertText: 'setShowAnswer(${1:"显示内容"})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'getGroupName',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '获取队伍名称',
            documentation: '返回给定的GID的队伍名',
            insertText: 'getGroupName(${1:gid})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'getRankAndWinner',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '获取队伍排名和冠军',
            documentation: '返回给定的GID的队伍的完赛排名以及冠军队伍名称',
            insertText: 'getRankAndWinner(${1:gid})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          },
          {
            label: 'httpPostForm',
            kind: monaco.languages.CompletionItemKind.Method,
            detail: '发送HTTP POST请求',
            documentation: '由后端发出HTTP POST请求，调用指定的URL',
            insertText: 'httpPostForm(${1:url}, ${2:form}, ${3:headers})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column - (ctxMatch[1] ? ctxMatch[1].length : 0),
              endLineNumber: position.lineNumber,
              endColumn: position.column
            }
          }
        ];
        return { suggestions };
      }

      // 提供ctx整体对象的补全
      const emptyMatch = textUntilPosition.match(/^[\s\n]*$/);
      if (emptyMatch || textUntilPosition.endsWith(' ') || textUntilPosition.endsWith('\n')) {
        return {
          suggestions: [
            {
              label: 'ctx',
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: '后端脚本上下文对象',
              documentation: '包含与后端系统交互的接口和方法的上下文对象',
              insertText: 'ctx',
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            }
          ]
        };
      }
      
      return { suggestions: [] };
    }
  });
  
  // 保存这个disposable以便清理
  editor['__custom_completions_disposables__'].push(completionDisposable);
}

/**
 * 从编辑器实例中移除自定义补全支持
 * @param editor 需要清理的编辑器实例
 */
function unloadPuzzleScriptCompletions(editor) {
  // 清理自定义补全提供程序
  if (editor['__custom_completions_disposables__']) {
    editor['__custom_completions_disposables__'].forEach((disposable) => {
      disposable.dispose();
    });
    delete editor['__custom_completions_disposables__'];
  }
  
  console.log(`已从编辑器(${editor.getId()})移除题目脚本自定义补全支持`);
}

// 导出函数供外部使用
export { loadPuzzleScriptCompletions, unloadPuzzleScriptCompletions }; 