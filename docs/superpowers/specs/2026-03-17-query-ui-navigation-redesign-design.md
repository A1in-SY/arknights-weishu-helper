# 卫戍协议查询页导航与展示重构设计

## 1. 目标

把当前围绕“三栏同屏”实现的查询工具，重构成一套更稳定的前端应用结构：

- PC 端使用两个主页面：
  - 干员列表页
  - 编队列表页
- 移动端使用真正的分屏流程，而不是仅靠响应式把同一页挤窄
- 保留当前已经支持的真实功能和数据内容，不为了贴合原型图删减已有能力
- 降低后续继续维护查询、编队、详情、弹层逻辑的成本

本次改动的核心不是导出数据，而是前端的信息架构、导航状态和展示层重组。

## 2. 非目标

本次明确不做以下事情：

- 不修改 `src/export/*` 导出逻辑
- 不调整 `data/*` 的产物结构
- 不改变已经保存到本地存储中的编队数据结构
- 不引入后端服务
- 不把原型图中不存在的数据硬造出来

允许为长期维护性重写整个 `web/` 前端层，但不以引入框架为前提。

## 3. 总体方案

推荐方案是：**保留单页应用形态，但重写前端层，显式引入导航状态。**

理由：

- 现有业务状态已经基本够用，主要问题在于旧 UI 是围绕同屏三栏长出来的
- 如果拆成多个静态页面，筛选状态、返回逻辑、选中态和编队上下文都会散掉
- 当前工具规模仍然适合原生模块化 JavaScript；直接引入框架会增加工具链和依赖维护面

因此本次采用：

- 原生 HTML / CSS / JavaScript
- 单入口页面
- 显式导航状态驱动桌面与移动端不同视图
- 允许按新结构重写 `web/` 模块

## 4. 状态模型

### 4.1 保留的业务状态

- `queryState`
  - 干员搜索条件
  - 筛选条件
- `formationsState`
  - 编队数据本身
  - 每个编队的名称、备注、策略、干员槽位、转职盟约等持久化内容

本次重构中：

- `queryState` 不再持有“当前选中干员”
- `formationsState` 不再持有“当前选中编队”或“当前选中槽位”
- 不保留全局 `detailTarget`

运行时的“当前看谁、选中谁、正在显示哪个详情”，统一由新的 `viewState` 持有。

换句话说：

- 业务状态负责“有什么数据”
- 视图状态负责“现在正在看哪条数据”
- 可见结果属于渲染时派生数据，不持久存入业务状态

### 4.2 新增的视图状态

新增 `viewState`，作为本次重构的核心。

它至少需要表达：

- `mode`
  - `operators`
  - `formations`
- `operatorsView`
  - `desktopFrame`
    - `selectedOperatorKey`
    - `resultsScrollTop`
  - `mobileStack`
    - `{ screen: 'operatorList', scrollTop }`
    - `{ screen: 'operatorDetail', operatorKey, scrollTop }`
- `formationsView`
  - `desktopFrame`
    - `selectedFormationId`
    - `selectedEntryId`
    - `listScrollTop`
    - `detailScrollTop`
  - `mobileStack`
    - `{ screen: 'formationList', scrollTop }`
    - `{ screen: 'formationDetail', formationId, scrollTop, overlay: null | 'strategyPicker' }`
    - `{ screen: 'formationOperatorDetail', formationId, entryId, scrollTop }`

设计约束：

- `desktop/mobile` 不写入 `viewState`
  - 由媒体查询或窗口宽度实时推导
- 业务状态里不再保存运行时选中对象
- 桌面端和移动端各自拥有自洽的视图工作区快照
  - 桌面端看谁，由 `desktopFrame` 决定
  - 移动端看谁，由 `mobileStack` 栈顶决定
  - 这两套快照允许不同步，并且切换视口时各自恢复上次状态
- 从一个主模式切到另一个主模式时，不销毁对方已有导航上下文
- 用户切回原主模式时，应回到该主模式此前保存的视图快照
- `mobileStack` 是真正的 push/pop 栈
  - 进入子屏时 `push`
  - 返回时 `pop`
  - 当前屏永远取栈顶
- 根栈不变量：
  - `operatorsView.mobileStack` 初始且最少始终保留一个 `operatorList`
  - `formationsView.mobileStack` 初始且最少始终保留一个 `formationList`
  - 根栈不允许被 pop 掉
- 每个工作区内部只能有一份选中对象定义
  - 桌面端不再额外参考移动端栈帧中的对象
  - 移动端不再额外参考桌面端 frame 中的对象
