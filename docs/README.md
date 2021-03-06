# 概述

Ralltiir 前端极速浏览框架，是一种前端异步单页技术。
点击超链接或浏览器跳转时，异步地获取数据并将内容展现给用户。
以此来减少用户等待时间，以及提高页面渲染速度。

与 MVC 框架不同的是，Ralltiir Application 可以载入传统的 Web 页面只需稍加修改。
通过适当的服务器配置，还可以实现跨域的单页异步。

## 异步渲染

Ralltiir 将同步的页面打开过程异步化，来减少用户等待和提供渲染优化的可能。

## 整体架构

Ralltiir 是由一系列技术构成的解决方案，为了最大限度地灵活和通用
Ralltiir 采取分层设计，产品方可通过编写 Service 来控制具体的页面入场、渲染和退场行为。
Ralltiir 整体架构中包括低层的 AMD 环境、 Ralltiir 框架核心。

