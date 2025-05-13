import request from '@/utils/request';

// 获取题目分区列表
export function getPuzzleGroups() {
  return request({
    url: '/v1/admin/get-puzzle-group',
    data: {}
  });
} 

// 新建题目分区
export function addPuzzleGroup(pg_name, pg_desc, is_hide) {
  return request({
    url: '/v1/admin/add-puzzle-group',
    data: { pg_name, pg_desc, is_hide }
  });
}

// 编辑题目分区
export function editPuzzleGroup(pgid, pg_name, pg_desc, is_hide) {
  return request({
    url: '/v1/admin/edit-puzzle-group',
    data: { pgid, pg_name, pg_desc, is_hide }
  });
}

// 删除题目分区
export function deletePuzzleGroup(pgid) {
  return request({
    url: '/v1/admin/delete-puzzle-group',
    data: { pgid }
  });
} 