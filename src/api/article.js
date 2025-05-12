import request from '@/utils/request';

// 获取文章列表
export function getArticleList() {
  return request({
    url: '/v1/list-article',
    data: {}
  });
}

// 新建文章
export function addArticle(order, title, path, content, is_hide) {
  return request({
    url: '/v1/admin/add-article',
    data: { order, title, path, content, is_hide }
  });
}

// 编辑文章
export function editArticle(aid, order, title, path, content, is_hide) {
  return request({
    url: '/v1/admin/edit-article',
    data: { aid, order, title, path, content, is_hide }
  });
}

// 删除文章
export function deleteArticle(aid) {
  return request({
    url: '/v1/admin/delete-article',
    data: { aid }
  });
} 