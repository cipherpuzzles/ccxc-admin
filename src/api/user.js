import request from '@/utils/request';

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/v1/admin/get-user',
    data: params
  });
}

// 设置内测用户
export function setBetaUser(uid) {
  return request({
    url: '/v1/admin/set-beta-user',
    data: { uid }
  });
}

// 取消内测用户
export function removeBetaUser(uid) {
  return request({
    url: '/v1/admin/remove-beta-user',
    data: { uid }
  });
}

// 封禁用户
export function setBanUser(uid) {
  return request({
    url: '/v1/admin/set-ban-user',
    data: { uid }
  });
}

// 取消封禁用户
export function removeBanUser(uid) {
  return request({
    url: '/v1/admin/remove-ban-user',
    data: { uid }
  });
}

// 获取轻量级用户列表（用于下拉选择）
export function getLightUserList() {
  return request({
    url: '/v1/admin/get-l-user-list',
    data: {}
  });
}

// 获取组织者列表（管理员和出题组成员）
export function getOrganizerList() {
  return request({
    url: '/v1/admin/get-organizer-list',
    data: {}
  });
}

// 设置组织者角色
export function setOrganizerRole(uid, roleid) {
  return request({
    url: '/v1/admin/set-organizer-role',
    data: { uid, roleid }
  });
} 