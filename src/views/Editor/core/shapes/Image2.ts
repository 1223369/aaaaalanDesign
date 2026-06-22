// 1-8行：从绘图引擎 'leafer-ui' 中引入核心工具、装饰器、基础图形和接口
import {
  dataProcessor, // 装饰器：用于为自定义 UI 组件绑定对应的数据处理器类
  IUIData, // 接口：定义了 UI 节点内部数据对象（__）的基本类型约束
  IUIInputData, // 接口：定义了 UI 节点构造函数所接收的输入初始化参数的类型约束
  Rect, // 基础图形类：矩形类，Image2 继承于它以利用矩形的填充机制
  registerUI, // 装饰器：用于在绘图引擎中注册自定义图形组件，使其可以被实例化渲染
  UIData, // 基类：所有 UI 节点内部数据处理器的基类
} from "leafer-ui";

// 10-11行：定义自定义输入数据接口 ICustomInputData，继承自 Leafer 官方的初始化参数接口
interface ICustomInputData extends IUIInputData {}

// 13-14行：定义自定义元素的数据接口 ICustomData，继承自 Leafer 官方的 UI 内部数据接口
interface ICustomData extends IUIData {}

// 16-18行：定义自定义数据类 CustomData，它负责元素属性的脏检查、计算和流转，防止参数污染通用 UI 数据
class CustomData extends UIData implements ICustomData {
  // 元素数据，负责元素的数据处理
}

/**
 * 20-23行：文档注释
 * 说明此自定义元素是为了解决官方 Image 元素在初始化时无法设置 fill（填充）透明度的痛点而实现的。
 */
@registerUI() // 24行：使用装饰器将下面的 Image2 类注册到 Leafer-UI 的内部 UI 图形映射表中
class Image2 extends Rect {
  // 25行：声明 Image2 类，继承自 Rect 类以拥有矩形的一切属性和方法
  private _url: string; // 26行：私有属性，存放图片的原始 URL 地址
  private _fillOpacity: number; // 27行：私有属性，存放图片的填充透明度值（0 ~ 1）

  // 29-31行：定义静态标签 getter。Leafer-UI 会读取该标记，将其识别为名为 'Image2' 的图形节点
  public get __tag() {
    return "Image2";
  }

  // 33-35行：使用 @dataProcessor 装饰器将 CustomData 绑定到内部的公开数据对象 __ 上
  @dataProcessor(CustomData)
  declare public __: ICustomData; // declare 表示该属性是在基类中声明或将在运行时生成，此处进行类型重写约束

  // 37-39行：构造函数，接收符合 ICustomInputData 格式的初始化参数对象，并调用父类 Rect 的构造函数进行基础初始化
  constructor(data: ICustomInputData) {
    super(data);
  }

  // 41-43行：获取图片 URL 的 getter 属性拦截器，返回私有属性 _url
  get url(): string {
    return this._url;
  }

  // 45-48行：设置图片 URL 的 setter 属性拦截器
  set url(value: string) {
    // 46行：将 Rect 的 fill 填充设置为一个 image 类型对象，传入图片地址，透明度默认为 1
    this.fill = { type: "image", url: value, opacity: 1 };
    // 47行：将传入的 url 保存至私有变量 _url 中
    this._url = value;
  }

  // 50-52行：获取图片填充透明度的 getter 属性拦截器，返回私有属性 _fillOpacity
  get fillOpacity(): number {
    return this._fillOpacity;
  }

  // 54-57行：设置图片填充透明度的 setter 属性拦截器
  set fillOpacity(value: number) {
    this._fillOpacity = value; // 55行：更新内部私有透明度变量
    // 56行：关键行，通过重置整个 fill 的配置，将当前 url 对应的图片填充透明度修改为指定的 value，解决了官方组件的 opacity 初始化限制问题
    this.fill = { type: "image", url: this._url, opacity: value };
  }
} // 58行：Image2 类声明结束

export default Image2; // 60行：默认导出 Image2 类，方便其他文件直接 import 导入使用
