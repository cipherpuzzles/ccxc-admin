<template>
    <div class="preview-container">
        <div class="header-line">
            <h2>{{ puzzle.title }}</h2>
        </div>
        <div class="ft-content">
            <div v-html="renderedHtml"></div>
        </div>
        <div class="collapse-container" v-if="renderedExtendHtml">
            <div class="collapse-header" @click="toggleCollapse">
                <span>隐藏的内容</span>
                <span class="collapse-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
            </div>
            <div class="collapse-content" v-show="!isCollapsed">
                <div v-html="renderedExtendHtml"></div>
            </div>
        </div>

        <div class="main-container">
            <div v-if="puzzle.type === 0 && puzzle.image" class="puzzle-image-container">
                <img :src="puzzle.image" alt="题目图片">
            </div>
            <div v-if="puzzle.type === 1" v-html="puzzle.html" id="puzzleHtml"></div>
            <div v-if="puzzle.type === 2 || puzzle.type === 3" id="puzzleVue">
                <div id="puzzleVueApp"></div>
            </div>
        </div>
        
        <!-- 页脚空白区域 -->
        <div class="footer-spacer"></div>
    </div>

    <!-- 浮动状态面板 -->
    <div 
        v-show="showStatusPanel"
        class="status-panel"
        :style="{ left: panelPosition.x + 'px', top: panelPosition.y + 'px' }"
        @mousedown="startDrag"
    >
        <div class="status-panel-header">
            <span>同步状态</span>
            <button @click="showStatusPanel = false" class="close-btn">×</button>
        </div>
        <div class="status-panel-content">
            <div class="status-item">
                <span class="status-label">连接状态:</span>
                <span :class="['status-value', ySyncStatus.connected ? 'connected' : 'disconnected']">
                    {{ ySyncStatus.connected ? '已连接' : '未连接' }}
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">同步状态:</span>
                <span :class="['status-value', ySyncStatus.synced ? 'synced' : 'not-synced']">
                    {{ ySyncStatus.synced ? '已同步' : '未同步' }}
                </span>
            </div>
            <div class="status-item" v-if="ySyncStatus.lastSyncTime">
                <span class="status-label">重试次数:</span>
                <span class="status-value">{{ ySyncStatus.retries }}</span>
            </div>
            <div class="status-item" v-if="ySyncStatus.errorMessage">
                <span class="status-label">错误信息:</span>
                <span class="status-value error">{{ ySyncStatus.errorMessage }}</span>
            </div>
        </div>
    </div>

</template>

<style scoped>
.preview-container {
    padding: 20px;
    min-height: 100vh;
}

.ft-content {
    font-family: '楷体', KaiTi, serif;
    margin-bottom: 20px;
}

.collapse-container {
    margin: 20px 0;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
}

.collapse-header {
    background-color: #f5f5f5;
    padding: 12px 16px;
    cursor: pointer;
    user-select: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
}

.collapse-header:hover {
    background-color: #e8e8e8;
}

.collapse-icon {
    font-size: 12px;
    color: #666;
    transition: transform 0.2s ease;
}

.collapse-content {
    padding: 16px;
    background-color: #fff;
}

.footer-spacer {
    height: 80px;
}

.puzzle-image-container img {
    max-width: 100%;
    height: auto;
}

/* 浮动状态面板样式 */
.status-panel {
    position: fixed;
    width: 280px;
    background: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    user-select: none;
}

.status-panel-header {
    background: #f8f9fa;
    padding: 8px 12px;
    border-bottom: 1px solid #e0e0e0;
    border-radius: 8px 8px 0 0;
    cursor: move;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
}

.close-btn {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #666;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.close-btn:hover {
    color: #333;
    background: #e9ecef;
    border-radius: 3px;
}

.status-panel-content {
    padding: 12px;
}

.status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 13px;
}

.status-item:last-child {
    margin-bottom: 0;
}

.status-label {
    color: #666;
    min-width: 70px;
}

.status-value {
    font-weight: 500;
    text-align: right;
    flex: 1;
    margin-left: 8px;
}

