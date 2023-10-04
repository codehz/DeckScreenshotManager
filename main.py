import decky_plugin

from settings import SettingsManager # type: ignore

logger = decky_plugin.logger

settings = SettingsManager(name="settings", settings_directory=decky_plugin.DECKY_PLUGIN_SETTINGS_DIR)
settings.read()

counter = SettingsManager(name="counter", settings_directory=decky_plugin.DECKY_PLUGIN_RUNTIME_DIR)
counter.read()

class Plugin:
  async def plugin_info(self):
    # Call plugin_info only once preferably
    logger.debug('[backend] PluginInfo:\n\tPluginName: {}\n\tPluginVersion: {}\n\tDeckyVersion: {}'.format(
      decky_plugin.DECKY_PLUGIN_NAME,
      decky_plugin.DECKY_PLUGIN_VERSION,
      decky_plugin.DECKY_VERSION
    ))
    pluginInfo = {
      "name": decky_plugin.DECKY_PLUGIN_NAME,
      "version": decky_plugin.DECKY_PLUGIN_VERSION
    }
    return pluginInfo
  async def logger(self, logLevel:str, msg:str):
    msg = '[frontend] {}'.format(msg)
    match logLevel.lower():
      case 'info':      logger.info(msg)
      case 'debug':     logger.debug(msg)
      case 'warning':   logger.warning(msg)
      case 'error':     logger.error(msg)
      case 'critical':  logger.critical(msg)
  async def getSetting(self, key: str, defaults):
    logger.info('[backend] Reading setting {}'.format(key))
    return settings.getSetting(key, defaults)
  async def putSetting(self, key: str, value):
    logger.info('[backend] Setting setting {}: {}'.format(key, value))
    return settings.setSetting(key, value)
  async def increaseCounter(self, key: str):
    return counter.setSetting(key, counter.getSetting(key, 0) + 1)
  async def getCounter(self, key: str):
    return counter.getSetting(key, 0)
  async def _unload(self):
    pass