- 移动端每一层详情栈帧必须自描述
  - `formationOperatorDetail` 自己持有 `formationId + entryId`
  - 不允许依赖父帧偷偷提供详情目标
  - 从 `formationOperatorDetail` 返回 `formationDetail` 时，不保留槽位高亮

规范化规则：

- 干员模式
  - 桌面端 `desktopFrame.selectedOperatorKey` 无效时：
    - 还有可见干员则自动切到第一项
    - 否则置空并显示空状态
  - 移动端栈顶如果是 `operatorDetail` 且 `operatorKey` 无效时：
    - 还有可见干员则把栈顶替换成第一项对应的 `operatorDetail`
    - 否则降级回 `operatorList`
- 编队模式
  - 桌面端 `desktopFrame.selectedFormationId` 无效时：
    - 还有剩余编队则切到第一项
    - 否则置空
  - 桌面端 `desktopFrame.selectedEntryId` 允许长期为空
    - 为空时右栏显示“选择一个槽位查看干员详情”
    - 不自动补第一项
  - 桌面端 `desktopFrame.selectedEntryId` 非空但失效时：
    - 直接置空
    - 右栏回到“选择一个槽位查看干员详情”
  - 移动端栈顶如果是 `formationDetail` 且 `formationId` 无效时：
    - 还有剩余编队则降级回 `formationList`
    - 否则降级回 `formationList`
  - 移动端栈顶如果是 `formationOperatorDetail`：
    - `formationId` 无效时，降级回 `formationList`
    - `entryId` 无效但 `formationId` 仍有效时，降级回对应的 `formationDetail`
- 整栈清洗规则：
  - 任何对象删除或失效后，不只修栈顶
  - 必须从栈底到栈顶遍历整条 `mobileStack`
  - 按固定规则清洗：
    - `operatorDetail` 失效：替换成第一项对应的 `operatorDetail`；若无结果则替换为根 `operatorList`
    - `formationDetail` 失效：替换为根 `formationList`
    - `formationOperatorDetail` 的 `formationId` 失效：替换为根 `formationList`
    - `formationOperatorDetail` 的 `entryId` 失效：替换为同编队的 `formationDetail`
  - 清洗后若栈为空，补回根栈帧

### 4.3 新增的轻量弹层状态

新增一套统一的 `popoverState`，负责盟约气泡。

它至少需要表达：

- 当前是否打开
- 当前打开的是哪个盟约
- 纯数据定位信息，例如 `anchorRect`
- `hostKey`
  - 触发该气泡的宿主视图和触发源标识
  - 例如：
    - `operators:desktop:detail:bond:lateranoShip`
    - `formations:desktop:summary:formation-1:bond:lateranoShip`
    - `formations:mobile:detail:formation-1:bond:lateranoShip`

同一时间只允许一个盟约气泡打开。

设计约束：

- `popoverState` 不保存 DOM 节点引用
- `hostKey` 用来区分“同一个盟约在不同位置被点击”这种情况
  - 点击相同 `hostKey` 视为切换开关
  - 点击不同 `hostKey` 视为关闭旧气泡并在新位置打开
- 盟约气泡的关闭由统一的页面控制器负责
  - 不允许把 `closePopover()` 逻辑散落到各个渲染模块里
- 各宿主视图只负责发出统一的“宿主已失效”事件
  - 例如重渲染、卸载、切屏前通知控制器
  - 真正的关闭动作仍由统一控制器完成
- 同一次交互里如果同时发生“打开气泡”和“宿主失效/打开 overlay/切屏”，关闭优先
- 只要宿主视图发生切换、重渲染、返回、视口变化或触发项被卸载，气泡必须立即关闭
- 任意窗口滚动、容器滚动或普通 resize 发生时，当前气泡也必须立即关闭，不做位置重算
- 打开任何局部覆盖层前，必须先关闭当前盟约气泡

## 5. 页面结构

## 5.1 PC 端

### 干员列表页

布局固定为三列：

- 左栏：筛选区
- 中栏：干员结果区
- 右栏：干员详情区

规则：

- 左栏保留当前已支持的全部筛选，不因原型图简化而删减
- 中栏改成卡片网格
- 右栏默认显示当前选中干员详情
- 点击盟约时，不切换右栏详情；改为在点击位置附近弹出盟约气泡
- 点击气泡外区域关闭气泡

空状态规则：

