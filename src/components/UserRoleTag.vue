<template>
  <a-tag :color="roleColor">
    {{ roleName }}
  </a-tag>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  roleId: {
    type: Number,
    required: true,
    validator: (value) => [-1, 0, 1, 2, 3, 4, 5].includes(value)
  }
});

const roleMap = {
  '-1': { name: '已封禁', color: 'black' },
  '0': { name: '未激活', color: 'grey' },
  '1': { name: '未报名', color: 'blue' },
  '2': { name: '队员', color: 'green' },
  '3': { name: '队长', color: '#237804' },
  '4': { name: '出题组', color: 'orange' },
  '5': { name: '管理员', color: 'red' },
};

const roleName = computed(() => roleMap[props.roleId]?.name || '未知');
const roleColor = computed(() => roleMap[props.roleId]?.color || 'default');
</script> 