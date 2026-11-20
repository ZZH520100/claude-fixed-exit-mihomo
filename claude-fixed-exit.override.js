function main(config) {
  // 复制为 .local.js 后填写。若代理无需认证，用户名和密码都留空。
  const settings = {
    server: '',
    port: 0,
    username: '',
    password: '',
    relay: ''
  };

  const fixedExit = 'Claude 固定出口';
  const proxies = config.proxies || [];
  const groups = config['proxy-groups'] || [];
  const existingNames = new Set([...proxies, ...groups].map(entry => entry.name));
  const ready = settings.server.trim() !== ''
    && Number.isInteger(settings.port)
    && settings.port >= 1
    && settings.port <= 65535
    && Boolean(settings.username) === Boolean(settings.password)
    && existingNames.has(settings.relay)
    && !existingNames.has(fixedExit);

  const suffixes = [
    'claude.ai',
    'claude.com',
    'anthropic.com',
    'claudeusercontent.com',
    'claude.app',
    'claudemcpcontent.com',
    'clau.de'
  ];
  const matchers = [
    ...suffixes.map(domain => 'DOMAIN-SUFFIX,' + domain),
    'DOMAIN,servd-anthropic-website.b-cdn.net'
  ];
  const claude = 'OR,(' + matchers.map(matcher => '(' + matcher + ')').join(',') + ')';

  if (!ready) {
    config.rules = [claude + ',REJECT', ...(config.rules || [])];
    return config;
  }

  const egress = {
    name: fixedExit,
    type: 'socks5',
    server: settings.server.trim(),
    port: settings.port,
    'dialer-proxy': settings.relay,
    udp: false
  };
  if (settings.username) {
    egress.username = settings.username;
    egress.password = settings.password;
  }
  config.proxies = [...proxies, egress];
  config.rules = [
    'AND,((NETWORK,UDP),(' + claude + ')),REJECT',
    claude + ',' + fixedExit,
    ...(config.rules || [])
  ];
  return config;
}
