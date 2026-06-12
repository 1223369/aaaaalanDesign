import { IMLeaferCanvas, MLeaferCanvas } from "../../core/canvas/mLeaferCanvas";
import { IKeybindingService, KeybindingService } from "../../core/keybinding/keybindingService";
import { Disposable } from "../../utils/lifecycle";
import { Point, PointerEvent } from "leafer-ui";
import MenuComponent from "@/components/contextMenu";
import { layerItems, zoomItems } from "@/views/Editor/utils/contextMenu";
import { typeUtil } from "../../utils/utils";

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

  private showBlankContextMenu(e: PointerEvent) {
    e.stopDefault();
    const event = e.origin;
    const { mod } = this.keybindingService;
    MenuComponent.showContextMenu({
      x: event.clientX,
      y: event.clientY - 5,
      preserveIconWidth: false,
      items: [
        {
          label: "选择全部",
          onClick: () => {
            this.keybindingService.trigger("mod+a");
          },
          shortcut: `${mod} A`,
        },
        {
          label: "粘贴到当前位置",
          onClick: () => {
            this.keybindingService.trigger("mod+shift+v");
          },
          shortcut: `${mod} ⇧ V`,
        },
        ...zoomItems(),
      ],
    });
  }

  private showLayerContextMenu(e: PointerEvent) {
    e.stopDefault();
    const event = e.origin;
    const object = this.canvas.activeObject.value;
    // 置空选项
    if (!object || typeUtil.isBottomCanvas(object)) {
      this.showBlankContextMenu(e);
      return;
    }

    MenuComponent.showContextMenu({
      x: event.clientX,
      y: event.clientY - 5,
      preserveIconWidth: false,
      items: layerItems(),
    });
  }
}
