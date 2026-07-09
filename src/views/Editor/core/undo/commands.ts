export interface UndoRedoCommand {
  getTimestamp(): number;
  getDuration(): number;
  label: string;
  undo(): void;
  redo(): void;
}

export class CommandBase implements UndoRedoCommand {
  private _timestamp: number;
  private _label = "";

  public constructor() {
    this._timestamp = new Date().getTime();
  }

  public getTimestamp(): number {
    return this._timestamp;
  }

  public getDuration(): number {
    return 0;
  }

  public get label(): string {
    return this._label;
  }

  public set label(value: string) {
    this._label = value;
  }

  public undo(): void {
    throw new Error("Not implemented");
  }

  public redo(): void {
    throw new Error("Not implemented");
  }
}

/**
 * 
commands.ts
 —— 撤销重做命令规范与基类
该文件属于经典的 命令模式 (Command Pattern) 实践，定义了撤销重做操作的规范和命令对象的基类。



UndoRedoCommand
 接口： 这是系统中所有撤销/重做操作的“契约书”。接口规范了具体的命令必须实现：

getTimestamp()：返回命令创建的时间戳。
getDuration()：返回命令执行的持续时长。
label：操作的描述标签（如“创建图层”、“删除节点”），通常用来在撤销记录历史菜单中做文本渲染。
undo()：执行具体的撤销还原逻辑。
redo()：执行具体的重做恢复逻辑。


CommandBase
 类： 实现了 

UndoRedoCommand
 接口的抽象基类：

时间戳初始化: 在构造函数中自动记录创建时间 _timestamp。
接口属性包装: 提供了一系列公共的 get/set 存取器（如 label）。
占位方法抛错: 在基类中，undo() 和 redo() 均是未实现状态并直接抛出 Error，约束具体的业务命令子类（例如 SaveStateCommand）必须继承此基类并重写这两个核心方法。
 */
