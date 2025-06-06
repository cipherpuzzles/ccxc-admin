import request from '@/utils/request';

// 获取插件列表
export function getPluginList() {
  return request({
    url: '/v1/admin/list-plugins',
    data: {}
  });
}

// 重新扫描插件目录
export function reloadPluginInfo() {
  return request({
    url: '/v1/admin/reload-plugin-info',
    data: {}
  });
}

// 设置插件激活状态
export function setPluginStatus(plugin_name, status) {
  return request({
    url: '/v1/admin/set-plugin-status',
    data: { plugin_name, status }
  });
}

// 获取插件前端组件列表
export function getFrontendPlugins() {
  return request({
    url: '/v1/admin/get-frontend-plugins',
    data: {}
  });
}