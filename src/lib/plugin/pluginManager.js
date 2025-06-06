import { h, provide } from 'vue';
import { message } from "ant-design-vue";
import { getFrontendPlugins } from '@/api/plugin';

import * as Antd from "ant-design-vue";
import * as Vue from "vue";
import request from '@/utils/request';
import MonacoEditor from '@/components/MonacoEditor.vue';
import ImageUploader from '@/components/ImageUploader.vue';

class PluginManager {
    constructor() {
        this.plugins = new Map();
        this.componentCache = new Map();
        this.menuItems = [];
    }

    async fetchPlugins(router) {
        try {
            // 从API加载插件列表
            const plugins = await getFrontendPlugins();

            if (plugins?.data?.length > 0) {
                for (const plugin of plugins.data) {
                    await this.registerPlugin(plugin, router);
                }
            }

            return this.plugins;
        } catch (error) {
            message.error("插件列表请求失败");
            console.error('插件列表请求失败：', error);
            return new Map();
        }
    }

    async registerPlugin(pluginManifest, router) {
        const { plugin_name, name, path, component, icon } = pluginManifest;
        let id = `${plugin_name}/${path}`;

        if (this.plugins.has(id)) {
            console.warn(`插件 ${id} 已注册过，不能重复注册。请检查名称定义是否有重复。`);
            return;
        }

        try {
            this.plugins.set(id, pluginManifest);

            //添加到菜单
            this.menuItems.push({
                key: `plugin-${id}`,
                path: `/userbackend/${id}`,
                name,
                icon
            });

            //添加到路由
            router.addRoute('userbackend', {
                path: `${id}`,
                name: `plugin-${id}`,
                component: () => this.loadPluginComponent(plugin_name, component)
            })
        } catch (error) {
            console.error(`插件 ${id} 注册失败：`, error);
        }
    }

    runUmdScriptInSandbox(umdScript) {
        const sandbox = {
            console,
            setTimeout,
            clearTimeout,
            setInterval,
            clearInterval,
            fetch,
            URL,
            document,
            localStorage,
            sessionStorage,
            Vue,
            Antd
        };

        const wrappedCode = `
            (function(window, self, globalThis, define, require, module, exports) {
                ${umdScript}
            }).call(this, this, this, this, undefined, undefined, undefined, {})
        `;

        const pluginFunction = new Function(wrappedCode);
        pluginFunction.call(sandbox);

        if (typeof sandbox.pluginDefault === 'object' && sandbox.pluginDefault !== null) 
        {
            return sandbox.pluginDefault;
        }

        console.error("执行插件umd脚本失败：", sandbox);
        return undefined;
    }

    async loadPluginComponent(pluginName, componentName) {
        const realPath = `${pluginName}/${componentName}.js`;

        //检查缓存
        if (this.componentCache.has(realPath)) {
            return this.componentCache.get(realPath);
        }

        const pluginUrl = new URL(`/plugins/${realPath}`, window.location.origin).href;

        try {
            //动态导入组件
            const moduleScriptResponse = await fetch(pluginUrl);
            const moduleScript = await moduleScriptResponse.text();

            const component = this.runUmdScriptInSandbox(moduleScript);
            component.name = `Plugin_${pluginName}_${componentName}`;

            
            //返回一个VueComponent包装用来provide API
            const vueWrapper = {
                name: `PluginWrapper_${pluginName}_${componentName}`,
                setup(props) {
                    provide('request', request);
                    provide('MonacoEditor', MonacoEditor);
                    provide('ImageUploader', ImageUploader);

                    return () => h(component, props);
                }
            }

            this.componentCache.set(realPath, vueWrapper);
            return vueWrapper;
        } catch (error) {
            console.error(`加载插件失败！${realPath}：`, error);

            return {
                name: 'ErrorComponent',
                render() {
                    return h('div', {
                        style: {
                            color: '#f00',
                            padding: '20px'
                        }
                    }, '插件加载失败！');
                }
            }
        }
    }

    getMenuItems() {
        return this.menuItems;
    }

    getRoutes() {
        return this.routes;
    }
}

const pluginManager = new PluginManager();

export const usePluginManager = {
    install(app) {
        app.provide('pluginManager', pluginManager);
    }
};
