import { warn } from "./warn";

const proxyIdentifier = "FakeFunctionObjectForProxy";
const getFakeObject = () =>
  new Proxy(
    Object.defineProperty(() => getFakeObject(), "name", {
      value: proxyIdentifier,
    }),
    handler
  );

export const handler: ProxyHandler<any> = {
  get: function (target, name, receiver) {
    if (Reflect.has(target, name)) {
      return Reflect.get(target, name, receiver);
    }
    try {
      if (process.env.NODE_ENV === "development") {
        console.warn(`\t属性 ${String(name)} 不存在`);
      }
    } catch (_) {}
    return getFakeObject();
  },

  apply: function (target, ctx, args) {
    if (ctx?.name !== proxyIdentifier) {
      return Reflect.apply(target, ctx, args);
    }
    try {
      if (process.env.NODE_ENV === "development") {
        console.warn("\t\t方法不存在");
      }
    } catch (_) {}
    return getFakeObject();
  },

  construct: function (target, args) {
    if (target?.name !== proxyIdentifier) {
      return new target(...args);
    }
    try {
      if (process.env.NODE_ENV === "development") {
        console.warn("\t\t对象不存在");
      }
    } catch (_) {}
    return getFakeObject();
  },
};

export function proxy(target?: object) {
  return target ? new Proxy(target, handler) : getFakeObject();
}
