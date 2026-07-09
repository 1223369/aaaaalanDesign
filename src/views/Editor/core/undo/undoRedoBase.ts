import { LinkedList } from "@/utils/linkedList";

class UndoQueue {
  private inner_ = new LinkedList<any>();
  private size_ = 50;

  pop() {
    return this.inner_.pop();
  }

  push(e: any) {
    this.inner_.push(e);
    while (this.length > this.size_) {
      this.inner_.shift();
    }
  }

  get length(): number {
    return this.inner_.size;
  }
}

export class UndoRedoBase {
  declare readonly _serviceBrand: undefined;

  private undoStates: UndoQueue = new UndoQueue();
  private redoStates: UndoQueue = new UndoQueue();
  private isUndoing = false;
  public isTracking = true;

  constructor() {
    this.push = this.push.bind(this);
  }

  pause() {
    this.isTracking = false;
  }

  resume() {
    this.isTracking = true;
  }

  push(state: any) {
    if (!this.isTracking) return;
    this.undoStates.push(state);
    this.redoStates = new UndoQueue();
  }

  undo(redoState: any) {
    if (this.isUndoing) return;
    if (!this.canUndo) throw new Error("Nothing to undo");
    this.isUndoing = true;
    const state = this.undoStates.pop();
    this.redoStates.push(redoState);
    this.isUndoing = false;
    return state;
  }

  redo(undoState: any) {
    if (this.isUndoing) return;
    if (!this.canRedo) throw new Error("Nothing to redo");
    this.isUndoing = true;
    const state = this.redoStates.pop();
    this.undoStates.push(undoState);
    this.isUndoing = false;
    return state;
  }

  reset() {
    this.undoStates = new UndoQueue();
    this.redoStates = new UndoQueue();
    this.isUndoing = false;
  }

  get canUndo(): boolean {
    return !!this.undoStates.length;
  }

  get canRedo(): boolean {
    return !!this.redoStates.length;
  }
}

/**
 * 
 * 
undoRedoBase.ts
 —— 局部状态备忘录栈
该文件负责单个页面（或者单个画布）状态的暂存、撤销和重做计算。它是纯粹的基于“数据快照（Memento）”的数据存储器。



UndoQueue
 类：
封装了一个双向链表 LinkedList。
限制了单页历史队列的最大容量 size_ = 50。当保存的快照数超过50个时，会把最旧的数据从头部移出 (shift)，防止无限增长占用大量内存。


UndoRedoBase
 类：
管理着代表当前页面状态的撤销队列 undoStates 和重做队列 redoStates。
提供 pause() 和 resume() 来切换 isTracking 标志位。这可以暂时暂停历史栈的追踪，避免在撤销还原 JSON 数据时，触发画布更新事件而重复录制状态，从而陷入死循环。


push()
: 将传入的快照状态存入 undoStates，同时清空 redoStates。


undo()
: 弹出最顶部的历史快照（即上一个状态），并将当前的状态压入重做栈 redoStates 中，返回旧状态。


redo()
: 弹出重做栈顶部快照，将当前状态压入撤销栈 undoStates 中，返回新状态。
 */
