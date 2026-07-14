import {
  App,
  ChildEvent,
  DragEvent,
  DropEvent,
  Frame,
  IUI,
  Leafer,
  PropertyEvent,
  ResizeEvent,
} from "leafer-ui";
import "@leafer-in/view";
import { createDecorator } from "../instantiation/instantiation";
import { ILeafer, IUIInputData } from "@leafer-ui/interface";
import { Ruler } from "leafer-x-ruler";
import { EditTool } from "app";
import { toFixed } from "@/utils/math";
import { SignaturePluginOptions } from "./penDraw";
import { useAppStore, useFontStore } from "@/store";
import {
  IWorkspacesService,
  WorkspacesService,
} from "../workspaces/workspacesService";
import { EventbusService, IEventbusService } from "../eventbus/eventbusService";
import { HierarchyService, IHierarchyService } from "../layer/hierarchyService";
import { addCustomFonts } from "@/utils/fonts/utils";
import { v4 as uuidv4 } from "uuid";
import { BOTTOM_CANVAS_NAME } from "@/views/Editor/utils/constants";
import { EditorEvent } from "@leafer-in/editor";
import { typeUtil } from "../../utils/utils";

type ExtendedOption = {
  width: number;
  height: number;
  name: string;
};

type ObjectType =
  // 官方元素tag
  | "UI"
  | "App"
  | "Leafer"
  | "Frame"
  | "Group"
  | "Box"
  | "Rect"
  | "Image"
  | "SVG"
  | "Canvas"
  | "Text"
  | "Pen"
  | "HTMLText"
  // 自定义元素tag
  | "Image2"
  | "QrCode"
  | "BarCode";

interface Page {
  children: any;
  name?: string;
  id?: string;
  cover?: string;
  height?: number;
  hittable?: undefined;
  pixelRatio?: number;
  tag?: string;
  width?: number;
  scale?: number;
}

export const IMLeaferCanvas = createDecorator<MLeaferCanvas>("mLeaferCanvas");

export class MLeaferCanvas {
  declare readonly _serviceBrand: undefined;

  public activeObject = shallowRef<IUI | null>();

  public extendedData = shallowRef<ExtendedOption>();

  /***
   * 当前页面ID
   */
  public pageId?: string;

  /**
   * 多页面
   */
  private readonly pages: Map<string, Page> = new Map();

  // 画布
  public wrapperEl: any;

  // 主应用
  private _app?: App;
  // 内容层
  private _contentLayer?: ILeafer;

  // 标尺
  public ruler: Ruler;

  // 内容画板
  private _contentFrame: Frame;
  // 操作选项
  private activeTool?: EditTool;

  /**
   * 下面这些可变变量都可以修改成使用成store
   */
  /**
   * 响应式属性
   */
  public readonly ref = {
    zoom: ref(toFixed(this.getZoom(), 2)),
    _children: shallowRef<IUI[]>([]),
    // 是否启用辅助线
    enabledRuler: ref(true),
    // 画笔配置
    penDrawConfig: reactive<SignaturePluginOptions>({
      type: "pen",
      config: {
        stroke: "red",
        strokeWidth: 2,
      },
    }),
  };

  public backgroundColor?: string;

  constructor(
    @IWorkspacesService private readonly workspacesService: WorkspacesService,
    @IEventbusService private readonly eventbus: EventbusService,
    @IHierarchyService private readonly hierarchyService: HierarchyService,
  ) {
    const app = new App({
      width: 800,
      height: 800,
      editor: {
        point: { cornerRadius: 0 },
        middlePoint: {},
        rotatePoint: { width: 16, height: 16 },
        rect: { dashPattern: [3, 2] },
        buttonsDirection: "top",
      },
    });
    // 启用滚动条
    // new ScrollBar(app)
    this.wrapperEl = app.canvas.view;
    this.ruler = new Ruler(app, {
      enabled: this.ref.enabledRuler.value,
      theme: "light",
    });
    const contentLayer = app.tree;
    contentLayer.fill = "transparent";
    // TODO 2023-11-10 等待修复Leafer的fill的功能后放开下面注释启用背景填充
    // contentLayer.fill = {
    //     type:'image',
    //     url:'https://www.toptal.com/designers/subtlepatterns/uploads/white_carbon.png'
    // }
    this._contentLayer = contentLayer;
    this._app = app;
    this.pageId = this.workspacesService.getCurrentId();
    this.initWorkspace();
    this.initPageEditor();
    this.initWatch();
    useFontStore()
      .initFonts()
      .then((value) => {
        addCustomFonts(value);
      });
  }

