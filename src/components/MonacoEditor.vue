<template>
  <div ref="editorContainer" :style="{ height: `${height}px` }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as monaco from 'monaco-editor';

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
    editor.dispose();
  }
});
</script> 