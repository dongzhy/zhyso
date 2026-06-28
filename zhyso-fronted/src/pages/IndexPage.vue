<template>
  <div class="index-page">
    <a-input-search
      v-model:value="searchText"
      placeholder="请输入搜索关键词"
      enter-button="搜索"
      size="large"
      @search="onSearch"
    />
    <MyDivider />
    <a-tabs v-model:activeKey="activeKey" @change="onTabChange">
      <a-tab-pane key="post" tab="文章">
        <PostList :post-list="postList" />
      </a-tab-pane>
      <a-tab-pane key="picture" tab="图片">
        <PictureList :picture-list="pictureList" />
      </a-tab-pane>
      <a-tab-pane key="user" tab="用户">
        <UserList :user-list="userList" />
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import PostList from "@/components/PostList.vue";
import PictureList from "@/components/PictureList.vue";
import UserList from "@/components/UserList.vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "ant-design-vue";
import myAxios from "@/plugins/MyAxios";

// 初始化数据列表
const postList = ref<any[]>([]);
const userList = ref<any[]>([]);
const pictureList = ref<any[]>([]);

// 路由相关
const route = useRoute();
const router = useRouter();

// 响应式标签页key（增加默认值容错）
const activeKey = ref<string>((route.params.category as string) || "post");
// 搜索文本（强类型处理）
const searchText = ref<string>((route.query.text as string) || "");

// 搜索参数（抽离为独立响应式对象）
const searchParams = ref({
  type: activeKey.value,
  text: searchText.value,
  pageSize: 10,
  pageNum: 1,
});

/**
 * 加载单类数据（优化版）
 * @param params 搜索参数
 */
const loadData = async (params: {
  type: string;
  text: string;
  pageSize: number;
  pageNum: number;
}) => {
  // 空参数拦截
  if (!params.type) {
    message.error("请选择搜索类别");
    return;
  }

  try {
    // 发起请求（统一入参格式）
    const response = await myAxios.post("/search/all", {
      type: params.type,
      searchText: params.text,
      pageSize: params.pageSize,
      current: params.pageNum,
    });

    // 兼容后端常见的响应格式：{ code:200, data: { ... } }
    const res = response.data || response;

    // 按类别赋值（增加空值兜底）
    switch (params.type) {
      case "post":
        postList.value = res.dataList || res.dataList || [];
        break;
      case "user":
        userList.value = res.dataList || res.dataList || [];
        break;
      case "picture":
        pictureList.value = res.dataList || res.dataList || [];
        break;
      default:
        message.warning(`不支持的搜索类别：${params.type}`);
        break;
    }

    // 调试日志（方便定位问题）
    console.log(`【${params.type}】加载数据：`, res);
  } catch (error) {
    // 错误提示优化
    const errMsg = (error as Error).message || "请求失败";
    message.error(`加载${params.type}数据失败：${errMsg}`);
    console.error("请求异常详情：", error);
    // 出错时清空对应列表，避免旧数据残留
    if (params.type === "post") postList.value = [];
    if (params.type === "user") userList.value = [];
    if (params.type === "picture") pictureList.value = [];
  }
};

/**
 * 手动触发搜索（解决搜索按钮点击逻辑）
 */
const onSearch = (value: string) => {
  // 同步搜索框文本
  searchText.value = value.trim();
  // 路由跳转（确保路径和参数正确）
  router.push({
    path: `/${activeKey.value}`, // 路径对应当前标签
    query: { text: searchText.value }, // 只传搜索关键词
  });
};

/**
 * 标签页切换事件
 */
const onTabChange = (key: string) => {
  // 同步标签key
  activeKey.value = key;
  // 路由跳转（保留搜索文本）
  router.push({
    path: `/${key}`,
    query: { text: searchText.value },
  });
};

/**
 * 监听路由变化（替代watchEffect，避免重复触发）
 */
watch(
  [() => route.params.category, () => route.query.text],
  ([newCategory, newText], [oldCategory, oldText]) => {
    // 只有参数真正变化时才更新（避免重复请求）
    if (newCategory !== oldCategory || newText !== oldText) {
      // 更新响应式参数
      activeKey.value = (newCategory as string) || "post";
      searchText.value = (newText as string) || "";
      searchParams.value = {
        ...searchParams.value,
        type: activeKey.value,
        text: searchText.value,
      };
      // 重新加载数据
      loadData(searchParams.value);
    }
  },
  { immediate: true } // 初始化时执行一次
);

// 页面挂载时确保数据加载（兜底）
onMounted(() => {
  loadData({
    type: activeKey.value,
    text: searchText.value,
    pageSize: 10,
    pageNum: 1,
  });
});
</script>
