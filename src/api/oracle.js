import request from '@/utils/request';

// 获取人工提示列表
export function getOracleList(params) {
  return request({
    url: '/v1/admin/query-oracle',
    data: params
  });
}

// 回复或编辑人工提示
export function replyOracle(params) {
  return request({
    url: '/v1/admin/reply-oracle',
    data: params
  });
} 