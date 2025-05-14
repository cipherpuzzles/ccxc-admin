import request from '@/utils/request';

// 获取题目脚本列表
export function getPuzzleScriptList() {
  return request({
    url: '/v1/list-puzzle-script',
    data: {}
  });
}

// 新建题目脚本
export function addPuzzleScript(key, desc, script) {
  return request({
    url: '/v1/admin/add-puzzle-script',
    data: { key, desc, script }
  });
}

// 编辑题目脚本
export function editPuzzleScript(psid, key, desc, script) {
  return request({
    url: '/v1/admin/edit-puzzle-script',
    data: { psid, key, desc, script }
  });
}

// 删除题目脚本
export function deletePuzzleScript(psid) {
  return request({
    url: '/v1/admin/delete-puzzle-script',
    data: { psid }
  });
} 