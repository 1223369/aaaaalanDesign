import {
  MLeaferCanvas,
  IMLeaferCanvas,
} from "@/views/Editor/core/canvas/mLeaferCanvas";
import { UndoRedoBase } from "@/views/Editor/core/undo/undoRedoBase";
import {
  KeybindingService,
  IKeybindingService,
} from "@/views/Editor/core/keybinding/keybindingService";
import {
  EventbusService,
  IEventbusService,
} from "@/views/Editor/core/eventbus/eventbusService";
import {
  IWorkspacesService,
  WorkspacesService,
} from "@/views/Editor/core/workspaces/workspacesService";
import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import { Disposable } from "@/views/Editor/utils/lifecycle";
import { runWhenIdle, IDisposable } from "@/views/Editor/utils/async";
import {
  UndoRedoService,
  IUndoRedoService,
} from "@/views/Editor/core/undo/undoRedoService";
import { CommandBase } from "@/views/Editor/core/undo/commands";
import { debounce } from "lodash";
import { PropertyEvent, DragEvent, ChildEvent } from "leafer-ui";
import { InnerEditorEvent } from "@leafer-in/editor";

export const IEditorUndoRedoService = createDecorator<EditorUndoRedoService>(
  "editorUndoRedoService",
);

class SaveStateCommand extends CommandBase {
  constructor(
    private readonly workspacesService: WorkspacesService,
    private readonly editorUndoRedoService: EditorUndoRedoService,
    private pageId: string,
  ) {
    super();
  }

  public undo() {
    this.workspacesService.setCurrentId(this.pageId);
    this.editorUndoRedoService.undo();
  }

  public redo() {
    this.workspacesService.setCurrentId(this.pageId);
    this.editorUndoRedoService.redo();
  }
}

export class EditorUndoRedoService extends Disposable {
  declare readonly _serviceBrand: undefined;

  private pageId: string;
  private enablePropertyChange: boolean = true;

  private undoRedos: Map<
    string,
    {
      instantiation: UndoRedoBase;
      lastState: string | undefined;
    }
  > = new Map();

  constructor(
    @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
    @IKeybindingService readonly keybinding: KeybindingService,
    @IEventbusService private readonly eventbus: EventbusService,
    @IWorkspacesService private readonly workspacesService: WorkspacesService,
    @IUndoRedoService private readonly undoRedoService: UndoRedoService,
  ) {
    super();

    // 快捷键
    keybinding.bind("mod+z", () => {
      undoRedoService.undo();
    });
    keybinding.bind(["mod+y", "mod+shift+z"], () => {
      undoRedoService.redo();
    });
    canvas.app.editor.on(DragEvent.END, (arg: PropertyEvent) => {
      if (this.enablePropertyChange) {
        this.saveState();
      }
    });
    canvas.contentLayer.on(
      [ChildEvent.ADD, ChildEvent.REMOVE],
      (arg: PropertyEvent) => {
        if (this.enablePropertyChange) {
          this.saveState();
        }
      },
    );

    let oldValue: null | string = null;
    canvas.app.editor.on(InnerEditorEvent.BEFORE_OPEN, (arg) => {
      // 关闭文本默认全选
      arg.innerEditor.config.selectAll = false;
      oldValue = arg.editTarget.text;
    });
    canvas.app.editor.on(InnerEditorEvent.CLOSE, (arg) => {
      if (oldValue !== arg.editTarget.text) {
        oldValue = null;
        this.saveState();
      }
    });

    this.pageId = this.workspacesService.getCurrentId();

    this.initWorkspace();
  }

  public canUndo() {
    return this.undoRedoService.canUndo.value;
  }

  public canRedo() {
    return this.undoRedoService.canRedo.value;
  }

  public disabledPropertyChangeWatch() {
    this.enablePropertyChange = false;
  }

  public enablePropertyChangeWatch() {
    this.enablePropertyChange = true;
  }

  private getUndoRedo() {
    return this.undoRedos.get(this.pageId);
  }

  public push(state: any) {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return;

    undoRedo.instantiation.push(state);
    this.eventbus.emit("undoRedoStackChange");
  }

  public redo() {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return;

    if (!undoRedo.instantiation.canRedo) return;

    this.disabledPropertyChangeWatch();
    undoRedo.lastState = undoRedo.instantiation.redo(undoRedo.lastState);
    if (undoRedo.lastState) {
      this.loadJson(undoRedo.lastState);
      this.eventbus.emit("undoRedoStackChange");
    }

    this.enablePropertyChangeWatch();
    return undoRedo.lastState;
  }

  public undo() {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return;

    if (!undoRedo.instantiation.canUndo) return;
    undoRedo.lastState = undoRedo.instantiation.undo(undoRedo.lastState);
    if (undoRedo.lastState) {
      this.loadJson(undoRedo.lastState);
      this.eventbus.emit("undoRedoStackChange");
    }
    return undoRedo.lastState;
  }

  public reset() {
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return;

    undoRedo.instantiation.reset();
    this.eventbus.emit("undoRedoStackChange");
  }

