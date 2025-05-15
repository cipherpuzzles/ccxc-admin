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

// 新建题目
export function addPuzzle(puzzleData) {
  return request({
    url: '/v1/admin/add-puzzle',
    data: puzzleData
  });
}

// 编辑题目
export function editPuzzle(puzzleData) {
  return request({
    url: '/v1/admin/edit-puzzle',
    data: puzzleData
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

// ==== 附加答案（里程碑）相关 API ====

// 获取附加答案列表
export function getAdditionalAnswers(pid) {
  return request({
    url: '/v1/admin/get-additional-answer',
    data: { pid }
  });
}

// 添加附加答案
export function addAdditionalAnswer(pid, answer, message, extra, not_count) {
  return request({
    url: '/v1/admin/add-additional-answer',
    data: { pid, answer, message, extra, not_count }
  });
}

// 编辑附加答案
export function editAdditionalAnswer(aaid, pid, answer, message, extra, not_count) {
  return request({
    url: '/v1/admin/edit-additional-answer',
    data: { aaid, pid, answer, message, extra, not_count }
  });
}

// 删除附加答案
export function deleteAdditionalAnswer(aaid) {
  return request({
    url: '/v1/admin/delete-additional-answer',
    data: { aaid }
  });
}

// ==== 提示相关 API ====

// 获取提示列表
export function getTips(pid) {
  return request({
    url: '/v1/admin/get-tips',
    data: { pid }
  });
}

// 添加提示
export function addTip(order, pid, title, content, desc, point_cost, unlock_delay) {
  return request({
    url: '/v1/admin/add-tips',
    data: { order, pid, title, content, desc, point_cost, unlock_delay }
  });
}

// 编辑提示
export function editTip(ptid, order, pid, title, content, desc, point_cost, unlock_delay) {
  return request({
    url: '/v1/admin/edit-tips',
    data: { ptid, order, pid, title, content, desc, point_cost, unlock_delay }
  });
}

// 删除提示
export function deleteTip(ptid) {
  return request({
    url: '/v1/admin/delete-tips',
    data: { ptid }
  });
} 