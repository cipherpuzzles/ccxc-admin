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

// 获取题目列表
export function getPuzzleList() {
  return request({
    url: '/v1/admin/get-puzzle',
    data: {}
  });
}

// 删除题目
export function deletePuzzle(pid) {
  return request({
    url: '/v1/admin/delete-puzzle',
    data: { pid }
  });
}

// 交换题目PID
export function swapPuzzlePids(pid1, pid2) {
  return request({
    url: '/v1/admin/swap-pids',
    data: { pid1, pid2 }
  });
} 