  private initWatch() {
    const { activeTool } = storeToRefs(useAppStore());
    this.activeTool = activeTool.value;
    // 监听activeTool
    watch(activeTool, (newTool, oldTool) => {
      this.activeTool = newTool;
      if (newTool !== "select") {
        this.discardActiveObject();
      }
    });
  }

  // 工作区 | 页面管理
  private initWorkspace() {
    this.workspacesService.all().forEach((workspace) => {
      this.setPageJSON(workspace.id, {
        children: [],
      });
    });
    this.eventbus.on("workspaceAddAfter", ({ newId }) => {
      this.setPageJSON(newId, {
        children: [],
      });
    });
    this.eventbus.on("workspaceRemoveAfter", (id) => {
      this.pages.delete(id);
    });
    this.eventbus.on("workspaceChangeBefore", ({ oldId }) => {
      if (!oldId || !this.pages.has(oldId)) return;
      const page = this.pages.get(oldId);
      if (!page) return;
      // 切换前保存当前工作区
      this.setPageJSON(oldId, this.contentFrame.toJSON());
      // page.scale = this.contentLayer.scale
      this.contentFrame.clear();
    });
    this.eventbus.on("workspaceChangeAfter", ({ newId }) => {
      // 切换后恢复当前工作区
      if (this.pageId !== newId) {
        useAppStore().activeTool = "select";
        this.discardActiveObject();
        const page = this.pages.get(newId);
        this.pageId = newId;
        if (page) {
          this.importJsonToCurrentPage(page, true);
        }
      }
    });
    this.eventbus.on("workspaceChangeRefresh", ({ newId }) => {
      const json = this.pages.get(newId);
      console.log("json=", json);
      if (json) {
        this.contentFrame.set(json);
      } else {
        this.setPageJSON(newId, this.contentFrame.toJSON());
      }
    });
  }

  // 页面元素编辑器
  initPageEditor() {
    // 创建基础画板
    const frame = new Frame({
      id: uuidv4(),
      name: BOTTOM_CANVAS_NAME,
      width: this.contentLayer.width,
      height: this.contentLayer.height,
      fill: [
        {
          type: "solid",
          color: "#ffffff",
        },
      ],
    });
    this.contentLayer.add(frame);
    this.contentFrame = frame;
    this.setActiveObjectValue(this.contentFrame);

    this.app.editor.on(EditorEvent.SELECT, (arg: EditorEvent) => {
      this.setActiveObjectValue(arg.editor.element);
      // this.ruler.forceRender()
    });
    // 子元素添加事件
    this.contentLayer.on(ChildEvent.ADD, (arg: ChildEvent) => {
      // this.selectObject(arg.target)
      this.childrenEffect();
    });

    // 子元素移除事件
    this.contentLayer.on(ChildEvent.REMOVE, (arg: ChildEvent) => {
      this.childrenEffect();
    });

    // 元素属性事件
    this.contentLayer.on(PropertyEvent.CHANGE, (e2: PropertyEvent) => {
      // 监听最底层画布xy变化 触发布局移动事件（用于辅助线跟随画布移动）
      // @ts-ignore
      if (
        (typeUtil.isBottomCanvas(e2.target as IUI) ||
          typeUtil.isBottomLeafer(e2.target as IUI)) &&
        e2.newValue &&
        ["x", "y"].includes(e2.attrName)
      ) {
        this.eventbus.emit("layoutMoveEvent", e2);
      }
    });

    let initFrameWH = true;
    // resize事件
    this.contentLayer.on(ResizeEvent.RESIZE, (e2: ResizeEvent) => {
      if (initFrameWH) {
        // 第一次初始化画布时设置画布宽高为可视区域大小
        this.contentFrame.width = e2.width;
        this.contentFrame.height = e2.height;
        this.app.tree.zoom("fit");
      }
      this.eventbus.emit("layoutResizeEvent", e2);
      initFrameWH = false;
    });
  }

