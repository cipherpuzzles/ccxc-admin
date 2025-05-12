import request from '@/utils/request';

// 获取公告列表
export function getAnnouncementList() {
  return request({
    url: '/v1/admin/get-announcement',
    data: {}
  });
}

// 新建公告
export function addAnnouncement(content, is_hide) {
  return request({
    url: '/v1/admin/add-announcement',
    data: { content, is_hide }
  });
}

// 编辑公告
export function editAnnouncement(aid, content, is_hide) {
  return request({
    url: '/v1/admin/edit-announcement',
    data: { aid, content, is_hide }
  });
}

// 删除公告
export function deleteAnnouncement(aid) {
  return request({
    url: '/v1/admin/delete-announcement',
    data: { aid }
  });
} 