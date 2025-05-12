import request from '@/utils/request';
import axios from 'axios';
import { handleResponseStatus } from '@/utils/request';

// 获取上传token
export function getUploadToken(type) {
  return request({
    url: '/v1/admin/upload-prepare',
    data: { type }
  });
}

// 上传文件
export function uploadFile(file, uploadToken, config = {}) {
  const formData = new FormData();
  formData.append('file', file);

  return axios.post(
    `${import.meta.env.VITE_BACKEND_ROOT}/v1/admin/upload-image`,
    formData,
    {
      headers: {
        'Upload-Token': uploadToken,
        'Content-Type': 'multipart/form-data'
      },
      ...config
    }
  ).then(response => {
    return handleResponseStatus(response.data);
  });
} 