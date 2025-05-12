import request from '@/utils/request';

export function getOverviewData() {
  return request({
    url: '/v1/admin/overview',
    data: {}
  });
} 