- 首次进入且没有可见干员时，右栏显示“没有符合条件的干员”
- 首次进入且存在可见干员时，`operatorsView.desktopFrame.selectedOperatorKey` 自动指向第一项
- 如果筛选后当前选中干员已不在可见结果中，按 `operatorsView` 的规范化规则处理

### 编队列表页

布局固定为三列：

- 左栏：编队列表
- 中栏：编队详情区
- 右栏：干员详情区

规则：

- 中栏负责展示和编辑当前编队：
  - 编队名称
  - 备注
  - 当前策略展示
  - 策略选择入口
  - 九宫格槽位
  - 盟约摘要
- 右栏固定显示当前选中槽位的干员详情
- 点击盟约摘要时，在附近弹出盟约气泡，不抢占右栏
- 策略的选择和展示都留在中栏完成

空状态规则：

- 没有当前编队时，中栏显示“先新建编队”，右栏显示空状态
- 当前编队存在但没有选中槽位时，右栏显示“选择一个槽位查看干员详情”
- 当前槽位为空或槽位对应干员无效时，按 `formationsView` 的规范化规则处理

## 5.2 移动端

移动端使用真正的分屏流程，不复用桌面三列布局。

### 干员流

- `干员列表页`
- `干员详情页`

规则：

- 列表页显示搜索、筛选和干员卡片
- 点击干员时：
  - 直接向 `operatorsView.mobileStack` `push` 一个带该干员 `operatorKey` 的 `operatorDetail`
- 干员详情中的盟约点击后在附近弹出盟约气泡
- 点击气泡外区域关闭气泡
- 盟约不再成为单独移动端页面

### 编队流

- `编队列表页`
- `编队详情页`
- `干员详情页`

规则：

- 编队列表页每个卡片右上角有删除按钮
- 点击卡片主体进入编队详情页时：
  - 直接向 `formationsView.mobileStack` `push` 一个带该编队 `formationId` 的 `formationDetail`
- 删除规则：
  - 删除后留在 `编队列表页`
  - 如果删除的不是当前选中编队，只刷新列表
  - 如果删除的是当前选中编队：
    - 桌面端：
      - 还有其他编队时，`desktopFrame.selectedFormationId` 切到第一项，`desktopFrame.selectedEntryId` 置空
      - 没有剩余编队时，两个字段都置空
    - 移动端：
      - 清洗整条 `mobileStack`
      - 任何依赖被删编队的帧都删除
      - 清洗后统一回到 `formationList`
- 编队详情页中：
  - 只有点击干员格子才进入干员详情页
    - 再向 `formationsView.mobileStack` `push` 一个带当前 `formationId` 和目标 `entryId` 的 `formationOperatorDetail`
    - 返回 `formationDetail` 后不保留刚才的槽位高亮
  - 策略在选定后常驻展示其信息
  - 再次点击策略区域时，在当前 `编队详情页` 内打开策略选择底部弹层
  - 点击盟约后只弹出气泡，不进入独立详情页

## 6. 内容映射原则

原型图只决定视觉层级和布局方向，不决定字段白名单。

真实展示内容以当前项目已经支持的数据为准。

例如：

- 干员筛选不仅保留搜索、职业、阶级，也保留当前已有的：
  - 分支
  - 特质触发时机
  - 盟约多选
- 干员详情继续展示当前支持的：
  - 基础信息
  - 盟约
  - 卫戍特质
  - 阶段特质
- 编队页继续保留：
  - 备注
  - 策略
  - 转职盟约
  - 满足/未满足盟约摘要

## 7. 交互规则

### 7.1 主模式切换

- PC 和移动端都保留两个主模式：
  - 干员列表
  - 编队列表
- 切换主模式时保留各自上下文
  - 干员页保留搜索、筛选和 `operatorsView`
  - 编队页保留编队数据和 `formationsView`
- 移动端切换主模式时：
  - 不共享各自的 `mobileStack`
  - 不重置另一个主模式的视图快照
  - 切回时恢复到该主模式上次离开时的视图快照
  - 同时关闭当前盟约气泡，并清空当前栈顶上的 `overlay`

### 7.2 盟约气泡

盟约详情统一改成轻量弹层，而不是占用主详情区或独立页面。

气泡内容至少包括：

- 盟约名
- 分类
- 触发人数
- 盟约效果描述

交互要求：

- 点击盟约项打开气泡
- 再次点击同一盟约时关闭
- 点击其他盟约时切换到新的气泡
- 点击气泡外部时关闭
- 同一时刻最多一个气泡

以下情况一律强制关闭当前气泡：

