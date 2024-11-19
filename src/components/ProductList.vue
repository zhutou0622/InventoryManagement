<template>
    <div class="product-list">
      <h2>库存产品列表</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>产品名称</th>
            <th>描述</th>
            <th>数量</th>
            <th>价格</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.description }}</td>
            <td>{{ product.quantity }}</td>
            <td>{{ product.price }}</td>
            <td>
              <button @click="editProduct(product)">编辑</button>
              <button @click="deleteProduct(product.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  const db = require('../database/db')
  
  const products = ref([])
  
  const loadProducts = () => {
    const stmt = db.prepare('SELECT * FROM products')
    products.value = stmt.all()
  }
  
  const deleteProduct = (id) => {
    const stmt = db.prepare('DELETE FROM products WHERE id = ?')
    stmt.run(id)
    loadProducts()
  }
  
  onMounted(() => {
    loadProducts()
  })
  </script>
  
  <style scoped>
  .product-list {
    padding: 20px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  
  button {
    margin: 0 5px;
    padding: 5px 10px;
  }
  </style>