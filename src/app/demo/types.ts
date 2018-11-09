export interface StringMap {
  [key: string]: string;
}

// TypeMeta describes an individual object in an API response or request
// with strings representing the type of the object and its API schema version.
// Structures that are versioned or persisted should inline TypeMeta.
export interface TypeMeta {
  kind?: string;
  apiVersion?: string;
}

export interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
  uid: string;
  controller: boolean;
  blockOwnerDeletion: boolean;
}

// ObjectMeta is metadata that all persisted resources must have, which includes all objects
export interface ObjectMeta {
  name?: string;
  namespace?: string;
  labels?: StringMap;
  annotations?: StringMap;
  readonly selfLink?: string;
  readonly uid?: string;
  readonly creationTimestamp?: string;
  readonly ownerReferences?: OwnerReference[];
  resourceVersion?: string;
}

export interface KubernetesResource extends TypeMeta {
  metadata?: ObjectMeta;
  status?: any;
}

export interface LabelSelector {
  matchLabels?: StringMap;
}

/**
 * Represents a raw K8S deployment.
 */
export interface Deployment extends KubernetesResource {
  spec?: DeploymentSpec;
  status?: any;
}

// DeploymentSpec is the specification of the desired behavior of the Deployment.
export interface DeploymentSpec {
  replicas?: number;
  selector?: LabelSelector;
  template?: PodTemplateSpec;
  strategy?: DeploymentStrategy;
  minReadySeconds?: number;
  revisionHistoryLimit?: number;
}

export interface DaemonSet extends KubernetesResource {
  spec?: DaemonSetSpec;
  status?: any;
}

export interface DaemonSetSpec {
  selector?: LabelSelector;
  template?: PodTemplateSpec;
  updateStrategy?: DaemonSetUpdateStrategy;
  minReadySeconds?: number;
  revisionHistoryLimit?: number;
}

export interface StatefulSet extends KubernetesResource {
  spec?: StatefulSetSpec;
  status?: any;
}

export interface StatefulSetSpec {
  replicas?: number;
  selector?: LabelSelector;
  template?: PodTemplateSpec;

  // serviceName is the name of the service that governs this StatefulSet.
  // This service must exist before the StatefulSet, and is responsible for
  // the network identity of the set. Pods get DNS/hostnames that follow the
  // pattern: pod-specific-string.serviceName.default.svc.cluster.local
  // where "pod-specific-string" is managed by the StatefulSet controller.
  serviceName?: string;
  updateStrategy?: StatefulSetUpdateStrategy;
  revisionHistoryLimit?: number;
}

export interface PodTemplateSpec {
  metadata?: ObjectMeta;
  spec?: PodSpec;
}

export type DeploymentStrategyType = 'RollingUpdate' | 'Recreate';
export type DaemonSetUpdateStrategyType = 'RollingUpdate' | 'OnDelete';
export type StatefulSetUpdateStrategyType = 'RollingUpdate' | 'OnDelete';

export interface DeploymentStrategy {
  type?: DeploymentStrategyType;
  rollingUpdate?: RollingUpdateDeployment;
}

export interface DaemonSetUpdateStrategy {
  type?: DaemonSetUpdateStrategyType;
  rollingUpdate?: RollingUpdateDaemonSet;
}

export interface StatefulSetUpdateStrategy {
  type?: StatefulSetUpdateStrategyType;
  rollingUpdate?: RollingUpdateStatefulSetStrategy;
}

export interface RollingUpdateDeployment {
  maxUnavailable?: string | number;
  maxSurge?: string | number;
}

export interface RollingUpdateDaemonSet {
  maxUnavailable?: string | number;
}

// Partition indicates the ordinal at which the StatefulSet should be
// partitioned.
// Default value is 0.
export interface RollingUpdateStatefulSetStrategy {
  partition?: string | number;
}

// TODO: fill this in if required
// tslint:disable-next-line:no-empty-interface
export interface DeploymentStatus {}

export interface PodSpec {
  initContainers?: Container[];
  containers: Container[];
  volumes?: Volume[];
}

export interface Volume {
  name: string;
}

export interface VolumeMount {
  name: string;
  mountPath?: string;
  readOnly?: boolean;
  subPath?: string;
  mountPropagation?: string;
}

// TODO: fill this in if required
// tslint:disable-next-line:no-empty-interface
export interface VolumeSource {}

export interface KeyToPath {
  key?: string;
  path?: string;
}

export interface ResourceRequirements {
  limits?: any;
  requests?: any;
}

export interface Container {
  name?: string;
  image?: string;
  command?: string[];
  args?: string[];
  env?: EnvVar[];
  envFrom?: EnvFromSource[];
  workingDir?: string;
  ports?: ContainerPort[];
  resources?: ResourceRequirements;
}

