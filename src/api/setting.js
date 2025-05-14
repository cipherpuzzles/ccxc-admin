import request from '@/utils/request';

// 获取动态数值设置
export function getDynamicNumericalSet() {
  return request({
    url: '/v1/admin/get-dynamic-numerical-set',
    data: {}
  });
}

// 更新动态数值设置
export function updateDynamicNumericalSet(data) {
  return request({
    url: '/v1/admin/update-dynamic-numerical-set',
    data
  });
}

// 更新信用点增速
export function updatePowerIncreaseRate(data) {
  return request({
    url: '/v1/admin/update-power-increase-rate',
    data
  });
}

// 更新自动解锁分区
export function unlockAutoGroup(data) {
  return request({
    url: '/v1/admin/unlock-auto-group',
    data
  });
}

// 为所有队伍解锁下一道题目
export function unlockNextPuzzleForAll(data) {
  return request({
    url: '/v1/admin/unlock-next-puzzle-forall',
    data
  });
}

// 清理缓存
export function purgeCache(op_key) {
  return request({
    url: '/v1/admin/purge-cache',
    data: { op_key }
  });
} 