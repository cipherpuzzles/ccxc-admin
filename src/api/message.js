import request from '@/utils/request';

// 获取队伍列表
export function getGroupNameList() {
  return request({
    url: '/v1/admin/list-group-name',
    data: {}
  });
}

// 获取站内信列表
export function getMessageList(params) {
  return request({
    url: '/v1/admin/query-message',
    data: params
  });
}

// 获取与指定队伍的消息记录
export function getGroupMessages(gid) {
  return request({
    url: '/v1/admin/query-message-group',
    data: { gid }
  });
}

// 发送消息
export function sendMessage(gid, content) {
  return request({
    url: '/v1/admin/add-message',
    data: { gid, content }
  });
}

// 设置站内信为已读
export function setMessageRead(mid) {
  return request({
    url: '/v1/admin/set-read-message',
    data: { mid }
  });
}

// 删除站内信
export function deleteMessage(mid) {
  return request({
    url: '/v1/admin/delete-message',
    data: { mid }
  });
} 