- 切换主模式
- 切换移动端分屏
- 返回上一屏
- 视口在 `desktop/mobile` 间切换
- 任意窗口滚动
- 任意容器滚动
- 普通 resize
- 列表或详情重渲染导致触发项消失
- 当前编队、当前干员或当前上下文变化导致原气泡目标失效
- 打开策略选择弹层

### 7.3 策略展示与重选

策略不再作为移动端主流程中的独立详情页。

要求：

- 在编队详情中常驻展示当前已选策略的信息
- 点击该区域时，在当前 `编队详情页` 上打开底部策略选择弹层
- 关闭或选择完成后，仍停留在 `编队详情页`
- 策略选择弹层不写入独立 route，而是挂在当前 `formationDetail` 栈帧的 `overlay` 字段上
- `overlay` 只允许在移动端 `formationDetail` 屏打开
  - 一旦主模式切换、视口切换、返回、或栈顶不再是 `formationDetail`，必须立即清空
- 返回键优先级高于历史栈：
  - 如果当前 `formationDetail` 栈帧上的 `overlay` 处于打开状态，先关闭弹层
  - 只有当没有局部覆盖层打开时，才允许 pop `mobileStack`

### 7.4 返回逻辑

移动端所有分屏返回必须依赖各自主模式自己的 `mobileStack`，而不是靠临时布尔值硬拼。

要求：

- 返回后恢复上一屏的视图快照
- 列表状态、滚动位置和选中态必须保留
- 干员流和编队流的返回栈彼此独立
- 滚动位置归属：
  - 滚动位置属于各自的视图快照
  - 进入新屏前保存当前快照的 `scrollTop`
  - 返回时恢复被激活快照自己的 `scrollTop`
- 状态转移优先级：
  - 先关闭当前栈帧上的 `overlay`
  - 再 pop `mobileStack`
  - 最后按规范化规则修正当前工作区的选中对象
- 根页返回规则：
  - 当 `mobileStack` 只剩根页且无 overlay 时，前端不拦截
  - 交给浏览器/系统默认返回行为

### 7.5 最小状态转移表

| 触发事件 | 结果 |
| --- | --- |
| 移动端列表进入详情 | 先按目标对象 `push` 新栈帧，再渲染详情 |
| 移动端返回键，且当前栈帧 `overlay` 打开 | 只关闭当前栈帧 `overlay`，不 pop 栈 |
| 移动端返回键，且无 overlay | pop 一层 `mobileStack`，恢复上一屏滚动位置 |
| 移动端返回键，且已在根页 | 前端不拦截，交给浏览器/系统默认行为 |
| 主模式切换 | 保留两个主模式自己的视图快照，但关闭当前气泡并清空当前栈帧 `overlay` |
| 视口切换 | 保留桌面/移动各自快照，但关闭当前气泡并清空当前栈帧 `overlay` |
| 删除当前选中编队，且仍有剩余编队 | 桌面端切到第一项并清空槽位选中；移动端清洗整条栈后回到 `formationList` |
| 删除当前选中编队，且无剩余编队 | 桌面端清空编队选择；移动端清洗整条栈后重置为仅含 `formationList` 的栈 |
| 打开策略选择弹层 | 先关闭当前盟约气泡，再把当前 `formationDetail` 栈帧的 `overlay` 设为打开 |

## 8. 实现边界

### 8.1 允许修改的范围

- `web/index.html`
- `web/styles.css`
- `web/app.mjs`
- `web/app-state.mjs`
- `web/render-view.mjs`
- `web/formation-panel.mjs`
- 以及为新结构新增的前端模块文件

### 8.2 不允许破坏的范围

- `src/export/*`
- `data/*`
- 已保存数据结构
- 现有本地持久化的基本行为

## 9. 测试与验证

本次重构后需要重点验证：

### 9.1 自动测试

- 干员查询状态不退化
- 编队状态不退化
- 新导航状态的切换与返回
- 盟约气泡的开关逻辑
- 编队页策略展示与重选逻辑

### 9.2 人工检查

- PC 干员列表页布局与交互
- PC 编队列表页布局与交互
- 移动端干员流切换与返回
- 移动端编队流切换与返回
- 点击气泡外关闭
- 切换主模式后上下文仍在

## 10. 决策总结

本次前端改造的最终决策是：

- 可以重写整个 `web/` 层
- 不需要引入前端框架
- 重点重建导航状态、视图组织和盟约弹层系统
- 所有真实内容继续由当前导出数据驱动

这比继续在旧三栏页面上缝补更可靠，也比为了“现代化”盲目引入框架更实际。