  private setPageJSON(id: string, json: Partial<Page | IUIInputData | any>) {
    if (id === "") return;
    this.pages.set(id, {
      children: [],
      name: BOTTOM_CANVAS_NAME,
      id: id,
      ...json,
    });
  }

  /**
   * 根据id获取页面的json数据
   * 注意：getPageJSON必须在setCurrentId之后执行，否则要页面中的数据可能还未保存
   * @param id 页面ID
   */
  public getPageJSON(id: string): Page | undefined {
    if (id === this.pageId) {
      return {
        ...this.pages.get(id),
        children: this.ref._children.value,
      };
    }
    return this.pages.get(id);
  }

  /**
   * 获取多页面JSON
   */
  public getPages() {
    this.setPageJSON(this.pageId, this.contentFrame.toJSON());
    return this.pages;
  }

  /**
   * 获取当前页面JSON
   */
  public getCurrentPage(): Page {
    this.setPageJSON(
      this.workspacesService.getCurrentId(),
      this.contentFrame.toJSON(),
    );
    return this.pages.get(<string>this.pageId);
  }

  public activeObjectIsType(...types: ObjectType[]) {
    return types.includes(<ObjectType>this.activeObject.value?.tag);
  }

  /**
   * 导入JSON到当前页中
   * @param json json
   * @param clearHistory 是否清除历史画布数据
   */
  public async importJsonToCurrentPage(json: any, clearHistory?: boolean) {
    if (clearHistory) {
      this.contentFrame.clear();
    }
    console.log("json", json);
    if (json) {
      this.contentFrame.set(json);
      this.discardActiveObject();
      useAppStore().activeTool = "select";
      this.childrenEffect();
    }
    this.zoomToFit();
    useFontStore()
      .extractTemplateFonts(json, true)
      .then((value) => {
        const texts = this.contentFrame.findTag("Text");
        for (let i = 0; i < texts.length; i++) {
          texts[i].forceRender();
        }
        const htmls = this.contentFrame.findTag("HTMLText");
        for (let i = 0; i < htmls.length; i++) {
          htmls[i].forceRender();
        }
      });
  }

  public setActiveObjectValue(object: IUI | null) {
    if (!object) {
      object = this.contentFrame;
    }
    if (this.objectIsTypes(object, "QrCode")) {
      this.app.editor.config.lockRatio = true;
    } else {
      this.app.editor.config.lockRatio = false;
    }
    // setTimeout(()=>{
    this.activeObject.value = object;
    // },200)
  }

  /**
   * 取消选中元素
   */
  public discardActiveObject() {
    this.app.editor.target = null;
    this.setActiveObjectValue(this.contentFrame);
  }

  /**
   * 选中元素
   * @param target
   */
  public selectObject(target: IUI | null) {
    if (this.activeTool === "select") {
      // 选择器
      console.log("选中：", target);
      this.app.editor.target = target;
      console.log("Editor element：", this.app.editor.element);
      this.setActiveObjectValue(this.app.editor.element);
    }
  }

  /**
   * 重新加载json数据（一般用于切换页面）
   * @param json
   */
  public reLoadFromJSON(json: Partial<Page | IUIInputData | any>) {
    this.importJsonToCurrentPage(json, true);
    this.setZoom(json.scale);
  }

