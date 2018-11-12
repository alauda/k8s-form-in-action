class: left, middle

# Angular 响应式表单

## Kubernetes 对象实战

---

# DEMO

[demo](/demo)

---

# 你将会了解到

### YAML/表单(UI) 互转问题难点

### Angular 响应式表单

### Link 项目使用响应式表单编辑 Kubernetes 对象的实战

---

# YAML/表单(UI)互转问题 - K8S 对象

### YAML 是 Kubernetes 对象最常见的展现和修改形式。
### Kuberntes 对象通常有如下字段:

- 类型信息：TypeMeta
- 基本信息：ObjectMeta
- 目标配置、约束：Spec
- 运行时增加的状态信息：Status
- [Ref](https://kubernetes.io/cn/docs/concepts/overview/working-with-objects/kubernetes-objects/)

---

# YAML/表单(UI)互转问题 - K8S 对象

```yaml
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.7.9
          ports:
            - containerPort: 80
```

- 结构抽象，重视可移植性，字段嵌套层次深
- 声明式结构，对象在创建前后结构是统一的，但创建后可能会多出比较多的不可编辑字段(比如状态信息)

---

# YAML/表单(UI)互转问题

### 表单实现要点：

- 由于实现上的困难与业务局限性，我们不会或者不需要通过 UI 编辑 K8S 的所有字段
  - 非 UI 可编辑字段在互转的时候可以得到正确保留
- UI 展现的形式并非与 YAML 严格对应
  - 有时候会根据业务进行隐式的修改或者填充
- 表单字段嵌套层次深、表单字段之间可能有关联性
- 局部表单复用。 比如 Workload/Pod 相关的资源都可以编辑 PodSpec 或者 Container
- 实时同步表单与 YAML 内容，保证两种数据表现形式在任何时间点都是一致的

---

class: start, middle

# 静下心来...
# 思考一下任务目标 🙏

---

class: left, middle

## 众所众知
### 控制台应用中处理复杂表单是 Web 前端最难的任务之一
### 而处理复杂的 Kubernetes 表单把这个问题推到了极致

---

class: left, middle

#### 我们的目标不是解决编辑一个复杂 Kubernetes 对象的问题

#### 为了减少开发重复性、降低维护成本

### 把开发时的工作重心放到业务功能实现上，我们需要

# 设计一个良好的<span style="color: red">范式</span> （Paradigm）

---

class: start, middle

# 有好的范式的时候可以获得如下开发红利：

- 不管任何模式的复杂表单，可以立刻开始着手开发
- 强调开发体验的共识、抽象
- 避免开发出新的错误类型

---

class: start, middle

### 因此我们需要

## 一个 _易复制_、_易理解_、_可成长_、_可维护_ 的范式

#### 让我们不管面对任何需要实现编辑功能的 Kubernetes 对象都可以手到擒来。

---

# Link 中 k8s 对象表单开发范式

### 中心思想：

1. 神形合一：组件即是资源，也是表单控件
2. 分形：局部子对象表单组件处理与整体对象表单组件处理保持一致
3. 递归: 用递归的方式自上而下处理表单组件
4. 问题隔离：一次只处理一个问题
5. 响应式表单：严格执行单向数据流，同步处理，以达到实时同步的目的

---

# Link 中 k8s 对象表单开发范式
### 流程

1. 学习目标 Kubernetes 对象的基本功能, 对它的 YAML Schema 有基本概念。
2. 书写目标 API 对象 TypeScript 的类型 ( `interface` / `type` 等)。
3. 拆解 k8s 对象类型成一系列子对象，为每个可复用的子对象封装为单独的表单组件。
  - 比如 `PodSpec`, `Container`, `Env` 等
4. 为拆解出来的每个子对象表单组件实现表单到对象的互转。
5. 组合子对象表单，最终组合成完整的 K8S 对象表单。

---

# Link 中 k8s 对象表单开发范式
### 学习 Kubernetes 对象

由于我们前端人员对于 YAML 字段的高透明度和充分的修改灵活度, 我们需要了解相关 k8s 对象的业务/特性.

#### 如何了解?

- 首先在官网上了解对象的设计初衷与基本用例
- 了解过后, 再查看 K8S 对象的 API 来深入了解对象的功能点细节.
  - 阅读 [API 文档](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.11/)
  - 查看 [k8s-api Go 源码](https://sourcegraph.com/github.com/kubernetes/api@master/-/blob/core/v1/types.go)

---

class: split

### 先看一个例子🌰：部署表单
.column[
https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.11/#deployment-v1-apps
```yaml
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: nginx-deployment
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.7.9
```
]

.column[
```ts
interface Deployment {
  apiVersion: string;
  kind: string;
  metadata?: ObjectMeta;
  spec?: DeploymentSpec;
}
export interface ObjectMeta {
  name?: string;
  namespace?: string;
}
export interface DeploymentSpec {
  replicas?: number;
  template?: PodTemplateSpec;
  // ...
}
export interface PodTemplateSpec {
  metadata?: ObjectMeta;
  spec?: PodSpec;
}
export interface PodSpec {
  containers: Container[];
  // ...
}
export interface Container {
  name?: string;
  image?: string;
 }
```
]

---

### 部署表单拓扑

- 对于部署表单，我们拆分为3个主要表单
  - `[DeploymentForm, PodSpecForm, ContainerForm]`

```plaintext
+[DeploymentForm]----------------------+
|                                      |
| metadata.name: input                 |
| metadata.namespace: select           |
| spec.replicas: input                 |
|                                      |
| +spec.template.spec: [PodSpecForm]-+ |
| |                                  | |
| | containers[0]:+[ContainerForm]-+ | |
| |               | name: input    | | |
| |               | image: input   | | |
| |               +----------------+ | |
| | containers[1]:+[ContainerForm]-+ | |
| |               | name: input    | | |
| |               | image: input   | | |
| |               +----------------+ | |
| +----------------------------------+ |
+--------------------------------------+
```

art: http://asciiflow.com/

---

### K8S 资源对象表单控件组件 - 模板

最外层组件，对象的使用者可以依然使用模板驱动表单，将视图双向绑定到数据上：
```html
<deployment-form [(ngModel)]="deployment"></deployment-form>
```

内部模板书写上比较容易：由普通表单控件 (如`aui-select`, `aui-input`等) 和其他子对象表单控件（如`pod-spec-form`）组成为一个单独的表单。

部署模板使用响应式表单：
```html
<form formGroup="form">
  <ng-container formGroupName="metadata">
    Name:     <input formControlName="name">
    Namespace <select formControlName="namespace"></select>
  </ng-container>
  <ng-container formGroupName="spec">
    <ng-container formGroupName="template">
      <pod-spec-form formControlName="spec"></pod-spec-form>
    </ng-container>
  </ng-container>
</form>
```

\* 模板的书写体验上很接近模板驱动表单。我们这里为相关控件绑定的是响应式表单对象实例，而不是数据本身。

---

### 题外话：为何选择 **响应式表单**？

- 响应式表单通过对数据模型的同步访问提供了更多的可预测性，使用 Observable 的操作符提供了不可变性，并且通过 Observable 流提供了变化追踪功能。
- 模板驱动表单由于数据流变化的不确定性和异步处理特性，对于复杂表单交互可能会处理起来不可预知
- 由于我们需要 YAML 和表单数据实时 **同步**，而响应式表单可以保证这一点。

#### 关于同步：

- 使用响应式表单，你会在代码中创建整个表单控件树。 你可以立即更新一个值或者深入到表单中的任意节点，因为所有的控件都始终是可用的。
- 模板驱动表单会委托指令来创建它们的表单控件。 为了消除“检查完后又变化了”的错误，这些指令需要消耗一个以上的变更检测周期来构建整个控件树。 这意味着在从组件类中操纵任何控件之前，你都必须先等待一个节拍。

REF: [Angular Reactive Form](https://angular.cn/guide/reactive-forms)

---

### K8S 资源对象表单控件组件 - 控制器
#### 职责
- 对外暴露为一个单独的表单控件
  - Host 模板可以绑定表单相关指令到对象表单控件
- 对内表现为一个完整的表单组件
  - 根据视图创建出一个表单控件树
  - 协同各个表单控件，响应数据变化
- 使用单向数据流处理流入表单的数据
- 使用单向数据流处理流出表单的数据

---

### K8S 资源对象表单控件组件 - 控制器
#### 使用响应式表单给了我们几个问题：
- 如何初始化响应式表单控件
- 如何实现 `writeValue`
  - 处理流入表单的数据
- 如何调用 `onChange`
  - 处理流出表单的数据

---

### K8S 资源对象表单控件组件 - 控制器
#### 表单初始化

组件初始化时，需要生成一个响应式表单控件树
  
- 有且只有一个根部 `form` 控件。 根据情况可能是 `FormGroup` 、`FormArray`、`FormControl`
  - 结构一般与当前对象 schema 结构相似，这样可以
    - 通过 `form.patchValue` 来设置表单数据
    - 在控制器或者模板里更容易的与原始数据进行对照
- 在模板内可以组合使用 `formGroupName`, `formControlName` 等指令绑定到响应表单控件上

---
### K8S 资源对象表单控件组件 - 控制器
#### 表单初始化

比如对于部署表单，我们需要生成这样结构的表单控件：

```ts
const metadataForm = this.fb.group({
  name: ['', [Validators.required]],
  namespace: ['', [Validators.required]],
  labels: [{}],
  annotations: [{}]
});

const specForm = this.fb.group({
  selector: this.fb.group({ matchLabels: [{}] }),
  template: this.fb.group({ spec: [{}] })
});

const deployForm = this.fb.group({
  metadata: metadataForm,
  spec: specForm,
});

```

---

### K8S 资源对象表单控件组件 - 控制器
#### 对外暴露为一个普通的表单控件，同时提供验证器以暴露自身表单控件的错误
实现 `ControlValueAccessor` 和 `Validator`接口。
- `writeValue`: 由外部写入内部时，需要将资源对象适配为表单可用的模型结构。
  - 大部分时候表单的 FormModel 与资源对象的 schema 一致。
  - 假如业务需要，比如 k8s 的 `metadata.labels` 字段是 `{ [key: string]: string }` 键值映射对象，但在视图中他的表单模型是键值对数组 `[string, string][]`，可以在这个阶段进行数据适配。
- `onChange`: 由内部写回外部时，需要将表单模型适配为资源对象模型，同时将 UI 不可见的字段写回资源对象模型中。
- `validate`: 对外部暴露表单控件组件内部的错误状态
- 同时由于实现的原因，需要监听上层模板的 `Form` 指令，以得到提交嵌套模板的功能。

---

### K8S 资源对象表单控件组件 - 控制器
#### `setFormByResource` 和 `setResourceByForm`

刚才提到，为表单设置资源对象数据时可以直接通过调用 `form.patchValue(formModel)` ，使得一个结构化的表单被能快速的填充。
有一个问题是，Angular 限制调用 `patchValue` 方法时 `formModel` 的 schema 必须是 form 结构的一个子集，
但通常来讲 form 的控制器结构有时候不需要覆盖完整的 schema (比如 status 字段等)。

Link 里设计了 `setFormByResource` 函数解决这个问题，方法是通过遍历表单层级里面所有的控制器，以控制器所在的路径作为线索查找资源对象上的相应的值，
然后设置到表单控制器上；同时在 form 的某个控制器是 FormArray 的情况下，根据数据来源的大小进行伸缩。

而 `setResourceByForm` 函数与 `setFormByResource` 作用相反。
在表单数据写回资源对象时，可以利用它遍历表单层级控制器，将值设置到资源对象上。

---

### K8S 资源对象表单控件组件 - 控制器

#### 单项数据流：

```

 +--------+
 |Resource|<<<-----+
 +---+----+        |
     |             |
 writeValue    onChange
     |             |
adaptResource  adaptForm
     |             |
  setForm     setResource
     |             |
     |         +------+
     +------>>>+ Form |
               +------+
```


由于控制器大多数情况下使用方式和行为高度相似，于是 Link 将表单的这些功能和行为抽象、封装到了 `BaseResourceFormComponent` 基类内。

并且要求 Link 中所有的子对象表单控件组件需要继承自 `BaseResourceFormComponent`。

---

#### K8S 资源对象表单控件组件 - `BaseResourceFormComponent`

```typescript
// 核心代码片段, 因为 Slides 长度原因删改了部分内容
export abstract class BaseResourceFormComponent<R, F> implements ControlValueAccessor, Validator {
  form: FormControl | FormGroup | FormArray;
  adaptedFormModel: F;

  abstract createForm(): FormControl | FormGroup | FormArray;

  adaptResourceModel(resource: R): F { return resource as F; }
  adaptFormModel(formModel: F): R { return formModel as R; }

  registerOnChange(fn: (value: R) => void): void { this.onChange = fn; }
  onChange = (_: R) => {};

  writeValue(resource: R) {
    const formModel = this.adaptedFormModel = this.adaptResourceModel(resource);
    this.setupForm();
    setFormByResource(this.form, formModel);
    this.registerObservables();
  }

  registerObservables() {
    this.formValueSub = this.form.valueChanges
      .pipe(map(() => setResourceByForm(this.form, this.adaptedFormModel))
      .subscribe(formModel => this.onChange(this.adaptFormModel(formModel)));
  }

  validate(_c: FormControl) { return this.form && this.form.invalid ? true : null }
}

```

---
### 在最后

基于表单开发范式，Link 的开发者可以非常快速的进行 K8S 相关资源对象表单的实现。

- 实现总结过程中基本是我自己闭门造车，希望得到大家的反馈
- 实现方案依需打磨，在成文过程中依然返厂了多次，修改了不少实践
- 缺少用例分析。目前有一些简单的测试用例覆盖，但还不完整。
- 源码：https://github.com/pengx17/k8s-form-in-action

## 谢谢大家
