import Seajs from './util/sea';
import { proxy } from './util/proxy';
import { getCapiModules } from './modules/capi';
import { constantsModules } from './modules/constants';
import { SDKRunnerEnvModules, SDKRunnerSetupOptions } from './type';
import { register, initSDKImporter } from './sdk';
import { initSupport } from './util/support';
import { warn } from './util/warn';
import { tipsModules } from './modules/tips';
import { appUtilModules } from './modules/appUtil';
import { utilModules } from './modules/util';
import { ClipboardJs } from './modules/clipboard';

/**
 * 准备 Seajs 环境
 */
function initShim(modules: SDKRunnerEnvModules) {
  Seajs(window);

  window.seajs['Module'] = proxy();
  if (!window.define || !window.seajs) {
    throw new Error('需要 Sea.js 运行环境');
  }

  const define = window.define;

  window.define = (moduleId, factory) => {
    const _factory = (require, exports, module) => {
      const _require = Object.assign((moduleId: string) => {
        const m = require(moduleId);
        if (!m && !modules[moduleId]) {
          warn(`模块 ${moduleId} 未定义`);
        }
        return m ? m : proxy(modules[moduleId]);
      }, require);
      return factory(_require, exports, module);
    };
    define(moduleId, _factory);
  };

  const use = window.seajs.use;
  const require = window.seajs.require;

  window.seajs = {
    ...(window.seajs || {}),
    use: (moduleId, cb) => {
      if (!modules[moduleId]) {
        warn(`模块 ${moduleId} 未定义`);
      }
      cb && cb(proxy(modules[moduleId]));
    },
    require: (moduleId) => {
      const m = require(moduleId);
      if (!m && !modules[moduleId]) {
        warn(`模块 ${moduleId} 未定义`);
      }
      return m ? m : proxy(modules[moduleId]);
    },
  };
}

/**
 * 合并内置模块
 */
function mergeBuildInModules(
  buildInModules: SDKRunnerEnvModules,
  modules: SDKRunnerEnvModules
): SDKRunnerEnvModules {
  const mergedModules = {};
  Object.entries(buildInModules).forEach(([id, module]) => {
    mergedModules[id] = {
      ...module,
      ...(modules[id] || {}),
    };
  });
  return mergedModules;
}

/**
 * 初始化 Runner
 */
export function setup({
  sdks,
  capi,
  modules = {},
  loginInfo,
  requireRegionData,
}: SDKRunnerSetupOptions) {
  // tips 包含在 menus 中
  window['g_buffet_data'] = proxy({ menuRouter: {} });
  window['Insight'] = proxy();
  register({
    name: 'menus-sdk',
    js: 'https://imgcache.qq.com/qcloud/tea/sdk/menus.zh.8162d4d61c.js?max_age=31536000',
    css: 'https://imgcache.qq.com/qcloud/tea/sdk/menus.zh.d3f1d0ae0f.css?max_age=31536000',
  });

  sdks.forEach((sdk) => register(sdk));

  if (loginInfo) {
    window.LOGIN_INFO = loginInfo;
  }

  modules = {
    ...modules,
    ...mergeBuildInModules(constantsModules, modules),
    ...mergeBuildInModules(getCapiModules(capi), modules),
    ...mergeBuildInModules(tipsModules, modules),
    ...mergeBuildInModules(appUtilModules, modules),
    ...mergeBuildInModules(utilModules, modules),
    clipboard: ClipboardJs,
  };

  window['TeaSDKRunner'] = modules;

  initShim(modules);
  initSupport();
  initSDKImporter({ requireRegionData });
}
