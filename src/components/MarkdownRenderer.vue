<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script setup>
import { computed } from 'vue';
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

const props = defineProps({
  content: {
    type: String,
    required: true
  }
});

// 配置marked选项
marked.setOptions({
  breaks: true,        // 允许回车换行
  gfm: true,           // 允许GitHub风格的Markdown
  headerIds: false,    // 禁用header IDs以避免XSS
  mangle: false        // 禁用mangle以避免XSS
});

// 渲染并净化Markdown内容
const renderedContent = computed(() => {
  if (!props.content) return '';
  const rawHtml = marked(props.content);
  return DOMPurify.sanitize(rawHtml);
});
</script>

<style>
.markdown-content {
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-word;
  line-height: 1.6;
}

.markdown-content p {
  margin-bottom: 16px;
}

.markdown-content h1, 
.markdown-content h2, 
.markdown-content h3, 
.markdown-content h4, 
.markdown-content h5, 
.markdown-content h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
}

.markdown-content img {
  max-width: 100%;
  margin: 8px 0;
}

.markdown-content a {
  color: #1890ff;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content code {
  font-family: monospace;
  padding: 2px 4px;
  font-size: 90%;
  color: #d63200;
  background-color: rgba(0, 0, 0, 0.06);
  border-radius: 3px;
}

.markdown-content pre {
  margin-bottom: 16px;
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #f6f8fa;
  border-radius: 6px;
}

.markdown-content pre code {
  display: block;
  padding: 0;
  color: inherit;
  background-color: transparent;
}

.markdown-content blockquote {
  padding: 0 1em;
  color: #6a737d;
  border-left: 0.25em solid #dfe2e5;
  margin-left: 0;
  margin-right: 0;
}

.markdown-content ul, 
.markdown-content ol {
  padding-left: 2em;
  margin-bottom: 16px;
}

.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.markdown-content table th,
.markdown-content table td {
  padding: 6px 13px;
  border: 1px solid #dfe2e5;
}

.markdown-content table tr {
  background-color: #fff;
  border-top: 1px solid #c6cbd1;
}

.markdown-content table tr:nth-child(2n) {
  background-color: #f6f8fa;
}
</style> 