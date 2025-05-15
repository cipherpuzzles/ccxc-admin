<template>
  <div ref="editorContainer" :style="{ height: `${height}px` }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';
import { loadCustomCompletions, unloadCustomCompletions } from '@/lib/monaco/vueCompletionLoader.js';
import { loadPuzzleScriptCompletions, unloadPuzzleScriptCompletions } from '@/lib/monaco/puzzleScriptCompletionLoader.js';

const props = defineProps({
  value: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'plaintext'
  },
  height: {
    type: Number,
    default: 300
  },
  theme: {
    type: String,
    default: 'vs',
    validator: (value) => ['vs', 'vs-dark', 'hc-black'].includes(value)
  },
  isScriptEditor: {
    type: Boolean,
    default: false
  },
  isPuzzleScriptEditor: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:value']);
const editorContainer = ref(null);
let editor = null;

// 创建编辑器实例
const createEditor = () => {
  if (!editorContainer.value) return;

  editor = monaco.editor.create(editorContainer.value, {
    value: props.value,
    language: props.language,
    theme: props.theme,
    minimap: {
      enabled: false
    },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    wordWrap: 'on',
    automaticLayout: true
  });

  // 监听内容变化
  editor.onDidChangeModelContent(() => {
    const value = editor.getValue();
    emit('update:value', value);
  });

  // 如果是题目脚本编辑器，加载对应的自定义补全
  if (props.isScriptEditor && (props.language === 'javascript' || props.language === 'typescript')) {
    loadCustomCompletions(editor, monaco);
  }

  // 如果是题目后端脚本编辑器，加载对应的自定义补全
  if (props.isPuzzleScriptEditor && (props.language === 'javascript' || props.language === 'typescript')) {
    loadPuzzleScriptCompletions(editor, monaco);
  }
};

// 监听 value 属性变化
watch(() => props.value, (newValue) => {
  if (editor && newValue !== editor.getValue()) {
    editor.setValue(newValue);
  }
});

// 监听 language 属性变化
watch(() => props.language, (newLanguage) => {
  if (editor) {
    monaco.editor.setModelLanguage(editor.getModel(), newLanguage);
  }
});

// 监听 theme 属性变化
watch(() => props.theme, (newTheme) => {
  if (editor) {
    monaco.editor.setTheme(newTheme);
  }
});

onMounted(() => {
  createEditor();
});

onBeforeUnmount(() => {
  if (editor) {
    // 如果是题目脚本编辑器，移除自定义补全
    if (props.isScriptEditor) {
      unloadCustomCompletions(editor);
    }
    
    // 如果是题目后端脚本编辑器，移除自定义补全
    if (props.isPuzzleScriptEditor) {
      unloadPuzzleScriptCompletions(editor);
    }
    
    editor.dispose();
  }
});
</script> 