export interface ContainerPort {
  name?: string;
  hostPort?: number;
  containerPort?: number;
  protocol?: string;
  hostIP?: string;
}

export interface EnvVarSource {
  configMapKeyRef?: ConfigMapKeyRef;
  secretKeyRef?: SecretKeyRef;
}

export interface EnvVar {
  name: string;
  value?: string;
  valueFrom?: EnvVarSource;
}

export interface EnvFromSource {
  prefix?: string;
  configMapRef?: ConfigMapRef;
  secretRef?: SecretRef;
}

// tslint:disable-next-line:no-empty-interface
export interface Namespace extends KubernetesResource {}

export interface LocalObjectReference {
  name: string;
}

export interface ConfigMapKeyRef extends LocalObjectReference {
  key: string;
  optional?: boolean;
}

export interface SecretKeyRef extends LocalObjectReference {
  key: string;
  optional?: boolean;
}

export interface ConfigMapRef extends LocalObjectReference {
  optional?: boolean;
}

export interface SecretRef extends LocalObjectReference {
  optional?: boolean;
}

export interface IngressSpec {
  backend?: IngressBackend;
  rules?: IngressRule[];
  tls?: IngressTLS[];
}

export interface IngressRule {
  host: string;
  http: HTTPIngressRuleValue;
}

export interface HTTPIngressRuleValue {
  paths?: HTTPIngressPath[];
}

export interface HTTPIngressPath {
  path: string;
  backend: IngressBackend;
}

export interface IngressBackend {
  serviceName?: string;
  servicePort?: string | number;
}

export interface IngressTLS {
  hosts?: string[];
  secretName?: string;
}

export interface IngressStatus {
  loadBalancer?: LoadBalancerStatus;
}

export interface LoadBalancerStatus {
  ingress?: LoadBalancerIngress[];
}

export interface LoadBalancerIngress {
  ip: string;
  hostname: string;
}

export interface LimitRange extends KubernetesResource {
  spec?: LimitRangeSpec;
}

export type LimitType = 'Container' | 'Pod' | 'PersistentVolumeClaim';

export interface LimitRangeItem {
  type: LimitType;
  min?: StringMap;
  max?: StringMap;
  default?: StringMap;
  defaultRequest?: StringMap;
  maxLimitRequestRatio?: StringMap;
}

export interface LimitRangeSpec extends KubernetesResource {
  limits: LimitRangeItem[];
}

export type ResourceQuotaScope =
  | 'Terminating'
  | 'NotTerminating'
  | 'BestEffort'
  | 'NotBestEffort';

export interface ResourceQuota extends KubernetesResource {
  spec?: ResourceQuotaSpec;
}

export interface ResourceQuotaSpec {
  hard?: StringMap;
  scopes?: ResourceQuotaScope[];
}

export enum PodStatusEnum {
  Failed = 'Failed',
  Succeeded = 'Succeeded',
  Running = 'Running',
  Pending = 'Pending',
  Completed = 'Completed',
  ContainerCreating = 'ContainerCreating',
  PodInitializing = 'PodInitializing',
  Terminating = 'Terminating',
  Initing = 'Initing',
}

export interface ConfigMap extends KubernetesResource {
  data?: StringMap;
}

export interface Secret extends KubernetesResource {
  data?: StringMap;
}

export interface PersistentVolumeClaim extends KubernetesResource {
  spec?: PersistentVolumeClaimSpec;
}

export interface PersistentVolumeClaimSpec {
  accessModes: string[];
  volumeMode: string;
  storageClassName: string;
  resources: { [key: string]: any };
  selector: {
    matchLabels?: StringMap;
  };
}

export const DeploymentTypeMeta: TypeMeta = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
};

export const DaemonSetTypeMeta: TypeMeta = {
  apiVersion: 'apps/v1',
  kind: 'DaemonSet',
};

export const StatefulSetTypeMeta: TypeMeta = {
  apiVersion: 'apps/v1',
  kind: 'StatefulSet',
};

export const NamespaceTypeMeta: TypeMeta = {
  apiVersion: 'v1',
  kind: 'Namespace',
};

export const LimitRangeTypeMeta: TypeMeta = {
  apiVersion: 'v1',
  kind: 'LimitRange',
};

export const ResourceQuotaTypeMeta: TypeMeta = {
  apiVersion: 'v1',
  kind: 'ResourceQuota',
};

export const ConfigMapTypeMeta: TypeMeta = {
  apiVersion: 'v1',
  kind: 'ConfigMap',
};

export const SecretTypeMeta: TypeMeta = {
  apiVersion: 'v1',
  kind: 'Secret',
};

export const PersistentVolumeClaimTypeMeta: TypeMeta = {
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
};
