import request from '@/utils/request';

export function getPerformanceData() {
  return request({
    url: '/v1/admin/performance',
    data: {}
  });
}