  /**
   * 添加元素
   * @param _child 元素
   * @param _index 层级
   */
  public add(_child: IUI, _index?: number) {
    if (this.objectIsTypes(_child, "Group", "Box")) {
      this.bindDragDrop(_child);
    }
    if (!_child.zIndex) {
      const topLevel = this.hierarchyService.getTopLevel().zIndex;
      _child.zIndex = topLevel + 1;
    }
    this.contentFrame.add(_child, _index);

    // 选中提添加的元素
    this.selectObject(_child);
    this.childrenEffect();
  }

  public objectIsTypes(object: any, ...types: ObjectType[]) {
    return types.includes(<ObjectType>object?.tag);
  }

  get contentFrame(): Frame {
    return this._contentFrame;
  }

  set contentFrame(value: Frame) {
    this._contentFrame = value;
  }

  get contentLayer(): Leafer {
    return <Leafer>this._contentLayer;
  }

  set contentLayer(value: Leafer) {
    this._contentLayer = value;
  }

  get app(): App {
    return <App>this._app;
  }

  set app(value: App) {
    this._app = value;
  }

  public getActiveObjects(): IUI[] {
    return this.app.editor.list;
  }

  public getActiveObject() {
    return this.activeObject.value;
  }

  public zoomToInnerPoint(zoom?: number) {
    this.ref.zoom.value = zoom;
    this.app.tree.zoom(zoom);
  }

  public zoomToFit() {
    this.app.tree.zoom("fit");
    this.ref.zoom.value = <number>this.contentLayer.scale;
  }

  public setZoom(scale: number | undefined) {
    this.zoomToInnerPoint(<number>scale);
  }

  public getZoom(): number {
    if (this.contentLayer) {
      return <number>this.contentLayer.scale;
    } else {
      return 1;
    }
  }
  /**
   * 执行调度器 更新_children值
   */
  public childrenEffect() {
    this.ref._children.value = [];
    this.ref._children.value = this.contentFrame.children;
  }

  /**
   * 绑定组的元素拖动放置事件
   * @param group
   */
  public bindDragDrop(group: IUI) {
    const that = this;
    group.on(DragEvent.ENTER, function () {
      DragEvent.setData({ data: "drop data" });
    });
    group.on(DropEvent.DROP, function (e: DropEvent) {
      e.list.forEach((leaf) => {
        if (leaf.innerId !== group.innerId) {
          leaf.dropTo(group); // 放置元素到group中
        }
      });
    });
    group.on(DragEvent.OUT, function (e: DropEvent) {
      if (that.objectIsTypes(e.current, "Group")) {
        e.target.dropTo(e.current.parent);
      }
    });
  }
  public setActiveObjects(objects: IUI[] | undefined) {
    this.app.editor.target = objects;
  }
}

