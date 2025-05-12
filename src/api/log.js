import request from '@/utils/request';

// 获取登录日志列表
export function getLoginLogs(params) {
  return request({
    url: '/v1/admin/query-login-log',
    data: params
  });
}

// 获取答案记录列表
export function getAnswerLogs(params) {
  return request({
    url: '/v1/admin/query-answer-log',
    data: params
  });
}

// 获取用户和题目列表用于下拉菜单
export function getSelectItems() {
  return request({
    url: '/v1/admin/get-user-list',
    data: {}
  });
} 