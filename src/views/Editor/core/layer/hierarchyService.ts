import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import {
  registerSingleton,
  InstantiationType,
} from "@/views/Editor/core/instantiation/extensions";
import _ from "lodash";

interface Item {
  key: number;
  zIndex: number;
}
const defaultItem: Item = {
  key: 0,
  zIndex: 0,
};

export const IHierarchyService =
  createDecorator<HierarchyService>("hierarchyService");

/**
 * TODO 临时使用 简单实现，可以优化提高性能。
 * 2024-3-16 leafer-ui预计会对z-index再整体优化一次，到时候根据优化完成的结果再来做修改
 */
export class HierarchyService {
  declare readonly _serviceBrand: undefined;

  private items: Item[];

  constructor() {
    this.items = [];
  }

  // 添加项目
  addItem(item: Item) {
    this.items.push(item);
    this.items = _.sortBy(this.items, "zIndex");
  }

  // 修改元素或添加新元素
  updateOrAddItem(item: Item) {
    const existingItemIndex = _.findIndex(this.items, { key: item.key });
    if (existingItemIndex !== -1) {
      this.items[existingItemIndex] = item;
    } else {
      this.addItem(item);
    }
  }
  // 删除项目
  removeItem(key: number) {
    _.remove(this.items, { key });
  }

  // 获取指定 key 的上一级
  getPreviousLevel(keys: number | number[]): Item {
    const allKeys = Array.isArray(keys) ? keys : [keys];
    const maxZIndexKey = Math.max(
      ...allKeys.map((key) => this.getItemByKey(key)?.zIndex || 0),
    );
    const index = _.findIndex(this.items, (item) => item.zIndex > maxZIndexKey);
    return index !== -1 ? this.items[index] : defaultItem;
  }

  // 获取指定 key 的下一级
  getNextLevel(keys: number | number[]): Item {
    const allKeys = Array.isArray(keys) ? keys : [keys];
    const maxZIndexKey = Math.max(
      ...allKeys.map((key) => this.getItemByKey(key)?.zIndex || 0),
    );
    const index = _.findLastIndex(
      this.items,
      (item) => item.zIndex < maxZIndexKey,
    );
    return index !== -1 ? this.items[index] : defaultItem;
  }

  // 获取顶级
  getTopLevel(): Item {
    return _.last(this.items) || defaultItem;
  }

  // 获取最低级
  getBottomLevel(): Item {
    return _.first(this.items) || defaultItem;
  }

  // 根据 key 获取项目
  private getItemByKey(key: number): Item | undefined {
    return _.find(this.items, { key });
  }
}

registerSingleton(IHierarchyService, HierarchyService, InstantiationType.Eager);

/**
 * Edited mLeaferCanvas.ts
Edited eventbusService.ts
Viewed hierarchyService.ts:6-34
Viewed hierarchyService.ts:1-82

爸爸，[hierarchyService.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/layer/hierarchyService.ts) 定义的服务 [HierarchyService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/layer/hierarchyService.ts#L20) 是编辑器的**“图层层级（z-index）管理器”**。

在图形设计软件（例如 Canvas 画板、Photoshop）中，通常有很多重叠在一起的元素（文字、图片、背景等）。哪个在上面，哪个在下面，全靠 `zIndex` 属性来决定。

[HierarchyService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/layer/hierarchyService.ts#L20) 就是用来**记录、计算和调整这堆图层“谁在谁上面/下面”**的。

---

### 一、 它是怎么工作的？

它在内存里维护了一个列表 `items`（类型为 [Item](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/layer/hierarchyService.ts#L5-L8) 数组），记录着每个图层的标识（`key`）和它的层级高度（`zIndex`）：
```typescript
interface Item {
    key: number;      // 元素的唯一ID
    zIndex: number;   // 元素的层级高度
}
```

每当图层被添加、删除或者被修改时，这个服务就会对列表按照 `zIndex` **从小到大（从底到顶）**进行重新排序。

---

### 二、 它提供了哪些核心能力？

这个服务为编辑器的**“图层上下移动”**提供了算法支持：

1. **`getPreviousLevel(keys)` (查找上一层)**：
   * **作用**：输入一个图层，找到**紧挨着它上方**的那个图层。
   * **场景**：用于实现**“图层上移一层”**的功能。
2. **`getNextLevel(keys)` (查找下一层)**：
   * **作用**：输入一个图层，找到**紧挨着它下方**的那个图层。
   * **场景**：用于实现**“图层下移一层”**的功能。
3. **[getTopLevel](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/layer/hierarchyService.ts#L66-L68) (获取最顶层)**：
   * **作用**：找出当前最上面的图层的 `zIndex`。
   * **场景**：当往画布中添加新元素时，画布会向它询问最顶层高度，然后把新元素的 `zIndex` 设为 `最顶层 + 1`，保证新加入的元素始终在最前面，比如在 [mLeaferCanvas.ts:L433](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L433) 中：
     ```typescript
     const topLevel = this.hierarchyService.getTopLevel().zIndex;
     _child.zIndex = topLevel + 1; // 永远在最上层
     ```
4. **`getBottomLevel()` (获取最底层)**：
   * **作用**：找出最底下的图层，一般用于**“图层置底”**逻辑。

---

### 三、 大白话还原使用例子

比如你选中了画布里的“图片”，想把它**上移一层**，盖在它上面的“文字”上方：

1. 编辑器拦截到你的“上移”点击，调用 `hierarchyService.getPreviousLevel(图片的key)`。
2. 服务在排好序的列表里一查，发现“图片”上方紧挨着的是“文字”（假设图片的 `zIndex` 是 2，文字的 `zIndex` 是 3）。
3. 服务把“文字”的信息丢回给编辑器。
4. 编辑器把图片的 `zIndex` 改成 3，文字的 `zIndex` 改成 2，页面一刷新，“图片”就成功盖在“文字”上面了！
 */