/**
 * Edited type.ts
Edited type.ts
Edited root.ts
Edited index.ts
Edited contextMenu.ts
Viewed mLeaferCanvas.ts:78-105
Viewed mLeaferCanvas.ts:1-647

爸爸，[mLeaferCanvas.ts](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts) 是整个编辑器最核心的画布控制中心。它基于 **[Leafer UI](https://leaferjs.com/)**（一个非常高性能的 2D 绘图引擎）进行封装，扮演着**“画布大管家”**的角色。

下面为您详细剖析 [MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L98) 类的核心设计和具体实现细节：

---

### 一、 核心定位与依赖注入
```typescript
export const IMLeaferCanvas = createDecorator<MLeaferCanvas>('mLeaferCanvas')
```
* **作用**：通过自定义装饰器，将 [MLeaferCanvas](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L98) 注册为一个全局可注入的服务（类似于 VS Code 的依赖注入机制）。
* **消费者**：在其他服务和插件里，只需要声明 `@IMLeaferCanvas private readonly canvas: MLeaferCanvas`，就可以直接操作这个画布实例。

---

### 二、 核心功能模块详细解读

#### 1. 画布底座初始化（Constructor）
在构造函数中，它完成了：
* **实例化 Leafer App**：指定宽高为 800px，并配置编辑控制框（如控制手柄圆角、旋转手柄、辅助虚线等）。
* **挂载标尺 [Ruler](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L124)**：提供刻度和辅助线功能。
* **调用初始化方法**：启动多页面管理（`initWorkspace`）、页面元素监听（`initPageEditor`）和动态字体载入。

#### 2. 响应式状态与数据收集
它在 `ref` 属性和类成员中维护了响应式数据，以便 Vue 组件能感知画布的变化：
* **[activeObject](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L101)**：当前被选中的元素（可以是文字、图片、或者底部的画板本身），右侧面板 `setting.vue` 就是基于这个值来决定显示什么属性设置。
* **`ref.zoom`**：缩放比例。
* **`ref._children`**：画布当前的直接子元素集合（图层管理面板通过它来渲染图层树）。
* **`ref.penDrawConfig`**：画笔（线条）样式，用于手写签名或随手画插件。

#### 3. 工作区与多页面管理器（Workspace / Multi-Page）
核心函数是 [initWorkspace](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L209)。
为了实现“多页面编辑”，它在内存中维护了一个 Map 类型的 `pages` 列表：
* **状态保存**：监听 `workspaceChangeBefore` 事件（切换工作区前），调用 `this.contentFrame.toJSON()` 将当前页面所有图层和缩放比例打包成 JSON 并暂存入 `pages`。
* **状态恢复**：监听 `workspaceChangeAfter` 事件（切换工作区后），通过 [importJsonToCurrentPage](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L465) 清空老画布，重新用 `set(json)` 还原新页面中的元素。

#### 4. 页面元素编辑器交互：[initPageEditor](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L256)
负责监听画布的原始交互事件：
* **选中事件（`EditorEvent.SELECT`）**：用户在画布上点击了某个元素时，自动捕获并执行 `setActiveObjectValue` 更新当前选中状态。
* **子元素变化（`ChildEvent.ADD` / `ChildEvent.REMOVE`）**：当用户拖入/删除了元素，自动调用 `childrenEffect()` 刷新图层数据列表。
* **画布 Resize 监听**：当外层容器大小改变，自适应调整底层画板（Frame）的大小并触发 `layoutResizeEvent`。

#### 5. 元素与选中管理方法
* **`selectObject(target)`**：编程式选中某元素，激活它的编辑控制框。
* **`discardActiveObject()`**：取消所有选中状态，重新将选中框对齐到背景画板上。
* **`add(child, index)`**：将一个新组件（如文字或图片）加入当前页，并根据当前图层顶层高度自动分配一个 `zIndex`。
* **`findObjectById(id)` / `findObjectsByIds(ids)`**：基于 Leafer UI 的查找 API，方便其他组件快速检索元素实例。

#### 6. 进阶交互：容器拖拽放置 [bindDragDrop](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/canvas/mLeaferCanvas.ts#L628)
* 当向画布添加 `Group`（分组）或 `Box`（盒子）类型的容器时，会执行此方法。
* 它绑定了 Leafer 的 `DragEvent` 和 `DropEvent`，允许用户拖动某个图层直接“丢入”组中，或者将其从组中“丢出来”挂载到父级，实现极好的交互效果。

---

### 三、 总结
这个文件就是**编辑器的引擎**。它将 Leafer UI 的各种原生画布 API 进行高度封装，结合了 **[WorkspacesService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/workspaces/workspacesService.ts)** 和 **[EventbusService](file:///d:/项目相关/AAA/gzm-design/src/views/Editor/core/eventbus/eventbusService.ts)**，实现了编辑器的：
1. **画面渲染**与元素编辑（旋转、缩放、移动、锁定宽高比）。
2. **多页面**切换与缓存管理。
3. **图层上下级关系**（Group 与 元素）的拖拽交互。
4. **外部属性联动**（通知右面板刷新输入框）。
 */
