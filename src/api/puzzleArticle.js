import request from '@/utils/request';

// 获取题目文章列表
export function getPuzzleArticleList() {
  return request({
    url: '/v1/list-puzzle-article',
    data: {}
  });
}

// 新建题目文章
export function addPuzzleArticle(key, title, content, is_hide) {
  return request({
    url: '/v1/admin/add-puzzle-article',
    data: { key, title, content, is_hide }
  });
}

// 编辑题目文章
export function editPuzzleArticle(paid, key, title, content, is_hide) {
  return request({
    url: '/v1/admin/edit-puzzle-article',
    data: { paid, key, title, content, is_hide }
  });
}

// 删除题目文章
export function deletePuzzleArticle(paid) {
  return request({
    url: '/v1/admin/delete-puzzle-article',
    data: { paid }
  });
} 