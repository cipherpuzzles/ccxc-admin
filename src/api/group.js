import request from '@/utils/request';

// 获取组队列表
export function getGroupOverview(order, groupname, page_num, page_size = 10, gid = null) {
  const data = { order, groupname, page_num, page_size };
  if (gid !== null) {
    data.gid = gid;
  }
  return request({
    url: '/v1/admin/get-group-overview',
    data
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

// 移除队伍成员
export function removeGroupMember(gid, uid) {
  return request({
    url: '/v1/admin/remove-group-member',
    data: { gid, uid }
  });
}

// 添加队伍成员
export function addGroupMember(gid, uid, roleid) {
  return request({
    url: '/v1/admin/add-group-member',
    data: { gid, uid, roleid }
  });
}

// 删除队伍
export function deleteGroup(gid) {
  return request({
    url: '/v1/admin/delete-group',
    data: { gid }
  });
}

// 创建队伍
export function createGroup(groupname, profile) {
  return request({
    url: '/v1/admin/create-group',
    data: { groupname, profile }
  });
}

// 更新队伍信息
export function updateGroupProfile(gid, groupname, profile) {
  return request({
    url: '/v1/admin/update-group-profile',
    data: { gid, groupname, profile }
  });
}

// 获取模拟登录会话
export function getSimLoginSession(gid) {
  return request({
    url: '/v1/admin/get-sim-login-session',
    data: { gid }
  });
} 