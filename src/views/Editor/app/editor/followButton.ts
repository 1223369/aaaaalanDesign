import {IMLeaferCanvas, MLeaferCanvas} from '@/views/Editor/core/canvas/mLeaferCanvas'
import {Disposable} from '@/views/Editor/utils/lifecycle'
import {IKeybindingService, KeybindingService} from '@/views/Editor/core/keybinding/keybindingService'
import {Platform, Point, Rect, Box} from "leafer-ui";
import {Flow} from "@leafer-in/flow";
import IconfontDeleteSvg from '@/assets/icons/iconfont-delete.svg?raw'
import IconfontCopySvg from '@/assets/icons/iconfont-copy.svg?raw'
import IconfontAiSvg from '@/assets/icons/iconfont-ai.svg?raw'
import {EditorEvent} from "@leafer-in/editor";
import {IEventListener} from "@leafer-ui/interface";
import {Message} from "@arco-design/web-vue";

const baseHeight: number = 30
const baseWidth: number = 30
const basePadding: number = 10

export class FollowButton extends Disposable {

    public pointer: Point | undefined

    constructor(
        @IMLeaferCanvas private readonly canvas: MLeaferCanvas,
        @IKeybindingService private readonly keybinding: KeybindingService,
    ) {
        super()
        const btnBox = new Flow({
            flowAlign: 'center',
            fill: '#ffffff',
            height: baseHeight + basePadding,
            cornerRadius: 5,
            stroke: 'rgb(229,229,229)',
        })

        const btnSeparate = new Box({
            around: 'center',
            width: 11,
            padding: basePadding / 2,
        })
        const separate = new Rect({
            width: 1,
            x: 6,
            height: baseHeight / 2,
            stroke: 'rgb(215,215,215)',
        })
        btnSeparate.add(separate)

        const btnCopy = this.createBtn(Platform.toURL(IconfontCopySvg, 'svg'), function () {
            keybinding.trigger('mod+c')
            keybinding.trigger('mod+v')
        })
        const btnDelete = this.createBtn(Platform.toURL(IconfontDeleteSvg, 'svg'), function () {
            keybinding.trigger('del')
        })
        const btnAi = this.createBtn(Platform.toURL(IconfontAiSvg, 'svg'), function () {
            Message.warning('AI抠图还未开发，欢迎PR');
        })
        const aiSpt = btnSeparate.clone()
        btnBox.add(btnAi)
        btnBox.add(aiSpt)
        btnBox.add(btnCopy)
        btnBox.add(btnSeparate.clone())
        btnBox.add(btnDelete)
        btnBox.width = btnBox.width + basePadding
        canvas.app.editor.buttons.add(btnBox)

        canvas.app.editor.on(EditorEvent.SELECT, (arg) => {
            btnAi.visible = aiSpt.visible = !canvas.activeObjectIsType("Image", "Image2") ? 0 : true
            const totalWidth = btnBox.children.reduce((acc, curr) => acc + (curr.visible !== 0 ? curr.width : 0), 0);
            btnBox.width = totalWidth + basePadding
        })
    }

    private createBtn(imgUrl: string, tapEvent: IEventListener): Rect {
        return new Rect({
            width: baseWidth,
            height: baseHeight,
            cursor: 'pointer',
            cornerRadius: 5,
            hoverStyle: {
                fill: [
                    {
                        type: 'solid',
                        color: 'rgba(215,215,215,0.5)'
                    },
                    {
                        type: "image",
                        mode: 'fit',
                        url: imgUrl,
                        padding: basePadding / 2
                    },
                ],
            },
            fill: {
                type: "image",
                mode: 'fit',
                url: imgUrl,
                padding: basePadding / 2
            },
            event: {
                tap: tapEvent,
            },
        })
    }
}
