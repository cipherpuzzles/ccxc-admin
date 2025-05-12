import request from '@/utils/request';

// 获取组队列表
export function getGroupOverview(order, groupname, page_num, page_size = 10) {
  return request({
    url: '/v1/admin/get-group-overview',
    data: { order, groupname, page_num, page_size }
  });
}

// 获取题目列表
export function getProblemList() {
  return request({
    url: '/v1/admin/get-p-user-list',
    data: {}
  });
}

// 获取组队详情
export function getGroupDetail(gid) {
  return request({
    url: '/v1/admin/get-group-detail',
    data: { gid }
  });
}

// 修改组队信用点
export function addGroupPowerPoint(gid, power_point) {
  return request({
    url: '/v1/admin/add-group-powerpoint',
    data: { gid, power_point }
  });
}

// 更新组队隐藏状态
export function updateGroupHideStatus(gid, is_hide) {
  return request({
    url: '/v1/admin/update-group-hidestatus',
    data: { gid, is_hide }
  });
} 