.status-value.connected {
    color: #28a745;
}

.status-value.disconnected {
    color: #dc3545;
}

.status-value.synced {
    color: #28a745;
}

.status-value.not-synced {
    color: #ffc107;
}

.status-value.error {
    color: #dc3545;
    font-size: 12px;
    line-height: 1.3;
    word-break: break-word;
}
</style>

<script setup>
import { ref, reactive, nextTick, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import simUserRequestFactory from '@/lib/preview/previewRequest';
import ySyncDocs from '@/lib/preview/ySyncDocs';
import { adjustTextColor, dateFormat, sleep } from '@/lib/preview/utils';
import { markdownToHtml } from '@/lib/preview/markdown';
import puzzleBackendFactory from '@/lib/preview/puzzleBackend';
import { parse as vueSfcParser } from '@vue/compiler-sfc';
import * as Vue from "vue";
import message from '../lib/preview/message';

const ySyncStatus = ySyncDocs.status;

let pid = ref(0);
let simUser = ref({
    uid: 0,
    username: '',
    roleid: 0,
    token: '',
    sk: '',
    etc: '',
    color: '',
});

let puzzle = reactive({
    pid: 0,
    pgid: 0,
    type: 0,
    title: '',
    content: '',
    image: '',
    html: '',
    script: '',
    answer_type: 0,
    extend_content: '',
    adda: 0
});

// 控制折叠状态的响应式变量
const isCollapsed = ref(false);

// 状态面板相关变量
const showStatusPanel = ref(false);
const panelPosition = reactive({ x: 20, y: 100 });
const isDragging = ref(false);
const dragStart = reactive({ x: 0, y: 0 });

// 切换折叠状态的方法
const toggleCollapse = () => {
    isCollapsed.value = !isCollapsed.value;
};

// 状态面板相关方法
const toggleStatusPanel = () => {
    showStatusPanel.value = !showStatusPanel.value;
};

const startDrag = (e) => {
    isDragging.value = true;
    dragStart.x = e.clientX - panelPosition.x;
    dragStart.y = e.clientY - panelPosition.y;
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
};

const onDrag = (e) => {
    if (!isDragging.value) return;
    
    panelPosition.x = e.clientX - dragStart.x;
    panelPosition.y = e.clientY - dragStart.y;
    
    // 限制面板在窗口内
    const maxX = window.innerWidth - 280; // 面板宽度
    const maxY = window.innerHeight - 200; // 面板最小高度
    
    panelPosition.x = Math.max(0, Math.min(panelPosition.x, maxX));
    panelPosition.y = Math.max(0, Math.min(panelPosition.y, maxY));
};

const stopDrag = () => {
    isDragging.value = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
};

// 键盘快捷键处理
const handleKeyDown = (e) => {
    if (e.ctrlKey && e.altKey && e.key === 'm') {
        e.preventDefault();
        toggleStatusPanel();
    }
};
let router = useRouter();
const route = useRoute();

// 从URL参数中读取数据并存入状态
onMounted(() => {
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyDown);
    
    // 读取pid参数
    if (route.query.pid) {
        pid.value = parseInt(route.query.pid) || 0;
    }
    
    // 读取用户相关参数
    if (route.query.uid) {
        simUser.value.uid = parseInt(route.query.uid) || 0;
    }
    
    if (route.query.username) {
        simUser.value.username = route.query.username;
    }
    
    if (route.query.roleid) {
        simUser.value.roleid = parseInt(route.query.roleid) || 0;
    }
    
    if (route.query.token) {
        simUser.value.token = route.query.token;
    }
    
    if (route.query.sk) {
        simUser.value.sk = route.query.sk;
    }
    
    if (route.query.etc) {
        simUser.value.etc = route.query.etc;
    }
    
    if (route.query.color) {
        simUser.value.color = route.query.color;
    }

    //检查当前用户信息必须是roleid >= 4
    if (simUser.value.roleid < 4) {
        router.push('/');
    }

    const request = simUserRequestFactory(simUser.value.token, simUser.value.sk);
    const fetchPostWithSign = async (url, data, type = "normal") => {
        if (type !== "normal") {
            message.error("type 的其他取值仅供 CCBC 13/14 特殊功能使用，目前已经弃用。在新项目中请不要再使用了。");
            return;
        }

        return request.request({
            url: "/v1" + url,
            method: "POST",
            data
        });
    }
    const puzzleBackend = puzzleBackendFactory(request);
    const puzzleVuePlugin = {
        install(app) {
            app.provide('service', request);
            app.provide('api', fetchPostWithSign);
            app.provide('ysync', ySyncDocs);
            app.provide('message', message);
            app.provide("adjustTextColor", adjustTextColor);
            app.provide("formatTimestamp", dateFormat);
            app.provide("markdownToHtml", markdownToHtml);
            app.provide("sleep", sleep);
            app.provide("backend", puzzleBackend);
        }
    }

    //连接ySync
    ySyncDocs.userInfo = simUser.value;
    ySyncDocs.connect(simUser.value.token).then(() => {
        console.log("ySync 连接成功");
        //加载题目信息
        loadPuzzleDetail(request, puzzleVuePlugin);
    }).catch((err) => {
        console.error("ySync 连接失败", err);
    });

    
});

