import axios from 'axios';
import CryptoJS from 'crypto-js';
import { useUserStore } from '@/stores/user';

let collaborationBaseURL = null;

// 生成签名 (与request.js相同的方法)
function generateSign(token, sk, ts, data) {
  const dataBody = JSON.stringify(data);
  const unsignedString = `token=${token}&ts=${ts}&bodyString=${dataBody}`;
  return CryptoJS.HmacSHA1(unsignedString, sk).toString(CryptoJS.enc.Base64);
}

// 获取协作管理的BaseURL
export async function getCollaborationBaseURL() {
  if (collaborationBaseURL) {
    return collaborationBaseURL;
  }
  
  try {
    const response = await axios.get(import.meta.env.VITE_BACKEND_ROOT + '/v1/get-sso-prefix');
    const wsPrefix = response.data.ws_prefix;
    
    // 将 ws:// 或 wss:// 替换成 http:// 或 https://
    if (wsPrefix.startsWith('wss://')) {
      collaborationBaseURL = wsPrefix.replace('wss://', 'https://');
    } else if (wsPrefix.startsWith('ws://')) {
      collaborationBaseURL = wsPrefix.replace('ws://', 'http://');
    } else {
      collaborationBaseURL = wsPrefix;
    }
    
    return collaborationBaseURL;
  } catch (error) {
    console.error('获取协作管理BaseURL失败:', error);
    throw error;
  }
}

// 创建协作管理的axios实例
const createCollaborationRequest = async () => {
  const baseURL = await getCollaborationBaseURL();
  const instance = axios.create({
    baseURL,
    timeout: 15000,
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 添加请求拦截器，使用与request.js相同的签名逻辑
  instance.interceptors.request.use(
    (config) => {
      const userStore = useUserStore();
      const { token, sk } = userStore;
      const ts = Date.now();
      const sign = generateSign(token, sk, ts, config.data || {});
      
      config.headers['User-Token'] = token;
      config.headers['X-Auth-Token'] = `Ccxc-Auth ${ts} ${sign}`;
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return instance;
};

// 获取所有文档
export async function getAllDocs() {
  const request = await createCollaborationRequest();
  const response = await request.post('/admin/getAllDocs', {});
  return response.data;
}

// 根据名称删除文档
export async function deleteDocByName(docName) {
  const request = await createCollaborationRequest();
  const response = await request.post('/admin/deleteDocByName', { docName });
  return response.data;
}

// 删除所有文档
export async function deleteAllDocs() {
  const request = await createCollaborationRequest();
  const response = await request.post('/admin/deleteAllDocs', {});
  return response.data;
} 