import { createDecorator } from "@/views/Editor/core/instantiation/instantiation";
import { EventbusService, IEventbusService } from "@/views/Editor/core/eventbus/eventbusService";

type UndoRedoState = unknown;

export const IEditorUndoRedoService = createDecorator<EditorUndoRedoService>(
  "editorUndoRedoService",
);

export class EditorUndoRedoService {
  declare readonly _serviceBrand: undefined;

  private undoStack: UndoRedoState[] = [];
  private redoStack: UndoRedoState[] = [];

  constructor(@IEventbusService private readonly eventbus: EventbusService) {}

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }

  saveState(state?: UndoRedoState) {
    this.undoStack.push(state ?? null);
    this.redoStack = [];
    this.emitStackChange();
  }

  undo() {
    if (!this.canUndo) return undefined;
    const state = this.undoStack.pop();
    this.redoStack.push(state);
    this.emitStackChange();
    return state;
  }

  redo() {
    if (!this.canRedo) return undefined;
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    this.emitStackChange();
    return state;
  }

  reset() {
    this.undoStack = [];
    this.redoStack = [];
    this.emitStackChange();
  }

  private emitStackChange() {
    this.eventbus.emit("undoRedoStackChange", undefined);
  }
}