  // private async loadJson(json: IUIInputData) {
  private async loadJson(json: string) {
    this.disabledPropertyChangeWatch();
    const undoRedo = this.getUndoRedo();
    if (!undoRedo) return;
    const { instantiation } = undoRedo;

    try {
      instantiation.pause();
      await this.canvas.importJsonToCurrentPage(JSON.parse(json));
    } finally {
      // this.canvas.contentLayer.updateLayout()
      this.enablePropertyChangeWatch();
      instantiation.resume();
    }
  }

  private getJson() {
    return JSON.stringify(this.canvas.contentFrame.toJSON());
  }

  private saveDispose: IDisposable | undefined;

  // todo jsondiffpatch https://github.com/benjamine/jsondiffpatch
  public saveState = debounce(() => {
    console.log("saveState");
    const pageId = this.pageId;
    this.saveDispose?.dispose();
    this.saveDispose = runWhenIdle(() => {
      if (pageId !== this.pageId) return;
      const undoRedo = this.getUndoRedo();
      if (!undoRedo || !undoRedo.instantiation.isTracking) return;
      this.push(undoRedo.lastState);
      undoRedo.lastState = this.getJson();
      // 添加命令
      this.undoRedoService.add(
        new SaveStateCommand(this.workspacesService, this, pageId),
      );
    });
  }, 300);

  // 工作区 | 页面管理
  private initWorkspace() {
    const currentId = this.workspacesService.getCurrentId();
    this.workspacesService.all().forEach((workspace) => {
      this.undoRedos.set(workspace.id, {
        instantiation: new UndoRedoBase(),
        lastState: this.pageId === currentId ? this.getJson() : undefined,
      });
    });
    this.eventbus.on("workspaceAddAfter", ({ newId }) => {
      this.undoRedos.set(newId, {
        instantiation: new UndoRedoBase(),
        lastState: this.pageId === newId ? this.getJson() : undefined,
      });
    });
    this.eventbus.on("workspaceRemoveAfter", (id) => {
      this.undoRedos.delete(id);
    });
    this.eventbus.on("workspaceChangeAfter", ({ newId }) => {
      this.pageId = newId;
    });
  }

  public dispose(): void {
    super.dispose();
    // 解绑事件绑定
    this.keybinding.unbind(["mod+z", "mod+y", "mod+shift+z"]);
  }
}

