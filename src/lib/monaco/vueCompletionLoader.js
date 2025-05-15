/**
 * 为特定的Monaco编辑器实例动态加载自定义补全支持
 * @param editor 需要添加自动补全的编辑器实例
 * @param monaco Monaco编辑器的命名空间对象
 */
function loadCustomCompletions(editor, monaco) {
    // 检查编辑器模型的语言
    const model = editor.getModel();
    if (!model || (model.getLanguageId() !== 'javascript' && model.getLanguageId() !== 'typescript')) {
      console.log('不是JavaScript/TypeScript编辑器，不加载自定义补全');
      return; // 只为JavaScript或TypeScript编辑器加载
    }
  
    // 为该特定编辑器/模型生成唯一的库URI
    // 这样做可以确保不同编辑器之间的定义不会冲突
    const libUri = `custom-vue-renderer-functions.d.ts`;
    
    // 设置TypeScript编译选项
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
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

    // 添加 Vue 类型定义
    if (window.VUE_TYPE_DEFINITIONS) {
      const vueTypeDisposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(window.VUE_TYPE_DEFINITIONS, 'vue.d.ts');
      editor['__custom_completions_disposables__'].push(vueTypeDisposable);
      console.log(`已为编辑器(${editor.getId()})加载Vue类型定义`);
    }
  
    // 添加自定义库的TypeScript定义
    const disposable = monaco.languages.typescript.javascriptDefaults.addExtraLib(`
/**
 * API函数类型定义
 */
interface ApiFunction {
  /**
   * 调用后端API
   * @param url API的URL路径
   * @param data 要发送的数据
   * @param type 请求类型，"normal" 或 "sp"
   * @returns 返回一个Promise，解析为API的响应结果
   */
  (url: string, data: any, type: "normal" | "sp"): Promise<any>;
}

/**
 * Backend函数类型定义
 */
interface BackendFunction {
  /**
   * 调用后端脚本（"题目脚本"中定义的脚本）
   * @param key 后端脚本的键名
   * @param data 要发送给后端脚本的数据
   * @returns 返回一个Promise，解析为后端脚本的执行结果
   */
  (key: string, data: any): Promise<any>;
}

/**
 * AdjustTextColor函数类型定义
 */
interface AdjustTextColorFunction {
  /**
   * 根据传入的背景色返回适合的文本颜色
   * @param color 背景颜色，CSS颜色格式
   * @returns 返回"#000000"(黑色)或"#ffffff"(白色)
   */
  (color: string): "#000000" | "#ffffff";
}

/**
 * FormatTimestamp函数类型定义
 */
interface FormatTimestampFunction {
  /**
   * 格式化时间戳为指定格式的字符串
   * @param timestamp 时间戳(毫秒)
   * @param format 可选的格式化模板
   * @returns 格式化后的时间字符串
   */
  (timestamp: number, format?: string): string;
}

/**
 * MarkdownToHtml函数类型定义
 */
interface MarkdownToHtmlFunction {
  /**
   * 转换markdown文本为HTML
   * @param markdown markdown格式的文本
   * @returns 转换后的HTML字符串
   */
  (markdown: string): string;
}

/**
 * Sleep函数类型定义
 */
interface SleepFunction {
  /**
   * 延时指定的毫秒数
   * @param ms 要延时的毫秒数
   * @returns 返回一个Promise，在指定的毫秒数后解析
   */
  (ms: number): Promise<unknown>;
}

/**
 * Yjs命名空间定义
 * 用于编写同队伍间实时同步、实时协作内容
 */
declare namespace Yjs {
  class Doc {
    /**
     * 获取一个Yjs Map
     * @param name Map的名称
     * @returns 返回一个YMap实例
     */
    getMap(name: string): YMap<any>;
    
    /**
     * 获取一个Yjs Array
     * @param name Array的名称
     * @returns 返回一个YArray实例
     */
    getArray(name: string): YArray<any>;
    
    /**
     * 获取一个Yjs Text
     * @param name Text的名称
     * @returns 返回一个YText实例
     */
    getText(name: string): YText;
    
    /**
     * 获取一个Yjs XML Fragment
     * @param name XML Fragment的名称
     * @returns 返回一个YXmlFragment实例
     */
    getXmlFragment(name: string): YXmlFragment;
  }
  
  interface YMap<T> {
    /**
     * 设置键值对
     * @param key 键名
     * @param value 值
     */
    set(key: string, value: T): void;
    
    /**
     * 获取键对应的值
     * @param key 键名
     * @returns 键对应的值
     */
    get(key: string): T | undefined;
    
    /**
     * 删除键值对
     * @param key 要删除的键名
     * @returns 是否成功删除
     */
    delete(key: string): boolean;
    
    /**
     * 获取所有键名
     * @returns 键名数组
     */
    keys(): IterableIterator<string>;
    
    /**
     * 监听Map的变化
     * @param callback 当Map发生变化时调用的回调函数
     */
    observe(callback: (event: any) => void): void;
  }
  
  interface YArray<T> {
    /**
     * 获取数组长度
     */
    readonly length: number;
    
    /**
     * 在数组末尾添加元素
     * @param items 要添加的元素
     */
    push(items: T | Array<T>): void;
    
    /**
     * 在指定索引位置插入元素
     * @param index 插入位置
     * @param items 要插入的元素
     */
    insert(index: number, items: T | Array<T>): void;
    
    /**
     * 删除指定索引位置的元素
     * @param index 要删除的元素的索引
     * @param length 要删除的元素数量
     */
    delete(index: number, length: number): void;
    
    /**
     * 获取指定索引的元素
     * @param index 索引
     * @returns 元素值
     */
    get(index: number): T;
    
    /**
     * 监听数组的变化
     * @param callback 当数组发生变化时调用的回调函数
     */
    observe(callback: (event: any) => void): void;
  }
  
  interface YText {
    /**
     * 在指定位置插入文本
     * @param index 插入位置
     * @param text 要插入的文本
     */
    insert(index: number, text: string): void;
    
    /**
     * 删除指定位置的文本
     * @param index 开始位置
     * @param length 要删除的字符数
     */
    delete(index: number, length: number): void;
    
    /**
     * 获取文本内容的字符串表示
     * @returns 文本内容字符串
     */
    toString(): string;
    
    /**
     * 获取文本的长度
     * @returns 文本长度
     */
    length: number;
    
    /**
     * 监听文本的变化
     * @param callback 当文本发生变化时调用的回调函数
     */
    observe(callback: (event: any) => void): void;
  }
  
  interface YXmlFragment {
    /**
     * 在指定位置插入XML元素
     * @param index 插入位置
     * @param element XML元素
     */
    insert(index: number, element: YXmlElement): void;
  }
  
  interface YXmlElement {
    /**
     * 设置元素的属性
     * @param name 属性名
     * @param value 属性值
     */
    setAttribute(name: string, value: string): void;
    
    /**
     * 获取元素的属性值
     * @param name 属性名
     * @returns 属性值
     */
    getAttribute(name: string): string | null;
  }
  
  /**
   * Yjs对象，提供实时协作功能
   */
  interface Yjs {
    /**
     * 当前的Yjs文档实例
     */
    yDoc: Doc;
  }
}

/**
 * Vue的inject函数类型定义
 * 允许在Vue组件中注入依赖
 * 
 * 这是Vue Composition API的部分定义，仅限于inject函数
 */
declare module Vue {
  /**
   * 从Vue应用的Provide/Inject系统中注入一个值
   * 专门支持自定义API和工具的类型定义
   */
  export function inject(key: "api"): ApiFunction;
  export function inject(key: "backend"): BackendFunction;
  export function inject(key: "ysync"): Yjs.Yjs;
  export function inject(key: "adjustTextColor"): AdjustTextColorFunction;
  export function inject(key: "formatTimestamp"): FormatTimestampFunction;
  export function inject(key: "markdownToHtml"): MarkdownToHtmlFunction;
  export function inject(key: "sleep"): SleepFunction;
  
  /**
   * 通用的inject函数定义，用于处理其他键名
   * @param key 要注入的依赖的键名
   * @param defaultValue 可选的默认值，当未找到注入值时使用
   */
  export function inject<T>(key: string | Symbol, defaultValue?: T): T;

  export function ref<T>(value?: T): { value: T };
  export function reactive<T extends object>(target: T): T;
  export function computed<T>(getter: () => T): { value: T };
  export function watch<T>(source: any, callback: (value: T, oldValue: T, onCleanup: () => void) => void, options?: { immediate?: boolean, deep?: boolean, flush?: 'pre' | 'post' | 'sync' }): () => void;
  export function watchEffect(effect: () => (() => void), options?: { immediate?: boolean, flush?: 'pre' | 'post' | 'sync' }): () => void;
  export function onMounted(callback: () => void): void;
  export function onUnmounted(callback: () => void): void;
  export function onBeforeMount(callback: () => void): void;
  export function onBeforeUnmount(callback: () => void): void;
  export function onBeforeUpdate(callback: () => void): void;
  export function onUpdated(callback: () => void): void;
  export function onBeforeDestroy(callback: () => void): void;
  export function onDestroyed(callback: () => void): void;
  export function nextTick(callback: () => void): void;
}

// 全局可用的函数定义，这些也可以直接调用
declare function api(url: string, data: any, type: "normal" | "sp"): Promise<any>;
declare function backend(key: string, data: any): Promise<any>;
declare function adjustTextColor(color: string): "#000000" | "#ffffff";
declare function formatTimestamp(timestamp: number, format?: string): string;
declare function markdownToHtml(markdown: string): string;
declare function sleep(ms: number): Promise<unknown>;

/**
 * Yjs对象，用于编写同队伍间实时同步、实时协作内容
 */
declare const ysync: Yjs.Yjs
  `, libUri);
    
    // 将disposable对象存储到编辑器实例中，以便稍后可能的清理
    // 这样如果编辑器被销毁，我们可以释放这些资源
    editor['__custom_completions_disposables__'].push(disposable);
    console.log(`已为编辑器(${editor.getId()})加载自定义补全支持`);
    

    const completionDisposable = monaco.languages.registerCompletionItemProvider('javascript', {
      triggerCharacters: ['"', "'", '.'],
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
        
        // 为inject函数提供特定的补全项
        const injectMatch = textUntilPosition.match(/inject\(["']([^"']*)$/);
        if (injectMatch) {
          const suggestions = [
            {
              label: 'api',
              kind: monaco.languages.CompletionItemKind.Function,
              detail: 'API调用函数',
              documentation: '调用后端API的函数',
              insertText: 'api',
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            },
            {
              label: 'backend',
              kind: monaco.languages.CompletionItemKind.Function,
              detail: '后端脚本调用函数',
              documentation: '调用"题目脚本"中定义的脚本',
              insertText: 'backend',
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            },
            {
              label: 'ysync',
              kind: monaco.languages.CompletionItemKind.Variable,
              detail: 'Yjs对象',
              documentation: '用于编写同队伍间实时同步、实时协作内容的Yjs对象',
              insertText: 'ysync',
              range: {
                startLineNumber: position.lineNumber,
                startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                endLineNumber: position.lineNumber,
                endColumn: position.column
              }
            },
            {
                label: 'adjustTextColor',
                kind: monaco.languages.CompletionItemKind.Function,
                detail: '调整文本颜色函数',
                documentation: '根据传入的背景色返回适合的文本颜色',
                insertText: 'adjustTextColor',
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                }
            },
            {
                label: 'formatTimestamp',
                kind: monaco.languages.CompletionItemKind.Function,
                detail: '格式化时间戳函数',
                documentation: '格式化时间戳为指定格式的字符串',
                insertText: 'formatTimestamp',
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                }
            },
            {
                label: 'markdownToHtml',
                kind: monaco.languages.CompletionItemKind.Function,
                detail: '将Markdown文本转换为HTML',
                documentation: '将Markdown文本转换为HTML',
                insertText: 'markdownToHtml',
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                }
            },
            {
                label: 'sleep',
                kind: monaco.languages.CompletionItemKind.Function,
                detail: '延时函数',
                documentation: '延时指定的毫秒数',
                insertText: 'sleep',
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column - (injectMatch[1] ? injectMatch[1].length : 0),
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                }
            }
          ];
          return { suggestions };
        }
        
        return { suggestions: [] };
      }
    });
    
    // 同样保存这个disposable以便清理
    editor['__custom_completions_disposables__'].push(completionDisposable);
  }
  
  /**
   * 从编辑器实例中移除自定义补全支持
   * @param editor 需要清理的编辑器实例
   */
  function unloadCustomCompletions(editor) {    
    // 清理自定义补全提供程序
    if (editor['__custom_completions_disposables__']) {
      editor['__custom_completions_disposables__'].forEach((disposable) => {
        disposable.dispose();
      });
      delete editor['__custom_completions_disposables__'];
    }
    
    console.log(`已从编辑器(${editor.getId()})移除自定义补全支持`);
  }

  // 导出函数供外部使用
  export { loadCustomCompletions, unloadCustomCompletions };