onBeforeUnmount(() => {
    // 移除事件监听器
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    
    ySyncDocs.disconnect();
});


const renderedHtml = ref('');
const renderedExtendHtml = ref('');

const loadPuzzleDetail = async (request,puzzleVuePlugin) => {
    let data = await request({
        url: '/v1/play/get-detail',
        method: 'post',
        data: {
            pid: pid.value,
        }
    });

    if (data.status === 1 && data.puzzle) {
        Object.assign(puzzle, data.puzzle);

        if (puzzle.content) {
            renderedHtml.value = markdownToHtml(puzzle.content);
        }

        if (puzzle.extend_content) {
            renderedExtendHtml.value = markdownToHtml(puzzle.extend_content);
        }

        //HTML
        if (puzzle.type === 1) {
            let html = puzzle.html;
            puzzle.html = html.replace(/<script.*?>([\s\S]+?)<\/script>/g, (_, js) => {
                nextTick(() => {
                    let htmlContainer = document.getElementById("puzzleHtml");
                    if (htmlContainer) {
                        let script = document.createElement("script");
                        script.innerHTML = js;
                        htmlContainer.appendChild(script);
                    }
                });

                return "";
            });
        }
        //VUE
        else if (puzzle.type === 2 || puzzle.type === 3) {
            let script = puzzle.script;
            let template = "";
            let style = "";

            if (puzzle.type === 2) {
                let html = puzzle.html;
                let { descriptor } = vueSfcParser(html);
                template = descriptor.template?.content || "";
                style = descriptor.styles[0]?.content || "";
            } else if (puzzle.type === 3) {
                let vueResponse = await fetch(script);
                let vueContent = await vueResponse.text();
                let { descriptor } = vueSfcParser(vueContent);
                template = descriptor.template?.content || "";
                style = descriptor.styles[0]?.content || "";
                script = descriptor.script?.content || "";
            }

            puzzle.script = "";
            nextTick(() => {
                script = script.replace(/export default/g, "return ");
                let __vue_script__ = new Function(script)();
                __vue_script__.template = template;

                let __vue_app__ = Vue.createApp(__vue_script__);
                __vue_app__.use(puzzleVuePlugin);
                //执行安装钩子
                if (__vue_script__.ccxcPuzzleAppConfig) {
                    if (__vue_script__.ccxcPuzzleAppConfig.onAppInit) {
                        __vue_script__.ccxcPuzzleAppConfig.onAppInit(__vue_app__);
                    }
                }
                //挂载
                __vue_app__.mount("#puzzleVueApp");

                //注入style
                let puzzleAppContainer = document.getElementById("puzzleVue");
                if (!puzzleAppContainer) return;
                let styleElement = document.createElement("style");
                styleElement.innerHTML = style;
                puzzleAppContainer.appendChild(styleElement);
            });
        }
    }

    
}


window["Vue"] = Vue;
</script>