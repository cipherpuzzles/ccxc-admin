import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    uid: 0,
    username: '',
    roleid: 0,
    token: '',
    sk: '',
    etc: '',
  }),
  
  actions: {
    setUserInfo(userInfo) {
      this.uid = parseInt(userInfo.uid)
      this.username = userInfo.username
      this.roleid = parseInt(userInfo.roleid)
      this.token = userInfo.token
      this.sk = userInfo.sk
      this.etc = userInfo.etc
    },
    
    clearUserInfo() {
      this.uid = 0
      this.username = ''
      this.roleid = 0
      this.token = ''
      this.sk = ''
      this.etc = ''
    },
    
    isLoggedIn() {
      return this.uid > 0 && this.token
    }
  },
  
  persist: true
}) 