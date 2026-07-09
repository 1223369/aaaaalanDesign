import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import {
  InstantiationType,
  registerSingleton,
} from "@/views/Editor/core/instantiation/extensions";
import { UndoRedoCommand } from "@/views/Editor/core/undo/commands";

export const IUndoRedoService =
  createDecorator<UndoRedoService>("undoRedoService");

export class UndoRedoService {
  declare readonly _serviceBrand: undefined;
  private _stack: UndoRedoCommand[] = [];
  private _stackIndex = -1;
  public readonly canUndo = ref(false);
  public readonly canRedo = ref(false);

  constructor() {
    this.updateCanUndoRedo();
    // 使用Proxy对象来创建一个代理，在设置_stackIndex属性时手动触发更新canUndo和canRedo状态。这样就可以确保在_stackIndex改变时，能够更新对应的状态
    return new Proxy(this, {
      set: (target, prop, value) => {
        Reflect.set(target, prop, value);
        if (prop === "_stackIndex") {
          this.updateCanUndoRedo();
        }
        return true;
      },
    });
  }

  private updateCanUndoRedo(): void {
    this.canUndo.value = this._stackIndex > 0;
    this.canRedo.value =
      this._stackIndex < this._stack.length && this._stack.length > 0;
  }

  public clear(): void {
    this._stack = [];
    this._stackIndex = -1;
  }

  public add(cmd: UndoRedoCommand): void {
    if (this.canRedo.value) {
      this._stack.splice(this._stackIndex, this._stack.length);
    }
    this._stack.push(cmd);
    this._stackIndex = this._stack.length;
  }

  public undo(): void {
    if (this.canUndo.value) {
      this._stackIndex--;
      this._stack[this._stackIndex].undo();
    }
  }

  public redo(): void {
    if (this.canRedo.value) {
      this._stack[this._stackIndex].redo();
      this._stackIndex++;
    }
  }
}

registerSingleton(IUndoRedoService, UndoRedoService, InstantiationType.Eager);
/**
 * 
 * 
undoRedoService.ts
 —— 全局撤销重做调度服务
该文件定义了编辑器全局的撤销重做服务，作为 IOC 容器管理的全局单例，面向编辑器的整体操作流。

全局命令栈管理：
_stack：保存了在整个编辑器生命周期中所有跨页面操作的 

UndoRedoCommand
（即行为命令）线性列表。
_stackIndex：当前的命令索引指针。
响应式状态同步与代理 (Proxy)：
使用 ref(false) 定义了 canUndo 和 canRedo 响应式变量，支持在前端 UI 层直接侦听控制按钮是否可用。
Proxy 代理拦截: 在构造函数中，使用 new Proxy(this, ...) 代理拦截了对 _stackIndex 的属性赋值操作。每当 _stackIndex 变化，自动触发 updateCanUndoRedo()，从而完美同步 canUndo/canRedo 状态。
指令调度方法：
add(cmd): 当用户产生新动作时向 _stack 中追加命令，如果有重做分支，则清空指针后面的旧历史。
undo()/redo(): 改变 _stackIndex 的指针位置，并依次去触发当前指针指向的命令所包装的具体逻辑。
 */