/**
 * Viewed undoRedoService.ts:1-232

这个文件 `undoRedoService.ts` 实现了编辑器中**撤销（Undo）与重做（Redo）**的核心逻辑。它基于依赖注入（Dependency Injection）架构，利用了 Leafer UI 引擎的事件系统和工作区服务，提供了**多页面（多工作区）独立状态管理**以及**全局撤销/重做命令历史**。

下面将从核心架构、关键组件、工作原理以及生命周期几个方面对该文件进行详细拆解。

---

### 一、 核心概念与架构设计

#### 1. 两个维度的撤销重做
该服务结合了两种级别的撤销/重做机制：
*   **页面级状态机 (`UndoRedoBase`)**：每个页面（Workspace）都有自己独立的 `UndoRedoBase` 实例，用来存储该页面画布的 JSON 状态历史栈。
*   **全局命令历史 (`UndoRedoService` 和 `SaveStateCommand`)**：全局的命令服务。当用户触发撤销或重做时，全局服务会调用 `SaveStateCommand`，后者先切换到对应的页面 ID，然后再触发该页面的撤销或重做。这样即使在多页面切换后，用户按 `Ctrl+Z` 也能正确地在对应的页面中执行撤销。

#### 2. 命令模式 (`SaveStateCommand`)
```typescript
class SaveStateCommand extends CommandBase {
    constructor(
        private readonly workspacesService: WorkspacesService,
        private readonly editorUndoRedoService: EditorUndoRedoService,
        private pageId: string,
    ) { super() }

    public undo() {
        this.workspacesService.setCurrentId(this.pageId) // 切换到修改发生时的页面
        this.editorUndoRedoService.undo()                 // 执行对应页面的撤销
    }

    public redo() {
        this.workspacesService.setCurrentId(this.pageId) // 切换到修改发生时的页面
        this.editorUndoRedoService.redo()                 // 执行对应页面的重做
    }
}
```
*   它继承自 `CommandBase`，代表一次状态保存的命令。
*   当撤销或重做被触发时，它会确保编辑器先**自动跳转到发生更改的页面**，然后再恢复当时画布的数据。

---

### 二、 核心服务类 `EditorUndoRedoService` 详解

`EditorUndoRedoService` 继承自 `Disposable`（用于管理资源的释放和解绑）。

#### 1. 初始化与事件监听（构造函数）
在构造函数中，服务注册了快捷键并监听了画布的各种操作事件，用以自动捕获并保存状态：
*   **快捷键绑定**：
    *   `mod+z` (Ctrl+Z / Cmd+Z) $\rightarrow$ 触发撤销。
    *   `mod+y` 或 `mod+shift+z` $\rightarrow$ 触发重做。
*   **画布事件监听**：
    *   `DragEvent.END`：当在画布上拖拽元素结束时保存状态。
    *   `ChildEvent.ADD` / `ChildEvent.REMOVE`：当图层添加或删除子节点（图形）时保存状态。
    *   `InnerEditorEvent.BEFORE_OPEN` 与 `CLOSE`：针对文本节点（Text）的双击内联编辑。在编辑前记录 `oldValue`，在关闭编辑时如果内容发生改变，则保存状态。

#### 2. 状态保存机制 (`saveState`)
为了避免频繁操作画布导致性能问题，状态保存使用了防抖（Debounce）和空闲调用（`runWhenIdle`）：
```typescript
public saveState = debounce(() => {
    console.log('saveState')
    const pageId = this.pageId
    this.saveDispose?.dispose()
    this.saveDispose = runWhenIdle(() => {
        if (pageId !== this.pageId) return
        const undoRedo = this.getUndoRedo()
        if (!undoRedo || !undoRedo.instantiation.isTracking) return
        this.push(undoRedo.lastState)
        undoRedo.lastState = this.getJson()
        // 向全局撤销重做服务中添加当前命令
        this.undoRedoService.add(new SaveStateCommand(this.workspacesService, this, pageId))
    })
}, 300)
```
*   **`debounce(..., 300)`**：将状态保存延迟 300ms 执行。如果在此期间内再次触发了保存事件（例如连续快速地拖拽、改变属性），会重新计时，最终只会保存一次。
*   **`runWhenIdle`**：在浏览器空闲时再执行状态序列化，降低因频繁序列化大型 JSON 对 UI 渲染造成的卡顿。
*   **序列化**：通过 `this.getJson()` 将当前页面画布 `contentFrame` 转换成 JSON 字符串保存。

#### 3. 状态应用与防循环 (`loadJson`)
当用户执行撤销或重做时，需要将保存的 JSON 状态重新渲染到画布中。在此过程中，必须防止重新触发画布的变更事件，否则会导致“死循环状态保存”。
```typescript
private async loadJson(json: string) {
    this.disabledPropertyChangeWatch() // 1. 禁用画布属性变化监听
    const undoRedo = this.getUndoRedo()
    if (!undoRedo) return
    const { instantiation } = undoRedo

    try {
        instantiation.pause() // 2. 暂停当前页面的历史栈追踪
        await this.canvas.importJsonToCurrentPage(JSON.parse(json)) // 3. 导入数据到画布
    } finally {
        this.enablePropertyChangeWatch() // 4. 恢复监听
        instantiation.resume()           // 5. 恢复追踪
    }
}
```

#### 4. 多工作区（多页面）数据隔离 (`initWorkspace`)
当用户在编辑器中添加、删除或切换页面时，该服务会同步更新各个页面对应的撤销重做栈：
*   **初始化**：为每个已有的页面创建一个 `UndoRedoBase` 历史栈实例。
*   **新增页面 (`workspaceAddAfter`)**：动态为新页面分配一个独立的历史栈。
*   **删除页面 (`workspaceRemoveAfter`)**：释放并删除对应页面的历史栈，避免内存泄漏。
*   **切换页面 (`workspaceChangeAfter`)**：更新 `this.pageId` 标识，确保后续的操作都作用在当前活动页面上。

#### 5. 销毁与清理 (`dispose`)
```typescript
public dispose(): void {
    super.dispose()
    // 解绑快捷键绑定，防止组件销毁后快捷键依然生效
    this.keybinding.unbind(['mod+z', 'mod+y', 'mod+shift+z'])
}
```

---

### 三、 整体工作流程图

以用户**“拖拽移动图形”**为例：

```mermaid
sequenceDiagram
    participant User as 用户 (User)
    participant Canvas as 画布 (MLeaferCanvas)
    participant Serv as 编辑器撤销重做服务 (EditorUndoRedoService)
    participant Base as 页面历史栈 (UndoRedoBase)
    participant Global as 全局撤销重做服务 (UndoRedoService)

    User->>Canvas: 结束拖拽图形 (DragEvent.END)
    Canvas->>Serv: 触发事件回调
    Note over Serv: debounce (等待 300ms 且浏览器空闲)
    Serv->>Base: push(lastState) 保存前一个状态
    Serv->>Serv: lastState = 获取当前最新画布 JSON
    Serv->>Global: add(SaveStateCommand) 注册全局命令
    
    Note over User: 按下 Ctrl + Z (撤销操作)
    User->>Global: 触发全局 undo()
    Global->>Serv: 执行 SaveStateCommand.undo()
    Serv->>Serv: disabledPropertyChangeWatch() 暂停监听
    Serv->>Base: undo() 获取上一个 JSON 状态
    Base-->>Serv: 返回旧状态 JSON
    Serv->>Canvas: importJsonToCurrentPage() 导入画布
    Serv->>Serv: enablePropertyChangeWatch() 恢复监听
```

### 总结
该文件通过**“全局命令调度 + 页面局部状态存储”**的双层设计，精细化地处理了多页面下的撤销/重做逻辑。同时使用**防抖延迟序列化**与**临时阻断监听（防死循环）**的手段，保证了画布在频繁操作时的性能与稳定性。
 */
