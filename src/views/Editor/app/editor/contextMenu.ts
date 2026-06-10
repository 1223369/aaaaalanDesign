import { IMLeaferCanvas, MLeaferCanvas } from "../../core/canvas/mLeaferCanvas";
import { Disposable } from "../../utills/lifecycle";
import { Point, PointerEvent } from "leafer-ui";

export class ContextMenu extends Disposable {
  public pointer: Point | undefined;

  constructor(
    @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
    @IKeybindingService private readonly keybindingService: KeybindingService,
  ) {
    super();
    canvas.contentFrame.on(PointerEvent.MENU, (arg: PointerEvent) => {
      this.pointer = new Point(arg.x, arg.y);
      this.showLayerContextMenu(arg);
    });
    canvas.app.editor.on(PointerEvent.MENU, (arg: PointerEvent) => {
      this.pointer = new Point(arg.x, arg.y);
      this.showLayerContextMenu(arg);
    });
  }
}
